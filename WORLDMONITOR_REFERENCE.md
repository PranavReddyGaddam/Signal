# WorldMonitor — Data & AI Architecture Reference

> Source: `worldmonitor/` (koala73/worldmonitor)  
> Purpose: Reference for replicating their data ingestion, news classification, and AI analysis patterns in Signal.

---

## What It Is

Real-time global intelligence dashboard. TypeScript SPA (Vite + Preact) with 86 panel components, 60+ Vercel Edge API endpoints, a Railway relay service, and a Tauri desktop app. Aggregates **30+ upstream sources** across geopolitics, military, finance, cyber, maritime, aviation, climate, and health.

---

## System Architecture (3 Layers)

```
Browser SPA (Preact + Web Workers + ONNX in-browser ML)
        │ fetch /api/*
Vercel Edge Functions (60+ endpoints, Redis-cached, proto-typed)
        │ cachedFetchJson() → Upstash Redis
Railway Relay (seed loops, AIS WebSocket proxy, cron seeders)
        │
30+ upstream APIs (ACLED, FRED, Yahoo Finance, GDELT, RSS feeds, ...)
```

**Caching tiers** (Redis):
| Tier | TTL | Used for |
|---|---|---|
| fast | 5 min | Live event streams, flight tracking |
| medium | 10 min | Market quotes, stock analysis |
| slow | 30 min | Conflict events, cyber threats |
| static | 2 hr | Humanitarian summaries, ETF flows |
| daily | 24 hr | Critical minerals, reference data |

---

## 1. Macro & Financial Data Sources

All financial data is pre-fetched by Railway cron seed scripts, stored in Redis, and served cold by Edge Functions. Nothing is fetched live per-request for financial data.

### Macroeconomic Data

| Source | What it provides | Seed script |
|---|---|---|
| **FRED** (Federal Reserve) | Interest rates, GDP, CPI, unemployment, yield curve, M2 | `seed-economy.mjs`, `seed-fred-series.mjs` |
| **BLS** (Bureau of Labor Statistics) | CPI series, employment | `seed-bls-series.mjs` |
| **BIS** (Bank for International Settlements) | Credit data, central bank policy rates, exchange rates | `seed-bis-data.mjs`, `seed-bis-extended.mjs` |
| **ECB** | EUR/USD FX rates, EU yield curves, short rates | `seed-ecb-fx-rates.mjs`, `seed-ecb-short-rates.mjs` |
| **Eurostat** | EU country GDP, government debt, house prices, industrial production | `seed-eurostat-country-data.mjs`, `seed-bundle-ecb-eu.mjs` |
| **IMF** | Growth forecasts, labor stats, macro, external debt | `seed-imf-growth.mjs`, `seed-imf-macro.mjs`, `seed-imf-external.mjs` |
| **World Bank** | Development indicators per country | `seed-wb-indicators.mjs` |
| **FAO** | Food Price Index (cereals, dairy, oils, meat, sugar) | `seed-fao-food-price-index.mjs` |
| **AAII** | Investor sentiment survey (bullish/bearish/neutral %) | `seed-aaii-sentiment.mjs` |
| **COMTRADE** | Bilateral trade flows by HS4 code (exports/imports between countries) | `seed-comtrade-bilateral-hs4.mjs`, `seed-supply-chain-trade.mjs` |

### Market Data (Live, seeded every few minutes by Railway relay)

| Source | What it provides | Method |
|---|---|---|
| **Yahoo Finance** | Stock quotes, ETF data, earnings calendar, OHLCV chart data | `_yahoo-fetch.mjs` (150ms staggered requests via rotating proxy) |
| **Finnhub** | Insider transactions, analyst consensus, price targets, upgrade/downgrade history | Direct API |
| **CoinGecko** | Crypto quotes (BTC, ETH, top altcoins), sector performance | `seed-crypto-quotes.mjs` |
| **HyperLiquid** | DeFi flows, perp open interest | `seed-hyperliquid-flow.mjs` |
| **Commitment of Traders (CFTC)** | Large speculator positioning in commodities/indices | `seed-cot.mjs` |
| **Fear & Greed Index** | CNN-style composite market sentiment | `seed-fear-greed.mjs` |

### Energy Data

