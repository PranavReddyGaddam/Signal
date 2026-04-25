import { useEffect, useState } from 'react'
import { fetchRisk } from '../api/client'
import type { CountryRisk } from '../types'
import CountryModal from './CountryModal'

const LEVEL_COLOR: Record<CountryRisk['level'], string> = {
  critical: '#ff1744',
  high:     '#ff6d00',
  elevated: '#ffd700',
  normal:   '#00e676',
  low:      '#b0bec5',
}

const LEVEL_TEXT: Record<CountryRisk['level'], string> = {
  critical: 'white',
  high:     'white',
  elevated: '#0a0a0a',
  normal:   '#0a0a0a',
  low:      '#0a0a0a',
}

const TREND_ARROW: Record<CountryRisk['trend'], string> = {
  up:   '↑',
  down: '↓',
  flat: '—',
}

const TREND_COLOR: Record<CountryRisk['trend'], string> = {
  up:   '#ff1744',
  down: '#00e676',
  flat: '#0a0a0a40',
}

const DIMS: { key: keyof CountryRisk['components']; label: string; color: string }[] = [
  { key: 'conflict',    label: 'Conflict',    color: '#ff1744' },
  { key: 'unrest',      label: 'Unrest',      color: '#ff6d00' },
  { key: 'sanctions',   label: 'Sanctions',   color: '#9c27b0' },
  { key: 'cyber',       label: 'Cyber',       color: '#2979ff' },
  { key: 'econ_stress', label: 'Econ',        color: '#ff9100' },
]

function ScoreRing({ score, level }: { score: number; level: CountryRisk['level'] }) {
  const r = 20
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  const color = LEVEL_COLOR[level]
  return (
    <svg width="54" height="54" viewBox="0 0 54 54" className="shrink-0">
      <circle cx="27" cy="27" r={r} fill="none" stroke="#e0e0e0" strokeWidth="5" />
      <circle
        cx="27" cy="27" r={r} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
      />
      <text x="27" y="31" textAnchor="middle" fontSize="12" fontWeight="900"
        fontFamily="monospace" fill="#0a0a0a">
        {score}
      </text>
    </svg>
  )
}

function DimBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="text-[8px] font-black uppercase tracking-wider text-[#0a0a0a]/40 w-12 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-[3px] bg-[#0a0a0a]/10 relative">
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-[8px] font-black font-mono text-[#0a0a0a]/50 w-5 text-right shrink-0">
        {value}
      </span>
    </div>
  )
}

function CountryCard({ country, rank }: { country: CountryRisk; rank: number }) {
  const levelColor = LEVEL_COLOR[country.level]
  const c = country.components

  // dominant driver = highest scoring dimension
  const topDim = DIMS.reduce((a, b) => (c[a.key] >= c[b.key] ? a : b))

  return (
    <div
      className="bg-white border-2 border-[#0a0a0a] shadow-[3px_3px_0_#0a0a0a] p-3 flex flex-col gap-2"
      style={{ borderLeftWidth: 4, borderLeftColor: levelColor }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-[#0a0a0a]/25 font-mono w-4 shrink-0">{rank}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[13px] font-black text-[#0a0a0a] leading-tight">{country.name}</span>
            <span className="text-[9px] font-black font-mono text-[#0a0a0a]/30">{country.code}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5"
              style={{ background: levelColor, color: LEVEL_TEXT[country.level] }}
            >
              {country.level}
            </span>
            {c[topDim.key] > 20 && (
              <span className="text-[8px] font-bold text-[#0a0a0a]/40 uppercase tracking-wider">
                {topDim.label} pressure
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <ScoreRing score={country.score} level={country.level} />
          <span className="text-[13px] font-black" style={{ color: TREND_COLOR[country.trend] }}>
            {TREND_ARROW[country.trend]}
          </span>
        </div>
      </div>

      {/* Dimension bars */}
      <div className="space-y-0.5">
        {DIMS.map(d => (
          <DimBar key={d.key} label={d.label} value={c[d.key]} color={d.color} />
        ))}
      </div>
    </div>
  )
}

export default function RiskScores() {
  const [countries, setCountries] = useState<CountryRisk[]>([])
  const [loading, setLoading]     = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selected, setSelected] = useState<CountryRisk | null>(null)

  const load = () => {
    fetchRisk()
      .then(data => {
        setCountries(data)
        setLoading(false)
        setLastUpdated(new Date())
      })
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
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#0a0a0a]">
            Country Instability Index
          </span>
          <span className="text-[9px] font-bold uppercase bg-[#0a0a0a] text-white px-2 py-0.5">
            GDELT Live
          </span>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && !loading && (
            <span className="text-[9px] font-bold text-[#0a0a0a]/40 uppercase tracking-wider">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-[8px] font-bold text-[#0a0a0a]/40 uppercase tracking-wider">
            {DIMS.map(d => (
              <span key={d.key} className="flex items-center gap-0.5">
                <span className="w-2 h-2 inline-block rounded-full" style={{ background: d.color }} />
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {loading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-[130px] bg-white border-2 border-[#0a0a0a] shadow-[3px_3px_0_#0a0a0a] skeleton" />
            ))
          : countries.map((c, idx) => (
              <div key={c.code} onClick={() => setSelected(c)} className="cursor-pointer">
                <CountryCard country={c} rank={idx + 1} />
              </div>
            ))
        }

        {!loading && countries.length === 0 && (
          <p className="col-span-full text-[11px] font-bold text-[#0a0a0a]/40 text-center py-8 uppercase tracking-wider">
            No risk data available — GDELT may be temporarily unavailable
          </p>
        )}
      </div>

      {selected && (
        <CountryModal country={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
