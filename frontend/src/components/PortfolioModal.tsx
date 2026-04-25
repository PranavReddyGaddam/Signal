import { useState, useEffect, useRef } from 'react'
import { MdClose, MdAdd, MdDelete, MdSearch, MdCheckCircle, MdError } from 'react-icons/md'

export interface Holding {
  ticker: string
  shares: number
  avgCost: number
  name: string
}

interface Props {
  onClose: () => void
}

const STORAGE_KEY = 'signal_portfolio'

// Broad known-ticker map — covers S&P 500 majors, sector ETFs, and common names.
// Used for instant offline validation before any API call.
const KNOWN_TICKERS: Record<string, string> = {
  // Mag 7
  AAPL: 'Apple Inc.', MSFT: 'Microsoft Corp.', GOOGL: 'Alphabet Inc.',
  GOOG: 'Alphabet Inc. (C)', AMZN: 'Amazon.com Inc.', META: 'Meta Platforms',
  NVDA: 'NVIDIA Corp.', TSLA: 'Tesla Inc.',
  // Finance
  JPM: 'JPMorgan Chase', BAC: 'Bank of America', GS: 'Goldman Sachs',
  MS: 'Morgan Stanley', WFC: 'Wells Fargo', C: 'Citigroup', BLK: 'BlackRock',
  // Energy
  XOM: 'Exxon Mobil', CVX: 'Chevron', COP: 'ConocoPhillips', SLB: 'SLB',
  OXY: 'Occidental Petroleum', PSX: 'Phillips 66',
  // Defense
  LMT: 'Lockheed Martin', RTX: 'RTX Corp.', NOC: 'Northrop Grumman',
  BA: 'Boeing', GD: 'General Dynamics', HII: 'Huntington Ingalls',
  // Tech
  INTC: 'Intel Corp.', AMD: 'AMD', QCOM: 'Qualcomm', AVGO: 'Broadcom',
  TSM: 'Taiwan Semiconductor', ASML: 'ASML Holding', ARM: 'Arm Holdings',
  CRM: 'Salesforce', ORCL: 'Oracle', SAP: 'SAP SE', IBM: 'IBM',
  NFLX: 'Netflix', SPOT: 'Spotify', UBER: 'Uber', LYFT: 'Lyft',
  SNAP: 'Snap Inc.', PINS: 'Pinterest', TWTR: 'Twitter/X',
  // Healthcare
  JNJ: 'Johnson & Johnson', PFE: 'Pfizer', MRNA: 'Moderna', LLY: 'Eli Lilly',
  ABBV: 'AbbVie', MRK: 'Merck', UNH: 'UnitedHealth', BMY: 'Bristol-Myers',
  // Consumer
  KO: 'Coca-Cola', PEP: 'PepsiCo', MCD: "McDonald's", SBUX: 'Starbucks',
  NKE: 'Nike', WMT: 'Walmart', COST: 'Costco', TGT: 'Target', AMGN: 'Amgen',
  // Industrials / Materials
  CAT: 'Caterpillar', DE: 'John Deere', GE: 'GE Aerospace', HON: 'Honeywell',
  MMM: '3M', UPS: 'UPS', FDX: 'FedEx', DAL: 'Delta Air Lines',
  // Commodities & Macro
  GLD: 'SPDR Gold ETF', SLV: 'iShares Silver ETF', GDX: 'VanEck Gold Miners',
  USO: 'United States Oil Fund', BNO: 'Brent Oil ETF',
  TLT: 'iShares 20+ Yr Treasury', HYG: 'iShares HY Corp Bond',
  UUP: 'Invesco USD Bull ETF', FXI: 'iShares China Large-Cap',
  EEM: 'iShares MSCI EM ETF', VEA: 'Vanguard FTSE Developed',
  // Sector ETFs
  XLE: 'Energy Select SPDR', XLF: 'Financial Select SPDR',
  XLI: 'Industrial Select SPDR', XLB: 'Materials Select SPDR',
  XLP: 'Consumer Staples SPDR', XLY: 'Consumer Discret. SPDR',
  XLV: 'Health Care Select SPDR', XLK: 'Technology Select SPDR',
  XLC: 'Communication Services SPDR', XLRE: 'Real Estate SPDR',
  XLU: 'Utilities Select SPDR', ITA: 'iShares US Aerospace & Defense',
  // Crypto-adjacent
  COIN: 'Coinbase', MSTR: 'MicroStrategy', MARA: 'MARA Holdings',
  RIOT: 'Riot Platforms', IBIT: 'iShares Bitcoin Trust',
  // Emerging / Geopolitical plays
  VALE: 'Vale S.A.', RIO: 'Rio Tinto', BHP: 'BHP Group',
  FCX: 'Freeport-McMoRan', NEM: 'Newmont Corp.',
  MP: 'MP Materials', LTHM: 'Livent Corp.', ALB: 'Albemarle Corp.',
  FSLR: 'First Solar', ENPH: 'Enphase Energy', SEDG: 'SolarEdge',
}

