import asyncio
import json
from datetime import datetime, timezone, timedelta

from supabase import Client

from ai.implications import analyze_cluster

_db: Client | None = None


def set_db(db: Client) -> None:
    global _db
    _db = db


def _build_clusters(events: list[dict]) -> list[list[dict]]:
    n = len(events)
    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(x, y):
        parent[find(x)] = find(y)

    for i in range(n):
        for j in range(i + 1, n):
            tags_i = set(events[i].get("sector_tags") or [])
            tags_j = set(events[j].get("sector_tags") or [])
            if tags_i & tags_j:
                union(i, j)

    groups: dict[int, list[dict]] = {}
    for i, e in enumerate(events):
        root = find(i)
        groups.setdefault(root, []).append(e)

    return list(groups.values())


async def run() -> None:
    if _db is None:
        return

    loop = asyncio.get_event_loop()
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=4)).isoformat()

    def _fetch_events():
        return _db.table("events").select(
            "id, sector_tags, magnitude, title, source, embedding"
        ).gte("fetched_at", cutoff).execute()

    resp = await loop.run_in_executor(None, _fetch_events)
    if not resp.data:
        print("[engine] No recent events")
        return

    events = [
        {
            "id": r["id"],
            "sector_tags": list(r.get("sector_tags") or []),
            "magnitude": float(r.get("magnitude") or 0),
            "title": r.get("title", ""),
            "source": r.get("source", ""),
            "embedding": r.get("embedding"),
        }
        for r in resp.data
    ]

    clusters = _build_clusters(events)

    for cluster in clusters:
        score = sum(e["magnitude"] for e in cluster)
        if score < 0.6:
            continue

        existing_ids = [e["id"] for e in cluster]

        embedded = [e for e in cluster if e.get("embedding") is not None]
        if embedded:
            for evt in embedded[:2]:
                try:
                    def _similarity_search(embedding=evt["embedding"], ids=list(existing_ids)):
                        return _db.rpc("match_events", {
                            "query_embedding": embedding,
                            "exclude_ids": ids,
                            "match_count": 3,
                        }).execute()

                    sim_resp = await loop.run_in_executor(None, _similarity_search)
                    if sim_resp.data:
                        for s in sim_resp.data:
                            sid = s["id"]
                            if sid not in existing_ids:
                                cluster.append({
                                    "id": sid,
                                    "sector_tags": list(s.get("sector_tags") or []),
                                    "magnitude": float(s.get("magnitude") or 0),
                                    "title": s.get("title", ""),
                                    "source": s.get("source", ""),
                                    "embedding": None,
                                })
                                existing_ids.append(sid)
                except Exception as e:
                    print(f"[engine] pgvector similarity error: {e}")

        try:
            implications = await analyze_cluster(cluster)
        except Exception as e:
            print(f"[engine] implications error: {e}")
            continue

        all_tags = list({tag for e in cluster for tag in (e.get("sector_tags") or [])})
        confidence = float(implications.get("overall_confidence", 0.5))

        def _insert_signal(impl=implications, tags=all_tags, conf=confidence, eids=list(existing_ids)):
            return _db.table("signals").insert({
                "event_ids": eids,
                "sector_tags": tags,
                "ai_implications": impl,
                "confidence": conf,
            }).execute()

        try:
            await loop.run_in_executor(None, _insert_signal)
            print(f"[engine] Signal created: score={score:.2f} confidence={confidence:.2f} events={len(cluster)}")
        except Exception as e:
            print(f"[engine] DB insert error: {e}")
