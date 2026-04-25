import { useEffect, useState } from 'react'
import { fetchMacro } from '../api/client'
import type { MacroIndicator } from '../types'

const RISING_BAD = ['FEDFUNDS', 'BAMLH0A0HYM2', 'ICSA']

function trendColor(trend: string, seriesId: string): string {
  const risingBad = RISING_BAD.includes(seriesId)
  if (trend === 'up') return risingBad ? '#ff1744' : '#00e676'
  if (trend === 'down') return risingBad ? '#00e676' : '#ff1744'
  return '#0a0a0a'
}

function TrendArrow({ trend, seriesId }: { trend: string; seriesId: string }) {
  const color = trendColor(trend, seriesId)
  const arrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'
  return (
    <span className="text-[18px] font-black leading-none" style={{ color }}>
      {arrow}
    </span>
  )
}

function formatValue(ind: MacroIndicator): string {
  if (ind.series_id === 'ICSA') return `${(ind.value / 1000).toFixed(0)}K`
  if (ind.units === '%' || ind.units === 'percent') return `${ind.value.toFixed(2)}%`
  return ind.value.toFixed(2)
}

const DISPLAY_ORDER = ['FEDFUNDS', 'T10Y2Y', 'BAMLH0A0HYM2', 'ICSA', 'UNRATE']

export default function MacroStress() {
  const [indicators, setIndicators] = useState<MacroIndicator[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetchMacro()
      .then(data => { setIndicators(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 15 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const ordered = DISPLAY_ORDER
    .map(id => indicators.find(i => i.series_id === id))
    .filter((i): i is MacroIndicator => !!i)

  return (
    <div>
      <div className="px-4 py-2.5 border-b-[3px] border-[#0a0a0a] bg-white flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#0a0a0a]">
          Macro Stress
        </span>
        <span className="text-[9px] font-bold uppercase bg-[#0a0a0a] text-white px-2 py-0.5">
          FRED
        </span>
      </div>

      <div className="p-3 flex flex-col gap-2">
        {loading
          ? [1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-[58px] bg-white border-2 border-[#0a0a0a] shadow-[3px_3px_0_#0a0a0a] skeleton" />
            ))
          : ordered.map(ind => {
              const isInverted = ind.series_id === 'T10Y2Y' && ind.value < 0
              const accentColor = trendColor(ind.trend, ind.series_id)
              const barWidth = Math.min(100, (ind.magnitude ?? 0) * 100)
              return (
                <div
                  key={ind.series_id}
                  className="bg-white border-2 border-[#0a0a0a] shadow-[3px_3px_0_#0a0a0a] p-2.5"
                  style={isInverted ? { borderLeftWidth: 4, borderLeftColor: '#ff1744' } : {}}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#0a0a0a]/50 leading-tight">
                      {ind.label}
                    </p>
                    {isInverted && (
                      <span className="text-[8px] font-black uppercase tracking-wider text-[#ff1744] border border-[#ff1744] px-1">
                        INVERTED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[18px] font-black font-mono leading-none ${isInverted ? 'text-[#ff1744]' : 'text-[#0a0a0a]'}`}>
                        {formatValue(ind)}
                      </span>
                      <TrendArrow trend={ind.trend} seriesId={ind.series_id} />
                    </div>
                    <div className="w-16 h-1 bg-[#0a0a0a]/10 rounded-none overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${barWidth}%`, background: accentColor }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}

        {!loading && ordered.length === 0 && (
          <p className="text-[11px] font-bold text-[#0a0a0a]/40 text-center py-4">
            No macro data yet
          </p>
        )}
      </div>
    </div>
  )
}
