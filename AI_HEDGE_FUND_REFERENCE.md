# AI Hedge Fund — Architecture Reference

> Source: `ai-hedge-fund/` (virattt/ai-hedge-fund)  
> Purpose: Reference for adapting the agent council pattern into Signal.

---

## How It Works — High Level

The system is a **LangGraph `StateGraph`** where every analyst runs in parallel, feeds into a single Risk Manager, which then feeds into a Portfolio Manager that makes the final trade decisions.

```
start_node
    ├── warren_buffett_agent ──┐
    ├── charlie_munger_agent ──┤
    ├── cathie_wood_agent ─────┤
    ├── michael_burry_agent ───┤
    ├── nassim_taleb_agent ────┤
    ├── ben_graham_agent ──────┤
    ├── ... (13 more agents) ──┤
    └──────────────────────────▼
                     risk_management_agent
                               │
                               ▼
                       portfolio_manager ──▶ END
```

**Shared state** (`AgentState`) flows through every node:
- `messages` — append-only list of `HumanMessage` objects (one per agent)
- `data` — mutable dict: `tickers`, `portfolio`, `start_date`, `end_date`, `analyst_signals`
- `metadata` — `show_reasoning`, `model_name`, `model_provider`

---

## Agent Types

### 1. Analyst Agents (19 total)

Split into two sub-categories:

**Persona Agents** — LLM is explicitly told to think like a real investor:

| Agent | Persona | Core Philosophy |
|---|---|---|
| `warren_buffett_agent` | "You are Warren Buffett" | Moat, owner earnings DCF, margin of safety |
| `charlie_munger_agent` | Charlie Munger | Mental models, moat, insider skin-in-game |
| `ben_graham_agent` | Ben Graham | Deep value, net-net, P/B < 1, margin of safety |
| `bill_ackman_agent` | Bill Ackman | Activist investing, concentrated contrarian bets |
| `cathie_wood_agent` | Cathie Wood | Disruptive innovation, TAM, R&D intensity |
| `michael_burry_agent` | Michael Burry | Deep value, contrarian, FCF, insider buying |
| `nassim_taleb_agent` | Nassim Taleb | Tail risk, antifragility, debt fragility, convexity |
| `peter_lynch_agent` | Peter Lynch | "Buy what you know", PEG ratio, 10-baggers |
| `phil_fisher_agent` | Phil Fisher | Scuttlebutt, mgmt quality, long-term growth |
| `mohnish_pabrai_agent` | Mohnish Pabrai | Cloned Buffett/Graham, Dhandho, low-risk high-uncertainty |
| `stanley_druckenmiller_agent` | Stanley Druckenmiller | Macro top-down, currencies, rates, momentum |
| `rakesh_jhunjhunwala_agent` | Rakesh Jhunjhunwala | Emerging market macro, domestic India growth sectors |
| `aswath_damodaran_agent` | Aswath Damodaran | Rigorous DCF, intrinsic value, cost of capital |

**Functional Analysts** — No persona, role-based:

| Agent | Role |
|---|---|
| `technical_analyst_agent` | Chart patterns, momentum, RSI, MACD, Bollinger |
| `fundamentals_analyst_agent` | Financial statement deep-dive |
| `valuation_analyst_agent` | Multi-model valuation (DCF, comps, EV/EBITDA) |
| `growth_analyst_agent` | Revenue/earnings growth trajectory analysis |
| `sentiment_analyst_agent` | Market sentiment, institutional positioning |
| `news_sentiment_agent` | News flow NLP, event-driven signals |

---

## What Each Analyst Agent Does (Step-by-Step)

Every analyst follows the same 4-step pattern:

