import { useEffect, useRef, useState } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface NewsChannel {
  id: string
  label: string
  tag: string
  youtubeId: string
}

// ─── Data ────────────────────────────────────────────────────────────────────

const CHANNEL_LIBRARY: NewsChannel[] = [
  { id: 'bloomberg',  label: 'Bloomberg',     tag: 'Finance', youtubeId: 'iEpJwprxDdk' },
  { id: 'yahoo',      label: 'Yahoo Finance', tag: 'Finance', youtubeId: 'V8wfN4bXfPg' },
  { id: 'cnbc',       label: 'CNBC',          tag: 'Finance', youtubeId: 'OAUwPFsacJA' },
  { id: 'bbcnews',    label: 'BBC News',      tag: 'World',   youtubeId: '-GPBPBn7JCI' },
  { id: 'skynews',    label: 'Sky News',      tag: 'World',   youtubeId: 'YDvsBbKfLPA' },
  { id: 'aljazeera',  label: 'Al Jazeera',    tag: 'World',   youtubeId: 'dfYE7DeElpY' },
  { id: 'dwnews',     label: 'DW News',       tag: 'World',   youtubeId: 'LuKwFajn37U' },
  { id: 'wion',       label: 'WION',          tag: 'World',   youtubeId: 'vfszY1JYbMc' },
]

const DEFAULT_ACTIVE = ['bloomberg', 'yahoo', 'bbcnews', 'aljazeera']

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const s = localStorage.getItem(key)
      return s ? (JSON.parse(s) as T) : initial
    } catch { return initial }
  })
  const set = (v: T) => { setValue(v); localStorage.setItem(key, JSON.stringify(v)) }
  return [value, set]
}

// ─── YouTube Player component ─────────────────────────────────────────────────

function YouTubePlayer({ videoId }: { videoId: string }) {
  const src =
    `https://www.youtube.com/embed/${videoId}` +
    `?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3`

  return (
    <iframe
      src={src}
      title="Live news"
      className="absolute inset-0 w-full h-full"
      frameBorder="0"
      allow="autoplay; encrypted-media; picture-in-picture"
      sandbox="allow-scripts allow-same-origin allow-presentation"
    />
  )
}


// ─── Manage modal ─────────────────────────────────────────────────────────────

interface ManageModalProps {
  activeIds: string[]
  onChange: (ids: string[]) => void
  onClose: () => void
}