const DEMO_HOLDINGS: Holding[] = [
  { ticker: 'NVDA',  shares: 15,  avgCost: 420.00, name: 'NVIDIA Corp.' },
  { ticker: 'XOM',   shares: 30,  avgCost: 112.50, name: 'Exxon Mobil' },
  { ticker: 'LMT',   shares: 8,   avgCost: 445.00, name: 'Lockheed Martin' },
  { ticker: 'TSM',   shares: 20,  avgCost: 138.00, name: 'Taiwan Semiconductor' },
  { ticker: 'GLD',   shares: 12,  avgCost: 185.00, name: 'SPDR Gold ETF' },
  { ticker: 'XLE',   shares: 25,  avgCost: 88.00,  name: 'Energy Select SPDR' },
  { ticker: 'AAPL',  shares: 10,  avgCost: 175.00, name: 'Apple Inc.' },
  { ticker: 'JPM',   shares: 12,  avgCost: 198.00, name: 'JPMorgan Chase' },
]

export function loadPortfolio(): Holding[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const arr = JSON.parse(raw) as Holding[]
      if (Array.isArray(arr) && arr.length > 0) return arr
    }
  } catch { /* ignore */ }
  return DEMO_HOLDINGS
}

export function savePortfolio(holdings: Holding[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings))
  } catch { /* ignore */ }
}

type ValidationState = 'idle' | 'checking' | 'valid' | 'invalid'

