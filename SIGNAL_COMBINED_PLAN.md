# Signal — Combined Architecture Plan
### Synthesizing WorldMonitor's data pipeline + ai-hedge-fund's agent reasoning

---

## The Core Insight

The existing council plan (AGENT_COUNCIL_PLAN.md) has the right skeleton but weak inputs and no scoring scaffolding. Both reference repos solve exactly the missing pieces:

- **WorldMonitor** → how to classify, score, and structure raw world data before an LLM touches it
- **ai-hedge-fund** → how to run hybrid quant+LLM agents in parallel and synthesize them into investment decisions

The combination: **pre-process all signals into scored, structured facts (WorldMonitor pattern), then reason over those facts with specialized agents (ai-hedge-fund pattern).**

LLMs in Signal should never see raw data. They should only see interpreted signals.

---

## What Changes vs. The Original Plan

| Original Plan | Combined Plan |
|---|---|
| 3 generic agents (macro, geo, market) | Same 3 agents + Devil's Advocate + Orchestrator, but with structured scored inputs |
| Raw FRED numbers in prompts | Pre-computed Economic Stress Index composite (WorldMonitor pattern) |
| "Read the conflict map" instruction | CII scores + ACLED breakdown + classified headline counts per country |
| Basic quote data in Market Agent | Quant scoring first (MA, RSI, MACD, fundamentals) → compact facts dict → LLM |
| Single LLM provider (Claude) | Provider chain: Groq (fast/tool) → Claude Sonnet (agents) → Claude Opus (orchestrator) |
| No news classification | Keyword classifier → importance scoring before any agent sees news |

---

## New Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DATA LAYER (WorldMonitor pattern)               │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Macro Layer │  │  Geo Layer   │  │      News Layer          │  │
│  │              │  │              │  │                          │  │
│  │ FRED series  │  │ ACLED events │  │ RSS fetch (50+ feeds)    │  │
│  │ → Economic   │  │ GDELT topics │  │ → keyword classify       │  │
│  │   Stress     │  │ Existing map │  │   (critical/high/medium) │  │
│  │   Index      │  │ layer data   │  │ → importance score       │  │
│  │ BIS/ECB/IMF  │  │ → CII score  │  │   (severity×0.55 +       │  │
│  │ yield curve  │  │   per country│  │    tier×0.20 +           │  │
│  │ credit spread│  │ chokepoint   │  │    corroboration×0.15 +  │  │
│  └──────┬───────┘  │ flags        │  │    recency×0.10)         │  │
│         │          └──────┬───────┘  └────────────┬─────────────┘  │
│         └─────────────────┴──────────────────────-┘                │
│                           │  structured scored facts                │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│                   AGENT LAYER (ai-hedge-fund pattern)               │
│                                                                     │
│   All 3 run in parallel (asyncio.gather) — no dependencies         │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ MACRO AGENT  │  │ GEO-RISK     │  │   MARKET AGENT           │  │
│  │              │  │ AGENT        │  │                          │  │
│  │ Input:       │  │              │  │ Input:                   │  │
│  │ • ESI score  │  │ Input:       │  │ • Portfolio holdings     │  │
│  │   + components│ │ • CII per    │  │ • Quant scores per       │  │
│  │ • Yield curve│  │   country    │  │   ticker (MA/RSI/MACD/   │  │
│  │   shape      │  │ • ACLED      │  │   fundamentals — no LLM) │  │
│  │ • Rate delta │  │   breakdown  │  │ • Classified news per    │  │
│  │ • Classified │  │ • Chokepoint │  │   ticker (importance     │  │
│  │   macro news │  │   flags      │  │   scored)                │  │
│  │              │  │ • Classified │  │ • Live quotes            │  │
│  │ Output:      │  │   geo news   │  │                          │  │
│  │ • stance     │  │              │  │ Output (per ticker):     │  │
│  │ • recession  │  │ Output:      │  │ • signal: bullish/       │  │
│  │   risk 0-100 │  │ • per-region │  │   bearish/neutral        │  │
│  │ • rate dir.  │  │   risk map   │  │ • confidence 0-100       │  │
│  │ • sectors to │  │ • supply     │  │ • reasoning (brief)      │  │
│  │   favor/avoid│  │   chain flags│  │                          │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
│         └─────────────────┴──────────────────────-┘                │
│                           │                                         │
│              ┌────────────▼────────────┐                           │
│              │   DEVIL'S ADVOCATE      │  (sequential)             │
│              │                         │                           │
│              │ Input: all 3 reports    │                           │
│              │ Task: strongest bear    │                           │
│              │ case per holding        │                           │
│              └────────────┬────────────┘                           │
│                           │                                         │
│              ┌────────────▼────────────┐                           │
│              │   ORCHESTRATOR          │  (sequential)             │
│              │   Claude Opus           │                           │
│              │   extended thinking     │                           │
│              │                         │                           │
│              │ Issues final verdict    │                           │
│              └─────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1 — Data Layer Upgrades

