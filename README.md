# Signal

**Real-time geopolitical and macro intelligence dashboard with an AI Agent Council for portfolio decision-making.**

Signal aggregates live conflict data, economic stress indicators, global news, and market signals into a single dashboard. An AI Agent Council — powered by Claude — debates that data and issues investment verdicts for your portfolio.

![Dashboard](https://img.shields.io/badge/status-active_development-yellow)
![Python](https://img.shields.io/badge/python-3.11+-blue)
![React](https://img.shields.io/badge/react-18-61dafb)
![FastAPI](https://img.shields.io/badge/fastapi-0.111-green)

---

## What It Does

| Panel | Description |
|---|---|
| **World Map** | Live geopolitical layers — conflict events, cyber incidents, sanctions, supply chain chokepoints, critical minerals, pipelines, submarine cables |
| **Country Instability Index** | 28 countries scored across 5 dimensions (Conflict, Unrest, Sanctions, Cyber, Econ Stress) using GDELT event data. Click any country for an AI-generated intelligence brief |
| **Economic Stress Index** | Composite 0-100 stress gauge from 6 FRED series (VIX, yield curve, HY credit spread, unemployment, CPI, consumer sentiment) |
| **AI Brief** | Structured intelligence summary — regime, risk posture, sector outlook, key watch items |
| **Signal Feed** | Correlated event clusters detected across news, macro, and market data with AI-generated implications |
| **Live News Feed** | Global live broadcast streams |
| **AI Agent Council** | Multi-agent investment analysis — Macro, Geo-Risk, and Market agents debate live data and produce per-ticker verdicts (hold/add/reduce/exit) with conviction scores |
| **Portfolio Tracker** | Enter your holdings; the council analyzes each position against live geopolitical and macro context |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              React Frontend (Vite + TypeScript)          │
│  WorldMap · RiskScores · EconStress · CouncilModal      │
└────────────────────┬────────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────────┐
│              FastAPI Backend (Python 3.11)               │
│                                                         │
│  Routers: /api/risk · /api/council · /api/economic-     │
│           stress · /api/signals · /api/brief · ...      │
│                                                         │
│  Scheduler (APScheduler, 15-min intervals):             │
│  FRED → Supabase · NewsAPI → Supabase · yfinance →     │
│  Supabase · Correlation Engine · AI Brief               │
└──────┬─────────────────────────┬───────────────────────┘
       │                         │
┌──────▼──────┐         ┌────────▼────────┐
│  Supabase   │         │  External APIs  │
│  (Postgres  │         │                 │
│  + pgvector)│         │  GDELT · FRED   │
│             │         │  NewsAPI · ACLED│
│  events     │         │  yfinance       │
│  signals    │         │  Anthropic      │
│  embeddings │         └─────────────────┘
│  portfolios │
└─────────────┘
```

### AI Agent Council Flow

```
Portfolio Input
      │
      ▼
┌─────────────────────────────────────────┐
│  Data Layer (pre-scored, parallel)      │
│  Economic Stress Index (FRED)           │
│  Country Risk / CII (GDELT + ACLED)     │
│  News Classification (keyword + score)  │
│  Quant Scores per ticker (yfinance)     │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼   (parallel)
Macro       Geo-Risk    Market
Agent       Agent       Agent
(Haiku)     (Haiku)     (Haiku)
    └──────────┬──────────┘
               ▼
        Devil's Advocate
            (Haiku)
               ▼
          Orchestrator
            (Sonnet)
               ▼
          Verdict JSON
  { hold | add | reduce | exit }
  per ticker + conviction + reasoning
```

**Key design principle:** LLMs receive pre-scored, structured facts — not raw data. The news classifier and scoring layers process all inputs before any agent sees them. This keeps prompts short, reduces hallucination, and makes outputs reliably parseable as JSON.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, TailwindCSS v4, Leaflet, Recharts, Globe.gl |
| Backend | Python 3.11, FastAPI 0.111, APScheduler, asyncio |
| Database | Supabase (PostgreSQL + pgvector for semantic search) |
| AI | Anthropic Claude (Haiku for agents, Sonnet for orchestrator) |
| Embeddings | VoyageAI + vecs |
| Data Sources | GDELT, FRED, NewsAPI, ACLED, yfinance, Anthropic |

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- A [Supabase](https://supabase.com) project
- API keys (see Environment Variables below)

---

## Setup

### 1. Clone

```bash
git clone https://github.com/PranavReddyGaddam/Signal.git
cd Signal
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Copy the example env file and fill in your keys:

```bash
cp .env.example .env
```

Run the database schema:

```bash
# In your Supabase SQL editor, run:
cat schema.sql
```

Start the backend:

```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Environment Variables

Create `backend/.env` with the following:

```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key

# AI
ANTHROPIC_API_KEY=sk-ant-...

# Data Sources
FRED_API_KEY=your_fred_key          # https://fred.stlouisfed.org/docs/api/api_key.html
NEWS_API_KEY=your_newsapi_key       # https://newsapi.org

# Optional: conflict event data
ACLED_EMAIL=your@email.com          # https://acleddata.com — requires free account
ACLED_PASSWORD=your_password

# Frontend (Vite)
VITE_API_BASE_URL=http://localhost:8000
VITE_DEMO_MODE=false
```

### Getting API Keys

| Key | Where | Cost |
|---|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | Pay per token |
| `FRED_API_KEY` | [fred.stlouisfed.org](https://fred.stlouisfed.org/docs/api/api_key.html) | Free |
| `NEWS_API_KEY` | [newsapi.org](https://newsapi.org) | Free tier (100 req/day) |
| `SUPABASE_URL` + `SUPABASE_ANON_KEY` | [supabase.com](https://supabase.com) → Project Settings → API | Free tier |
| `ACLED_EMAIL` + `ACLED_PASSWORD` | [acleddata.com](https://acleddata.com) — register + request API access | Free (research) |

**GDELT requires no key** — it is public and used directly by the backend.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend + scheduler status |
| `GET` | `/api/signals` | Correlated event feed |
| `GET` | `/api/brief` | Latest AI intelligence brief |
| `GET` | `/api/macro` | Raw FRED series values |
| `GET` | `/api/economic-stress` | Economic Stress Index (composite + components) |
| `GET` | `/api/risk` | Country Instability Index for all 28 tracked countries |
| `GET` | `/api/risk/{code}` | Detailed country report with AI brief (e.g. `/api/risk/RU`) |
| `GET` | `/api/map-layers` | All geopolitical map layer data (conflict, cyber, sanctions, etc.) |
| `GET` | `/api/chokepoints` | Supply chain chokepoint status |
| `POST` | `/api/council/run` | Run the AI Agent Council (accepts `{ portfolio: [...] }`) |
| `GET` | `/api/council/latest` | Most recent council verdict |
| `GET` | `/api/portfolio` | Current portfolio positions |
| `POST` | `/api/portfolio` | Add position `{ ticker, shares, avg_cost }` |
| `DELETE` | `/api/portfolio/{ticker}` | Remove position |
| `GET` | `/api/ai-toggle` | AI analysis on/off state |
| `POST` | `/api/ai-toggle` | Toggle AI analysis |

---

## Data Pipeline

The backend runs an **APScheduler** loop every 15 minutes:

```
FRED (6 series)   → Supabase events table
NewsAPI articles  → news_classifier.py → importance scored → Supabase events
yfinance ETFs     → Supabase events
                        ↓ (every 15 min, jittered)
               Correlation Engine
               (detects cross-domain signal clusters)
                        ↓ (every 30 min)
               AI Brief generator (Claude Haiku)
               (structured JSON: regime, risks, sectors)
```

On startup, one full ingestion cycle runs immediately before the scheduler takes over.

---

## News Classifier

`backend/ingestion/news_classifier.py` — pure Python, zero LLM cost.

Classifies every article by:
- **Severity**: `critical → high → medium → low → info`
- **Category**: conflict, protest, economic, cyber, diplomatic, disaster, military, health, infrastructure, tech
- **Importance score**: `severity×0.55 + source_tier×0.20 + corroboration×0.15 + recency×0.10`
- **Sector tags**: maps events to affected equity sectors (energy, defense, tech, financials, etc.)

Agents receive pre-classified, importance-ranked article summaries — not raw article dumps.

---

## Project Structure

```
Signal/
├── backend/
│   ├── ai/
│   │   ├── brief.py               # AI brief generation
│   │   ├── implications.py        # Signal implication generation
│   │   ├── toggle.py              # AI on/off state
│   │   └── agents/                # Council agents (in development)
│   │       ├── macro_agent.py
│   │       ├── geo_agent.py
│   │       ├── market_agent.py
│   │       └── devils_advocate.py
│   ├── correlation/
│   │   └── engine.py              # Cross-domain signal detection
│   ├── ingestion/
│   │   ├── fred.py                # FRED macro data
│   │   ├── market.py              # yfinance ETF prices
│   │   ├── news.py                # NewsAPI articles
│   │   ├── embeddings.py          # VoyageAI vector embeddings
│   │   └── news_classifier.py     # Keyword classifier + importance scorer
│   ├── routers/
│   │   ├── risk.py                # Country Instability Index (GDELT-powered)
│   │   ├── economic_stress.py     # Economic Stress Index (FRED)
│   │   ├── map_layers.py          # Geopolitical map layers
│   │   ├── brief.py               # AI brief endpoint
│   │   ├── signals.py             # Signal feed
│   │   ├── macro.py               # Raw FRED values
│   │   └── council.py             # AI Agent Council (in development)
│   ├── main.py                    # FastAPI app + scheduler
│   ├── schema.sql                 # Supabase table definitions
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── components/
        │   ├── WorldMap.tsx        # Interactive Leaflet map
        │   ├── RiskScores.tsx      # Country Instability Index panel
        │   ├── EconStressIndex.tsx # Economic Stress gauge
        │   ├── MacroStress.tsx     # FRED series panel
        │   ├── AIBrief.tsx         # Structured AI brief
        │   ├── SignalFeed.tsx      # Correlated event feed
        │   ├── CouncilModal.tsx    # AI Agent Council UI
        │   ├── PortfolioModal.tsx  # Portfolio management
        │   ├── CountryModal.tsx    # Country detail + AI brief
        │   └── LiveNewsFeed.tsx    # Live news stream player
        ├── api/
        │   └── client.ts           # Typed API client
        └── App.tsx                 # Root layout
```

---

## Roadmap

- [x] World map with geopolitical layers
- [x] Country Instability Index (28 countries, 5 dimensions)
- [x] Economic Stress Index (FRED composite)
- [x] AI Brief (structured intelligence summary)
- [x] Signal Feed with AI implications
- [x] News classifier (keyword + importance scoring)
- [x] Council UI shell
- [ ] **AI Agent Council backend** ← in active development
- [ ] Portfolio backend (Supabase persistence + live P&L)
- [ ] Per-ticker quant scoring (MA, RSI, MACD, fundamentals)
- [ ] Map country click → zoom + inline stat sheet
- [ ] Council verdict history timeline
- [ ] News classifier wired into live ingestion pipeline

---

## License

MIT
