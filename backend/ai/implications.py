import os
import json
import anthropic
from pathlib import Path
import ai.toggle as ai_toggle

_sector_map: dict | None = None

OUTPUT_SCHEMA = {
    "summary": "string",
    "affected_sectors": ["string"],
    "tickers": [
        {"symbol": "string", "direction": "bullish or bearish", "confidence": 0.0, "reasoning": "string"}
    ],
    "overall_confidence": 0.0,
    "historical_pattern": "string",
}


def _load_sector_map() -> dict:
    global _sector_map
    if _sector_map is None:
        path = Path(__file__).parent.parent / "data" / "sector_map.json"
        _sector_map = json.loads(path.read_text())
    return _sector_map


def _build_prompt(events: list[dict]) -> str:
    sector_map = _load_sector_map()
    all_tags = set()
    for e in events:
        all_tags.update(e.get("sector_tags", []))
    relevant = {k: v for k, v in sector_map.items() if any(t in v.get("sectors", []) for t in all_tags)}
    summaries = [
        {"title": e.get("title", ""), "magnitude": e.get("magnitude", 0),
         "sector_tags": e.get("sector_tags", []), "source": e.get("source", "")}
        for e in events
    ]
    return (
        f"Events cluster:\n{json.dumps(summaries, indent=2)}\n\n"
        f"Sector context:\n{json.dumps(relevant, indent=2)}\n\n"
        f"Return JSON matching this exact schema:\n{json.dumps(OUTPUT_SCHEMA, indent=2)}"
    )


async def analyze_cluster(events: list[dict]) -> dict:
    if not ai_toggle.is_enabled():
        return _fallback(events)

    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        return _fallback(events)

    client = anthropic.AsyncAnthropic(api_key=api_key)
    prompt = _build_prompt(events)

    for attempt in range(2):
        try:
            response = await client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                system="You are a financial intelligence analyst. Return JSON only, no prose.",
                messages=[{"role": "user", "content": prompt}],
            )
            text = response.content[0].text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            result = json.loads(text)
            if not {"summary", "affected_sectors", "tickers", "overall_confidence", "historical_pattern"} <= set(result):
                raise ValueError("Missing required keys")
            return result
        except (json.JSONDecodeError, ValueError) as e:
            if attempt == 0:
                prompt = f"Fix JSON error: {e}\n\nOriginal:\n{prompt}"
            else:
                return _fallback(events)
        except Exception as e:
            print(f"[implications] Claude error: {e}")
            return _fallback(events)

    return _fallback(events)


def _fallback(events: list[dict]) -> dict:
    all_tags = list({t for e in events for t in (e.get("sector_tags") or [])})
    return {
        "summary": f"Signal cluster detected across {', '.join(all_tags[:3])} sectors.",
        "affected_sectors": all_tags[:5],
        "tickers": [],
        "overall_confidence": 0.5,
        "historical_pattern": "Insufficient data for pattern matching.",
    }