*These feed the agents. No agents work well without them.*

### 1A. Economic Stress Index (from WorldMonitor)

Build `backend/ingestion/economic_stress.py`:

Pull these FRED series (already have FRED access):
- `VIXCLS` — VIX (market fear)
- `T10Y2Y` — 10Y-2Y yield curve spread (inversion = recession signal)
- `BAMLH0A0HYM2` — HY credit spread (OAS)
- `UNRATE` — unemployment rate
- `CPIAUCSL` — CPI YoY delta
- `UMCSENT` — consumer sentiment

Compute composite ESI score (0-100) with component weights:
```python
COMPONENTS = [
    {"id": "vix",          "label": "Market Volatility (VIX)",    "weight": 0.20},
    {"id": "yield_curve",  "label": "Yield Curve Spread",         "weight": 0.25},
    {"id": "credit_spread","label": "HY Credit Spread",           "weight": 0.20},
    {"id": "unemployment", "label": "Unemployment Rate",          "weight": 0.15},
    {"id": "cpi",          "label": "Inflation Pressure",         "weight": 0.10},
    {"id": "sentiment",    "label": "Consumer Sentiment",         "weight": 0.10},
]
```

Each component normalized to 0-100 (higher = more stress). Store as `economic_stress_index` in Supabase or cache. The Macro Agent receives this pre-computed object, not raw series values.

### 1B. Country Intelligence Index / CII (from WorldMonitor)

Build `backend/ingestion/country_risk.py`:

Uses data Signal **already has** (existing map layer endpoints):
- Conflict events (ACLED already flowing) — count by type: protests, battles, explosions, civilian violence
- GDELT topic density per country
- Sanctions data (already in Signal)
- Cyber threat events (already in Signal)

Per-country scoring (same formula as WorldMonitor):
```python
BASELINE_RISK = {
    "US": 5, "RU": 35, "CN": 25, "UA": 50, "IR": 40,
    "IL": 45, "TW": 30, "KP": 45, "SA": 20, "TR": 25,
    # ... etc
}

EVENT_MULTIPLIER = {
    "KP": 3.0, "CN": 2.5, "RU": 2.0, "US": 0.3,
    # ... etc
}

def compute_cii(country_code, acled_events, gdelt_score, sanctions_active, cyber_count):
    base = BASELINE_RISK.get(country_code, 15)
    event_score = sum_weighted_events(acled_events) * EVENT_MULTIPLIER.get(country_code, 1.0)
    # ... composite
    return clamp(base + event_score + ..., 0, 100)
```

Output: `{ "US": 8, "RU": 72, "TW": 55, "IL": 68, ... }` — stored and served to agents.

### 1C. News Classifier (from WorldMonitor)

Build `backend/ingestion/news_classifier.py`:

Port the keyword classifier to Python. Same 4-tier severity structure:
```python
CRITICAL_KEYWORDS = {"nuclear strike": "military", "coup": "military", "invasion": "conflict", ...}
HIGH_KEYWORDS     = {"war": "conflict", "airstrike": "conflict", "cyber attack": "cyber", "sanctions": "economic", ...}
MEDIUM_KEYWORDS   = {"protest": "protest", "tariff": "economic", "recession": "economic", ...}
LOW_KEYWORDS      = {"election": "diplomatic", "interest rate": "economic", ...}
```

Run on every incoming NewsAPI article and GDELT item. Attach `threat_level`, `category`, `importance_score` to each article in Supabase. 

**Importance score formula (same as WorldMonitor):**
```python
importance = (
    severity_score * 0.55 +
    source_tier_score * 0.20 +
    corroboration_count * 20 * 0.15 +  # capped at 5 sources
    recency_score * 0.10               # linear decay over 24h
)
```

This means agents receive pre-ranked news, not chronological dumps.

### 1D. Per-Ticker Quant Scoring (from ai-hedge-fund)

