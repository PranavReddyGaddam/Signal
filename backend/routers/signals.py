import asyncio
import json
from pathlib import Path
from fastapi import APIRouter, Request, Query

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
                    "id, title, source, magnitude"
                ).in_("id", ids).execute()
            ev_resp = await loop.run_in_executor(None, _fetch_events)
            if ev_resp.data:
                events = [{"id": e["id"], "title": e["title"], "source": e["source"], "magnitude": e["magnitude"]} for e in ev_resp.data]

        result.append({
            "id": r["id"],
            "created_at": r["created_at"],
            "sector_tags": list(r.get("sector_tags") or []),
            "confidence": float(r.get("confidence") or 0),
            "ai_implications": impl,
            "events": events,
        })
    return result
