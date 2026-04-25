import asyncio
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
from fastapi import APIRouter, Request, Query

router = APIRouter()
_fixtures: dict | None = None

CHOKEPOINTS = [
    {"name": "Strait of Hormuz",  "keywords": ["iran", "persian gulf", "hormuz", "oil tanker"]},
    {"name": "Suez Canal",        "keywords": ["suez", "egypt", "red sea", "houthi"]},
    {"name": "Taiwan Strait",     "keywords": ["taiwan", "china", "tsmc", "semiconductor"]},
    {"name": "Bab el-Mandeb",     "keywords": ["bab el-mandeb", "yemen", "houthi", "djibouti"]},
    {"name": "Kerch Strait",      "keywords": ["kerch", "ukraine", "russia", "black sea"]},
]


def _load_fixtures() -> dict:
    global _fixtures
    if _fixtures is None:
        path = Path(__file__).parent.parent / "data" / "fixtures.json"
        _fixtures = json.loads(path.read_text())
    return _fixtures


def _risk_level(count: int) -> str:
    if count >= 3:
        return "critical"
    if count >= 1:
        return "elevated"
    return "normal"


@router.get("/chokepoints")
async def get_chokepoints(
    request: Request,
    demo: bool = Query(False),
    scenario: str = Query("oil_shock"),
):
    if demo:
        fixtures = _load_fixtures()
        s = next((x for x in fixtures["scenarios"] if x["name"] == scenario), fixtures["scenarios"][0])
        return s["chokepoints"]

    db = request.app.state.db
    if db is None:
        return [{"name": cp["name"], "risk_level": "normal", "top_tickers": [], "signal_count": 0} for cp in CHOKEPOINTS]

    loop = asyncio.get_event_loop()
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=4)).isoformat()

    def _fetch():
        return db.table("signals").select(
            "ai_implications, sector_tags, event_ids"
        ).gte("created_at", cutoff).execute()

    def _fetch_event_titles(ids: list):
        return db.table("events").select("title").in_("id", ids).execute()

    resp = await loop.run_in_executor(None, _fetch)
    signals_data = []
    for r in (resp.data or []):
        impl = r["ai_implications"]
        if isinstance(impl, str):
            impl = json.loads(impl)
        event_ids = r.get("event_ids") or []
        titles = []
        if event_ids:
            ev_resp = await loop.run_in_executor(None, _fetch_event_titles, event_ids)
            titles = [e["title"] for e in (ev_resp.data or [])]
        signals_data.append({
            "summary": impl.get("summary", "") if isinstance(impl, dict) else "",
            "tickers": impl.get("tickers", []) if isinstance(impl, dict) else [],
            "event_titles": " ".join(titles),
        })

    result = []
    for cp in CHOKEPOINTS:
        matching = []
        for sd in signals_data:
            search_text = f"{sd['summary']} {sd['event_titles']}".lower()
            if any(kw in search_text for kw in cp["keywords"]):
                matching.append(sd)

        top_tickers: list = []
        seen: set = set()
        for sd in matching:
            for t in sd["tickers"]:
                sym = t.get("symbol", "")
                if sym and sym not in seen:
                    top_tickers.append({"symbol": sym, "direction": t.get("direction", "")})
                    seen.add(sym)
                if len(top_tickers) >= 2:
                    break
            if len(top_tickers) >= 2:
                break

        result.append({
            "name": cp["name"],
            "risk_level": _risk_level(len(matching)),
            "top_tickers": top_tickers,
            "signal_count": len(matching),
        })

    return result
