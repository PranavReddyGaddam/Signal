# Signal — Implementation Plan
_Last updated: 2026-04-25_

## Current State

### Done
- World map with GDELT-driven conflict, cyber, sanctions, economic, pipeline, cable, minerals layers
- Country Instability Index: 28 countries, live GDELT 24h/48h scoring, 5 dimensions, 30-min cache, `sourcelang:english` filter, click-to-detail modal with AI brief (Claude Haiku)
- Economic Stress Index: 6 FRED series (VIX, yield curve, HY spread, UNRATE, CPI MoM, consumer sentiment), normalized composite 0-100, 30-min cache, frontend gauge + per-indicator bars
- AI Brief: structured JSON KPI cards (risk posture, confidence, regime, sectors, watch)
- Signal Feed: correlated event clusters from Supabase with AI implications
- MacroStress panel: raw FRED series values
- Live News Feed: audio/radio-style news player
- Portfolio modal: UI shell (no backend wiring)
- Council modal: full UI with phase tracker and verdict rendering (backend not implemented)
- News classifier: pure Python taxonomy classifier (`ingestion/news_classifier.py`) — written but not wired into pipeline
- AI toggle: global on/off switch for LLM calls
- Ingestion pipeline: FRED, yfinance, NewsAPI into Supabase with embeddings + correlation engine

### Data Source Decisions
- **GDELT**: primary live data source for all geopolitical/news layers. English-only filter (`sourcelang:english`) is mandatory — without it, 60%+ of results are non-English and keyword classifiers score nothing.
- **FRED**: live economic data. API key confirmed working. 30-min cache is sufficient (FRED updates at most daily).

### Core Architectural Principle
LLMs receive pre-scored, structured facts — not raw data. Every agent gets a compact context object built by the news classifier and scoring layers, not raw article lists or GDELT dumps. This keeps prompts short, reduces hallucination, and makes agent outputs deterministic enough to parse as JSON. The news classifier is the bridge between raw data and agent-ready context.

### Missing (not built yet)
- AI Agent Council backend (the biggest gap — UI exists but calls a non-existent endpoint)
- Portfolio backend (Supabase table + API)
- News classifier wired into ingestion pipeline
- Per-ticker quant scoring
- Council verdict storage and history
- Map country click — zoom + in-map stat sheet popup

---

## Implementation Order

Priority is: unblock the council run first (it is the demo centerpiece), then portfolio persistence, then quant layer.

---

## Phase 1 — AI Agent Council Backend

The council modal already exists and calls `POST /api/council/run`. This needs to be real.

### 1.1 Agent modules (`backend/ai/agents/`)

**`macro_agent.py`**
- Input: latest FRED data from `_get_stress()` (economic_stress router), last 10 FRED events from Supabase
- Prompt: 3-sentence macro regime assessment + risk score 0-100 + top 2 macro risks
- Model: `claude-haiku-4-5-20251001` (cheap, fast)
- Output schema:
  ```json
  { "regime": str, "risk_score": int, "primary_risk": str, "secondary_risk": str, "rate_outlook": str }
  ```

**`geo_agent.py`**
- Input: top 8 countries from risk router cache (`_get_live_scores()`), classified news from `build_agent_context()` filtered to category=["military","conflict","sanctions"]
- Prompt: identify top 3 active geopolitical threats and their market impact vectors
- Model: `claude-haiku-4-5-20251001`
- Output schema:
  ```json
  { "threat_level": "low"|"moderate"|"high"|"critical", "top_threats": [{"country": str, "event": str, "market_impact": str}], "contagion_risk": str }
  ```

**`market_agent.py`**
- Input: portfolio positions (from Supabase or request body), latest signals from Supabase, macro + geo agent outputs
- Prompt: for each position, assess hold/add/reduce/exit + entry/stop/target prices
- Model: `claude-haiku-4-5-20251001`
- Output schema:
  ```json
  { "portfolio_actions": [{"ticker": str, "action": str, "conviction": int, "reasoning": str, "price_targets": {"entry": float, "stop": float, "target": float}}] }
  ```

