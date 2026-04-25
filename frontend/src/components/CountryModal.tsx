import { useEffect, useState } from 'react'
import { MdClose, MdOpenInNew } from 'react-icons/md'
import { fetchRiskDetail } from '../api/client'
import type { CountryRiskDetail, RiskArticle } from '../api/client'
import type { CountryRisk } from '../types'

interface Props {
  country: CountryRisk
  onClose: () => void
}

const LEVEL_COLOR: Record<CountryRisk['level'], string> = {
  critical: '#ff1744',
  high:     '#ff6d00',
  elevated: '#ffd700',
  normal:   '#00e676',
  low:      '#b0bec5',
}

const DIM_TAGS: { key: keyof RiskArticle; label: string; color: string }[] = [
  { key: 'conflict',  label: 'Conflict',  color: '#ff1744' },
  { key: 'unrest',    label: 'Unrest',    color: '#ff6d00' },
  { key: 'sanctions', label: 'Sanctions', color: '#9c27b0' },
  { key: 'cyber',     label: 'Cyber',     color: '#2979ff' },
  { key: 'econ',      label: 'Econ',      color: '#ff9100' },
]

const DIMS: { key: keyof CountryRisk['components']; label: string; color: string }[] = [
  { key: 'conflict',    label: 'Conflict',   color: '#ff1744' },
  { key: 'unrest',      label: 'Unrest',     color: '#ff6d00' },
  { key: 'sanctions',   label: 'Sanctions',  color: '#9c27b0' },
  { key: 'cyber',       label: 'Cyber',      color: '#2979ff' },
  { key: 'econ_stress', label: 'Econ Stress',color: '#ff9100' },
]

function parseSeendate(s: string): string {
  // "20260423T224500Z" → "Apr 23, 22:45 UTC"
  try {
    const d = new Date(
      `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T${s.slice(9,11)}:${s.slice(11,13)}:00Z`
    )
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'
  } catch {
    return s.slice(0, 8)
  }
}

function DimBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-black uppercase tracking-wider text-[#0a0a0a]/50 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-3 border border-[#0a0a0a]/20 bg-[#f0f0f0] relative">
        <div className="h-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-[11px] font-black font-mono w-7 text-right" style={{ color }}>{value}</span>
    </div>
  )
}

function ArticleRow({ article }: { article: RiskArticle }) {
  const activeTags = DIM_TAGS.filter(t => article[t.key])
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 p-3 border-b border-[#0a0a0a]/10 hover:bg-[#ffd700]/20 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-[#0a0a0a] leading-snug group-hover:underline line-clamp-2">
          {article.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[9px] font-bold text-[#0a0a0a]/40 uppercase">{article.source}</span>
          {article.seendate && (
            <span className="text-[9px] text-[#0a0a0a]/30">{parseSeendate(article.seendate)}</span>
          )}
          {activeTags.map(t => (
            <span
              key={t.key}
              className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5"
              style={{ background: t.color + '22', color: t.color, border: `1px solid ${t.color}40` }}
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>
      <MdOpenInNew size={14} className="text-[#0a0a0a]/30 shrink-0 mt-0.5 group-hover:text-[#0a0a0a]" />
    </a>
  )
}

export default function CountryModal({ country, onClose }: Props) {
  const [detail, setDetail] = useState<CountryRiskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const levelColor = LEVEL_COLOR[country.level]

  useEffect(() => {
    setLoading(true)
    setError('')
    fetchRiskDetail(country.code)
      .then(d => { setDetail(d); setLoading(false) })
      .catch(e => { setError(e.message || 'Failed to load detail'); setLoading(false) })
  }, [country.code])

  const articles = detail?.articles ?? []
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="bg-[#f5f0e8] border-[3px] border-[#0a0a0a] shadow-[6px_6px_0_#0a0a0a] w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center gap-4 px-5 py-3 border-b-[3px] border-[#0a0a0a] shrink-0"
          style={{ background: levelColor }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-[18px] font-black text-white font-mono">{country.name}</span>
            <span
              className="text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-white/20 text-white"
            >
              {country.code}
            </span>
            <span
              className="text-[9px] font-black uppercase tracking-wider px-2 py-1 ml-1"
              style={{ background: 'white', color: levelColor }}
            >
              {country.level}
            </span>
            <span className="text-[22px] font-black text-white font-mono ml-2">{country.score}</span>
            <span className="text-[11px] text-white/70 font-bold">/100</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-white/60 text-white hover:bg-white/20 transition-colors shrink-0"
          >
            <MdClose size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Dimension scores */}
          <div className="p-5 border-b-[2px] border-[#0a0a0a] bg-white">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0a0a0a]/50 mb-3">
              Instability Dimensions
            </h3>
            <div className="space-y-2">
              {DIMS.map(d => (
                <DimBar key={d.key} label={d.label} value={country.components[d.key]} color={d.color} />
              ))}
            </div>
          </div>

          {/* AI Brief */}
          <div className="p-5 border-b-[2px] border-[#0a0a0a]" style={{ background: '#fffbea' }}>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0a0a0a]/50 mb-3">
              AI Intelligence Brief
            </h3>
            {loading ? (
              <div className="space-y-2">
                <div className="h-3 skeleton bg-[#0a0a0a]/10" style={{ width: '95%' }} />
                <div className="h-3 skeleton bg-[#0a0a0a]/10" style={{ width: '85%' }} />
                <div className="h-3 skeleton bg-[#0a0a0a]/10" style={{ width: '90%' }} />
              </div>
            ) : detail?.ai_brief ? (
              <div className="border-l-4 pl-4" style={{ borderColor: levelColor }}>
                <p className="text-[13px] text-[#0a0a0a] leading-relaxed font-medium">{detail.ai_brief}</p>
              </div>
            ) : (
              <p className="text-[11px] text-[#0a0a0a]/40 font-bold uppercase tracking-wider">
                {error || 'AI analysis not available'}
              </p>
            )}
          </div>

          {/* Articles */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b-[2px] border-[#0a0a0a] bg-white">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0a0a0a]/50">
                Source Articles ({articles.length})
              </h3>
              {articles.length > 0 && (
                <span className="text-[9px] font-bold text-[#0a0a0a]/40 uppercase">GDELT · 48h window</span>
              )}
            </div>

            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 skeleton bg-[#0a0a0a]/10" />
                ))}
              </div>
            ) : articles.length === 0 ? (
              <p className="px-5 py-6 text-[11px] font-bold text-[#0a0a0a]/30 uppercase tracking-wider text-center">
                No articles found in the 48h window
              </p>
            ) : (
              <div className="bg-white">
                {articles.map((a, i) => (
                  <ArticleRow key={i} article={a} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
