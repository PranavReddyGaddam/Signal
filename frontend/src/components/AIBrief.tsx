import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { fetchBrief } from '../api/client'
import type { Brief, BriefKPIs } from '../types'

function kpisFromText(text: string): BriefKPIs {
  const lower = text.toLowerCase()

  const riskOff = /risk.off|defensive|bearish|cautious|recession/i.test(lower)
  const riskOn  = /risk.on|bullish|rally|upside|growth/i.test(lower)
  const posture: BriefKPIs['risk_posture'] = riskOff ? 'risk-off' : riskOn ? 'risk-on' : 'neutral'

  const confMatch = text.match(/(\d{1,3})\s*%\s*confidence/i)
  const confidence = confMatch ? Math.min(100, parseInt(confMatch[1])) : 50

  const sectorMatch = text.match(/(\d+)[- ]sector/i)
  const sectors = sectorMatch ? parseInt(sectorMatch[1]) : 5

  const corrHigh = /systemic|cross.sector corr/i.test(lower)
  const corrLow  = /isolated|contained/i.test(lower)
  const corr: BriefKPIs['cross_sector_correlation'] = corrHigh ? 'high' : corrLow ? 'low' : 'moderate'

  const sectorWords = ['energy', 'financials', 'technology', 'materials', 'industrials',
    'geopolitics', 'commodities', 'credit', 'labor', 'healthcare', 'defense', 'utilities']
  const found = sectorWords.filter(s => lower.includes(s))
  const primarySector = found.length > 0 ? found[0].charAt(0).toUpperCase() + found[0].slice(1) : 'Macro'

  // Top theme: use a fixed descriptive label based on detected conditions, not a regex capture
  const topTheme = corrHigh
    ? 'Cross-sector systemic stress'
    : riskOff
    ? 'Defensive rotation signal'
    : riskOn
    ? 'Risk asset momentum'
    : 'Macro regime shift'

  // Regime: fixed label, not a regex capture from surrounding text
  const regime = riskOff
    ? 'Cautiously defensive'
    : riskOn
    ? 'Risk-on expansion'
    : 'Elevated uncertainty'

  // Watch: first recognized leading indicator keyword
  const watchMap: [RegExp, string][] = [
    [/credit spread/i,      'Credit spreads'],
    [/yield curve/i,        'Yield curve'],
    [/volatility|vix/i,     'Volatility (VIX)'],
    [/commodity/i,          'Commodity prices'],
    [/dollar|dxy/i,         'USD / DXY'],
    [/inflation|cpi/i,      'Inflation (CPI)'],
    [/fed|rate decision/i,  'Fed rate decisions'],
    [/earnings/i,           'Earnings revisions'],
  ]
  const watchEntry = watchMap.find(([re]) => re.test(lower))
  const watch = watchEntry ? watchEntry[1] : 'Credit spreads and volatility'

  return { risk_posture: posture, signal_confidence: confidence, sectors_affected: sectors,
    primary_sector: primarySector, top_theme: topTheme, watch, cross_sector_correlation: corr, regime }
}

const POSTURE_STYLE: Record<BriefKPIs['risk_posture'], { bg: string; text: string; border: string; badge: string }> = {
  'risk-on':  { bg: '#e3f2fd', text: '#0d47a1', border: '#1565c0', badge: '#1565c0' },
  'risk-off': { bg: '#fce4ec', text: '#880e4f', border: '#c62828', badge: '#c62828' },
  'neutral':  { bg: '#f3e5f5', text: '#4a148c', border: '#6a1b9a', badge: '#6a1b9a' },
}