**`devils_advocate.py`**
- Input: market agent output + macro/geo context
- Prompt: challenge every HOLD/ADD recommendation — what is the bear case? What is the model missing?
- Model: `claude-haiku-4-5-20251001`
- Output schema:
  ```json
  { "rebuttals": [{"ticker": str, "bear_case": str, "probability": int}], "tail_risks": [str] }
  ```

### 1.2 Orchestrator (`backend/ai/council.py`)

```python
async def run_council(portfolio: list[dict]) -> dict:
    # Step 1: macro + geo in parallel (both fast/cheap)
    macro_out, geo_out = await asyncio.gather(
        macro_agent.run(),
        geo_agent.run(),
    )
    # Step 2: market agent (needs macro + geo context)
    market_out = await market_agent.run(portfolio, macro_out, geo_out)
    # Step 3: devil's advocate (needs market output)
    devil_out = await devils_advocate.run(market_out, macro_out, geo_out)
    # Step 4: synthesis via Opus with extended thinking
    verdict = await _synthesize(macro_out, geo_out, market_out, devil_out, portfolio)
    return verdict
```

Synthesis uses `claude-sonnet-4-6`. Produces the final `Verdict` JSON matching the frontend interface.

### 1.3 Router (`backend/routers/council.py`)

- `POST /api/council/run` — accepts `{ portfolio: [...] }`, streams phase updates via SSE or returns final JSON after ~30s. Start with simple non-streaming JSON (CouncilModal already handles 120s timeout).
- `GET /api/council/latest` — returns last verdict from Supabase `council_verdicts` table
- Supabase table: `council_verdicts(id, verdict jsonb, portfolio_snapshot jsonb, created_at timestamptz)`

### 1.4 Wire into main.py
Add `council_router` import and `app.include_router`.

---

## Phase 2 — Portfolio Backend

The portfolio modal has a UI shell but no persistence.

### 2.1 Supabase table
```sql
create table portfolios (
  id         uuid primary key default gen_random_uuid(),
  ticker     text not null,
  shares     float not null,
  avg_cost   float not null,
  sector     text,
  added_at   timestamptz not null default now()
);
```

### 2.2 Router (`backend/routers/portfolio.py`)
- `GET /api/portfolio` — returns all positions with current price + P&L (fetch prices via yfinance)
- `POST /api/portfolio` — add position `{ ticker, shares, avg_cost, sector }`
- `DELETE /api/portfolio/{ticker}` — remove position

### 2.3 Frontend (`PortfolioModal.tsx`)
- Replace static mock data with live `GET /api/portfolio`
- Add/remove position forms
- Show current price, P&L %, sector tag per row
- Pass live portfolio to council run: `POST /api/council/run` body includes positions

---

## Phase 3 — News Classifier Pipeline Integration

`news_classifier.py` is written but isolated. Wire it in.

### 3.1 Update `ingestion/news.py`
After fetching articles from NewsAPI, run `classify_batch()` on them before inserting into Supabase. Store `importance_score`, `category`, `sub_category`, `severity`, `sectors`, `actors`, `locations` in the event `content` JSONB.

### 3.2 Update `build_agent_context()` call sites
The geo and market agents should call `build_agent_context(articles, category=..., min_importance=40)` instead of raw article lists. This gives agents pre-scored, de-duped, sector-tagged article summaries.

### 3.3 Map layers improvement
`map_layers.py` currently does its own keyword matching. Replace with `classify()` from the news classifier for richer categorization.

---

## Phase 4 — Quant Scoring Layer

Needed for the market agent to produce credible price targets.

### 4.1 `ingestion/ticker_quant.py`
For each portfolio ticker, compute:
- **Trend**: 20/50/200 MA position (above/below)
- **Momentum**: RSI-14, MACD signal crossover
- **Volatility**: 20-day realized vol, ATR
- **Fundamentals**: P/E, P/B from yfinance `.info`
- **Score**: composite 0-100 (60% technical, 40% fundamental)

Run on scheduler every 30 minutes, store in Supabase `quant_scores` table.

### 4.2 `GET /api/quant/{ticker}` router
Returns latest quant score for a ticker. Market agent calls this during portfolio analysis.

---

## Phase 5 — Map Country Click: Zoom + Stat Sheet

When the user clicks a country on the world map, if that country is in the `WATCH_COUNTRIES` list (the 28 tracked countries in `risk.py`), the map zooms in and a stat sheet popup appears anchored beside the country.

