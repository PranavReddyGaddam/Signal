import type { Signal } from '../types'

interface Props {
  signal: Signal | null
}

export default function ImplicationsPanel({ signal }: Props) {
  if (!signal) {
    return (
      <div className="px-4 py-10 flex items-center justify-center">
        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#0a0a0a]/30 text-center">
          Select a signal to view implications
        </p>
      </div>
    )
  }

  const { tickers = [], historical_pattern } = signal.ai_implications
  const sorted = [...tickers].sort((a, b) => b.confidence - a.confidence)

  return (
    <div className="overflow-y-auto h-full">
      <div className="px-3 py-2.5 border-b-[3px] border-[#0a0a0a] bg-white shrink-0">
        <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#0a0a0a]">
          Ticker Implications
        </span>
      </div>

      <div className="p-3 space-y-2">
        {sorted.map(t => (
          <div
            key={t.symbol}
            className="bg-white border-2 border-[#0a0a0a] shadow-[3px_3px_0_#0a0a0a] p-2.5"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-[13px] font-black text-[#0a0a0a] w-12 shrink-0">
                {t.symbol}
              </span>
              <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 border-2 border-[#0a0a0a] shrink-0 ${
                t.direction === 'bullish'
                  ? 'bg-[#00e676] text-[#0a0a0a]'
                  : 'bg-[#ff1744] text-white'
              }`}>
                {t.direction?.toUpperCase()}
              </span>
              <span className="ml-auto text-[10px] font-black text-[#0a0a0a]">
                {Math.round(t.confidence * 100)}%
              </span>
            </div>
            <div className="h-[3px] bg-[#f5f0e8] border border-[#0a0a0a] mb-1.5">
              <div
                className={`h-full ${t.direction === 'bullish' ? 'bg-[#00e676]' : 'bg-[#ff1744]'}`}
                style={{ width: `${t.confidence * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-[#0a0a0a]/60 leading-relaxed">{t.reasoning}</p>
          </div>
        ))}

        {sorted.length === 0 && (
          <p className="text-[11px] font-bold text-[#0a0a0a]/40 text-center py-4">
            No ticker data available
          </p>
        )}

        {historical_pattern && (
          <div className="bg-white border-2 border-[#0a0a0a] shadow-[3px_3px_0_#0a0a0a] border-l-[5px]" style={{ borderLeftColor: '#2979ff' }}>
            <div className="px-2.5 py-1.5 border-b-2 border-[#0a0a0a] bg-[#f5f0e8]">
              <span className="text-[9px] font-black uppercase tracking-wider text-[#0a0a0a]">
                Historical Pattern
              </span>
            </div>
            <p className="p-2.5 text-[11px] text-[#0a0a0a]/70 leading-relaxed italic">
              {historical_pattern}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
