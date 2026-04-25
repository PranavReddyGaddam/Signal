# Signal — AI Agent Council: Investment Decision Engine
## Hackathon Implementation Plan

---

## What We're Building

A **council of specialized AI agents** that debate live geopolitical + market data and produce a ranked, reasoned investment verdict: hold, exit, or enter positions. The council runs on demand (user-triggered) and on a 30-minute background schedule. Output surfaces in the existing Signal UI as a new "Council Verdict" panel.

---

## Current State (What Already Exists)

| Component | Status | Location |
|---|---|---|
| NewsAPI ingestion → Supabase events | Working | `ingestion/news.py` |
| yfinance sector ETF prices | Working | `ingestion/market.py` (7 tickers: XLE, XLF, XLI, XLB, XLP, GLD, USO) |
| FRED macro indicators | Working | `ingestion/fred.py` |
| Correlation engine → signals table | Working | `correlation/engine.py` |
| Claude single-agent implications | Working | `ai/implications.py` |
| Claude single-agent brief | Working | `ai/brief.py` |
| Map layers: conflict, climate, cyber, sanctions | Working | `routers/map_layers.py` |
| Frontend signal feed + implications panel | Working | `SignalFeed.tsx`, `ImplicationsPanel.tsx` |

**Gap:** All AI calls are single-shot, single-agent. No portfolio awareness. No debate. No buy/sell/hold verdict. No individual stock coverage (only sector ETFs).

---

## APIs Needed (Beyond What We Have)

### Tier 1 — Get These Before Hackathon Day

| API | What It Unlocks | Free Tier | Key Env Var |
|---|---|---|---|
| **Alpha Vantage** | Real-time quotes, fundamentals, earnings for individual stocks. Replaces yfinance for intraday | 25 req/day free, $50/mo for 75 req/min | `ALPHA_VANTAGE_KEY` |
| **Polygon.io** | Real-time + historical OHLCV, options flow, news per ticker | Free tier: 5 req/min, unlimited history | `POLYGON_KEY` |
| **Finnhub** | Company news, earnings calendar, insider sentiment, analyst ratings | 60 req/min free | `FINNHUB_KEY` |
| **GDELT DOC API** | Already working — geopolitical event articles, no key needed | Free, no key | — |
| **USGS + NASA FIRMS** | Already working — earthquakes + fires, no key needed | Free, no key | — |

### Tier 2 — Nice to Have on the Day

| API | What It Unlocks | Free Tier | Key Env Var |
|---|---|---|---|
| **Benzinga / Newsfilter** | Breaking financial news with ticker tags baked in | $50/mo | `BENZINGA_KEY` |
| **Unusual Whales** | Options flow — smart money positioning signals | $30/mo | `UNUSUAL_WHALES_KEY` |
| **FRED (already have)** | Macro context already flowing in | Free | `FRED_API_KEY` |
| **SEC EDGAR** | 13F filings, institutional position changes, 8-K events | Free, no key | — |

**Minimum viable:** Alpha Vantage + Polygon + Finnhub covers real-time quotes, fundamentals, and per-ticker news. Register all three today — they are free.

---

## Architecture: The Council

```
┌─────────────────────────────────────────────────────────────┐
│                    COUNCIL ORCHESTRATOR                      │
│              (claude-opus-4-7, extended thinking)            │
│   Receives all agent reports, runs debate, issues verdict    │
└────────────┬────────────────────────────────────────────────┘
             │ spawns & collects
    ┌────────┴─────────────────────────────────────────┐
    │                                                  │
    ▼                                                  ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  MACRO AGENT     │  │  GEO-RISK AGENT  │  │  MARKET AGENT    │
│ claude-sonnet    │  │ claude-sonnet    │  │ claude-sonnet    │
│                  │  │                  │  │                  │
│ Input:           │  │ Input:           │  │ Input:           │
│ - FRED series    │  │ - Map layer data │  │ - Portfolio       │
│ - yield curve    │  │   (conflict,     │  │   holdings        │
│ - credit spreads │  │   sanctions,     │  │ - Live quotes     │
│ - rate decisions │  │   cyber, climate)│  │ - Earnings cal    │
│                  │  │ - GDELT articles │  │ - Options flow    │
│ Output:          │  │ - Chokepoint     │  │ - Analyst ratings │
│ - Macro stance   │  │   risk levels    │  │                   │
│   (risk-on/off)  │  │                  │  │ Output:           │
│ - Rate direction │  │ Output:          │  │ - Per-ticker      │
│ - Recession risk │  │ - Sector exposure│  │   verdict         │
│   score 0-100    │  │   risk by region │  │ - Entry/exit pts  │
│                  │  │ - Supply chain   │  │ - Position size   │
│                  │  │   disruption     │  │   suggestion      │
│                  │  │   flags          │  │                   │
└──────────────────┘  └──────────────────┘  └──────────────────┘
         │                    │                      │
         └────────────────────┴──────────────────────┘
                              │
                    All three reports fed to
                              │
                    ┌─────────▼──────────┐
                    │  DEVIL'S ADVOCATE  │
                    │  claude-sonnet     │
                    │                   │
                    │  Argues the BEAR  │
                    │  case for each    │
                    │  proposed action. │
                    │  Finds holes in   │
                    │  the bull thesis. │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼──────────┐
                    │   ORCHESTRATOR     │
                    │  reads all above   │
                    │  issues VERDICT    │
                    └────────────────────┘
```

