import axios, { AxiosError } from 'axios'
import type { Signal, Brief, MacroIndicator, Chokepoint, CountryRisk } from '../types'

function demoParams() {
  const urlParams = new URLSearchParams(window.location.search)
  const demoMode = urlParams.get('demo') === 'true' || import.meta.env.VITE_DEMO_MODE === 'true'
  const scenario = urlParams.get('scenario') || import.meta.env.VITE_DEMO_SCENARIO || 'oil_shock'
  return demoMode ? { demo: true, scenario } : {}
}

const api = axios.create({ baseURL: '/api', timeout: 10_000 })

// Retry with exponential backoff — handles backend not yet ready or brief blip
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      const isConnectionError = (err as AxiosError)?.code === 'ECONNREFUSED'
        || (err as AxiosError)?.code === 'ERR_NETWORK'
        || (err as AxiosError)?.message?.includes('Network Error')
      // Don't retry 4xx — those are real errors
      const status = (err as AxiosError)?.response?.status ?? 0
      if (status >= 400 && status < 500) throw err
      if (i < retries - 1 && (isConnectionError || status === 0 || status >= 500)) {
        await new Promise(r => setTimeout(r, delayMs * (i + 1)))
        continue
      }
      throw err
    }
  }
  throw new Error('Max retries exceeded')
}

export async function fetchSignals(): Promise<Signal[]> {
  return withRetry(async () => {
    const res = await api.get<Signal[]>('/signals', { params: demoParams() })
    return res.data
  })
}

export async function fetchBrief(): Promise<Brief> {
  return withRetry(async () => {
    const res = await api.get<Brief>('/brief', { params: demoParams() })
    return res.data
  })
}

export async function fetchMacro(): Promise<MacroIndicator[]> {
  return withRetry(async () => {
    const res = await api.get<MacroIndicator[]>('/macro', { params: demoParams() })
    return res.data
  })
}

export async function fetchChokepoints(): Promise<Chokepoint[]> {
  return withRetry(async () => {
    const res = await api.get<Chokepoint[]>('/chokepoints', { params: demoParams() })
    return res.data
  })
}

export async function fetchRisk(): Promise<CountryRisk[]> {
  return withRetry(async () => {
    const res = await api.get<CountryRisk[]>('/risk', { params: demoParams() })
    return res.data
  })
}

// ─── Map layer endpoints ──────────────────────────────────────────────────────

export interface PointFeature {
  lat: number
  lng: number
  name: string
  detail: string
  severity?: 'critical' | 'elevated' | 'normal'
  [key: string]: unknown
}

export interface LineFeature {
  name: string
  detail: string
  coords: [number, number][]
  color: string
}

async function fetchLayer<T>(path: string): Promise<T[]> {
  return withRetry(async () => {
    const res = await api.get<T[]>(path)
    return res.data
  })
}

export const fetchConflictLayer    = () => fetchLayer<PointFeature>('/map/conflict')
export const fetchClimateLayer     = () => fetchLayer<PointFeature>('/map/climate')
export const fetchCyberLayer       = () => fetchLayer<PointFeature>('/map/cyber')
export const fetchSanctionsLayer   = () => fetchLayer<PointFeature>('/map/sanctions')
export const fetchPipelinesLayer   = () => fetchLayer<LineFeature>('/map/pipelines')
export const fetchCablesLayer      = () => fetchLayer<LineFeature>('/map/cables')
export const fetchMineralsLayer    = () => fetchLayer<PointFeature>('/map/minerals')
export const fetchEconomicLayer    = () => fetchLayer<PointFeature>('/map/economic')
export const fetchDatacentersLayer = () => fetchLayer<PointFeature>('/map/datacenters')

// ─── AI toggle ───────────────────────────────────────────────────────────────

export async function fetchAIToggle(): Promise<boolean> {
  const res = await api.get<{ enabled: boolean }>('/ai-toggle')
  return res.data.enabled
}

export async function setAIToggle(enabled: boolean): Promise<boolean> {
  const res = await api.post<{ enabled: boolean }>('/ai-toggle', { enabled })
  return res.data.enabled
}

// ─── Country risk detail ──────────────────────────────────────────────────────

export interface RiskArticle {
  title: string
  url: string
  source: string
  seendate: string
  conflict: boolean
  unrest: boolean
  sanctions: boolean
  cyber: boolean
  econ: boolean
}

export interface CountryRiskDetail extends CountryRisk {
  articles: RiskArticle[]
  ai_brief: string
}

export async function fetchRiskDetail(code: string): Promise<CountryRiskDetail> {
  const res = await api.get<CountryRiskDetail>(`/risk/${code}`, { timeout: 30_000 })
  return res.data
}

// ─── Economic Stress Index ────────────────────────────────────────────────────

export interface EconIndicator {
  series_id: string
  name: string
  description: string
  raw_value: number
  stress_score: number
  weight: number
  direction: 'rising' | 'falling' | 'flat'
  last_date: string
}

export interface EconomicStress {
  composite: number
  level: 'normal' | 'moderate' | 'elevated' | 'critical'
  level_description: string
  primary_driver: string
  stressed_indicators: number
  total_indicators: number
  indicators: EconIndicator[]
  regime: string
}

export async function fetchEconomicStress(): Promise<EconomicStress> {
  return withRetry(async () => {
    const res = await api.get<EconomicStress>('/economic-stress')
    return res.data
  })
}
