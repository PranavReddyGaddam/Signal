"""
Country Instability Index — live GDELT-driven scoring.

Strategy: one GDELT query per country fetching up to 50 articles (24h/48h),
then classify each article into dimensions by keyword matching in Python.
This avoids complex GDELT query syntax that silently returns 0 results.

5 dimensions, each 0-100:
  conflict     — war/strike/battle keywords
  unrest       — protest/coup/riot keywords
  sanctions    — sanctions/embargo/OFAC keywords
  cyber        — cyberattack/ransomware/breach keywords
  econ_stress  — crisis/IMF/currency/default keywords

Cache TTL = 30 minutes.
"""

import asyncio
import logging
import math
import time
import json
import os
from pathlib import Path

import anthropic
import httpx
from fastapi import APIRouter, Request, Query

router = APIRouter()
log = logging.getLogger(__name__)

_TIMEOUT = 20
_CACHE: list | None = None
_CACHE_TS: float = 0.0
_CACHE_TTL = 30 * 60  # 30 minutes

# Bump this whenever the scoring logic changes to invalidate stale cache
_CACHE_VERSION = 2

WATCH_COUNTRIES: dict[str, tuple[str, str]] = {
    # code: (display name, primary GDELT search term — simplest unambiguous term)
    "IR": ("Iran",         "Iran"),
    "RU": ("Russia",       "Russia"),
    "UA": ("Ukraine",      "Ukraine"),
    "IL": ("Israel",       "Israel"),
    "PS": ("Palestine",    "Gaza"),
    "YE": ("Yemen",        "Yemen"),
    "SY": ("Syria",        "Syria"),
    "AF": ("Afghanistan",  "Afghanistan"),
    "IQ": ("Iraq",         "Iraq"),
    "PK": ("Pakistan",     "Pakistan"),
    "SD": ("Sudan",        "Sudan"),
    "ET": ("Ethiopia",     "Ethiopia"),
    "LY": ("Libya",        "Libya"),
    "MM": ("Myanmar",      "Myanmar"),
    "KP": ("North Korea",  "North Korea"),
    "VE": ("Venezuela",    "Venezuela"),
    "NG": ("Nigeria",      "Nigeria"),
    "MX": ("Mexico",       "Mexico cartel"),
    "TR": ("Turkey",       "Turkey Erdogan"),
    "CN": ("China",        "China"),
    "TW": ("Taiwan",       "Taiwan"),
    "SA": ("Saudi Arabia", "Saudi Arabia"),
    "SS": ("South Sudan",  "South Sudan"),
    "SO": ("Somalia",      "Somalia"),
    "ML": ("Mali",         "Mali"),
    "HT": ("Haiti",        "Haiti"),
    "LB": ("Lebanon",      "Lebanon"),
    "CF": ("CAR",          "Central African Republic"),
}

# Keyword classifiers — checked against lowercased article title
_CONFLICT_KW = {
    "airstrike", "missile", "artillery", "bombing", "killed", "troops",
    "military", "battle", "combat", "offensive", "shelling", "attack",
    "soldiers", "war", "assault", "siege", "shoot", "explosion", "bomb",
    "sniper", "drone strike", "idf", "airforce", "navy", "ground forces",
}
_UNREST_KW = {
    "protest", "riot", "uprising", "coup", "demonstration", "civil unrest",
    "clashes", "crackdown", "arrested", "detained", "opposition", "strike",
    "rally", "march", "dissidents", "exile", "jailed", "dissident",
}
_SANCTIONS_KW = {
    "sanctions", "sanction", "embargo", "ofac", "asset freeze",
    "export controls", "trade restrictions", "blacklist", "designated",
    "treasury", "penalty", "tariff", "import ban",
}
_CYBER_KW = {
    "cyberattack", "ransomware", "data breach", "hacked", "malware",
    "espionage", "ddos", "phishing", "intrusion", "cybersecurity",
    "spyware", "vulnerability", "zero-day", "apt",
}
_ECON_KW = {
    "economic crisis", "currency", "imf", "debt", "default", "inflation",
    "recession", "bank run", "financial crisis", "devaluation", "collapse",
    "capital controls", "bailout", "austerity", "gdp", "poverty",
}

# Chronic instability floors (countries with low press coverage but real risk)
_FLOORS: dict[str, int] = {
    "KP": 45, "SY": 40, "AF": 40, "SS": 38, "CF": 35, "SO": 38,
    "ML": 32, "HT": 35, "YE": 42, "LY": 30, "SD": 38,
}