### Step 1: Fetch Raw Data
Pulls from the **FinancialDatasets API** (external paid API):
- `get_financial_metrics()` — ROE, D/E, margins, current ratio, ROIC (TTM or annual, up to 10 periods)
- `search_line_items()` — Specific income statement / balance sheet fields (revenue, FCF, CapEx, D&A, net income, etc.)
- `get_market_cap()` — Current market cap
- `get_prices()` — Historical OHLCV price data
- `get_insider_trades()` — Insider buys/sells (some agents)
- `get_company_news()` — Recent news headlines (some agents, up to 250 articles)

### Step 2: Run Python-Based Quantitative Scoring
Each agent has custom Python functions that compute rule-based scores **before** involving the LLM. Examples from Warren Buffett:

- `analyze_fundamentals()` — ROE > 15% (+2), D/E < 0.5 (+2), Op margin > 15% (+2), current ratio > 1.5 (+1)
- `analyze_moat()` — ROE consistency across 5+ periods, margin stability, asset efficiency
- `analyze_pricing_power()` — Gross margin trend, margin expansion > 2% (+3)
- `analyze_management_quality()` — Share buybacks (+1), dividend history (+1)
- `calculate_intrinsic_value()` — **3-stage DCF on owner earnings** (net income + D&A − maintenance CapEx − ΔWC), with 30% conservative haircut on historical growth, 10% discount rate, 15% additional safety haircut
- `analyze_book_value_growth()` — CAGR and consistency of book value/share

### Step 3: Feed Facts + Persona Prompt to LLM
Each agent builds a **compact facts dict** (scored outputs, not raw data) and sends it to the LLM with a tightly constrained system prompt:

```python
# Example — Warren Buffett
system = """You are Warren Buffett. Decide bullish, bearish, or neutral using only the provided facts.
Checklist: circle of competence, moat, management quality, financial strength, valuation vs intrinsic, long-term prospects.
Signal rules:
  Bullish: strong business AND margin_of_safety > 0
  Bearish: poor business OR clearly overvalued
  Neutral: good business but margin_of_safety <= 0, or mixed evidence.
Keep reasoning under 120 characters. Return JSON only."""
```

The LLM is called via `call_llm()` with:
- Structured output via `with_structured_output()` (JSON mode, Pydantic-validated)
- 3 retries on failure
- Neutral/0-confidence fallback if all retries fail
- Configurable model per-agent (defaults to GPT-4.1, supports OpenAI, Anthropic, Groq, etc.)

### Step 4: Emit Signal to Shared State
```python
# Output format — every agent produces this per ticker
{
  "AAPL": {
    "signal": "bullish",       # bullish | bearish | neutral
    "confidence": 85,          # 0-100
    "reasoning": "Strong moat, 23% margin of safety vs DCF"
  }
}
# Written to: state["data"]["analyst_signals"]["warren_buffett_agent"]
```

---

## Risk Manager

**Does not use the LLM.** Pure quant logic.

1. Fetches price history for all tickers (+ existing portfolio positions)
2. Computes **volatility metrics** per ticker (60-day lookback):
   - Daily volatility (std of daily returns)
   - Annualized volatility (× √252)
   - Volatility percentile (vs rolling 30-day history)
3. Builds a **correlation matrix** across all tickers using aligned daily returns
4. Calculates **volatility-adjusted position limit** per ticker:
   - Baseline: 20% of portfolio
   - Low vol (<15% ann.) → up to 25%
   - Medium vol (15-30%) → 12.5-20%
   - High vol (30-50%) → 5-15%
   - Very high vol (>50%) → capped at 10%
5. Applies **correlation multiplier** (vs active positions):
   - Corr ≥ 0.8 → 0.70× (reduce — already exposed)
   - Corr 0.6-0.8 → 0.85×
   - Corr 0.2-0.4 → 1.05× (bonus for diversification)
   - Corr < 0.2 → 1.10×
6. Final `remaining_position_limit` = `(portfolio_value × vol_adj_limit × corr_multiplier) − current_position_value`, capped by available cash.