export default function PortfolioModal({ onClose }: Props) {
  const [holdings, setHoldings] = useState<Holding[]>(loadPortfolio)
  const [ticker, setTicker]     = useState('')
  const [shares, setShares]     = useState('')
  const [avgCost, setAvgCost]   = useState('')
  const [validation, setValidation] = useState<ValidationState>('idle')
  const [resolvedName, setResolvedName] = useState('')
  const [error, setError]       = useState('')
  const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Persist on every change
  useEffect(() => { savePortfolio(holdings) }, [holdings])

  // Validate ticker as user types
  useEffect(() => {
    const raw = ticker.trim().toUpperCase()
    if (!raw) { setValidation('idle'); setResolvedName(''); setError(''); return }

    // Instant hit from known list
    if (KNOWN_TICKERS[raw]) {
      setValidation('valid')
      setResolvedName(KNOWN_TICKERS[raw])
      setError('')
      return
    }

    // Debounced Alpha Vantage search for unknowns
    setValidation('checking')
    setResolvedName('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const key = import.meta.env.VITE_ALPHA_VANTAGE_KEY
        if (!key) {
          // No key — accept anything that looks like a valid ticker format
          const looksValid = /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/.test(raw)
          setValidation(looksValid ? 'valid' : 'invalid')
          setResolvedName(looksValid ? raw : '')
          setError(looksValid ? '' : 'Unknown ticker')
          return
        }
        const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${raw}&apikey=${key}`
        const res = await fetch(url)
        const data = await res.json()
        const matches = data.bestMatches ?? []
        const exact = matches.find((m: any) => m['1. symbol'] === raw)
        if (exact) {
          setValidation('valid')
          setResolvedName(exact['2. name'] ?? raw)
          setError('')
        } else {
          setValidation('invalid')
          setResolvedName('')
          setError('Ticker not found')
        }
      } catch {
        // Network error — fall back to format check
        const looksValid = /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/.test(raw)
        setValidation(looksValid ? 'valid' : 'invalid')
        setResolvedName(looksValid ? raw : '')
        setError(looksValid ? '' : 'Could not validate')
      }
    }, 500)
  }, [ticker])

  function addHolding() {
    const t = ticker.trim().toUpperCase()
    const s = parseFloat(shares)
    const c = parseFloat(avgCost)
    if (!t || isNaN(s) || s <= 0 || isNaN(c) || c <= 0) {
      setError('Fill in all fields with valid numbers')
      return
    }
    if (validation === 'invalid') { setError('Fix ticker before adding'); return }

    const existing = holdings.findIndex(h => h.ticker === t)
    if (existing >= 0) {
      // Update existing position
      const updated = [...holdings]
      updated[existing] = { ...updated[existing], shares: s, avgCost: c }
      setHoldings(updated)
    } else {
      setHoldings(prev => [...prev, { ticker: t, shares: s, avgCost: c, name: resolvedName || t }])
    }
    setTicker(''); setShares(''); setAvgCost('')
    setValidation('idle'); setResolvedName(''); setError('')
  }

  function removeHolding(ticker: string) {
    setHoldings(prev => prev.filter(h => h.ticker !== ticker))
  }

  const totalValue = holdings.reduce((sum, h) => sum + h.shares * h.avgCost, 0)

  const validationIcon = () => {
    if (validation === 'checking') return <span className="text-[10px] text-[#888] animate-pulse">checking...</span>
    if (validation === 'valid')    return <MdCheckCircle size={14} color="#00e676" />
    if (validation === 'invalid')  return <MdError size={14} color="#ff1744" />
    return null
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60">
      <div
        className="bg-[#f5f0e8] border-[3px] border-[#0a0a0a] shadow-[8px_8px_0_#0a0a0a] flex flex-col"
        style={{ width: '760px', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#ffd700] border-b-[3px] border-[#0a0a0a] shrink-0">
          <div>
            <span className="text-base font-black uppercase tracking-[0.2em] font-mono">Portfolio</span>
            <span className="ml-3 text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/60">
              {holdings.length} positions · ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} book value
            </span>
          </div>
          <button
            onClick={onClose}
            className="border-2 border-[#0a0a0a] bg-white p-1 hover:bg-[#ff1744] hover:text-white transition-colors shadow-[2px_2px_0_#0a0a0a]"
          >
            <MdClose size={16} />
          </button>
        </div>

        {/* Add row */}
        <div className="px-5 py-3 border-b-[3px] border-[#0a0a0a] bg-white shrink-0">
          <p className="text-[9px] font-black uppercase tracking-wider text-[#0a0a0a]/50 mb-2">Add / Update Position</p>
          <div className="flex items-start gap-2">
            {/* Ticker input */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 border-2 border-[#0a0a0a] bg-white px-2 py-1.5 shadow-[2px_2px_0_#0a0a0a] w-36">
                <MdSearch size={12} color="#888" />
                <input
                  value={ticker}
                  onChange={e => setTicker(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && addHolding()}
                  placeholder="TICKER"
                  className="text-[11px] font-black font-mono uppercase bg-transparent outline-none w-full placeholder:text-[#bbb]"
                  maxLength={6}
                />
                <div className="shrink-0">{validationIcon()}</div>
              </div>
              {resolvedName && (
                <span className="text-[9px] text-[#555] font-bold truncate max-w-[144px]">{resolvedName}</span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <input
                value={shares}
                onChange={e => setShares(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addHolding()}
                placeholder="Shares"
                type="number"
                min="0"
                className="border-2 border-[#0a0a0a] px-2 py-1.5 text-[11px] font-mono w-24 outline-none shadow-[2px_2px_0_#0a0a0a] bg-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <input
                value={avgCost}
                onChange={e => setAvgCost(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addHolding()}
                placeholder="Avg cost $"
                type="number"
                min="0"
                className="border-2 border-[#0a0a0a] px-2 py-1.5 text-[11px] font-mono w-28 outline-none shadow-[2px_2px_0_#0a0a0a] bg-white"
              />
            </div>

            <button
              onClick={addHolding}
              disabled={validation === 'invalid' || validation === 'checking'}
              className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider border-2 border-[#0a0a0a] bg-[#0a0a0a] text-[#ffd700] shadow-[2px_2px_0_#0a0a0a] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0"
            >
              <MdAdd size={13} />
              Add
            </button>
          </div>
          {error && <p className="text-[10px] text-[#ff1744] font-bold mt-1.5">{error}</p>}
        </div>

        {/* Holdings table */}
        <div className="flex-1 overflow-y-auto">
          {holdings.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-[11px] font-bold text-[#888] uppercase tracking-wider">
              No positions. Add one above.
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white border-b-2 border-[#0a0a0a] sticky top-0">
                  {['Ticker', 'Name', 'Shares', 'Avg Cost', 'Book Value', ''].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-wider text-[#0a0a0a]/50">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((h, i) => (
                  <tr
                    key={h.ticker}
                    className={`border-b border-[#0a0a0a]/10 hover:bg-white transition-colors ${i % 2 === 0 ? 'bg-[#f5f0e8]' : 'bg-[#ede8df]'}`}
                  >
                    <td className="px-4 py-2.5">
                      <span className="text-[12px] font-black font-mono text-[#0a0a0a]">{h.ticker}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-[11px] font-bold text-[#555] max-w-[180px] truncate block">{h.name}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-[11px] font-mono font-bold">{h.shares}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-[11px] font-mono font-bold">${h.avgCost.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-[11px] font-mono font-black">
                        ${(h.shares * h.avgCost).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => removeHolding(h.ticker)}
                        className="p-1 border-2 border-transparent hover:border-[#ff1744] hover:text-[#ff1744] text-[#888] transition-colors"
                      >
                        <MdDelete size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-white border-t-2 border-[#0a0a0a]">
                  <td colSpan={4} className="px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-[#0a0a0a]/50">
                    Total Book Value
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-[13px] font-black font-mono">
                      ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t-[3px] border-[#0a0a0a] bg-white shrink-0 flex items-center justify-between">
          <p className="text-[9px] font-bold text-[#888] uppercase tracking-wider">
            Changes saved automatically · Persisted in browser
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[11px] font-black uppercase tracking-wider border-2 border-[#0a0a0a] bg-[#0a0a0a] text-white shadow-[2px_2px_0_#0a0a0a] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
