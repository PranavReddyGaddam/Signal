import os
import json
import anthropic
from pathlib import Path
import ai.toggle as ai_toggle

_sector_map: dict | None = None

OUTPUT_SCHEMA = {
    "summary": "string",
    "affected_sectors": ["string"],
    "tickers": [
        {"symbol": "string", "direction": "bullish or bearish", "confidence": 0.0, "reasoning": "string"}
    ],
    "overall_confidence": 0.0,
    "historical_pattern": "string",
}


def _load_sector_map() -> dict:
    global _sector_map
    if _sector_map is None:
        path = Path(__file__).parent.parent / "data" / "sector_map.json"
        _sector_map = json.loads(path.read_text())
    return _sector_map


def _build_prompt(events: list[dict]) -> str:
    sector_map = _load_sector_map()
    all_tags = set()
    for e in events:
        all_tags.update(e.get("sector_tags", []))
    relevant = {k: v for k, v in sector_map.items() if any(t in v.get("sectors", []) for t in all_tags)}
    # Cap to top-15 events by magnitude to keep the prompt focused
    top_events = sorted(events, key=lambda e: float(e.get("magnitude") or 0), reverse=True)[:15]
    summaries = [
        {"title": e.get("title", ""), "magnitude": e.get("magnitude", 0),
         "sector_tags": e.get("sector_tags", []), "source": e.get("source", "")}
        for e in top_events
    ]
    return (
        f"Events cluster ({len(events)} total, showing top {len(summaries)} by magnitude):\n{json.dumps(summaries, indent=2)}\n\n"
        f"Sector context:\n{json.dumps(relevant, indent=2)}\n\n"
        f"Return JSON matching this exact schema:\n{json.dumps(OUTPUT_SCHEMA, indent=2)}"
    )


async def analyze_cluster(events: list[dict]) -> dict:
    if not ai_toggle.is_enabled():
        print("[implications] AI toggle is OFF — using smart fallback")
        return _fallback(events)

    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        print("[implications] ANTHROPIC_API_KEY not set — using smart fallback")
        return _fallback(events)

    client = anthropic.AsyncAnthropic(api_key=api_key)
    prompt = _build_prompt(events)

    for attempt in range(2):
        try:
            response = await client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=2048,
                system="You are a financial intelligence analyst. Return JSON only, no prose.",
                messages=[{"role": "user", "content": prompt}],
            )
            text = response.content[0].text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            result = json.loads(text)
            if not {"summary", "affected_sectors", "tickers", "overall_confidence", "historical_pattern"} <= set(result):
                raise ValueError("Missing required keys")
            return result
        except (json.JSONDecodeError, ValueError) as e:
            print(f"[implications] parse error (attempt {attempt}): {e}")
            if attempt == 0:
                prompt = f"Fix JSON error: {e}\n\nOriginal:\n{prompt}"
            else:
                print("[implications] falling back after 2 failed parse attempts")
                return _fallback(events)
        except Exception as e:
            print(f"[implications] Claude error: {e}")
            return _fallback(events)

    return _fallback(events)


_GENERIC_SUMMARIES = {
    "Signal cluster detected",
    "Insufficient data",
}


def _is_stale_summary(summary: str) -> bool:
    return any(s in summary for s in _GENERIC_SUMMARIES)


def _sector_specificity(event_tags: list, signal_tags: list) -> float:
    """Fraction of an event's own tags that match the signal's sectors.
    Rewards tight matches; penalises broadly-tagged catch-all events."""
    if not event_tags:
        return 0.0
    return len(set(event_tags) & set(signal_tags)) / len(event_tags)


