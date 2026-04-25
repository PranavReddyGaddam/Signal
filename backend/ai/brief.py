import os
import asyncio
import json

import anthropic
from supabase import Client
import ai.toggle as ai_toggle

_db: Client | None = None


def set_db(db: Client) -> None:
    global _db
    _db = db


async def run() -> None:
    if _db is None:
        return
    if not ai_toggle.is_enabled():
        print("[brief] AI analysis disabled, skipping")
        return

    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        print("[brief] No ANTHROPIC_API_KEY, skipping")
        return

    loop = asyncio.get_event_loop()

    def _fetch_signals():
        return _db.table("signals").select(
            "ai_implications, confidence, sector_tags"
        ).order("created_at", desc=True).order("confidence", desc=True).limit(5).execute()

    resp = await loop.run_in_executor(None, _fetch_signals)
    if not resp.data:
        print("[brief] No signals to brief yet")
        return

    summaries = []
    for r in resp.data:
        impl = r["ai_implications"]
        if isinstance(impl, str):
            impl = json.loads(impl)
        summary = impl.get("summary", "") if isinstance(impl, dict) else ""
        summaries.append(
            f"- {summary} (confidence: {r['confidence']:.0%}, sectors: {', '.join(r['sector_tags'] or [])})"
        )

    try:
        client = anthropic.AsyncAnthropic(api_key=api_key)
        response = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            system=(
                "You are a financial intelligence analyst. "
                "Given market signals, return ONLY valid JSON with this exact schema — no prose, no markdown:\n"
                "{\n"
                '  "risk_posture": "risk-on" | "risk-off" | "neutral",\n'
                '  "signal_confidence": <0-100 integer>,\n'
                '  "sectors_affected": <integer count>,\n'
                '  "primary_sector": "<sector name>",\n'
                '  "top_theme": "<≤6 word theme label>",\n'
                '  "watch": "<≤8 word leading indicator to watch>",\n'
                '  "cross_sector_correlation": "high" | "moderate" | "low",\n'
                '  "regime": "<≤5 word market regime label>"\n'
                "}\n"
                "Be precise. Use only data from the signals provided."
            ),
            messages=[{"role": "user", "content": "Top market signals:\n" + "\n".join(summaries)}],
        )
        raw = response.content[0].text.strip()
        # Validate it's parseable JSON before storing
        json.loads(raw)
        brief_text = raw

        def _insert(text=brief_text):
            return _db.table("briefs").insert({"content": text}).execute()

        await loop.run_in_executor(None, _insert)
        print(f"[brief] Generated brief ({len(brief_text)} chars)")

    except Exception as e:
        print(f"[brief] Error generating brief: {e}")
