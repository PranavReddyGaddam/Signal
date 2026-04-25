import { useEffect, useState } from 'react'
import { fetchEconomicStress } from '../api/client'
import type { EconomicStress, EconIndicator } from '../api/client'

const LEVEL_COLORS: Record<string, string> = {
  critical: '#ff1744',
  elevated: '#ff6d00',
  moderate: '#ffd700',
  normal:   '#00e676',
}

const LEVEL_BG: Record<string, string> = {
  critical: '#fff0f0',
  elevated: '#fff5e6',
  moderate: '#fffde7',
  normal:   '#f0fff4',
}

function GaugeRing({ score, level }: { score: number; level: string }) {
  const r = 38
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = LEVEL_COLORS[level] ?? '#0a0a0a'

  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle
        cx="50" cy="50" r={r}
        fill="none"
        stroke="#0a0a0a12"
        strokeWidth="8"
      />
      <circle
        cx="50" cy="50" r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="square"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text
        x="50" y="46"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="22"
        fontWeight="900"
        fontFamily="monospace"
        fill="#0a0a0a"
      >
        {score}
      </text>
      <text
        x="50" y="63"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="7.5"
        fontWeight="700"
        fontFamily="sans-serif"
        fill="#0a0a0a80"
        letterSpacing="0.08em"
      >
        / 100
      </text>
    </svg>
  )
}

function DirectionArrow({ direction }: { direction: string }) {
  if (direction === 'rising')  return <span style={{ color: '#ff1744', fontSize: 14, fontWeight: 900 }}>↑</span>
  if (direction === 'falling') return <span style={{ color: '#00e676', fontSize: 14, fontWeight: 900 }}>↓</span>
  return <span style={{ color: '#0a0a0a40', fontSize: 14, fontWeight: 900 }}>→</span>
}

function IndicatorRow({ ind }: { ind: EconIndicator }) {
  const barColor = ind.stress_score >= 70
    ? '#ff1744'
    : ind.stress_score >= 50
      ? '#ff6d00'
      : ind.stress_score >= 30
        ? '#ffd700'
        : '#00e676'

  const formatRaw = (ind: EconIndicator) => {
    if (ind.series_id === 'CPIAUCSL') return `${ind.raw_value.toFixed(3)}%`
    if (ind.series_id === 'UMCSENT') return ind.raw_value.toFixed(1)
    return `${ind.raw_value.toFixed(2)}${ind.raw_value < 100 ? '%' : ''}`
  }

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-[#0a0a0a10] last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-black text-[#0a0a0a] uppercase tracking-wide leading-none">
            {ind.name}
          </span>
          <DirectionArrow direction={ind.direction} />
        </div>
        <div className="h-1 bg-[#0a0a0a10] w-full">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${ind.stress_score}%`, background: barColor }}
          />
        </div>
      </div>
      <div className="text-right shrink-0 w-16">
        <div className="text-[11px] font-black font-mono text-[#0a0a0a]">
          {formatRaw(ind)}
        </div>
        <div className="text-[8px] font-bold text-[#0a0a0a50] uppercase">
          stress {ind.stress_score}
        </div>
      </div>
    </div>
  )
}

interface Props {
  refreshKey?: number
}

export default function EconStressIndex({ refreshKey }: Props) {
  const [data, setData] = useState<EconomicStress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchEconomicStress()
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [refreshKey])

  const level = data?.level ?? 'normal'
  const levelColor = LEVEL_COLORS[level]
  const levelBg = LEVEL_BG[level]

  return (
    <div className="border-t-[3px] border-[#0a0a0a] bg-[#f5f0e8]">
      {/* Header */}
      <div className="px-4 py-2.5 border-b-[3px] border-[#0a0a0a] bg-white flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#0a0a0a]">
          Economic Stress Index
        </span>
        <span className="text-[9px] font-bold uppercase bg-[#0a0a0a] text-white px-2 py-0.5">
          FRED
        </span>
      </div>

      {loading ? (
        <div className="p-4 flex flex-col gap-2">
          <div className="h-[100px] bg-white border-2 border-[#0a0a0a] shadow-[3px_3px_0_#0a0a0a] skeleton" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-[44px] bg-white border-2 border-[#0a0a0a] shadow-[2px_2px_0_#0a0a0a] skeleton" />
          ))}
        </div>
      ) : !data || data.total_indicators === 0 ? (
        <div className="p-6 text-center">
          <p className="text-[11px] font-bold text-[#0a0a0a50] uppercase tracking-wide">
            FRED_API_KEY not configured
          </p>
          <p className="text-[10px] text-[#0a0a0a30] mt-1">
            Set FRED_API_KEY in backend .env
          </p>
        </div>
      ) : (
        <div className="p-3 flex flex-col gap-3">
          {/* Composite score card */}
          <div
            className="border-[3px] border-[#0a0a0a] shadow-[4px_4px_0_#0a0a0a] p-3"
            style={{ background: levelBg }}
          >
            <div className="flex items-center gap-4">
              <GaugeRing score={data.composite} level={level} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-2 border-[#0a0a0a]"
                    style={{ background: levelColor, color: level === 'moderate' ? '#0a0a0a' : '#fff' }}
                  >
                    {level}
                  </span>
                  <span className="text-[9px] font-bold text-[#0a0a0a50]">
                    {data.stressed_indicators}/{data.total_indicators} elevated
                  </span>
                </div>
                <p className="text-[10px] font-bold text-[#0a0a0a] leading-tight mb-1.5">
                  {data.level_description}
                </p>
                <div className="text-[9px] text-[#0a0a0a70] uppercase tracking-wide font-bold">
                  Regime: <span className="text-[#0a0a0a]">{data.regime}</span>
                </div>
                <div className="text-[9px] text-[#0a0a0a70] uppercase tracking-wide font-bold mt-0.5">
                  Driver: <span className="text-[#0a0a0a]">{data.primary_driver}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Per-indicator rows */}
          <div className="bg-white border-2 border-[#0a0a0a] shadow-[3px_3px_0_#0a0a0a] px-3 py-1">
            {data.indicators.map(ind => (
              <IndicatorRow key={ind.series_id} ind={ind} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