def _smart_summary(events: list[dict], preferred_sectors: list[str] | None = None) -> str:
    n = len(events)
    sources = list({e.get("source", "") for e in events if e.get("source")})
    all_tags = list({t for e in events for t in (e.get("sector_tags") or [])})

    if preferred_sectors:
        pset = set(preferred_sectors)

        def _score(e: dict) -> float:
            mag = float(e.get("magnitude") or 0)
            spec = _sector_specificity(list(e.get("sector_tags") or []), list(pset))
            # Blend: 60% specificity, 40% magnitude (both normalised 0-1)
            return 0.6 * spec + 0.4 * min(1.0, mag)

        scored = sorted(
            [e for e in events if e.get("title")],
            key=_score,
            reverse=True,
        )
        # Require at least 1 sector-matched event; otherwise fall back to plain magnitude
        has_match = any(set(e.get("sector_tags") or []) & pset for e in scored[:3])
        candidates = scored[:3] if has_match else sorted(events, key=lambda e: float(e.get("magnitude") or 0), reverse=True)[:3]
    else:
        candidates = sorted(events, key=lambda e: float(e.get("magnitude") or 0), reverse=True)[:3]

    titles = [e.get("title", "").strip() for e in candidates if e.get("title")]

    if not titles:
        return f"Elevated activity across {', '.join(all_tags[:3])} sectors ({n} events)."

    sector_str = ", ".join((preferred_sectors or all_tags)[:3])
    src_str = " + ".join(sources[:3])
    lead = titles[0][:90]
    if len(titles) >= 2:
        second = titles[1][:55]
        return f"{lead}; also: {second} — {sector_str} ({src_str}, {n} signals)"
    return f"{lead} — elevated {sector_str} risk ({n} signals)"


_BEARISH_KEYWORDS = {"sanction", "war", "conflict", "attack", "ban", "tariff", "crisis",
                     "shortage", "disruption", "collapse", "recession", "risk", "threat"}
_BULLISH_KEYWORDS = {"rally", "surge", "growth", "deal", "ceasefire", "recovery",
                     "approved", "breakthrough", "easing", "stimulus"}

# Maps sector tags to (scenario_keys, per-ticker direction_override)
_SECTOR_TO_SCENARIOS = {
    "energy":        ["oil_supply_disruption", "dollar_strength"],
    "geopolitical":  ["geopolitical_conflict", "oil_supply_disruption"],
    "commodities":   ["oil_supply_disruption", "inflation_spike"],
    "materials":     ["dollar_strength", "inflation_spike"],
    "financials":    ["fed_rate_hold", "credit_stress"],
    "credit":        ["credit_stress", "yield_curve_inversion"],
    "macro":         ["yield_curve_inversion", "fed_rate_hold"],
    "technology":    ["tech_regulation", "supply_chain_disruption"],
    "industrials":   ["supply_chain_disruption", "oil_supply_disruption"],
    "consumer_staples": ["jobs_miss", "inflation_spike"],
    "labor":         ["jobs_miss"],
}

_TICKER_DIRECTION = {
    # energy / geo bearish events → energy prices rise = XLE/XOM bullish, transport bearish
    "oil_supply_disruption": {"XLE": "bullish", "XOM": "bullish", "CVX": "bullish", "USO": "bullish",
                               "DAL": "bearish", "UPS": "bearish"},
    "geopolitical_conflict":  {"LMT": "bullish", "RTX": "bullish", "XLE": "bullish", "GLD": "bullish"},
    "fed_rate_hold":          {"XLF": "bullish", "TLT": "bullish", "VNQ": "bearish", "KRE": "neutral"},
    "credit_stress":          {"XLF": "bearish", "KRE": "bearish", "HYG": "bearish", "VNQ": "bearish"},
    "yield_curve_inversion":  {"TLT": "bullish", "XLF": "bearish", "VNQ": "bearish", "XLU": "bullish"},
    "inflation_spike":        {"GLD": "bullish", "TIP": "bullish", "XLB": "bullish", "XLP": "bearish"},
    "supply_chain_disruption": {"XLI": "bearish", "XLY": "bearish", "FDX": "bearish", "UPS": "bearish"},
    "jobs_miss":              {"XLY": "bearish", "XLP": "bearish", "XLF": "bearish"},
    "tech_regulation":        {"XLK": "bearish", "AAPL": "bearish", "GOOGL": "bearish", "META": "bearish"},
    "dollar_strength":        {"GLD": "bearish", "USO": "bearish", "XLB": "bearish", "EEM": "bearish"},
}