| Source | What it provides |
|---|---|
| **EIA** (Energy Info Admin) | US petroleum inventories, SPR levels, refinery utilization |
| **IEA** | International oil stock levels (OECD cover days) |
| **GIE** | EU gas storage by country (% capacity, injection/withdrawal) |
| **JODI** | International oil and gas production/consumption |
| **Ember** | Electricity mix by country (renewables, fossil, nuclear share) |
| **ENTSO-E / Grid operators** | Electricity prices, cross-border flows |

### Composite Indices (computed server-side from raw data)

- **Economic Stress Index** — Composite of VIX, yield curve slope, credit spreads, unemployment rate, CPI delta, consumer confidence. Computed by `seed-economy.mjs` from FRED components, stored as a single Redis key `economic:stress-index:v1`.
- **Resilience Scores** — Country economic resilience (import concentration, fiscal space, fuel stock cover, external reserves). Multi-dimensional from BIS, World Bank, IMF data.
- **Country Risk / CII** — Conflict Intelligence Index per country (see Section 3).

---

## 2. News Gathering

### RSS Feed Network

`server/worldmonitor/news/v1/_feeds.ts` defines **50+ RSS feeds** organized by category and variant:

| Category | Example sources |
|---|---|
| `politics` | BBC World, Guardian World, AP News, Reuters, CNN |
| `us` | NPR, PBS NewsHour, ABC, CBS, NBC, WSJ, Politico, The Hill, Axios |
| `europe` | France 24, EuroNews, Le Monde, DW, Tagesschau (DE), NOS (NL), SVT (SV) |
| `middleeast` | BBC Middle East, Al Jazeera, The National, BBC Persian (FA) |
| `finance` | CNBC, MarketWatch, Yahoo Finance, Financial Times, Reuters Business |
| `gov` | White House, State Dept, Pentagon, Federal Reserve, SEC, UN, CISA, Treasury, DOJ |
| `tech` | Hacker News, Ars Technica, The Verge, MIT Tech Review |
| `ai` | VentureBeat AI, ArXiv cs.AI, Verge AI, MIT Tech Review AI |
| `africa` | VOA Africa, Allafrica, Monitor (Uganda) |
| `russia` | Meduza (EN), Moscow Times |

Many sources use parameterized **Google News RSS** queries (`https://news.google.com/rss/search?q=...`) to search for specific domains or topics.

### How Feeds Are Fetched

