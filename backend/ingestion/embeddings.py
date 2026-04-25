import os
import voyageai
from supabase import Client

_db: Client | None = None
_voyage_client: voyageai.Client | None = None


def set_db(db: Client) -> None:
    global _db
    _db = db


def _get_voyage_client() -> voyageai.Client:
    global _voyage_client
    if _voyage_client is None:
        _voyage_client = voyageai.Client(api_key=os.getenv("VOYAGE_API_KEY") or os.getenv("ANTHROPIC_API_KEY"))
    return _voyage_client


def embed_event_sync(db: Client, event_id: str, text: str) -> None:
    try:
        client = _get_voyage_client()
        result = client.embed([text[:2000]], model="voyage-3")
        vector = result.embeddings[0]
        db.table("events").update({"embedding": vector}).eq("id", event_id).execute()
    except Exception as e:
        print(f"[embeddings] Failed to embed event {event_id}: {e}")


async def embed_event(db: Client, event_id: str, text: str) -> None:
    import asyncio
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, embed_event_sync, db, event_id, text)
