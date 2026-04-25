import { useState, useCallback } from 'react'
import { MdClose, MdPlayArrow, MdWarning, MdLightbulb } from 'react-icons/md'
import axios from 'axios'

interface Props {
  onClose: () => void
}

interface PriceTargets {
  entry: number
  stop: number
  target: number
}

interface PortfolioAction {
  ticker: string
  action: 'hold' | 'add' | 'reduce' | 'exit'
  conviction: number
  reasoning: string
  devil_rebuttal: string
  price_targets: PriceTargets
}

interface NewOpportunity {
  ticker: string
  thesis: string
  catalyst: string
  conviction: number
}

interface Verdict {
  market_stance: 'risk-on' | 'risk-off' | 'neutral'
  macro_backdrop: string
  geo_watch: string[]
  portfolio_actions: PortfolioAction[]
  new_opportunities: NewOpportunity[]
  risk_flags: string[]
  generated_at: string
}

type RunPhase = 'idle' | 'macro' | 'geo' | 'market' | 'debate' | 'synthesis' | 'done' | 'error'

const PHASE_LABELS: Record<RunPhase, string> = {
  idle: '',
  macro: 'Macro agent analyzing economic conditions...',
  geo: 'Geo-risk agent scanning conflict and sanctions data...',
  market: 'Market agent evaluating portfolio positions...',
  debate: 'Devil\'s advocate stress-testing the thesis...',
  synthesis: 'Orchestrator synthesizing council verdict...',
  done: 'Council verdict ready',
  error: 'Council run failed',
}

const ACTION_STYLES: Record<PortfolioAction['action'], { bg: string; text: string; label: string }> = {
  hold:   { bg: '#e8f5e9', text: '#1b5e20', label: 'HOLD' },
  add:    { bg: '#e3f2fd', text: '#0d47a1', label: 'ADD' },
  reduce: { bg: '#fff3e0', text: '#e65100', label: 'REDUCE' },
  exit:   { bg: '#fce4ec', text: '#880e4f', label: 'EXIT' },
}

const STANCE_STYLES: Record<Verdict['market_stance'], { bg: string; border: string; label: string }> = {
  'risk-on':  { bg: '#e3f2fd', border: '#1565c0', label: 'RISK-ON' },
  'risk-off': { bg: '#fce4ec', border: '#c62828', label: 'RISK-OFF' },
  'neutral':  { bg: '#f3e5f5', border: '#6a1b9a', label: 'NEUTRAL' },
}

function ConvictionBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = value >= 0.7 ? '#1b5e20' : value >= 0.5 ? '#e65100' : '#880e4f'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-[#e0e0e0] border border-[#0a0a0a] relative">
        <div style={{ width: `${pct}%`, background: color, height: '100%' }} />
      </div>
      <span className="text-[10px] font-black" style={{ color }}>{pct}%</span>
    </div>
  )
}