---

## Data Flow Into the Council

```
Supabase events table          Live API calls at run-time
(already ingested)             (council fetches fresh)
        │                               │
        ├── NewsAPI articles            ├── Alpha Vantage: live quotes
        ├── FRED macro series           ├── Polygon: OHLCV + options
        ├── yfinance sector ETFs        ├── Finnhub: earnings + ratings
        └── AI signal implications      ├── GDELT: last 6h conflict news
                                        ├── USGS: earthquakes today
                                        └── NASA FIRMS: active fires
                                                │
                                    ┌───────────▼───────────┐
                                    │   Council Context      │
                                    │   Builder              │
                                    │   Assembles a single   │
                                    │   structured context   │
                                    │   bundle passed to     │
                                    │   all agents           │
                                    └───────────────────────┘
```

---

## Portfolio Input

The user provides their holdings. Two modes:

1. **Manual entry** — user types tickers + share counts into a UI panel
2. **Paste brokerage export** — CSV from Robinhood/Schwab/Fidelity (columns: ticker, quantity, avg_cost)

Portfolio is stored in Supabase `portfolios` table (one row per user session for hackathon purposes). The Market Agent receives the full holdings on every council run.

---

## Implementation Checklist

### Phase 1 — Data Foundation (Do Before Hackathon Day)

- [ ] Register Alpha Vantage free account → get key → add `ALPHA_VANTAGE_KEY` to `.env`
- [ ] Register Polygon.io free account → get key → add `POLYGON_KEY` to `.env`
- [ ] Register Finnhub free account → get key → add `FINNHUB_KEY` to `.env`
- [ ] Create `ingestion/stocks.py` — fetches live OHLCV for user's portfolio tickers via Polygon
- [ ] Create `ingestion/fundamentals.py` — fetches P/E, earnings date, analyst consensus via Finnhub
- [ ] Extend `TICKERS` in `market.py` to cover individual stocks beyond sector ETFs
- [ ] Create Supabase table: `portfolios` (id, session_id, holdings jsonb, created_at)
- [ ] Create Supabase table: `council_verdicts` (id, created_at, verdict jsonb, agent_reports jsonb)

### Phase 2 — Agent Implementation (Hackathon Day Morning)

- [ ] Create `ai/agents/macro_agent.py`
  - Input: FRED data from Supabase + live rate data
  - Output: `{ stance, recession_risk, rate_direction, key_risks, sectors_to_avoid, sectors_to_favor }`
  - Model: claude-sonnet-4-6

- [ ] Create `ai/agents/geo_agent.py`
  - Input: map layer data (conflict, sanctions, cyber, climate) fetched from own endpoints
  - Output: `{ regional_risk_map, supply_chain_flags, commodity_impacts, sector_exposures }`
  - Model: claude-sonnet-4-6

- [ ] Create `ai/agents/market_agent.py`
  - Input: user portfolio + live quotes + Finnhub news per ticker + options flow
  - Output: per-ticker `{ verdict: hold|exit|add, confidence, entry_price, stop_loss, reasoning }`
  - Model: claude-sonnet-4-6

- [ ] Create `ai/agents/devils_advocate.py`
  - Input: all three agent reports above
  - Output: `{ challenged_assumptions, bear_cases, overlooked_risks }`
  - Model: claude-sonnet-4-6
  - System prompt: "You are a contrarian analyst. For every bullish recommendation above, construct the strongest possible bear case."

- [ ] Create `ai/council.py` — orchestrator
  - Runs all four agents in parallel (`asyncio.gather`)
  - Feeds all outputs to Opus for final synthesis
  - Model: claude-opus-4-7 with `thinking` enabled (extended reasoning)
  - Output schema:
    ```json
    {
      "market_stance": "risk-on | risk-off | neutral",
      "macro_backdrop": "string",
      "geo_watch": ["string"],
      "portfolio_actions": [
        {
          "ticker": "string",
          "action": "hold | add | reduce | exit",
          "conviction": 0.0,
          "reasoning": "string",
          "devil_rebuttal": "string",
          "price_targets": { "entry": 0, "stop": 0, "target": 0 }
        }
      ],
      "new_opportunities": [
        { "ticker": "string", "thesis": "string", "catalyst": "string", "conviction": 0.0 }
      ],
      "risk_flags": ["string"],
      "generated_at": "iso8601"
    }
    ```

