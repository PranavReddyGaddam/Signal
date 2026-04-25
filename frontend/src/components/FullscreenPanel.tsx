import { useEffect, useRef } from 'react'

interface Props {
  children: React.ReactNode
  onClose: () => void
  title: string
}

export default function FullscreenPanel({ children, onClose, title }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a]/80 flex items-center justify-center p-6">
      <div
        ref={ref}
        className="bg-[#f5f0e8] border-[3px] border-[#0a0a0a] shadow-[8px_8px_0_#0a0a0a] flex flex-col"
        style={{ width: '95vw', height: '92vh' }}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b-[3px] border-[#0a0a0a] bg-[#ffd700] shrink-0">
          <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#0a0a0a]">
            {title}
          </span>
          <button
            onClick={onClose}
            className="text-[11px] font-black uppercase tracking-wider px-3 py-1 border-2 border-[#0a0a0a] bg-[#0a0a0a] text-[#ffd700] shadow-[2px_2px_0_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            ✕ Close
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
