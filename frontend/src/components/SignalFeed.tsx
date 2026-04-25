import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { fetchSignals } from '../api/client'
import type { Signal } from '../types'

interface Props {
  onSelect: (signal: Signal) => void
  selectedId: string | null
}

const SOURCE_STYLE: Record<string, string> = {
  FRED: 'bg-[#2979ff] text-white border-[#0a0a0a]',
  yfinance: 'bg-[#d500f9] text-white border-[#0a0a0a]',
  NewsAPI: 'bg-[#ff6d00] text-white border-[#0a0a0a]',
}

function confidenceBorderColor(c: number): string {
  if (c >= 0.7) return '#00e676'
  if (c >= 0.4) return '#ffd700'
  return '#ff1744'
}

function confidenceBarClass(c: number): string {
  if (c >= 0.7) return 'bg-[#00e676]'
  if (c >= 0.4) return 'bg-[#ffd700]'
  return 'bg-[#ff1744]'
}

export default function SignalFeed({ onSelect, selectedId }: Props) {
  const [signals, setSignals] = useState<Signal[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetchSignals()
      .then(data => { setSignals(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="p-3 space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 bg-white border-2 border-[#0a0a0a] shadow-[3px_3px_0_#0a0a0a] skeleton" />
        ))}
      </div>
    )
  }

  if (signals.length === 0) {
    return (
      <div className="p-6 text-[#0a0a0a] text-[13px] text-center font-bold">
        No signals yet. Data is being ingested...
      </div>
    )
  }

  return (
    <div className="overflow-y-auto h-full p-2.5 space-y-2.5">
      {signals.map(signal => {
        const isExpanded = expanded === signal.id
        const isSelected = selectedId === signal.id
        const borderColor = confidenceBorderColor(signal.confidence)
        const barClass = confidenceBarClass(signal.confidence)

        return (
          <div
            key={signal.id}
            onClick={() => {
              onSelect(signal)
              setExpanded(isExpanded ? null : signal.id)
            }}
            className={`bg-white border-2 border-[#0a0a0a] cursor-pointer transition-all
              ${isSelected ? 'shadow-[4px_4px_0_#0a0a0a] -translate-x-[2px] -translate-y-[2px]' : 'shadow-[3px_3px_0_#0a0a0a] hover:shadow-[5px_5px_0_#0a0a0a] hover:-translate-x-[1px] hover:-translate-y-[1px]'}
            `}
            style={{ borderLeftWidth: 5, borderLeftColor: borderColor }}
          >
            <div className="p-3">
              <p className="text-[12px] text-[#0a0a0a] leading-relaxed mb-2 font-medium line-clamp-2">
                {signal.ai_implications?.summary || 'Processing...'}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {[...new Set(signal.events.map(e => e.source))].map(src => (
                  <span key={src} className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 border-2 ${SOURCE_STYLE[src] ?? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'}`}>
                    {src}
                  </span>
                ))}
                {signal.sector_tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-[#f5f0e8] border-2 border-[#0a0a0a] text-[#0a0a0a]">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-[4px] bg-[#f5f0e8] border border-[#0a0a0a]">
                  <div
                    className={`h-full ${barClass} transition-all`}
                    style={{ width: `${signal.confidence * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-black text-[#0a0a0a] shrink-0">{Math.round(signal.confidence * 100)}%</span>
                <span className="text-[9px] font-bold text-[#0a0a0a]/40 shrink-0">
                  {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            {isExpanded && (signal.ai_implications?.tickers?.length ?? 0) > 0 && (
              <div className="border-t-2 border-[#0a0a0a] p-3 bg-[#f5f0e8] space-y-2">
                {signal.ai_implications.tickers.slice(0, 5).map(t => (
                  <div key={t.symbol} className="flex items-center gap-2">
                    <span className="font-mono text-[12px] font-black text-[#0a0a0a] w-10 shrink-0">{t.symbol}</span>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 border-2 border-[#0a0a0a] shrink-0 ${
                      t.direction === 'bullish' ? 'bg-[#00e676] text-[#0a0a0a]' : 'bg-[#ff1744] text-white'
                    }`}>
                      {t.direction?.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-[#0a0a0a]/60 truncate flex-1">{t.reasoning}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