1. **Primary**: Direct `fetch()` with Chrome User-Agent to RSS URL
2. **Fallback**: Railway relay proxy (different IP pool, avoids Vercel's IP being blocked by publishers)
3. **Cache**: Redis key per feed URL, 1-hour TTL (`rss:feed:v1:{variant}:{url}`)
4. Take top **5 items per feed**, parse with hand-written regex (avoids DOM parser in Edge runtime)
5. Supports both RSS (`<item>`) and Atom (`<entry>`) formats

### GDELT (Global Database of Events, Language, Tone)

Used for structured event-level intelligence beyond RSS:
- `seed-gdelt-intel.mjs` — queries `api.gdeltproject.org` for global event data
- Topic timelines by country and keyword
- Fetched via rotating Decodo residential proxy pool (5 attempts, ~92% success rate — GDELT throttles Vercel/Railway IPs)
- Powers country-level news scoring and topic trend detection

### Telegram Channel Monitoring

`server/worldmonitor/intelligence/v1/list-telegram-feed.ts` — monitors curated Telegram channels for conflict/intelligence updates (typically military OSINT channels).

---

## 3. News Classification

Every RSS headline goes through a **two-stage classification pipeline**:

### Stage 1: Keyword Classifier (always runs, zero cost)

`server/worldmonitor/news/v1/_classifier.ts` — pure TypeScript, no LLM.

**4 severity tiers** × **14 event categories**:

```
critical (conf 0.9): "nuclear strike" → military, "coup" → military, "genocide" → conflict,
                     "chemical attack" → terrorism, "evacuation order" → disaster

high (conf 0.8):     "war", "airstrike", "drone strike" → conflict/military
                     "cyber attack", "ransomware" → cyber
                     "sanctions", "embargo" → economic
                     "earthquake", "tsunami" → disaster

medium (conf 0.7):   "protest", "riot", "unrest" → protest
                     "military exercise" → military
                     "trade war", "tariff", "recession" → economic
                     "pipeline explosion", "blackout" → infrastructure

low (conf 0.6):      "election", "summit", "treaty" → diplomatic
                     "interest rate", "gdp", "unemployment" → economic
                     "vaccine", "disease" → health

info (conf 0.3):     everything else (or exclusion-matched: sports, celebrity, recipes, etc.)
```

Variant-aware: tech variant adds extra keyword sets for outages, vulnerabilities, IPOs.

### Stage 2: Importance Scoring (composite formula)

```
importanceScore = (severityScore × 0.55)
                + (sourceTierScore × 0.20)
                + (corroborationScore × 0.15)
                + (recencyScore × 0.10)
```

- **Severity**: critical=100, high=75, medium=50, low=25, info=0
- **Source tier**: Tier 1 (Reuters/BBC/FT) = 100, Tier 2 = 75, Tier 3 = 50, unknown = 25
- **Corroboration**: min(source_count, 5) × 20 — story confirmed by multiple outlets scores higher
- **Recency**: linear decay over 24h (1.0 at publish → 0.0 at 24h old)

### Story Tracking & Deduplication

- SHA-256 hash of normalized title → Redis key `story:track:{hash}`
- Same story from different sources → corroboration count increments
- **Story phase** (computed via exponential moving average of source count over time):
  - emerging → developing → peak → waning → concluded
- Stories with phase "peak" or "developing" surfaced in the breaking news banner

---

## 4. AI Analysis

The project uses **two separate AI systems** — one server-side LLM and one client-side ONNX ML worker.

### A. Server-Side LLM (`server/_shared/llm.ts`)

**Provider chain** (tried in order, falls back on failure):
```
1. Ollama      (local, sidecar only) — model: llama3.1:8b (configurable via OLLAMA_MODEL)
2. Groq        — model: llama-3.1-8b-instant (fast, cheap)
3. OpenRouter  — model: google/gemini-2.5-flash (powerful, reasoning)
4. Generic     — any OpenAI-compatible endpoint (LLM_API_URL + LLM_API_KEY)
```

**Two call profiles**:
- `callLlmTool()` — fast/cheap model for extraction and parsing (Groq by default, configurable via `LLM_TOOL_PROVIDER`/`LLM_TOOL_MODEL`)
- `callLlmReasoning()` / `callLlmReasoningStream()` — powerful model for synthesis (OpenRouter by default, configurable via `LLM_REASONING_PROVIDER`/`LLM_REASONING_MODEL`)

**Safety features**:
- Health gate: checks provider endpoint reachability before each call
- Thinking-tag stripping: removes `<think>`, `<reasoning>`, `<reflection>` from chain-of-thought model outputs
- Prompt injection sanitization: all untrusted text (news headlines, RSS bodies, user queries) passed through `sanitizeForPrompt()` before interpolation — strips role markers, instruction overrides, control chars
- Temperature: 0.3 (consistent, low-creativity outputs)
- Timeout: 25s sync, 90s streaming

**Where LLM is used server-side**:

| Feature | Prompt type | Context injected |
|---|---|---|
| News brief (AI summary) | `callLlmTool()` | Top 10 headlines + descriptions from RSS |
| "Why this matters" | `callLlmTool()` | Headline + world brief + country brief + risk scores + macro signals + market data (category-gated) |
| Article deep-read | `callLlmReasoning()` | Full article text + geo context |
| Stock analysis overlay | `callLlmReasoning()` | Technical snapshot + news headlines + analyst consensus |
| Intelligence chat | `callLlmReasoningStream()` | Assembled domain context (see below) |
| Country intel brief | `callLlmReasoning()` | Country risk signals + ACLED events + climate + energy |
| Regional brief | `callLlmReasoning()` | Zone-level conflict + economic + energy summaries |
| Event classification (LLM path) | `callLlmTool()` | Unclassifiable headline (fallback from keyword classifier) |

### B. Client-Side ML Worker (`src/workers/ml.worker.ts`)

Runs **ONNX models entirely in the browser** via `@xenova/transformers`. No server call needed.

**4 models loaded on demand**:

| Model ID | Task | HuggingFace model | Use case |
|---|---|---|---|
| `embeddings` | Feature extraction | `Xenova/all-MiniLM-L6-v2` | 384-dim semantic embeddings for headlines |
| `sentiment` | Text classification | DistilBERT-based | Binary positive/negative sentiment per headline |
| `summarization` | Seq2seq | T5-based | Abstractive summarization of short text |
| `ner` | Token classification | BERT-based NER | Extract people, places, organizations from headlines |

**Vector store** (`vector-db.ts`) — persisted in IndexedDB:
- Ingests every headline as a 384-dim embedding
- Cosine similarity search (Float32Array, optimized)
- Semantic deduplication: similar headlines (cos-sim > threshold) merged into story clusters
- Enables "find related news" for the intelligence chat context window

**Analysis worker** (`analysis.worker.ts`):
- **News clustering**: Jaccard similarity on headline token sets — groups related stories
- **Cross-domain correlation detection**: identifies when conflict events + cyber events + GPS jamming co-occur in the same region (signals coordinated activity)

---

## 5. Intelligence Chat Analyst

The flagship AI feature — a real-time chat with a "senior intelligence analyst" backed by live data.

### Context Assembly (domain-filtered)

The system builds a context block from live Redis data, filtered by the user's query domain:

| Domain | Context sections included |
|---|---|
| `geo` | Matched articles + world brief + risk scores + forecasts + prediction markets + country brief + energy exposure + gas storage |
| `market` | Matched articles + market data + macro signals + market implications + prediction markets + forecasts + live headlines |
| `military` | Matched articles + world brief + risk scores + forecasts + country brief + live headlines |
| `economic` | Matched articles + market data + macro signals + risk scores + energy data + gas storage + SPR + refinery utilization + oil stocks |

**Semantic article retrieval**: before building context, user query is embedded (MiniLM), then the vector store is searched (top-K cosine similarity) to find the most relevant past headlines — injected as "Matched News Articles" into the context block.

### System Prompt (Intelligence Analyst)

```
You are a senior intelligence analyst providing live situational awareness as of {timestamp}.
Respond in structured prose. Lead with the key insight. Keep responses under 350 words unless more depth is explicitly requested.
Use ** bold ** section headers. Cite specific figures and dates from the context where available.
Use SITUATION / ANALYSIS / WATCH format for geopolitical queries.
For market queries use SIGNAL / THESIS / RISK.
Never speculate beyond what the data supports. Acknowledge uncertainty explicitly.
Do not cite data sources by name. Do not mention AI, models, or providers.
```

The response is **streamed** (Server-Sent Events) from the Edge Function through the Vercel/sidecar to the client.

---

## 6. Country Risk Scoring

`server/worldmonitor/intelligence/v1/get-risk-scores.ts` — produces the **CII (Country Intelligence Index)** for ~35 tracked countries.

### Signals Aggregated Per Country

```
ACLED events (past 30 days):   protests, riots, battles, explosions, civilian violence, fatalities
UCDP:                          active war flag, active minor conflict flag
Infrastructure:                outage count (major/partial), GPS interference hex count
Climate:                       climate anomaly severity score
Cyber:                         classified cyber incident count
Conflict:                      Iran strike events, OREF rocket alert count (Israel only)
Diplomatic:                    US State Dept travel advisory level (do-not-travel/reconsider/caution)
Humanitarian:                  UNHCR displaced population (persistent, doesn't decay after ceasefire)
News:                          classified headline counts (critical/high/medium/low) from GDELT seed
```

### Scoring Formula

```
rawScore = baseline_risk[country]
         + (ACLED_weighted_events × event_multiplier[country])
         + (UCDP_war × 15) + (UCDP_minor × 8)
         + (outage_score)
         + (cyber_score)
         + (climate_score)
         + (advisory_score)
         + (news_score × 0.3)
         
CII = clamp(rawScore, 0, 100)
```

- **Baseline** encodes domain knowledge: US=5, RU=35, UA=50, KP=45, Syria=50, Germany=5
- **Event multiplier** scales ACLED events per country's sensitivity: KP=3.0, CN=2.5, RU=2.0, US=0.3 (US events are common but less destabilizing)
- ACLED events weighted by recency: last 7 days count more than days 7-30
- Geographic fallback: if country isn't in ACLED by name, tries bbox lookup on event lat/lon

---

## 7. Stock Analysis

`server/worldmonitor/market/v1/analyze-stock.ts` — on-demand per-ticker analysis.

### What's Computed (no LLM)

**Price data** fetched from Yahoo Finance OHLCV chart endpoint:
- MA5 / MA10 / MA20 / MA60 moving averages
- Bias % (price deviation from each MA)
- Trend status: Strong bull → Strong bear (based on MA alignment + slope)
- **MACD**: DIF, DEA, histogram → classified as Golden cross / Death cross / Bullish / Bearish
- **RSI**: 6, 12, 24 periods → Overbought / Strong buy / Neutral / Weak / Oversold
- Volume ratio vs 5-day average → Heavy up / Heavy down / Normal
- Support & resistance levels (local minima/maxima clustering)
- Overall signal score → Strong buy / Buy / Hold / Watch / Sell / Strong sell

**Fundamental data** from Finnhub:
- Analyst consensus (buy/hold/sell counts)
- Price targets (low/median/high)
- Recent upgrade/downgrade events

**News context** from Yahoo Finance news search (recent headlines for the ticker).

### LLM Overlay

After technical + fundamental data is assembled, a single `callLlmReasoning()` call synthesizes:
- `summary` — plain English overview of the situation
- `action` — buy/hold/sell recommendation
- `confidence` — low/medium/high
- `whyNow` — why this specific moment matters
- `technicalSummary` — what the indicators collectively say
- `newsSummary` — what recent news means for price
- `bullishFactors` / `riskFactors` — enumerated lists

The LLM context is a compact snapshot (not raw OHLCV). Provider, model name, and `fallback: boolean` are included in the output so the UI can show a disclaimer when the LLM call failed and the response is a default.

---

## 8. Key Engineering Patterns to Borrow

### 1. Seed → Redis → Serve (never live on request for slow data)
All slow data (FRED, IMF, ACLED, GDELT) is fetched by Railway cron scripts, written to Redis with `seed-meta:<key>`, and served by Edge Functions from cache. The API endpoint never makes an upstream call for these.

### 2. Two-tier LLM
Fast model (`callLlmTool`, Groq llama-3.1-8b) for extraction/classification. Powerful model (`callLlmReasoning`, Gemini 2.5 Flash) for synthesis and chat. Separating these keeps cost down for high-frequency tasks.

### 3. Provider chain with health gates
Never hardcode a single LLM provider. The chain `ollama → groq → openrouter → generic` means the app degrades gracefully when any provider is down, overloaded, or rate-limited. Health check before each call avoids wasting timeout budget.

### 4. Category-gated LLM context
Don't dump all available data into every prompt. Match context sections to the query domain (geo ≠ market ≠ military). Prevents the LLM from citing irrelevant financial data in a humanitarian story.

### 5. Client-side ML (ONNX) + server-side LLM
ONNX in a Web Worker handles embeddings, sentiment, NER, and clustering. This is free (no API cost), private (data never leaves the browser), and fast (parallel to server fetches). The server LLM handles synthesis and reasoning, which require larger context and stronger models.

### 6. Importance scoring formula
`severity × 0.55 + sourceTier × 0.20 + corroboration × 0.15 + recency × 0.10` — simple, auditable, tunable. Severity dominates because it's the editorial signal. Corroboration from multiple independent sources strongly validates an event. Recency is just a tiebreaker.

### 7. Prompt injection defense at every boundary
`sanitizeForPrompt()` is called on ALL untrusted text before it touches a prompt — RSS headlines, article descriptions, user queries. Even internally-gated endpoints apply it. Convention is enforced regardless of auth level.

---

## Data Sources Quick Reference

```
Conflict/Events:  ACLED, UCDP, GDELT, OREF, Telegram OSINT feeds
Financial:        Yahoo Finance, Finnhub, CoinGecko, HyperLiquid, CFTC (COT)
Macro/Economic:   FRED, BLS, BIS, ECB, Eurostat, IMF, World Bank, FAO
Energy:           EIA, IEA, GIE, JODI, Ember, ENTSO-E
News:             50+ RSS feeds + Google News RSS + GDELT event stream
Maritime:         AIS WebSocket relay, PortWatch, chokepoint registry
Aviation:         OpenSky, aviation delay feeds
Climate:          Open-Meteo, NASA FIRMS (fires), NOAA anomalies
Cyber:            CISA advisories, internet outage trackers
Health:           WHO feeds, disease outbreak trackers
Prediction Mkts:  Polymarket/Metaculus-style APIs
Humanitarian:     UNHCR displacement data
```