# Scoring weights
_WEIGHTS = {"conflict": 0.35, "unrest": 0.25, "sanctions": 0.15, "cyber": 0.10, "econ_stress": 0.15}


def _score_level(score: float) -> str:
    if score >= 70: return "critical"
    if score >= 55: return "high"
    if score >= 40: return "elevated"
    if score >= 25: return "normal"
    return "low"


def _kw_match(title: str, keywords: set) -> bool:
    t = title.lower()
    return any(kw in t for kw in keywords)


def _count_to_score(count: int, scale: float = 9.0) -> int:
    if count == 0:
        return 0
    return min(100, int(math.log2(count + 1) * scale * 2.2))


async def _fetch_articles(country_query: str, timespan: str = "24h", maxrecords: int = 50) -> list[dict]:
    """Single GDELT query for a country — English articles only."""
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT, follow_redirects=True) as c:
            r = await c.get("https://api.gdeltproject.org/api/v2/doc/doc", params={
                "query": f"{country_query} sourcelang:english",
                "mode": "artlist",
                "maxrecords": maxrecords,
                "format": "json",
                "timespan": timespan,
            })
            r.raise_for_status()
            data = r.json()
            if not data or not isinstance(data, dict):
                return []
            return data.get("articles") or []
    except Exception as e:
        log.debug(f"[risk] GDELT failed ({country_query[:30]}): {e}")
        return []


def _classify_articles(articles: list[dict]) -> dict:
    """Classify articles into dimensions by keyword matching."""
    dims = {"conflict": 0, "unrest": 0, "sanctions": 0, "cyber": 0, "econ_stress": 0}
    for a in articles:
        title = (a.get("title") or "").lower()
        if _kw_match(title, _CONFLICT_KW):  dims["conflict"] += 1
        if _kw_match(title, _UNREST_KW):    dims["unrest"]   += 1
        if _kw_match(title, _SANCTIONS_KW): dims["sanctions"] += 1
        if _kw_match(title, _CYBER_KW):     dims["cyber"]     += 1
        if _kw_match(title, _ECON_KW):      dims["econ_stress"] += 1
    return dims