Build `backend/ingestion/ticker_quant.py`:

For each holding in the user's portfolio, compute before LLM:

**Technical scores** (from price data via Polygon/Yahoo):
- MA5/MA20/MA60 alignment → trend status
- RSI(14) → overbought/oversold flag
- MACD crossover status
- Volume ratio (current vs 20d avg)
- Overall signal score: -100 to +100

**Fundamental scores** (from Finnhub/Alpha Vantage):
- ROE vs 15% threshold → +2 points if above
- Debt/Equity vs 0.5 → +2 points if below
- Operating margin vs 15% → +2 points if above
- Earnings consistency (last 4 periods) → +3 if improving
- Gross margin trend → pricing power score

Output per ticker: `{ "score": 14, "max_score": 20, "technicals": {...}, "fundamentals": {...} }`

This is the exact compact facts dict pattern from `warren_buffett_agent`. The Market Agent LLM receives scores, not raw numbers.

---

## Phase 2 — Agent Upgrades

### 2A. Macro Agent (upgraded)

```python
# Input received by the Macro Agent:
{
  "economic_stress_index": {
    "composite_score": 67,
    "label": "Elevated Stress",
    "components": [
      {"id": "yield_curve", "label": "Yield Curve Spread", "score": 85, "raw_value": -0.42},
      {"id": "vix", "label": "VIX", "score": 55, "raw_value": 21.3},
      # ...
    ]
  },
  "classified_news": [
    {"title": "Fed signals pause on rate cuts", "level": "medium", "category": "economic", "importance": 73},
    {"title": "Core CPI beats expectations", "level": "medium", "category": "economic", "importance": 68},
    # top 5 by importance score
  ]
}
```

System prompt: *"You are a macro strategist. You receive a pre-computed Economic Stress Index and classified macro headlines. Assess the current macro regime. Output: stance (risk-on/risk-off/neutral), recession_risk (0-100), rate_direction, sectors_to_favor, sectors_to_avoid, key_risks. Keep reasoning under 200 words."*

### 2B. Geo-Risk Agent (upgraded)

```python
# Input received by the Geo-Risk Agent:
{
  "country_risk": {
    "TW": {"cii": 55, "acled": {"battles": 0, "protests": 2}, "sanctions": false, "cyber": 1},
    "IL": {"cii": 68, "acled": {"battles": 12, "explosions": 8, "fatalities": 34}, "sanctions": false},
    "RU": {"cii": 72, "acled": {"battles": 45, "explosions": 23}, "sanctions": true, "cyber": 4},
    # ...
  },
  "chokepoint_flags": {
    "hormuz": {"disrupted": false, "risk_level": "elevated"},
    "suez": {"disrupted": false, "risk_level": "normal"},
    "taiwan_strait": {"disrupted": false, "risk_level": "elevated"}
  },
  "classified_geo_news": [
    {"title": "Taiwan military exercises intensify", "level": "high", "category": "military", "importance": 81},
    {"title": "Iran threatens Hormuz closure", "level": "high", "category": "conflict", "importance": 78},
  ],
  "portfolio_tickers": ["AAPL", "XOM", "TSM", "LMT", "GLD"]
}
```

System prompt: *"You are a geopolitical risk analyst. You receive pre-scored country risk indices (CII 0-100), chokepoint status, and classified geopolitical headlines. Map these risks to the provided portfolio tickers. Output: per-ticker geo_risk_flag (none/low/medium/high), regional_risk_map, supply_chain_disruption_flags, commodity_impact. Keep reasoning under 200 words."*

### 2C. Market Agent (upgraded — ai-hedge-fund pattern)

```python
# Input received by the Market Agent:
{
  "holdings": [
    {
      "ticker": "TSM",
      "shares": 15,
      "avg_cost": 140.0,
      "current_price": 152.30,
      "quant_score": {
        "score": 11,
        "max_score": 20,
        "technicals": {
          "trend_status": "Bull",
          "rsi_status": "Neutral",
          "macd_status": "Bullish",
          "signal": "Buy",
          "signal_score": 65
        },
        "fundamentals": {
          "roe_score": 2,
          "margin_score": 2,
          "consistency_score": 2,
          "details": "ROE 23.4% (strong); Op margin 42% (strong); 4 periods consistent growth"
        }
      },
      "classified_news": [
        {"title": "TSMC Q1 revenue beats by 8%", "level": "low", "category": "economic", "importance": 61},
        {"title": "Taiwan Strait tensions resurface", "level": "high", "category": "military", "importance": 79}
      ]
    }
  ]
}
```