def _rule_based_tickers(events: list[dict], sector_tags: list[str]) -> list[dict]:
    """Generate ticker implications from sector_map rules + event keyword heuristics."""
    sector_map = _load_sector_map()

    # Detect overall sentiment from top-magnitude event titles
    top_titles = " ".join(
        e.get("title", "").lower()
        for e in sorted(events, key=lambda e: float(e.get("magnitude") or 0), reverse=True)[:5]
    )
    bearish_hits = sum(1 for w in _BEARISH_KEYWORDS if w in top_titles)
    bullish_hits = sum(1 for w in _BULLISH_KEYWORDS if w in top_titles)
    event_sentiment = "bearish" if bearish_hits >= bullish_hits else "bullish"

    avg_mag = (
        sum(float(e.get("magnitude") or 0) for e in events) / len(events)
        if events else 0.3
    )

    # Collect scenario keys for the signal's sectors
    scenarios: list[str] = []
    for tag in sector_tags:
        for s in _SECTOR_TO_SCENARIOS.get(tag, []):
            if s not in scenarios:
                scenarios.append(s)

    # Normalise sector_map tag names to match event tag vocabulary
    _SECTOR_ALIASES: dict[str, str] = {
        "tech": "technology",
        "consumer": "consumer_staples",
        "defense": "geopolitical",
        "real_estate": "credit",
        "emerging_markets": "geopolitical",
        "utilities": "macro",
    }

    def _resolve_scenario_sectors(raw: list[str]) -> set[str]:
        return {_SECTOR_ALIASES.get(s, s) for s in raw}

    # Collect tickers, deduplicate, assign direction + per-scenario + per-rank confidence
    seen: set[str] = set()
    tickers: list[dict] = []
    for scenario in scenarios[:4]:           # limit to 4 scenarios
        direction_map = _TICKER_DIRECTION.get(scenario, {})
        raw_sectors = sector_map.get(scenario, {}).get("sectors", [])
        scenario_sectors = _resolve_scenario_sectors(raw_sectors)
        sm_tickers = sector_map.get(scenario, {}).get("tickers", [])

        # Confidence = avg magnitude of events whose tags overlap with this scenario's sectors
        matched_events = [
            e for e in events
            if set(e.get("sector_tags") or []) & scenario_sectors
        ]
        if matched_events:
            matched_mags = sorted(
                [float(e.get("magnitude") or 0) for e in matched_events], reverse=True
            )
            top_n = max(1, len(matched_mags) // 3)
            scenario_mag = sum(matched_mags[:top_n]) / top_n
            coverage = min(1.0, len(matched_events) / max(1, len(events) * 0.3))
        else:
            scenario_mag = avg_mag * 0.5   # penalise missing match
            coverage = 0.15

        base_conf = min(0.85, max(0.42, round(
            0.65 * min(1.0, scenario_mag / 0.6) +
            0.35 * coverage,
            2,
        )))

        for symbol in sm_tickers[:3]:        # top 3 per scenario
            if symbol in seen:
                continue
            seen.add(symbol)
            direction = direction_map.get(symbol, event_sentiment)
            # Global position index drives confidence so every ticker is distinct
            global_rank = len(tickers)
            ticker_conf = round(max(0.40, base_conf - global_rank * 0.04), 2)
            tickers.append({
                "symbol": symbol,
                "direction": direction,
                "confidence": ticker_conf,
                "reasoning": f"{scenario.replace('_', ' ').title()} signal via {', '.join(sector_tags[:2])} sectors",
            })

    return tickers[:6]


def _fallback(events: list[dict]) -> dict:
    all_tags = list({t for e in events for t in (e.get("sector_tags") or [])})
    tickers = _rule_based_tickers(events, all_tags)
    avg_mag = sum(float(e.get("magnitude") or 0) for e in events) / len(events) if events else 0.3
    pattern = (
        f"Cluster of {len(events)} events across {', '.join(all_tags[:3])} sectors. "
        f"Rule-based implications derived from sector scenario mapping."
    )
    return {
        "summary": _smart_summary(events),
        "affected_sectors": all_tags[:5],
        "tickers": tickers,
        "overall_confidence": 0.5,
        "historical_pattern": pattern,
    }