Output per ticker:
```json
{
  "remaining_position_limit": 15230.50,
  "current_price": 182.45,
  "volatility_metrics": { "daily_volatility": 0.012, "annualized_volatility": 0.19, ... },
  "correlation_metrics": { "avg_correlation_with_active": 0.43, ... }
}
```

---

## Portfolio Manager

**Single LLM call** that synthesizes everything into final trade orders.

1. Reads `risk_management_agent` output → gets `remaining_position_limit` and `current_price` per ticker
2. **Deterministically computes allowed actions** per ticker (no LLM needed for this):
   - `buy`: allowed if cash > 0, max = `floor(position_limit / price)`
   - `sell`: allowed if long shares held, max = current long position
   - `short`: allowed if margin available, max = `floor(available_margin / price)`
   - `cover`: allowed if short shares held, max = current short position
   - `hold`: always valid
   - Tickers where only `hold` is possible are **pre-filled without LLM call**
3. Compresses all analyst signals down to `{agent: {sig, conf}}` per ticker
4. Sends to LLM with a minimal prompt:
   ```
   You are a portfolio manager.
   Pick one allowed action per ticker and a quantity ≤ the max.
   Keep reasoning very concise (max 100 chars). No cash or margin math. Return JSON only.
   ```
5. LLM outputs final decisions, merged with pre-filled holds.

Final output:
```json
{
  "decisions": {
    "AAPL": { "action": "buy", "quantity": 25, "confidence": 78, "reasoning": "Strong bullish consensus, 23% margin of safety" },
    "NVDA": { "action": "hold", "quantity": 0, "confidence": 60, "reasoning": "Mixed signals, near fair value" }
  },
  "analyst_signals": { ... all agent outputs ... }
}
```

---

## Key Design Patterns to Borrow

1. **Hybrid quant + LLM**: Python computes the numbers; LLM only interprets and decides. This keeps costs low and makes outputs reproducible and auditable.

2. **Compact facts dict**: Raw data is never sent to the LLM. Computed scores and summaries are. Keeps prompts short and cheap.

3. **Persona-in-system-prompt**: The entire personality/philosophy is encoded in the system message. The human turn is just structured data.

4. **Pydantic output models**: Every agent defines a strict output schema (`signal: Literal["bullish","bearish","neutral"]`, `confidence: int`, `reasoning: str`). LLM is forced into this via `with_structured_output(json_mode=True)`.

5. **Parallel analyst → serial risk/PM**: Analysts are stateless and independent, so they run concurrently in LangGraph. Risk and portfolio management are sequential because they depend on all analyst results.

6. **Deterministic constraints first, LLM second**: The portfolio manager pre-computes exactly what trades are mathematically possible before asking the LLM. The LLM only picks within valid options.

7. **Fallback defaults**: Every `call_llm()` has a `default_factory` that returns a neutral signal so no agent can break the pipeline.

---

## Data Dependencies

| Data Source | Used By |
|---|---|
| FinancialDatasets API | All fundamental agents (metrics, line items, market cap) |
| FinancialDatasets API | Price history (risk manager, Taleb, Druckenmiller, technicals) |
| FinancialDatasets API | Insider trades (Munger, Burry, Taleb) |
| FinancialDatasets API | Company news (Munger, Burry, Taleb, news_sentiment) |
| No external data | Portfolio Manager (uses pre-computed signals only) |

---

## Differences from Signal's Council Modal

| Dimension | ai-hedge-fund | Signal's CouncilModal (current) |
|---|---|---|
| Tickers | User-provided (any ticker) | User's portfolio tickers |
| Data source | FinancialDatasets API (paid) | Supabase signals + FRED + yfinance |
| Agent count | Up to 19 selectable | Fixed set (phase-based) |
| Parallelism | LangGraph parallel edges | Sequential `await` chain |
| Risk layer | Dedicated volatility + correlation agent | Not implemented |
| Output | Trade orders (buy/sell/qty) | Verdicts (hold/exit/enter + reasoning) |
| Streaming | Progress bar (CLI) | Phase-by-phase UI updates |