System prompt: *"You are a portfolio manager. You receive pre-computed quant scores and classified news per holding. Do not re-analyze fundamentals — the scores are pre-computed. Issue a signal (bullish/bearish/neutral), confidence (0-100), and brief reasoning per ticker. Keep reasoning under 100 characters."*

### 2D. Devil's Advocate (unchanged structure, upgraded inputs)

Receives all three agent outputs. Also receives the raw CII scores and ESI components to use as specific numerical ammunition for bear cases.

System prompt: *"You are a contrarian analyst. For every bullish or hold recommendation above, construct the strongest bear case using specific figures from the risk scores and macro data provided. Be direct. One paragraph per position."*

### 2E. Orchestrator (unchanged)

Claude Opus with extended thinking. Receives all four reports. Issues the final verdict JSON (same schema as original plan).

---

## Phase 3 — LLM Provider Strategy (from WorldMonitor)

Replace single-provider Claude calls with a provider chain:

```python
# backend/ai/llm.py

PROVIDER_CHAIN = ["groq", "claude", "openrouter"]

def call_llm_tool(messages, max_tokens=500):
    """Fast/cheap: extraction, classification, quant parsing"""
    # Try Groq (llama-3.1-8b-instant) first — cheapest, fastest
    # Fall back to Claude Sonnet
    ...

def call_llm_reasoning(messages, max_tokens=1500):
    """Powerful: per-agent synthesis"""
    # Claude Sonnet
    # Fall back to OpenRouter (Gemini Flash)
    ...

def call_llm_orchestrator(messages, max_tokens=3000):
    """Full reasoning: Opus with extended thinking"""
    # Claude Opus only — no fallback (council won't run degraded)
    ...
```

**Where each tier is used:**
- `call_llm_tool` → news classification (if LLM fallback needed), quant score summarization
- `call_llm_reasoning` → Macro Agent, Geo-Risk Agent, Market Agent, Devil's Advocate
- `call_llm_orchestrator` → final Orchestrator verdict only

---

## Phase 4 — Execution Flow (What Changes in council.py)

```python
async def run_council(portfolio: list[dict]) -> dict:
    
    # Step 1: Build data layer (parallel, no LLMs)
    tickers = [h["ticker"] for h in portfolio]
    esi, cii, classified_news, quant_scores = await asyncio.gather(
        build_economic_stress_index(),   # FRED → ESI composite
        build_country_risk_map(),         # ACLED + GDELT + sanctions → CII
        fetch_and_classify_news(tickers), # RSS + GDELT → keyword classify → importance score
        compute_quant_scores(tickers),    # price + fundamentals → scored facts dict
    )
    
    # Step 2: Assemble per-agent context (no LLMs, pure data assembly)
    macro_context = assemble_macro_context(esi, classified_news, category="economic")
    geo_context   = assemble_geo_context(cii, chokepoints, classified_news, tickers, category="military|conflict")
    market_context = assemble_market_context(portfolio, quant_scores, classified_news, tickers)
    
    # Step 3: Run specialist agents (parallel, call_llm_reasoning)
    macro_report, geo_report, market_report = await asyncio.gather(
        run_macro_agent(macro_context),
        run_geo_agent(geo_context),
        run_market_agent(market_context),
    )
    
    # Step 4: Devil's Advocate (sequential, call_llm_reasoning)
    devil_report = await run_devils_advocate(macro_report, geo_report, market_report, cii, esi)
    
    # Step 5: Orchestrator (sequential, call_llm_orchestrator)
    verdict = await run_orchestrator(macro_report, geo_report, market_report, devil_report)
    
    return verdict
```

Total latency:
- Step 1: ~3-5s (parallel API calls, mostly cached)
- Step 2: <1s (pure Python)
- Step 3: ~8-12s (3 parallel LLM calls, Sonnet)
- Step 4: ~5-8s (1 LLM call)
- Step 5: ~15-25s (Opus with extended thinking)
- **Total: ~35-45s** (vs. ~90s fully sequential)

---

## Phase 5 — What Stays the Same

These don't change from the original plan:

- `routers/council.py` — `POST /api/council/run`, `GET /api/council/latest`, `POST /api/council/portfolio`
- Supabase schema — `portfolios` + `council_verdicts` tables
- `CouncilModal.tsx` / `CouncilVerdict.tsx` — frontend UI already partially built
- Verdict output JSON schema — same structure, same fields
- Portfolio input (manual tickers + shares)
- 30-minute background schedule

