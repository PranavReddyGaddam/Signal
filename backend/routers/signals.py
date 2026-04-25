import asyncio
import json
from pathlib import Path
from fastapi import APIRouter, Request, Query
from ai.implications import _is_stale_summary, _smart_summary, _rule_based_tickers

router = APIRouter()
_fixtures: dict | None = None


def _load_fixtures() -> dict:
    global _fixtures
    if _fixtures is None:
        path = Path(__file__).parent.parent / "data" / "fixtures.json"
        _fixtures = json.loads(path.read_text())
    return _fixtures


@router.get("/signals")
async def get_signals(
    request: Request,
    demo: bool = Query(False),
    scenario: str = Query("oil_shock"),
):
    if demo:
        fixtures = _load_fixtures()
        s = next((x for x in fixtures["scenarios"] if x["name"] == scenario), fixtures["scenarios"][0])
        return s["signals"]

    db = request.app.state.db
    if db is None:
        return []

    loop = asyncio.get_event_loop()

    def _fetch():
        return db.table("signals").select(
            "id, created_at, sector_tags, confidence, ai_implications, event_ids"
        ).order("created_at", desc=True).limit(10).execute()

    resp = await loop.run_in_executor(None, _fetch)
    if not resp.data:
        return []

    result = []
    for r in resp.data:
        impl = r["ai_implications"]
        if isinstance(impl, str):
            impl = json.loads(impl)

        event_ids = r.get("event_ids") or []
        events = []
        if event_ids:
            def _fetch_events(ids=event_ids):
                return db.table("events").select(
                    "id, title, source, magnitude, sector_tags"
                ).in_("id", ids).execute()
            ev_resp = await loop.run_in_executor(None, _fetch_events)
            if ev_resp.data:
                events = [
                    {"id": e["id"], "title": e["title"], "source": e["source"],
                     "magnitude": e["magnitude"], "sector_tags": list(e.get("sector_tags") or [])}
                    for e in ev_resp.data
                ]

        stored_conf = float(r.get("confidence") or 0)
        if (stored_conf == 0.5 or stored_conf >= 0.9) and events:
            n_events = len(events)
            magnitude_sum = sum(float(e.get("magnitude") or 0) for e in events)
            avg_mag = magnitude_sum / n_events if n_events else 0
            n_sources = len({e.get("source", "") for e in events})
            stored_conf = min(0.90, max(0.20, round(
                0.55 * min(1.0, avg_mag / 0.5) +
                0.45 * min(1.0, n_sources / 3.0),
                2,
            )))

        stored_tickers = impl.get("tickers") or []
        is_flat_rule_based = (
            len(stored_tickers) > 1 and
            len({t.get("confidence") for t in stored_tickers}) == 1
        )
        is_fallback_pattern = "Rule-based" in (impl.get("historical_pattern") or "")
        needs_regen = not stored_tickers or is_flat_rule_based or is_fallback_pattern
        if events and needs_regen:
            defining_sectors = list(r.get("sector_tags") or [])[:3]
            all_sectors = list(r.get("sector_tags") or [])
            pattern = (
                f"Cluster of {len(events)} events across {', '.join(all_sectors[:3])} sectors. "
                f"Rule-based implications derived from sector scenario mapping."
            )
            impl = {
                **impl,
                "summary": _smart_summary(events, preferred_sectors=defining_sectors),
                "tickers": _rule_based_tickers(events, defining_sectors),
                "historical_pattern": pattern,
            }

        result.append({
            "id": r["id"],
            "created_at": r["created_at"],
            "sector_tags": list(r.get("sector_tags") or []),
            "confidence": stored_conf,
            "ai_implications": impl,
            "events": events,
        })
    return result
