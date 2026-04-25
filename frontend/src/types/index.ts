export interface TickerImplication {
  symbol: string
  direction: 'bullish' | 'bearish' | 'flat'
  confidence: number
  reasoning: string
}

export interface AIImplications {
  summary: string
  affected_sectors: string[]
  tickers: TickerImplication[]
  overall_confidence: number
  historical_pattern: string
}

export interface SignalEvent {
  id: string
  title: string
  source: 'FRED' | 'yfinance' | 'NewsAPI'
  magnitude: number
}

export interface Signal {
  id: string
  created_at: string
  sector_tags: string[]
  confidence: number
  ai_implications: AIImplications
  events: SignalEvent[]
}

export interface BriefKPIs {
  risk_posture: 'risk-on' | 'risk-off' | 'neutral'
  signal_confidence: number
  sectors_affected: number
  primary_sector: string
  top_theme: string
  top_theme_detail?: string
  watch: string
  watch_reason?: string
  cross_sector_correlation: 'high' | 'moderate' | 'low'
  regime: string
  regime_action?: string
}

export interface Brief {
  content: string | null
  kpis: BriefKPIs | null
  created_at: string | null
}

export interface MacroIndicator {
  series_id: string
  label: string
  value: number
  units: string
  trend: 'up' | 'down' | 'flat'
  magnitude: number
  fetched_at: string
}

export interface ChokepointTicker {
  symbol: string
  direction: string
}

export interface RiskComponents {
  conflict: number
  unrest: number
  sanctions: number
  cyber: number
  econ_stress: number
}

export interface CountryRisk {
  code: string
  name: string
  score: number
  level: 'low' | 'normal' | 'elevated' | 'high' | 'critical'
  trend: 'up' | 'down' | 'flat'
  components: RiskComponents
}

export interface Chokepoint {
  name: string
  risk_level: 'normal' | 'elevated' | 'critical'
  top_tickers: ChokepointTicker[]
  signal_count: number
}