### Phase 3 — API Endpoint + Scheduling (Hackathon Day Midday)

- [ ] Create `routers/council.py`
  - `POST /api/council/run` — triggers a full council run, returns verdict (takes ~15-30s)
  - `GET /api/council/latest` — returns most recent verdict from Supabase
  - `POST /api/council/portfolio` — upsert user portfolio holdings

- [ ] Register council job in `main.py` scheduler: every 30 minutes
- [ ] Add `POST /api/council/run` to trigger on-demand from UI

### Phase 4 — Frontend (Hackathon Day Afternoon)

- [ ] Create `PortfolioInput.tsx`
  - Text area for ticker list or CSV paste
  - Saves to `/api/council/portfolio`
  - Shows current holdings as chips

- [ ] Create `CouncilVerdict.tsx`
  - "Run Council" button → calls `POST /api/council/run`
  - Loading state with progress text ("Macro agent analyzing...", "Geo agent analyzing...", "Debating...")
  - Verdict cards per ticker: action badge (HOLD/ADD/REDUCE/EXIT) + conviction bar + reasoning
  - New opportunities section
  - Risk flags list
  - Timestamp + "Run again" button

- [ ] Wire into `App.tsx` — new section below Country Instability Index
- [ ] Show council-driven annotations on the map (e.g. tickers overlaid on conflict zones they're exposed to)

### Phase 5 — Polish (If Time Allows)

- [ ] Stream the council output token-by-token using Claude's streaming API so the UI updates live as the Opus model thinks
- [ ] Add debate transcript view — collapsible section showing each agent's raw report
- [ ] Historical verdict log — table of past verdicts with timestamps
- [ ] One-click "Explain this" on any verdict item — opens a modal with deeper reasoning

---

## Key Technical Decisions

**Why Opus for the orchestrator?**
The final synthesis needs to weigh contradictory inputs from four agents (including an adversarial one) and produce calibrated conviction scores. Opus with extended thinking handles multi-step reasoning better than Sonnet for this specific task.

**Why parallel agents then sequential orchestration?**
The three specialist agents (macro, geo, market) have no dependency on each other — run them simultaneously via `asyncio.gather` to cut latency from ~45s to ~15s. The devil's advocate and orchestrator must be sequential because they depend on the specialist outputs.

**Why not just one big prompt?**
Context window exhaustion and prompt dilution. Feeding all data into one agent produces mediocre output on all dimensions. Specialized agents with focused context windows produce sharper reasoning per domain, and the orchestrator synthesizes rather than analyzes.

**Rate limit strategy:**
- Alpha Vantage (25 req/day free): cache quotes for 15 min, only fetch portfolio tickers
- Polygon (5 req/min free): batch OHLCV requests, use for historical context not real-time
- Finnhub (60 req/min free): fetch per-ticker on council run only, not on schedule
- GDELT/USGS/FIRMS: already live, no limits

---

## Supabase Schema Additions

```sql
-- User portfolio
create table portfolios (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  holdings jsonb not null default '[]',
  -- holdings format: [{"ticker": "AAPL", "shares": 10, "avg_cost": 150.0}]
  updated_at timestamptz default now()
);

-- Council verdict history
create table council_verdicts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  verdict jsonb not null,
  agent_reports jsonb,  -- stores all four agent outputs for audit
  portfolio_snapshot jsonb  -- what portfolio looked like at time of run
);
```

---

## What to Demo at the Hackathon

1. Open Signal dashboard with live map showing conflict zones, sanctions, chokepoints
2. Paste in a portfolio: `AAPL 10, XOM 20, LMT 5, TSM 15, GLD 8`
3. Click **Run Council**
4. Watch the three agents run in parallel (show progress)
5. Council produces: "Given active Strait of Hormuz disruption → XOM: ADD (conviction 0.82). Taiwan Strait elevated risk → TSM: REDUCE (conviction 0.71). Defense spending cycle → LMT: HOLD."
6. Map highlights the geographic risk tied to each verdict
7. Devil's advocate rebuttal shown inline: "Counter: XOM earnings already pricing in $95/bbl — upside limited"

---

## File Structure After Implementation

```
backend/
├── ai/
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── macro_agent.py      ← NEW
│   │   ├── geo_agent.py        ← NEW
│   │   ├── market_agent.py     ← NEW
│   │   └── devils_advocate.py  ← NEW
│   ├── council.py              ← NEW (orchestrator)
│   ├── brief.py
│   └── implications.py
├── ingestion/
│   ├── stocks.py               ← NEW (Polygon OHLCV)
│   ├── fundamentals.py         ← NEW (Finnhub)
│   ├── fred.py
│   ├── market.py
│   └── news.py
├── routers/
│   ├── council.py              ← NEW
│   └── ...existing...

frontend/src/components/
├── PortfolioInput.tsx           ← NEW
├── CouncilVerdict.tsx           ← NEW
└── ...existing...
```
