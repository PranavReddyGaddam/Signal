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


@router.get("/brief")
async def get_brief(
    request: Request,
    demo: bool = Query(False),
    scenario: str = Query("oil_shock"),
):
    if demo:
        fixtures = _load_fixtures()
        s = next((x for x in fixtures["scenarios"] if x["name"] == scenario), fixtures["scenarios"][0])
        return s["brief"]

    db = request.app.state.db
    if db is None:
        return {"content": "No database connection. Use ?demo=true for demo data.", "created_at": None}

    loop = asyncio.get_event_loop()

    def _fetch():
        return db.table("briefs").select("content, created_at").order("created_at", desc=True).limit(1).execute()

    resp = await loop.run_in_executor(None, _fetch)
    if not resp.data:
        return {"content": "No brief available yet. Data is being ingested.", "created_at": None}

    row = resp.data[0]
    content = row["content"]
    # Try to parse as structured JSON (new format); fall back to text for old rows
    try:
        kpis = json.loads(content)
        return {"kpis": kpis, "content": None, "created_at": row["created_at"]}
    except (json.JSONDecodeError, TypeError):
        return {"content": content, "kpis": None, "created_at": row["created_at"]}
