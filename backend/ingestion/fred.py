import os
import asyncio
from datetime import datetime, timezone, timedelta

import httpx
import numpy as np
from supabase import Client

from ingestion.embeddings import embed_event

_db: Client | None = None

SERIES = {
    "FEDFUNDS":     {"sector_tags": ["financials", "macro"],   "units": "percent"},
    "T10Y2Y":       {"sector_tags": ["financials", "macro"],   "units": "percent"},
    "BAMLH0A0HYM2": {"sector_tags": ["credit", "financials"],  "units": "percent"},
    "ICSA":         {"sector_tags": ["labor", "macro"],        "units": "thousands"},
    "UNRATE":       {"sector_tags": ["labor", "macro"],        "units": "percent"},
}

FRED_BASE = "https://api.stlouisfed.org/fred/series/observations"


def set_db(db: Client) -> None:
    global _db
    _db = db


def _is_fresh(db: Client, series_id: str) -> bool:
    resp = (
        db.table("events")
        .select("fetched_at")
        .eq("source", "FRED")
        .eq("content->>series_id", series_id)
        .order("fetched_at", desc=True)
        .limit(1)
        .execute()
    )
    if not resp.data:
        return False
    fetched = resp.data[0]["fetched_at"]
    if isinstance(fetched, str):
        fetched = datetime.fromisoformat(fetched.replace("Z", "+00:00"))
    age = datetime.now(timezone.utc) - fetched.replace(tzinfo=timezone.utc)
    return age.total_seconds() < 14 * 60


async def _fetch_series(client: httpx.AsyncClient, series_id: str) -> dict | None:
    resp = await client.get(FRED_BASE, params={
        "series_id": series_id,
        "api_key": os.getenv("FRED_API_KEY", ""),
        "file_type": "json",
        "limit": 90,
        "sort_order": "desc",
    })
    resp.raise_for_status()
    observations = [o for o in resp.json().get("observations", []) if o["value"] != "."]
    if len(observations) < 2:
        return None
    values = [float(o["value"]) for o in observations]
    latest = values[0]
    ma90 = float(np.mean(values))
    magnitude = float(np.clip(abs((latest - ma90) / ma90) if ma90 != 0 else 0, 0, 1))
    return {"value": latest, "ma_90": ma90, "magnitude": magnitude, "event_time": observations[0]["date"]}


async def run() -> None:
    if _db is None:
        return
    api_key = os.getenv("FRED_API_KEY", "")
    if not api_key:
        print("[fred] No FRED_API_KEY, skipping")
        return

    loop = asyncio.get_event_loop()
    async with httpx.AsyncClient(timeout=30) as client:
        for series_id, meta in SERIES.items():
            try:
                fresh = await loop.run_in_executor(None, _is_fresh, _db, series_id)
                if fresh:
                    continue

                result = await _fetch_series(client, series_id)
                if result is None:
                    continue

                title = f"{series_id} value: {result['value']} (MA90: {result['ma_90']:.4f})"
                content = {
                    "series_id": series_id,
                    "value": result["value"],
                    "units": meta["units"],
                    "ma_90": result["ma_90"],
                }

                def _insert():
                    return _db.table("events").insert({
                        "source": "FRED",
                        "category": "macro",
                        "title": title,
                        "content": content,
                        "magnitude": result["magnitude"],
                        "sector_tags": meta["sector_tags"],
                        "event_time": result["event_time"],
                    }).execute()

                resp = await loop.run_in_executor(None, _insert)
                if resp.data:
                    event_id = resp.data[0]["id"]
                    await embed_event(_db, event_id, f"{title} {series_id} macro indicator")
                    print(f"[fred] Ingested {series_id} magnitude={result['magnitude']:.3f}")

            except Exception as e:
                print(f"[fred] Error ingesting {series_id}: {e}")
