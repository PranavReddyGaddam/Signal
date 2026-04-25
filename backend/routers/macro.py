import asyncio
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
from fastapi import APIRouter, Request, Query

router = APIRouter()
_fixtures: dict | None = None

SERIES_LABELS = {
    "FEDFUNDS":     ("Fed Funds Rate",        "%"),
    "T10Y2Y":       ("Yield Curve (10Y-2Y)",  "%"),
    "BAMLH0A0HYM2": ("HY Credit Spread",      "%"),
    "ICSA":         ("Jobless Claims",         "thousands"),
    "UNRATE":       ("Unemployment Rate",      "%"),
}


def _load_fixtures() -> dict:
    global _fixtures
    if _fixtures is None:
        path = Path(__file__).parent.parent / "data" / "fixtures.json"
        _fixtures = json.loads(path.read_text())
    return _fixtures


def _compute_trend(current: float, prior: float | None) -> str:
    if prior is None or prior == 0:
        return "flat"
    change = (current - prior) / abs(prior)
    if change > 0.01:
        return "up"
    if change < -0.01:
        return "down"
    return "flat"


@router.get("/macro")
async def get_macro(
    request: Request,
    demo: bool = Query(False),
    scenario: str = Query("oil_shock"),
):
    if demo:
        fixtures = _load_fixtures()
        s = next((x for x in fixtures["scenarios"] if x["name"] == scenario), fixtures["scenarios"][0])
        return s["macro"]

    db = request.app.state.db
    if db is None:
        return []

    loop = asyncio.get_event_loop()
    result = []
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

    for series_id, (label, units) in SERIES_LABELS.items():
        try:
            def _fetch_latest(sid=series_id):
                return db.table("events").select(
                    "content, magnitude, fetched_at"
                ).eq("source", "FRED").eq("content->>series_id", sid).order("fetched_at", desc=True).limit(1).execute()

            resp = await loop.run_in_executor(None, _fetch_latest)
            if not resp.data:
                continue

            row = resp.data[0]
            content = row["content"]
            if isinstance(content, str):
                content = json.loads(content)
            current_val = float(content.get("value", 0))

            def _fetch_prior(sid=series_id, wa=week_ago):
                return db.table("events").select("content").eq("source", "FRED").eq(
                    "content->>series_id", sid
                ).lt("fetched_at", wa).order("fetched_at", desc=True).limit(1).execute()

            prior_resp = await loop.run_in_executor(None, _fetch_prior)
            prior_val = None
            if prior_resp.data:
                prior_content = prior_resp.data[0]["content"]
                if isinstance(prior_content, str):
                    prior_content = json.loads(prior_content)
                prior_val = float(prior_content.get("value", 0))

            result.append({
                "series_id": series_id,
                "label": label,
                "value": current_val,
                "units": units,
                "trend": _compute_trend(current_val, prior_val),
                "magnitude": float(row.get("magnitude") or 0),
                "fetched_at": row["fetched_at"],
            })
        except Exception as e:
            print(f"[macro] Error fetching {series_id}: {e}")

    return result