function ActionCard({ action }: { action: PortfolioAction }) {
  const [expanded, setExpanded] = useState(false)
  const style = ACTION_STYLES[action.action]
  return (
    <div className="border-2 border-[#0a0a0a] bg-white shadow-[3px_3px_0_#0a0a0a]">
      <div className="flex items-center gap-3 p-3 border-b-2 border-[#0a0a0a]">
        <span
          className="text-[11px] font-black px-2 py-1 border-2 border-[#0a0a0a] min-w-[60px] text-center"
          style={{ background: style.bg, color: style.text }}
        >
          {style.label}
        </span>
        <span className="text-[15px] font-black font-mono">{action.ticker}</span>
        <div className="flex-1">
          <ConvictionBar value={action.conviction} />
        </div>
        <div className="text-right text-[10px] font-bold text-[#0a0a0a]/60 font-mono leading-tight">
          {action.price_targets.entry > 0 && <div>Entry ${action.price_targets.entry}</div>}
          {action.price_targets.stop > 0 && <div>Stop ${action.price_targets.stop}</div>}
          {action.price_targets.target > 0 && <div>Target ${action.price_targets.target}</div>}
        </div>
      </div>
      <div className="p-3">
        <p className="text-[11px] text-[#0a0a0a] leading-relaxed">{action.reasoning}</p>
        {action.devil_rebuttal && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-2 text-[10px] font-black uppercase tracking-wider text-[#880e4f] hover:underline"
          >
            {expanded ? 'Hide rebuttal' : 'Bear case'}
          </button>
        )}
        {expanded && action.devil_rebuttal && (
          <div className="mt-2 p-2 bg-[#fce4ec] border border-[#c62828] text-[11px] text-[#880e4f] leading-relaxed">
            {action.devil_rebuttal}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CouncilModal({ onClose }: Props) {
  const [phase, setPhase] = useState<RunPhase>('idle')
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const runCouncil = useCallback(async () => {
    setPhase('macro')
    setVerdict(null)
    setErrorMsg('')

    const phases: RunPhase[] = ['macro', 'geo', 'market', 'debate', 'synthesis']
    let phaseIdx = 0

    const ticker = setInterval(() => {
      phaseIdx++
      if (phaseIdx < phases.length) setPhase(phases[phaseIdx])
    }, 4000)

    try {
      const res = await axios.post<Verdict>('/api/council/run', {}, { timeout: 120_000 })
      clearInterval(ticker)
      setVerdict(res.data)
      setPhase('done')
    } catch (err: unknown) {
      clearInterval(ticker)
      setPhase('error')
      if (axios.isAxiosError(err)) {
        setErrorMsg(err.response?.data?.detail ?? err.message)
      } else {
        setErrorMsg('Unknown error')
      }
    }
  }, [])

  const stanceStyle = verdict ? STANCE_STYLES[verdict.market_stance] : null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: '#f5f0e8' }}
    >
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-3 border-b-[3px] border-[#0a0a0a] bg-[#ffd700] shrink-0">
        <span className="text-[13px] font-black uppercase tracking-[0.25em] text-[#0a0a0a] font-mono">
          AI Agent Council
        </span>
        {verdict && stanceStyle && (
          <span
            className="text-[11px] font-black px-3 py-1 border-2 border-[#0a0a0a]"
            style={{ background: stanceStyle.bg, borderColor: stanceStyle.border, color: stanceStyle.border }}
          >
            {stanceStyle.label}
          </span>
        )}
        <div className="ml-auto flex items-center gap-3">
          {phase !== 'idle' && phase !== 'done' && phase !== 'error' && (
            <span className="text-[10px] font-bold text-[#0a0a0a]/70 animate-pulse">
              {PHASE_LABELS[phase]}
            </span>
          )}
          {(phase === 'idle' || phase === 'done' || phase === 'error') && (
            <button
              onClick={runCouncil}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5
                bg-[#0a0a0a] text-[#ffd700] border-2 border-[#0a0a0a]
                shadow-[2px_2px_0_#00000040] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]
                transition-all"
            >
              <MdPlayArrow size={14} />
              {phase === 'done' || phase === 'error' ? 'Run Again' : 'Run Council'}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 border-2 border-[#0a0a0a] bg-white hover:bg-[#f5f0e8]
              shadow-[2px_2px_0_#0a0a0a] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            <MdClose size={16} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {/* Idle state */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-8">
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0a0a0a]/40">
              Council has not been run yet
            </div>
            <p className="text-[12px] text-[#0a0a0a]/60 max-w-lg leading-relaxed">
              The council runs four specialized AI agents — Macro, Geo-Risk, Market, and Devil's Advocate —
              then synthesizes their debate into a ranked investment verdict for your portfolio.
            </p>
            <button
              onClick={runCouncil}
              className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wider px-6 py-3
                bg-[#0a0a0a] text-[#ffd700] border-3 border-[#0a0a0a]
                shadow-[4px_4px_0_#00000040] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]
                transition-all"
            >
              <MdPlayArrow size={18} />
              Run Council
            </button>
          </div>
        )}

        {/* Running state */}
        {phase !== 'idle' && phase !== 'done' && phase !== 'error' && (
          <div className="flex flex-col items-center justify-center h-full gap-8 px-8">
            <div className="w-full max-w-md space-y-3">
              {(['macro', 'geo', 'market', 'debate', 'synthesis'] as RunPhase[]).map((p, i) => {
                const phases: RunPhase[] = ['macro', 'geo', 'market', 'debate', 'synthesis']
                const currentIdx = phases.indexOf(phase)
                const thisIdx = phases.indexOf(p)
                const done = thisIdx < currentIdx
                const active = thisIdx === currentIdx
                return (
                  <div
                    key={p}
                    className="flex items-center gap-3 p-3 border-2 border-[#0a0a0a]"
                    style={{ background: active ? '#ffd700' : done ? '#e8f5e9' : 'white', opacity: thisIdx > currentIdx ? 0.4 : 1 }}
                  >
                    <div
                      className="w-5 h-5 border-2 border-[#0a0a0a] shrink-0 flex items-center justify-center text-[10px] font-black"
                      style={{ background: done ? '#1b5e20' : active ? '#0a0a0a' : 'white', color: done || active ? 'white' : '#0a0a0a' }}
                    >
                      {done ? '' : i + 1}
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0a0a0a]">
                      {PHASE_LABELS[p]}
                    </span>
                    {active && (
                      <div className="ml-auto flex gap-1">
                        {[0, 1, 2].map(d => (
                          <div
                            key={d}
                            className="w-1.5 h-1.5 bg-[#0a0a0a] rounded-full animate-bounce"
                            style={{ animationDelay: `${d * 0.15}s` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Error state */}
        {phase === 'error' && (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
            <MdWarning size={40} className="text-[#c62828]" />
            <div className="text-[13px] font-black text-[#c62828] uppercase tracking-wider">Council Run Failed</div>
            {errorMsg && (
              <div className="max-w-lg p-3 bg-[#fce4ec] border-2 border-[#c62828] text-[11px] text-[#880e4f] font-mono">
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* Verdict */}
        {phase === 'done' && verdict && (
          <div className="p-6 space-y-8 max-w-5xl mx-auto">
            {/* Macro backdrop */}
            <section>
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0a0a0a]/60 mb-2">
                Macro Backdrop
              </h2>
              <div className="p-4 bg-white border-2 border-[#0a0a0a] shadow-[3px_3px_0_#0a0a0a] text-[12px] leading-relaxed">
                {verdict.macro_backdrop}
              </div>
            </section>

            {/* Portfolio actions */}
            {verdict.portfolio_actions.length > 0 && (
              <section>
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0a0a0a]/60 mb-3">
                  Portfolio Verdicts
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {verdict.portfolio_actions.map(a => (
                    <ActionCard key={a.ticker} action={a} />
                  ))}
                </div>
              </section>
            )}

            {/* New opportunities */}
            {verdict.new_opportunities.length > 0 && (
              <section>
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0a0a0a]/60 mb-3">
                  New Opportunities
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {verdict.new_opportunities.map(o => (
                    <div key={o.ticker} className="border-2 border-[#0a0a0a] bg-white shadow-[3px_3px_0_#0a0a0a] p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <MdLightbulb size={16} className="text-[#e65100] shrink-0" />
                        <span className="font-black text-[14px] font-mono">{o.ticker}</span>
                        <div className="flex-1">
                          <ConvictionBar value={o.conviction} />
                        </div>
                      </div>
                      <p className="text-[11px] text-[#0a0a0a] leading-relaxed mb-1">{o.thesis}</p>
                      <p className="text-[10px] font-bold text-[#0a0a0a]/60 uppercase tracking-wider">
                        Catalyst: {o.catalyst}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Geo watch + Risk flags */}
            <div className="grid gap-6 sm:grid-cols-2">
              {verdict.geo_watch.length > 0 && (
                <section>
                  <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0a0a0a]/60 mb-3">
                    Geo Watch
                  </h2>
                  <ul className="space-y-2">
                    {verdict.geo_watch.map((w, i) => (
                      <li key={i} className="flex gap-2 text-[11px] text-[#0a0a0a] p-2 bg-white border-2 border-[#0a0a0a]">
                        <span className="text-[#e65100] font-black shrink-0">!</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {verdict.risk_flags.length > 0 && (
                <section>
                  <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0a0a0a]/60 mb-3">
                    Risk Flags
                  </h2>
                  <ul className="space-y-2">
                    {verdict.risk_flags.map((f, i) => (
                      <li key={i} className="flex gap-2 text-[11px] text-[#880e4f] p-2 bg-[#fce4ec] border-2 border-[#c62828]">
                        <MdWarning size={14} className="shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <div className="text-[10px] font-mono text-[#0a0a0a]/40 text-right">
              Generated {new Date(verdict.generated_at).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