---

## Implementation Order

### Week 1 — Data Layer (foundation, no agents yet)
1. `backend/ingestion/economic_stress.py` — ESI from FRED *(2-3 hours)*
2. `backend/ingestion/country_risk.py` — CII from ACLED + existing map data *(3-4 hours)*
3. `backend/ingestion/news_classifier.py` — keyword classifier + importance scorer *(2 hours)*
4. `backend/ingestion/ticker_quant.py` — quant scoring from Polygon/Yahoo + Finnhub *(4-5 hours)*
5. Expose all four as internal utility functions (not API endpoints yet)

### Week 1 — Agents
6. `backend/ai/llm.py` — provider chain (Groq → Claude → OpenRouter) *(1 hour)*
7. `backend/ai/agents/macro_agent.py` — ESI + classified macro news → stance *(2 hours)*
8. `backend/ai/agents/geo_agent.py` — CII + chokepoints + geo news → per-ticker risk flags *(2 hours)*
9. `backend/ai/agents/market_agent.py` — quant scores + news → per-ticker signal *(2 hours)*
10. `backend/ai/agents/devils_advocate.py` — all 3 reports → bear cases *(1 hour)*
11. `backend/ai/council.py` — orchestrator, asyncio.gather, Opus verdict *(3 hours)*

### Week 2 — API + Frontend
12. `backend/routers/council.py` — run/latest/portfolio endpoints
13. `frontend/src/components/CouncilVerdict.tsx` — verdict cards, agent report tabs
14. Wire geo-risk flags onto the existing map as ticker overlays

---

## Key Design Rules (Borrowed from Both Repos)

1. **LLMs receive scored facts, never raw data.** Every number reaching an LLM prompt has already been processed by Python scoring functions. This is the single biggest ai-hedge-fund insight.

2. **Classify news before it enters any agent.** The keyword classifier runs on every article before the council runs. Agents receive `[{title, level, category, importance_score}]`, not `[{title, url, published_at}]`.

3. **CII feeds the geo agent, not the map.** The country risk score is computed from Signal's existing map data — you're just adding a numeric summary layer that condenses what's already displayed on the map into a number the agent can reason over.

4. **Parallel data, parallel specialists, sequential judgment.** Data layer is fully parallel. The three specialist agents are parallel. Devil's Advocate and Orchestrator are sequential. This mirrors the LangGraph topology exactly.

5. **Provider chain, not single provider.** Groq for speed on cheap tasks, Claude Sonnet for agents, Claude Opus for the orchestrator. If Groq fails, fall back gracefully. The system degrades but doesn't crash.

6. **Prompt injection defense.** All untrusted text (news headlines, RSS bodies) goes through a sanitize function before entering any prompt. Strip role markers, instruction overrides, control characters.

---

## What This Looks Like in the Demo

1. User opens Signal dashboard — sees live map with CII scores pulsing on country pins
2. User enters portfolio: `AAPL 10, XOM 20, TSM 15, LMT 5, GLD 8`
3. Clicks **Run Council** — progress shows:
   - *"Computing macro stress index..."*
   - *"Scoring country risk from live conflict data..."*
   - *"Classifying 47 relevant news articles..."*
   - *"Computing technical + fundamental scores for 5 tickers..."*
   - *"Macro agent analyzing..."* (parallel)
   - *"Geo-risk agent mapping exposures..."* (parallel)
   - *"Market agent reviewing positions..."* (parallel)
   - *"Devil's advocate stress-testing..."*
   - *"Orchestrator issuing verdict..."*
4. Verdict appears:
   - **TSM: REDUCE** (conviction 0.74) — *"Taiwan Strait CII 55 (elevated). Geo agent flagged high military-category headlines (importance 81). Tech fundamentals strong (quant 14/20) but geo discount warranted."*
   - **XOM: ADD** (conviction 0.81) — *"Hormuz risk elevated. ESI energy stress component 78/100. Technical: Bull trend, RSI neutral, MACD golden cross."*
   - **LMT: HOLD** (conviction 0.65) — *"Defense cycle favorable per Macro agent. Geo agent: high conflict activity benefits defense. Devil's Advocate: valuation stretched at 22x."*
5. Map highlights TSM with a TW risk overlay, XOM with a Hormuz flag
