import asyncio
from datetime import datetime, timezone

import numpy as np
from supabase import Client

from ingestion.embeddings import embed_event

_db: Client | None = None

TICKERS = {
    "XLE": ["energy"],
    "XLF": ["financials"],
    "XLI": ["industrials"],
    "XLB": ["materials"],
    "XLP": ["consumer_staples"],
    "GLD": ["commodities"],
    "USO": ["energy", "commodities"],
}


def set_db(db: Client) -> None:
    global _db
    _db = db


def _is_fresh(db: Client, ticker: str) -> bool:
    resp = (
        db.table("events")
        .select("fetched_at")
        .eq("source", "yfinance")
        .eq("content->>ticker", ticker)
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


def _download_tickers():
    import yfinance as yf
    return yf.download(list(TICKERS.keys()), period="5d", auto_adjust=True, progress=False)


async def run() -> None:
    if _db is None:
        return

    loop = asyncio.get_event_loop()
    try:
        data = await loop.run_in_executor(None, _download_tickers)
    except Exception as e:
        print(f"[market] yfinance download error: {e}")
        return

    close = data["Close"] if "Close" in data.columns.get_level_values(0) else data

    for ticker, sector_tags in TICKERS.items():
        try:
            if ticker not in close.columns:
                continue
            series = close[ticker].dropna()
            if len(series) < 2:
                continue

            close_today = float(series.iloc[-1])
            close_prev = float(series.iloc[-2])
            pct_change = (close_today - close_prev) / close_prev * 100
            magnitude = float(np.clip(abs(pct_change) / 10, 0, 1))

            fresh = await loop.run_in_executor(None, _is_fresh, _db, ticker)
            if fresh:
                continue

            direction = "+" if pct_change >= 0 else ""
            title = f"{ticker} moved {direction}{pct_change:.1f}% today"
            content = {
                "ticker": ticker,
                "close": round(close_today, 4),
                "prev_close": round(close_prev, 4),
                "pct_change": round(pct_change, 4),
            }

            def _insert(t=title, c=content, m=magnitude, st=sector_tags):
                return _db.table("events").insert({
                    "source": "yfinance",
                    "category": "market",
                    "title": t,
                    "content": c,
                    "magnitude": m,
                    "sector_tags": st,
                }).execute()

            resp = await loop.run_in_executor(None, _insert)
            if resp.data:
                event_id = resp.data[0]["id"]
                await embed_event(_db, event_id, f"{title} sector {' '.join(sector_tags)}")
                print(f"[market] Ingested {ticker} pct={pct_change:.2f}% magnitude={magnitude:.3f}")

        except Exception as e:
            print(f"[market] Error ingesting {ticker}: {e}")
