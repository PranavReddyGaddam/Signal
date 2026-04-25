import os
import asyncio
import json

import httpx
import anthropic
from supabase import Client

from ingestion.embeddings import embed_event

_db: Client | None = None

NEWS_URL = "https://newsapi.org/v2/everything"
NEWS_QUERY = "sanctions OR conflict OR supply chain OR Fed OR inflation"


def set_db(db: Client) -> None:
    global _db
    _db = db


async def _tag_article(client: anthropic.AsyncAnthropic, title: str, description: str) -> dict:
    try:
        response = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=256,
            system='Return JSON only: {"sector_tags": ["string"], "magnitude": 0.0}',
            messages=[{
                "role": "user",
                "content": (
                    f"Article: {title}. {description or ''}. "
                    "Assign sector tags from: [energy, financials, materials, industrials, "
                    "consumer_staples, geopolitical, labor, macro, commodities, technology]. "
                    "Magnitude 0-1 where 1=major market-moving event."
                ),
            }],
        )
        return json.loads(response.content[0].text)
    except Exception:
        return {"sector_tags": ["geopolitical"], "magnitude": 0.3}


async def run() -> None:
    if _db is None:
        return

    api_key = os.getenv("NEWS_API_KEY", "")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key or not anthropic_key:
        print("[news] Missing NEWS_API_KEY or ANTHROPIC_API_KEY, skipping")
        return

    async with httpx.AsyncClient(timeout=30) as http_client:
        try:
            resp = await http_client.get(NEWS_URL, params={
                "q": NEWS_QUERY,
                "sortBy": "publishedAt",
                "pageSize": 20,
                "apiKey": api_key,
                "language": "en",
            })
            resp.raise_for_status()
            articles = resp.json().get("articles", [])
        except Exception as e:
            print(f"[news] NewsAPI fetch error: {e}")
            return

    loop = asyncio.get_event_loop()
    ai_client = anthropic.AsyncAnthropic(api_key=anthropic_key)

    for article in articles:
        url = article.get("url", "")
        title = article.get("title") or ""
        description = article.get("description") or ""
        source_name = article.get("source", {}).get("name", "Unknown")

        if not url or not title:
            continue

        try:
            def _check_dup(u=url):
                return _db.table("events").select("id").eq("content->>url", u).limit(1).execute()

            existing = await loop.run_in_executor(None, _check_dup)
            if existing.data:
                continue

            tags_result = await _tag_article(ai_client, title, description)
            sector_tags = tags_result.get("sector_tags", ["geopolitical"])
            magnitude = float(tags_result.get("magnitude", 0.3))

            content = {
                "title": title,
                "url": url,
                "source": source_name,
                "description": description[:500],
            }

            def _insert(t=title, c=content, m=magnitude, st=sector_tags):
                return _db.table("events").insert({
                    "source": "NewsAPI",
                    "category": "geopolitical",
                    "title": t[:500],
                    "content": c,
                    "magnitude": m,
                    "sector_tags": st,
                }).execute()

            resp = await loop.run_in_executor(None, _insert)
            if resp.data:
                event_id = resp.data[0]["id"]
                await embed_event(_db, event_id, f"{title} {description[:300]}")
                print(f"[news] Ingested: {title[:60]} magnitude={magnitude:.2f}")

            await asyncio.sleep(0.5)

        except Exception as e:
            print(f"[news] Error processing article '{title[:40]}': {e}")
