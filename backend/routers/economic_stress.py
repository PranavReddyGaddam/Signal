"""
Economic Stress Index — live FRED data composite.

6 indicators, each normalized 0-100:
  vix          — CBOE VIX (fear gauge)
  yield_curve  — 10Y-2Y spread (inversion = recession signal)
  hy_spread    — HY OAS credit spread (BofA BAMLH0A0HYM2)
  unemployment — UNRATE
  cpi_mom      — CPIAUCSL month-over-month change
  consumer_sent— UMCSENT consumer sentiment (inverted — low = stress)

Composite = weighted sum, normalized 0-100.
Cache TTL = 30 minutes (FRED updates at most daily).
"""

import asyncio
import logging
import math
import os
import time
from typing import TypedDict

import httpx
from fastapi import APIRouter, Query

router = APIRouter()
log = logging.getLogger(__name__)

_TIMEOUT = 20
_CACHE: dict | None = None
_CACHE_TS: float = 0.0
_CACHE_TTL = 30 * 60

FRED_BASE = "https://api.stlouisfed.org/fred/series/observations"

# Indicator config: series_id → (weight, transform, display_name, description)
# transform = "raw" | "invert" | "spread" | "mom_pct"
_INDICATORS = {
    "VIXCLS":       (0.30, "raw",      "VIX",                "Equity volatility fear index"),
    "T10Y2Y":       (0.25, "invert_spread", "Yield Curve",   "10Y-2Y spread (negative = inverted)"),
    "BAMLH0A0HYM2": (0.20, "raw",      "HY Credit Spread",   "High-yield OAS over Treasuries"),
    "UNRATE":       (0.10, "raw",      "Unemployment",       "U-3 unemployment rate"),
    "CPIAUCSL":     (0.05, "mom_pct",  "CPI MoM",            "CPI month-over-month % change"),
    "UMCSENT":      (0.10, "invert",   "Consumer Sentiment", "U Michigan consumer sentiment (inverted)"),
}

# Historical stress reference bands for normalization (empirical ranges)
_BANDS: dict[str, tuple[float, float]] = {
    # series_id: (low_stress_val, high_stress_val)
    "VIXCLS":       (10.0, 80.0),   # calm=10, crisis=80
    "T10Y2Y":       (-1.5, 2.5),    # inverted=-1.5 (high stress), steep=2.5 (low stress) — inverted in transform
    "BAMLH0A0HYM2": (2.0, 22.0),    # tight=2%, GFC=22%
    "UNRATE":       (3.0, 15.0),    # full employment=3%, severe=15%
    "CPIAUCSL":     (0.0, 1.5),     # 0% MoM = no stress, >1.5% = severe
    "UMCSENT":      (50.0, 110.0),  # high=110 (low stress), low=50 (high stress) — inverted in transform
}

_LEVEL_THRESHOLDS = [
    (75, "critical",  "Systemic stress — recession/crisis indicators active"),
    (55, "elevated",  "Stress building — multiple indicators deteriorating"),
    (35, "moderate",  "Mild pressure — some indicators above baseline"),
    (0,  "normal",    "Conditions within historical norms"),
]


class IndicatorResult(TypedDict):
    series_id: str
    name: str
    description: str
    raw_value: float
    stress_score: int       # 0-100
    weight: float
    direction: str          # "up" = rising stress, "down" = falling stress, "flat"
    last_date: str


async def _fetch_series(client: httpx.AsyncClient, series_id: str, api_key: str, limit: int = 13) -> list[dict]:
    """Fetch recent observations. Returns list sorted newest-first."""
    try:
        r = await client.get(FRED_BASE, params={
            "series_id": series_id,
            "api_key": api_key,
            "file_type": "json",
            "limit": limit,
            "sort_order": "desc",
        })
        r.raise_for_status()
        obs = [o for o in r.json().get("observations", []) if o["value"] != "."]
        return obs
    except Exception as e:
        log.debug(f"[econ_stress] FRED {series_id} failed: {e}")
        return []


def _normalize(value: float, low: float, high: float) -> int:
    """Map value onto 0-100 where 0=low stress, 100=high stress."""
    if high == low:
        return 50
    score = (value - low) / (high - low) * 100
    return max(0, min(100, round(score)))


def _transform(series_id: str, obs: list[dict]) -> tuple[float, int, str]:
    """
    Returns (raw_value, stress_score_0_100, direction).
    direction: "rising" | "falling" | "flat"
    """
    if not obs:
        return (0.0, 50, "flat")  # neutral fallback

    transform = _INDICATORS[series_id][1]
    low, high = _BANDS[series_id]

    latest = float(obs[0]["value"])
    prev = float(obs[1]["value"]) if len(obs) > 1 else latest

    if transform == "raw":
        score = _normalize(latest, low, high)
        raw = latest

    elif transform == "invert":
        # Low raw = high stress
        score = _normalize(high - (latest - low), low, high)
        raw = latest

    elif transform == "invert_spread":
        # Yield curve: more negative = more stressed
        # Flip so that negative spread → high score
        raw = latest
        score = _normalize(-latest, -high, -low)

    elif transform == "mom_pct":
        # Month-over-month % change
        if len(obs) < 2:
            return (0.0, 0, "flat")
        prev_val = float(obs[1]["value"])
        if prev_val == 0:
            raw = 0.0
        else:
            raw = (latest - prev_val) / prev_val * 100
        score = _normalize(raw, low, high)
        prev = float(obs[2]["value"]) if len(obs) > 2 else prev_val
        prev_raw = (prev_val - prev) / prev * 100 if prev != 0 else 0.0
        delta = raw - prev_raw
    else:
        raw = latest
        score = 50

    # Direction: compare latest to previous obs
    if transform != "mom_pct":
        delta = latest - prev

    direction: str
    if abs(delta) < 0.01:
        direction = "flat"
    elif transform in ("raw", "mom_pct"):
        direction = "rising" if delta > 0 else "falling"
    elif transform == "invert":
        direction = "rising" if delta < 0 else "falling"
    elif transform == "invert_spread":
        direction = "rising" if delta < 0 else "falling"
    else:
        direction = "flat"

    return (round(raw, 4), score, direction)


