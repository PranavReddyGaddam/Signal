import { MdClose, MdOpenInNew } from 'react-icons/md'
import type { CountryRisk } from '../types'

interface Props {
  country: CountryRisk
  loading?: boolean
  onClose: () => void
  onFullReport: () => void
}

const LEVEL_COLOR: Record<string, string> = {
  critical: '#ff1744',
  high:     '#ff6d00',
  elevated: '#ffd700',
  normal:   '#00e676',
  low:      '#b0bec5',
}

const LEVEL_BG: Record<string, string> = {
  critical: '#fff0f0',
  high:     '#fff5e6',
  elevated: '#fffde7',
  normal:   '#f0fff4',
  low:      '#f5f5f5',
}

const DIMS = [
  { key: 'conflict'   as const, label: 'Conflict',    color: '#ff1744' },
  { key: 'unrest'     as const, label: 'Unrest',      color: '#ff6d00' },
  { key: 'sanctions'  as const, label: 'Sanctions',   color: '#9c27b0' },
  { key: 'cyber'      as const, label: 'Cyber',       color: '#2979ff' },
  { key: 'econ_stress'as const, label: 'Econ Stress', color: '#ff9100' },
]

function DimBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-bold uppercase tracking-wide text-[#0a0a0a70] w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[#0a0a0a10]">
        <div className="h-full transition-all duration-500" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[10px] font-black font-mono w-7 text-right" style={{ color }}>{value}</span>
    </div>
  )
}

function ScoreRing({ score, level }: { score: number; level: string }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = LEVEL_COLOR[level] ?? '#0a0a0a'
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#0a0a0a12" strokeWidth="7" />
      <circle
        cx="36" cy="36" r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="square"
        transform="rotate(-90 36 36)"
      />
      <text x="36" y="33" textAnchor="middle" dominantBaseline="middle" fontSize="18" fontWeight="900" fontFamily="monospace" fill="#0a0a0a">{score}</text>
      <text x="36" y="47" textAnchor="middle" dominantBaseline="middle" fontSize="7" fontWeight="700" fontFamily="sans-serif" fill="#0a0a0a60" letterSpacing="0.06em">/100</text>
    </svg>
  )
}

export default function CountryStatSheet({ country, loading, onClose, onFullReport }: Props) {
  const levelColor = LEVEL_COLOR[country.level] ?? '#0a0a0a'
  const levelBg = LEVEL_BG[country.level] ?? '#f5f0e8'

  // Find dominant driver
  const dominant = DIMS.reduce((best, d) =>
    country.components[d.key] > country.components[best.key] ? d : best, DIMS[0])

  return (
    <div
      className="w-72 border-[3px] border-[#0a0a0a] shadow-[6px_6px_0_#0a0a0a] flex flex-col"
      style={{ background: '#f5f0e8', maxHeight: 'calc(45vh - 24px)', overflowY: 'auto' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b-[3px] border-[#0a0a0a] shrink-0"
        style={{ background: levelBg }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-black text-[#0a0a0a]">{country.name}</span>
          <span
            className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 border-[2px] border-[#0a0a0a]"
            style={{ background: levelColor, color: country.level === 'elevated' ? '#0a0a0a' : '#fff' }}
          >
            {country.level}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-[#0a0a0a] hover:text-[#ff1744] transition-colors leading-none font-black text-sm"
        >
          <MdClose size={16} />
        </button>
      </div>

      {/* Score + dominant driver */}
      <div className="flex items-center gap-3 px-3 py-3 border-b-[2px] border-[#0a0a0a20] bg-white shrink-0">
        <ScoreRing score={country.score} level={country.level} />
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-[#0a0a0a50] mb-0.5">Instability Score</div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-[#0a0a0a50] mt-2 mb-0.5">Primary Driver</div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 border border-[#0a0a0a30]" style={{ background: dominant.color }} />
            <span className="text-[11px] font-black" style={{ color: dominant.color }}>{dominant.label}</span>
          </div>
        </div>
      </div>

      {/* Dimension bars */}
      <div className="px-3 py-2.5 border-b-[2px] border-[#0a0a0a20] bg-white shrink-0 flex flex-col gap-2">
        {loading ? (
          <div className="flex flex-col gap-2 py-1">
            {DIMS.map(d => (
              <div key={d.key} className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-wide text-[#0a0a0a70] w-16 shrink-0">{d.label}</span>
                <div className="flex-1 h-1.5 bg-[#0a0a0a10] skeleton" />
              </div>
            ))}
            <p className="text-[9px] font-bold text-[#0a0a0a40] uppercase tracking-wider text-center pt-1">
              Fetching live data...
            </p>
          </div>
        ) : (
          DIMS.map(d => (
            <DimBar key={d.key} label={d.label} value={country.components[d.key]} color={d.color} />
          ))
        )}
      </div>

      {/* Full report button */}
      <div className="px-3 py-2.5 shrink-0">
        <button
          onClick={onFullReport}
          className="w-full flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider
            py-2 border-[2px] border-[#0a0a0a] bg-[#0a0a0a] text-white
            shadow-[3px_3px_0_#0a0a0a40] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <MdOpenInNew size={12} />
          Full Report + AI Brief
        </button>
      </div>
    </div>
  )
}