async def _score_country(code: str, name: str, query: str) -> dict:
    # Fetch 24h articles (conflict/unrest) and 48h articles (sanctions/cyber/econ)
    arts_24h, arts_48h = await asyncio.gather(
        _fetch_articles(query, "24h", 50),
        _fetch_articles(query, "48h", 50),
    )

    dims_24h = _classify_articles(arts_24h)
    dims_48h = _classify_articles(arts_48h)

    conflict   = _count_to_score(dims_24h["conflict"],   9.0)
    unrest     = _count_to_score(dims_24h["unrest"],     8.0)
    sanctions  = _count_to_score(dims_48h["sanctions"],  6.0)
    cyber      = _count_to_score(dims_48h["cyber"],      7.0)
    econ       = _count_to_score(dims_48h["econ_stress"],7.0)

    raw = (
        conflict  * _WEIGHTS["conflict"]   +
        unrest    * _WEIGHTS["unrest"]     +
        sanctions * _WEIGHTS["sanctions"]  +
        cyber     * _WEIGHTS["cyber"]      +
        econ      * _WEIGHTS["econ_stress"]
    )
    score = max(_FLOORS.get(code, 0), min(100, round(raw)))

    # Deduplicate and trim articles for storage (title + url + domain + seendate)
    seen_urls: set = set()
    articles_out = []
    for a in arts_48h:
        url = a.get("url", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            articles_out.append({
                "title":    a.get("title", "")[:200],
                "url":      url,
                "source":   a.get("domain", ""),
                "seendate": a.get("seendate", ""),
                "conflict":   _kw_match((a.get("title") or "").lower(), _CONFLICT_KW),
                "unrest":     _kw_match((a.get("title") or "").lower(), _UNREST_KW),
                "sanctions":  _kw_match((a.get("title") or "").lower(), _SANCTIONS_KW),
                "cyber":      _kw_match((a.get("title") or "").lower(), _CYBER_KW),
                "econ":       _kw_match((a.get("title") or "").lower(), _ECON_KW),
            })

    return {
        "code":  code,
        "name":  name,
        "score": score,
        "level": _score_level(score),
        "trend": "flat",
        "components": {
            "conflict":    conflict,
            "unrest":      unrest,
            "sanctions":   sanctions,
            "cyber":       cyber,
            "econ_stress": econ,
        },
        "articles": articles_out[:20],  # top 20 kept for detail modal
    }


async def _compute_all() -> list[dict]:
    sem = asyncio.Semaphore(4)

    async def _guarded(code, name, query):
        async with sem:
            try:
                return await _score_country(code, name, query)
            except Exception as e:
                log.warning(f"[risk] failed {code}: {e}")
                return None

    tasks = [_guarded(code, name, q) for code, (name, q) in WATCH_COUNTRIES.items()]
    results = await asyncio.gather(*tasks)
    valid = [r for r in results if r is not None]
    valid.sort(key=lambda x: x["score"], reverse=True)
    return valid  # keep all, trim to top 15 only at the API response level


async def _get_live_scores() -> list[dict]:
    global _CACHE, _CACHE_TS
    now = time.monotonic()
    if _CACHE is not None and (now - _CACHE_TS) < _CACHE_TTL:
        return _CACHE
    log.info("[risk] recomputing from GDELT…")
    try:
        scores = await _compute_all()
        if scores:
            _CACHE = scores
            _CACHE_TS = now
            log.info(f"[risk] top: {scores[0]['name']} ({scores[0]['score']})")
        return scores
    except Exception as e:
        log.error(f"[risk] compute failed: {e}")
        return _CACHE or []


# ─── AI brief for a single country ───────────────────────────────────────────

async def _ai_country_brief(country: dict) -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        return ""
    articles = country.get("articles") or []
    if not articles:
        return ""
    headlines = "\n".join(
        f"- {a['title']} ({a['source']})" for a in articles[:12]
    )
    components = country["components"]
    try:
        client = anthropic.AsyncAnthropic(api_key=api_key)
        resp = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=220,
            system=(
                "You are a geopolitical analyst. Given recent news headlines about a country, "
                "write a 3-sentence intelligence brief covering: (1) the primary active threat, "
                "(2) the secondary pressure, (3) near-term outlook. Be precise and factual. "
                "No bullet points. No markdown."
            ),
            messages=[{"role": "user", "content": (
                f"Country: {country['name']}\n"
                f"Instability score: {country['score']}/100 (level: {country['level']})\n"
                f"Conflict: {components['conflict']}, Unrest: {components['unrest']}, "
                f"Sanctions: {components['sanctions']}, Cyber: {components['cyber']}, "
                f"Econ stress: {components['econ_stress']}\n\n"
                f"Recent headlines:\n{headlines}"
            )}],
        )
        return resp.content[0].text.strip()
    except Exception as e:
        log.warning(f"[risk] AI brief failed for {country['name']}: {e}")
        return ""


# ─── Fixtures ────────────────────────────────────────────────────────────────

_fixtures: dict | None = None

def _load_fixtures() -> dict:
    global _fixtures
    if _fixtures is None:
        path = Path(__file__).parent.parent / "data" / "fixtures.json"
        _fixtures = json.loads(path.read_text())
    return _fixtures


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.get("/risk")
async def get_risk(
    request: Request,
    demo: bool = Query(False),
    scenario: str = Query("oil_shock"),
):
    if demo:
        fixtures = _load_fixtures()
        s = next((x for x in fixtures["scenarios"] if x["name"] == scenario), fixtures["scenarios"][0])
        return s.get("risk", [])
    scores = await _get_live_scores()
    return scores[:15]  # top 15 for the dashboard list


@router.get("/risk/{code}")
async def get_risk_detail(code: str, request: Request):
    """Return full detail for one country including articles + AI brief.
    Falls back to scoring on demand if the country isn't in the cache."""
    from fastapi import HTTPException
    code = code.upper()
    scores = await _get_live_scores()
    country = next((c for c in scores if c["code"] == code), None)

    # Not in cache — score it on demand if it's a watched country
    if not country:
        if code not in WATCH_COUNTRIES:
            raise HTTPException(404, f"Country {code} not tracked")
        name, query = WATCH_COUNTRIES[code]
        try:
            country = await _score_country(code, name, query)
        except Exception as e:
            log.warning(f"[risk] on-demand score failed {code}: {e}")
            raise HTTPException(500, f"Failed to score {code}")

    brief = await _ai_country_brief(country)
    return {**country, "ai_brief": brief}