def _level(score: float) -> tuple[str, str]:
    for threshold, level, desc in _LEVEL_THRESHOLDS:
        if score >= threshold:
            return level, desc
    return "normal", "Conditions within historical norms"


async def _compute_stress(api_key: str) -> dict:
    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        tasks = {
            sid: _fetch_series(client, sid, api_key)
            for sid in _INDICATORS
        }
        results = await asyncio.gather(*tasks.values())
        obs_map = dict(zip(tasks.keys(), results))

    indicators: list[IndicatorResult] = []
    composite_num = 0.0
    composite_den = 0.0

    for series_id, (weight, _, name, description) in _INDICATORS.items():
        obs = obs_map[series_id]
        raw, score, direction = _transform(series_id, obs)
        last_date = obs[0]["date"] if obs else "N/A"

        indicators.append({
            "series_id": series_id,
            "name": name,
            "description": description,
            "raw_value": raw,
            "stress_score": score,
            "weight": weight,
            "direction": direction,
            "last_date": last_date,
        })

        if obs:  # only include series that returned data
            composite_num += score * weight
            composite_den += weight

    composite = round(composite_num / composite_den) if composite_den > 0 else 50
    level, level_desc = _level(composite)

    # Find primary driver — highest weighted contribution
    drivers = sorted(
        [(ind["name"], ind["stress_score"] * ind["weight"]) for ind in indicators],
        key=lambda x: x[1],
        reverse=True,
    )
    primary_driver = drivers[0][0] if drivers else "Unknown"

    # Count indicators in stress (score >= 60)
    stressed_count = sum(1 for ind in indicators if ind["stress_score"] >= 60)

    return {
        "composite": composite,
        "level": level,
        "level_description": level_desc,
        "primary_driver": primary_driver,
        "stressed_indicators": stressed_count,
        "total_indicators": len(indicators),
        "indicators": indicators,
        "regime": _classify_regime(indicators),
    }


def _classify_regime(indicators: list[IndicatorResult]) -> str:
    """Classify the current macro regime from indicator pattern."""
    vix_score = next((i["stress_score"] for i in indicators if i["series_id"] == "VIXCLS"), 50)
    yc_score = next((i["stress_score"] for i in indicators if i["series_id"] == "T10Y2Y"), 50)
    hy_score = next((i["stress_score"] for i in indicators if i["series_id"] == "BAMLH0A0HYM2"), 50)
    cpi_score = next((i["stress_score"] for i in indicators if i["series_id"] == "CPIAUCSL"), 50)
    sent_score = next((i["stress_score"] for i in indicators if i["series_id"] == "UMCSENT"), 50)

    if vix_score >= 70 and hy_score >= 70:
        return "Risk-off: Credit dislocation"
    if yc_score >= 65 and sent_score >= 60:
        return "Recession risk: Curve inverted + sentiment weak"
    if cpi_score >= 65 and yc_score < 40:
        return "Stagflation risk: Inflation elevated, curve steep"
    if vix_score <= 30 and hy_score <= 30:
        return "Risk-on: Low volatility, tight spreads"
    if cpi_score >= 55 and vix_score >= 55:
        return "Inflation shock: Fed tightening pressure"
    return "Transitional: Mixed signals"


async def _get_stress() -> dict:
    global _CACHE, _CACHE_TS
    now = time.monotonic()
    if _CACHE is not None and (now - _CACHE_TS) < _CACHE_TTL:
        return _CACHE

    api_key = os.getenv("FRED_API_KEY", "")
    if not api_key:
        log.warning("[econ_stress] No FRED_API_KEY")
        return _fallback()

    log.info("[econ_stress] recomputing from FRED...")
    try:
        data = await _compute_stress(api_key)
        _CACHE = data
        _CACHE_TS = now
        log.info(f"[econ_stress] composite={data['composite']} level={data['level']}")
        return data
    except Exception as e:
        log.error(f"[econ_stress] compute failed: {e}")
        return _CACHE or _fallback()


def _fallback() -> dict:
    """Return a neutral placeholder when FRED is unavailable."""
    return {
        "composite": 50,
        "level": "normal",
        "level_description": "Data unavailable — FRED_API_KEY not configured",
        "primary_driver": "N/A",
        "stressed_indicators": 0,
        "total_indicators": 0,
        "indicators": [],
        "regime": "Unknown",
    }


@router.get("/economic-stress")
async def get_economic_stress():
    """Return the current Economic Stress Index composite and per-indicator breakdown."""
    return await _get_stress()