### 5.1 Country click detection (`WorldMap.tsx`)

The map already uses `onEachFeature` to bind click handlers to GeoJSON country polygons. Extend this:
- On click, check if `feat.properties.name` resolves to a country code in `WATCH_COUNTRIES` (use the same `COUNTRY_NAME_ALIASES` map already in the file, extended with the 28 tracked countries)
- If tracked: call `map.flyTo(countryCenter, zoom)` — zoom level 5 for large countries (Russia, China, USA), 6 for medium (Iran, Turkey), 7 for small (Lebanon, Haiti). Compute center from the GeoJSON polygon bounds centroid.
- If not tracked: do nothing (no click handler / cursor stays default)

### 5.2 In-map stat sheet popup

Do not use a modal — render the stat sheet as a Leaflet `L.popup` or a React overlay div positioned at `map.latLngToContainerPoint(center)`. It should appear beside the country, not cover it.

Stat sheet contents (all from the existing risk router cache — no new API calls for the popup itself):
- Country name + ISO code + instability level badge (colored: critical/high/elevated/normal)
- Composite instability score (large number, same gauge style as `RiskScores.tsx`)
- 5 dimension bars: Conflict, Unrest, Sanctions, Cyber, Econ Stress — each with score and color
- Dominant driver label (highest scoring dimension)
- Top 3 article headlines with source and timestamp (from the cached `articles` array)
- "Full report" button — clicking this opens the existing `CountryModal` for the full detail view with AI brief

### 5.3 Data flow

The stat sheet should use data already cached by the risk router. Add a lightweight `GET /api/risk/{code}/summary` endpoint that returns just the score, components, level, and top 3 articles — no AI brief generation (that stays in `GET /api/risk/{code}` which is triggered only from CountryModal's "Full report" button). This avoids burning Haiku credits every time someone clicks a country on the map.

Alternatively, if the full risk cache is already loaded in `RiskScores.tsx`, pass it down as a prop or store it in a shared context so `WorldMap` can access it without a new fetch.

### 5.4 Zoom-out / dismiss

- Clicking anywhere outside the popup (or a close button on the popup) calls `map.flyTo(originalCenter, 2)` to zoom back out to the default world view
- Pressing Escape also dismisses

### 5.5 Cursor affordance

Countries that are tracked should show `cursor: pointer` on hover. Countries not in `WATCH_COUNTRIES` keep the default cursor. This is handled in the `onEachFeature` mouseover/mouseout handlers.

---

## Phase 6 — Polish

These are low-effort improvements that make the demo look sharper.

- **Council verdict history**: `GET /api/council/history` returning last 5 verdicts, timeline in CouncilModal
- **News classifier smoke UI**: small tag pills on news articles in LiveNewsFeed showing `severity` and `category` classification
- **EconStress + RiskScores below-the-fold layout**: currently stacked vertically in right sidebar — consider a dedicated full-width section below the map with both panels side by side
- **Refresh button scope**: currently re-renders WorldMap but not EconStress or CountryModal — pass `refreshKey` consistently

---

## Effort Estimates

| Phase | Files | Estimated time |
|-------|-------|----------------|
| 1 — Council backend | 6 new files, 1 updated | 3-4 hours |
| 2 — Portfolio backend | 2 new files, 1 updated | 1-2 hours |
| 3 — Classifier pipeline | 2 updated | 1 hour |
| 4 — Quant layer | 2 new files, 1 new router | 2 hours |
| 5 — Map country click | WorldMap.tsx + 1 backend endpoint | 2 hours |
| 6 — Polish | scattered small edits | 1 hour |

**Model budget summary:**
- Haiku: macro agent, geo agent, market agent, devils advocate (4 calls per council run)
- Sonnet: orchestrator synthesis (1 call per council run)
- Haiku: country AI briefs in CountryModal (on demand, not every run)

**Recommended order for a demo**: Phase 1 → Phase 2 → Phase 5 → Phase 3 → Phase 4 → Phase 6.

The council run is the centerpiece of the demo — nothing else matters if clicking "Run Council" shows an error. The map country click (Phase 5) is the second biggest visual wow moment.