function ManageModal({ activeIds, onChange, onClose }: ManageModalProps) {
  const [draft, setDraft] = useState<string[]>(activeIds)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const toggle = (id: string) =>
    setDraft(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const byTag = CHANNEL_LIBRARY.reduce<Record<string, NewsChannel[]>>((acc, ch) => {
    ;(acc[ch.tag] ??= []).push(ch)
    return acc
  }, {})

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] bg-[#0a0a0a]/70 flex items-center justify-center p-6"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-[#f5f0e8] border-[3px] border-[#0a0a0a] shadow-[8px_8px_0_#0a0a0a] w-[460px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b-[3px] border-[#0a0a0a] bg-[#ffd700] shrink-0">
          <span className="text-[12px] font-black uppercase tracking-[0.15em]">Manage Channels</span>
          <button onClick={onClose} className="text-[10px] font-black uppercase px-2 py-0.5 border-2 border-[#0a0a0a] bg-[#0a0a0a] text-[#ffd700] hover:opacity-80">✕</button>
        </div>
        <p className="px-4 py-2 text-[10px] font-bold text-[#0a0a0a]/50 uppercase tracking-wider border-b-2 border-[#0a0a0a] shrink-0">
          {draft.length} selected — pinned channels appear as buttons above the player
        </p>
        <div className="overflow-y-auto flex-1 p-4 space-y-5">
          {Object.entries(byTag).map(([tag, channels]) => (
            <div key={tag}>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#0a0a0a]/40 mb-2">{tag}</p>
              <div className="space-y-1.5">
                {channels.map(ch => {
                  const on = draft.includes(ch.id)
                  return (
                    <button
                      key={ch.id}
                      onClick={() => toggle(ch.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 border-2 border-[#0a0a0a] text-left transition-none
                        ${on ? 'bg-[#0a0a0a] text-white shadow-none translate-x-[2px] translate-y-[2px]'
                             : 'bg-white text-[#0a0a0a] shadow-[3px_3px_0_#0a0a0a] hover:bg-[#f5f0e8]'}`}
                    >
                      <div className={`w-4 h-4 border-2 shrink-0 flex items-center justify-center ${on ? 'border-[#ffd700] bg-[#ffd700]' : 'border-[#0a0a0a]'}`}>
                        {on && <span className="text-[10px] font-black text-[#0a0a0a] leading-none">✓</span>}
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-wider flex-1">{ch.label}</span>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 border ${
                        on ? 'border-white/30 text-white/60'
                           : tag === 'Finance' ? 'border-[#0a0a0a] bg-[#00e676] text-[#0a0a0a]'
                                               : 'border-[#0a0a0a] bg-[#2979ff] text-white'
                      }`}>{tag}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t-[3px] border-[#0a0a0a] bg-white shrink-0">
          <span className="text-[10px] font-bold text-[#0a0a0a]/50">{draft.length} channel{draft.length !== 1 ? 's' : ''} selected</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 border-2 border-[#0a0a0a] bg-white hover:bg-[#f5f0e8] shadow-[2px_2px_0_#0a0a0a] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all">Cancel</button>
            <button
              onClick={() => { if (draft.length > 0) { onChange(draft); onClose() } }}
              disabled={draft.length === 0}
              className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 border-2 border-[#0a0a0a] bg-[#ffd700] text-[#0a0a0a] shadow-[2px_2px_0_#0a0a0a] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-40 disabled:pointer-events-none"
            >Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface NewsPlayerState {
  currentId: string
}

interface Props {
  onFullscreen: () => void
  externalState?: NewsPlayerState
  onStateChange?: (s: NewsPlayerState) => void
}

export default function LiveNewsFeed({ onFullscreen, externalState, onStateChange }: Props) {
  const [activeIds, setActiveIds] = useLocalStorage<string[]>('signal-news-channels', DEFAULT_ACTIVE)
  const [managing, setManaging] = useState(false)
  const [currentId, setCurrentId] = useState<string>(externalState?.currentId ?? DEFAULT_ACTIVE[0])

  const activeChannels = CHANNEL_LIBRARY.filter(c => activeIds.includes(c.id))
  const channel = activeChannels.find(c => c.id === currentId) ?? activeChannels[0]

  const switchChannel = (id: string) => {
    setCurrentId(id)
    onStateChange?.({ currentId: id })
  }

  const handleSave = (ids: string[]) => {
    setActiveIds(ids)
    if (!ids.includes(currentId)) switchChannel(ids[0])
  }

  return (
    <>
      <div className="flex flex-col h-full bg-[#0a0a0a]">
        {/* Header */}
        <div className="px-3 py-2 border-b-[3px] border-[#0a0a0a] bg-white flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-[#0a0a0a]">Live News</span>
            <span className="live-dot" />
          </div>

          {/* Channel buttons */}
          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            {activeChannels.map(ch => (
              <button
                key={ch.id}
                onClick={() => switchChannel(ch.id)}
                className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 border-2 border-[#0a0a0a] transition-none shrink-0
                  ${channel?.id === ch.id
                    ? 'bg-[#ffd700] text-[#0a0a0a] shadow-none translate-x-[1px] translate-y-[1px]'
                    : 'bg-white text-[#0a0a0a] shadow-[2px_2px_0_#0a0a0a] hover:bg-[#f5f0e8]'
                  }`}
              >
                {ch.label}
              </button>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <button
              onClick={() => setManaging(true)}
              className="text-[9px] font-black uppercase tracking-wider px-2 py-1 border-2 border-[#0a0a0a] bg-white hover:bg-[#f5f0e8] shadow-[2px_2px_0_#0a0a0a] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              + Channels
            </button>
            <button
              onClick={onFullscreen}
              title="Fullscreen"
              className="text-[10px] font-black px-2 py-1 border-2 border-[#0a0a0a] bg-white hover:bg-[#f5f0e8] shadow-[2px_2px_0_#0a0a0a] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              ⛶
            </button>
          </div>
        </div>

        {/* Player area */}
        <div className="flex-1 min-h-0 relative">
          {channel ? (
            <>
              <YouTubePlayer key={channel.youtubeId} videoId={channel.youtubeId} />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[11px] font-black uppercase tracking-wider text-white/30">No channels selected</p>
            </div>
          )}
        </div>
      </div>

      {managing && (
        <ManageModal
          activeIds={activeIds}
          onChange={handleSave}
          onClose={() => setManaging(false)}
        />
      )}
    </>
  )
}