const CORR_STYLE: Record<BriefKPIs['cross_sector_correlation'], { color: string; bg: string }> = {
  high:     { color: '#c62828', bg: '#fce4ec' },
  moderate: { color: '#bf360c', bg: '#fff3e0' },
  low:      { color: '#1b5e20', bg: '#e8f5e9' },
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 70 ? '#1b5e20' : value >= 50 ? '#bf360c' : '#c62828'
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-end">
        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#0a0a0a]/50">Signal Confidence</span>
        <span className="text-[18px] font-black font-mono leading-none" style={{ color }}>{value}%</span>
      </div>
      <div className="h-3 w-full border-2 border-[#0a0a0a] bg-[#f0f0f0] relative">
        <div style={{ width: `${value}%`, background: color, height: '100%', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

function KPIGrid({ kpis }: { kpis: BriefKPIs }) {
  const postureStyle = POSTURE_STYLE[kpis.risk_posture]
  const corrStyle = CORR_STYLE[kpis.cross_sector_correlation]

  return (
    <div className="flex flex-col gap-2">
      {/* Row 1: Risk posture + Confidence side by side */}
      <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Risk posture */}
        <div
          className="border-2 p-3 flex flex-col gap-1.5"
          style={{ background: postureStyle.bg, borderColor: postureStyle.border }}
        >
          <span className="text-[9px] font-black uppercase tracking-[0.15em]"
            style={{ color: postureStyle.text, opacity: 0.65 }}>
            Risk Posture
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[11px] font-black uppercase px-2 py-0.5 text-white"
              style={{ background: postureStyle.badge }}
            >
              {kpis.risk_posture}
            </span>
            <span className="text-[11px] font-bold" style={{ color: postureStyle.text }}>
              {kpis.regime}
            </span>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="border-2 border-[#0a0a0a] bg-white p-3 flex flex-col justify-center shadow-[2px_2px_0_#0a0a0a]">
          <ConfidenceBar value={kpis.signal_confidence} />
        </div>
      </div>

      {/* Row 2: 3 metric cards */}
      <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        {/* Sectors */}
        <div className="border-2 border-[#0a0a0a] bg-white p-3 flex flex-col gap-1 shadow-[2px_2px_0_#0a0a0a]"
          style={{ borderLeftWidth: 4, borderLeftColor: '#ffd700' }}>
          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#0a0a0a]/50">Sectors Hit</span>
          <span className="text-[22px] font-black font-mono leading-none text-[#0a0a0a]">{kpis.sectors_affected}</span>
          <span className="text-[9px] font-bold text-[#0a0a0a]/50 uppercase tracking-wider">
            Lead: {kpis.primary_sector}
          </span>
        </div>

        {/* Cross-sector correlation */}
        <div className="border-2 border-[#0a0a0a] p-3 flex flex-col gap-1 shadow-[2px_2px_0_#0a0a0a]"
          style={{ background: corrStyle.bg, borderLeftWidth: 4, borderLeftColor: corrStyle.color }}>
          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#0a0a0a]/50">Cross-Sector Corr.</span>
          <span className="text-[15px] font-black uppercase leading-tight" style={{ color: corrStyle.color }}>
            {kpis.cross_sector_correlation}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: corrStyle.color, opacity: 0.7 }}>
            correlation
          </span>
        </div>

        {/* Top theme */}
        <div className="border-2 border-[#0a0a0a] bg-white p-3 flex flex-col gap-1 shadow-[2px_2px_0_#0a0a0a]"
          style={{ borderLeftWidth: 4, borderLeftColor: '#0a0a0a' }}>
          <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#0a0a0a]/50">Top Theme</span>
          <span className="text-[11px] font-black text-[#0a0a0a] leading-snug">{kpis.top_theme}</span>
        </div>
      </div>

      {/* Row 3: Watch bar */}
      <div className="border-2 border-[#0a0a0a] bg-[#ffd700] px-4 py-2.5 flex items-center gap-3 shadow-[2px_2px_0_#0a0a0a]">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#0a0a0a]/60 shrink-0">Watch</span>
        <div className="w-px h-4 bg-[#0a0a0a]/20 shrink-0" />
        <span className="text-[11px] font-black text-[#0a0a0a]">{kpis.watch}</span>
      </div>
    </div>
  )
}

export default function AIBrief() {
  const [brief, setBrief] = useState<Brief | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetchBrief()
      .then(data => { setBrief(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <div className="px-5 py-2.5 border-b-[3px] border-[#0a0a0a] bg-white flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#0a0a0a]">AI Brief</span>
        {brief?.created_at && !loading && (
          <span className="text-[9px] font-bold text-[#0a0a0a]/40 uppercase tracking-wider">
            {formatDistanceToNow(new Date(brief.created_at), { addSuffix: true })}
          </span>
        )}
      </div>

      <div className="px-5 py-4">
        {loading ? (
          <div className="flex flex-col gap-2">
            <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="h-16 skeleton bg-[#0a0a0a]/10 border-2 border-[#0a0a0a]/10" />
              <div className="h-16 skeleton bg-[#0a0a0a]/10 border-2 border-[#0a0a0a]/10" />
            </div>
            <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="h-16 skeleton bg-[#0a0a0a]/10 border-2 border-[#0a0a0a]/10" />
              <div className="h-16 skeleton bg-[#0a0a0a]/10 border-2 border-[#0a0a0a]/10" />
              <div className="h-16 skeleton bg-[#0a0a0a]/10 border-2 border-[#0a0a0a]/10" />
            </div>
            <div className="h-10 skeleton bg-[#0a0a0a]/10 border-2 border-[#0a0a0a]/10" />
          </div>
        ) : brief?.kpis ? (
          <KPIGrid kpis={brief.kpis} />
        ) : brief?.content ? (
          <KPIGrid kpis={kpisFromText(brief.content)} />
        ) : (
          <p className="text-[11px] font-bold text-[#0a0a0a]/30 uppercase tracking-wider py-3">
            Brief not yet available
          </p>
        )}
      </div>
    </div>
  )
}
