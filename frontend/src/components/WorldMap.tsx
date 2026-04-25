import { useEffect, useRef, useState, useCallback } from 'react'
import { fetchChokepoints } from '../api/client'
import type { Chokepoint } from '../types'
import type { PointFeature, LineFeature } from '../api/client'
import {
  fetchConflictLayer,
  fetchClimateLayer,
  fetchCyberLayer,
  fetchSanctionsLayer,
  fetchPipelinesLayer,
  fetchCablesLayer,
  fetchMineralsLayer,
  fetchEconomicLayer,
  fetchDatacentersLayer,
} from '../api/client'
import {
  MdBlock,
  MdOutlineWarningAmber,
  MdOutlineWifi,
  MdAccountBalance,
  MdOutlineDiamond,
  MdOutlineWaterDrop,
  MdCable,
  MdOutlineMemory,
  MdAnchor,
  MdOutlineWaves,
} from 'react-icons/md'
import type { IconType } from 'react-icons'

// ─── Layer definitions ────────────────────────────────────────────────────────
type LayerId =
  | 'sanctions'
  | 'conflict'
  | 'cyber'
  | 'economic'
  | 'minerals'
  | 'pipelines'
  | 'cables'
  | 'datacenters'
  | 'chokepoints'
  | 'climate'

interface LayerDef {
  id: LayerId
  label: string
  Icon: IconType
  color: string
}

const LAYERS: LayerDef[] = [
  { id: 'sanctions',   label: 'Sanctions',        Icon: MdBlock,               color: '#ff1744' },
  { id: 'conflict',    label: 'Conflict Zones',    Icon: MdOutlineWarningAmber, color: '#ff6d00' },
  { id: 'cyber',       label: 'Cyber Threats',     Icon: MdOutlineWifi,         color: '#2979ff' },
  { id: 'economic',    label: 'Economic Centers',  Icon: MdAccountBalance,      color: '#ffd700' },
  { id: 'minerals',    label: 'Critical Minerals', Icon: MdOutlineDiamond,      color: '#00e676' },
  { id: 'pipelines',   label: 'Pipelines',         Icon: MdOutlineWaterDrop,    color: '#ff6d00' },
  { id: 'cables',      label: 'Undersea Cables',   Icon: MdCable,               color: '#2979ff' },
  { id: 'datacenters', label: 'AI Data Centers',   Icon: MdOutlineMemory,       color: '#aa00ff' },
  { id: 'chokepoints', label: 'Chokepoints',       Icon: MdAnchor,              color: '#ffd700' },
  { id: 'climate',     label: 'Climate Anomalies', Icon: MdOutlineWaves,        color: '#00e5ff' },
]

// ─── Layer cache — static infra layers cached for the session,
// live layers (conflict/climate/cyber/sanctions) cached for 15 minutes
const layerCache: Partial<Record<LayerId, { data: PointFeature[] | LineFeature[]; ts: number }>> = {}
const STATIC_LAYERS: LayerId[] = ['pipelines', 'cables', 'minerals', 'economic', 'datacenters']
const LIVE_TTL_MS = 15 * 60 * 1000

async function loadLayer(id: LayerId, _chokepoints: Chokepoint[]): Promise<PointFeature[] | LineFeature[] | null> {
  const cached = layerCache[id]
  const isStatic = STATIC_LAYERS.includes(id)
  if (cached && (isStatic || Date.now() - cached.ts < LIVE_TTL_MS)) return cached.data
  try {
    let data: PointFeature[] | LineFeature[]
    switch (id) {
      case 'conflict':    data = await fetchConflictLayer();    break
      case 'climate':     data = await fetchClimateLayer();     break
      case 'cyber':       data = await fetchCyberLayer();       break
      case 'sanctions':   data = await fetchSanctionsLayer();   break
      case 'pipelines':   data = await fetchPipelinesLayer();   break
      case 'cables':      data = await fetchCablesLayer();       break
      case 'minerals':    data = await fetchMineralsLayer();    break
      case 'economic':    data = await fetchEconomicLayer();    break
      case 'datacenters': data = await fetchDatacentersLayer(); break
      case 'chokepoints':
        // Chokepoints use live data passed in directly — don't cache here
        return null
      default: return null
    }
    layerCache[id] = { data, ts: Date.now() }
    return data
  } catch {
    return null
  }
}

// ─── World GeoJSON — cached for the session ───────────────────────────────────
let worldGeoJson: any = null

async function loadWorldGeoJson(): Promise<any> {
  if (worldGeoJson) return worldGeoJson
  try {
    const r = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
    worldGeoJson = await r.json()
    return worldGeoJson
  } catch {
    return null
  }
}

// Map GDELT sourcecountry values and fallback names → GeoJSON name field
const COUNTRY_NAME_ALIASES: Record<string, string> = {
  'Burma': 'Myanmar',
  'Gaza': 'Palestine',
  'Gaza Strip': 'Palestine',
  'West Bank': 'Palestine',
  'Donbas': 'Ukraine',
  'Crimea': 'Ukraine',
  'North Korea': 'North Korea',
  'South Korea': 'South Korea',
  'United States': 'United States of America',
  'United Kingdom': 'United Kingdom',
  'Czech Republic': 'Czech Republic',
  'Dominican Republic': 'Dominican Republic',
  'Central African Republic': 'Central African Republic',
  'South Africa': 'South Africa',
  'South Sudan': 'South Sudan',
  'Sierra Leone': 'Sierra Leone',
  'Saudi Arabia': 'Saudi Arabia',
  'United Arab Emirates': 'United Arab Emirates',
}

function resolveGeoName(country: string): string {
  return COUNTRY_NAME_ALIASES[country] ?? country
}

// ─── Layer filter panel ───────────────────────────────────────────────────────
function LayerPanel({
  activeLayers,
  onToggle,
  onClose,
}: {
  activeLayers: Set<LayerId>
  onToggle: (id: LayerId) => void
  onClose: () => void
}) {
  return (
    <div className="bg-white border-2 border-[#0a0a0a] shadow-[4px_4px_0_#0a0a0a] w-52">
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-[#0a0a0a]">
        <span className="text-[11px] font-black uppercase tracking-wider">Map Layers</span>
        <button
          onClick={onClose}
          className="text-[#0a0a0a] font-black text-xs leading-none hover:text-[#ff1744] transition-colors"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-3 gap-0 p-2">
        {LAYERS.map(layer => {
          const active = activeLayers.has(layer.id)
          return (
            <button
              key={layer.id}
              onClick={() => onToggle(layer.id)}
              className={`flex flex-col items-center gap-1 p-2 border-2 m-0.5 transition-none text-center
                ${active ? 'shadow-[2px_2px_0_#0a0a0a]' : 'border-transparent hover:border-[#0a0a0a]'}`}
              style={active ? { background: layer.color + '22', borderColor: layer.color } : {}}
            >
              <layer.Icon size={18} color={active ? layer.color : '#555'} />
              <span
                className="text-[8px] font-bold uppercase leading-tight"
                style={{ color: active ? layer.color : '#555', maxWidth: 48 }}
              >
                {layer.label}
              </span>
              {active && (
                <div
                  className="w-1.5 h-1.5 rounded-full border border-[#0a0a0a]"
                  style={{ background: layer.color }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Chokepoint coordinates ───────────────────────────────────────────────────
const CHOKEPOINT_COORDS: Record<string, [number, number]> = {
  'Strait of Hormuz': [26.6, 56.3],
  'Suez Canal':       [30.0, 32.5],
  'Taiwan Strait':    [24.5, 120.0],
  'Bab el-Mandeb':    [12.5, 43.5],
  'Kerch Strait':     [45.3, 36.5],
}

const RISK_HEX: Record<string, string> = {
  normal:   '#00e676',
  elevated: '#ffd700',
  critical: '#ff1744',
}

const SEVERITY_HEX: Record<string, string> = {
  critical: '#ff1744',
  elevated: '#ffd700',
  normal:   '#00e676',
}

// ─── Tooltip HTML ─────────────────────────────────────────────────────────────
function tip(title: string, subtitle: string, color: string) {
  return `<div style="background:#fff;border:2.5px solid #0a0a0a;padding:8px 12px;font-family:monospace;font-size:12px;box-shadow:3px 3px 0 #0a0a0a;border-radius:0;width:220px;box-sizing:border-box;overflow:hidden;">
    <div style="font-weight:800;margin-bottom:4px;white-space:normal;word-break:break-word;overflow-wrap:break-word;">${title}</div>
    <div style="color:${color};font-size:10px;line-height:1.4;white-space:normal;word-break:break-word;overflow-wrap:break-word;">${subtitle}</div>
  </div>`
}

// ─── Marker builders ──────────────────────────────────────────────────────────
function addCircle(L: any, map: any, lat: number, lng: number, color: string, size: number, tooltip: string, pulse = false) {
  const icon = L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid #0a0a0a;border-radius:50%;box-shadow:2px 2px 0 #0a0a0a;${pulse ? 'animation:pulse2d 2s ease-out infinite;' : ''}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
  const m = L.marker([lat, lng], { icon })
  m.bindTooltip(tooltip, { sticky: false, className: 'nb-leaflet-tooltip', opacity: 1 })
  m.addTo(map)
  return m
}

function addSquare(L: any, map: any, lat: number, lng: number, color: string, size: number, tooltip: string) {
  const icon = L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid #0a0a0a;box-shadow:2px 2px 0 #0a0a0a;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
  const m = L.marker([lat, lng], { icon })
  m.bindTooltip(tooltip, { sticky: false, className: 'nb-leaflet-tooltip', opacity: 1 })
  m.addTo(map)
  return m
}

function addDiamond(L: any, map: any, lat: number, lng: number, color: string, size: number, tooltip: string) {
  const icon = L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid #0a0a0a;box-shadow:2px 2px 0 #0a0a0a;transform:rotate(45deg);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
  const m = L.marker([lat, lng], { icon })
  m.bindTooltip(tooltip, { sticky: false, className: 'nb-leaflet-tooltip', opacity: 1 })
  m.addTo(map)
  return m
}

function addPolyline(L: any, map: any, coords: [number, number][], color: string, tooltip: string) {
  const poly = L.polyline(coords, { color, weight: 2.5, opacity: 0.85, dashArray: '6 4' })
  poly.bindTooltip(tooltip, { sticky: true, className: 'nb-leaflet-tooltip', opacity: 1 })
  poly.addTo(map)
  return poly
}

function severitySize(severity?: string, base = 10) {
  if (severity === 'critical') return base + 4
  if (severity === 'elevated') return base + 2
  return base
}

// ─── Layer renderer ───────────────────────────────────────────────────────────
async function renderLayer(
  id: LayerId,
  data: PointFeature[] | LineFeature[],
  L: any,
  map: any,
): Promise<any[]> {
  const objs: any[] = []
  const layerDef = LAYERS.find(l => l.id === id)!
  const color = layerDef.color

  switch (id) {
    case 'conflict': {
      const points = data as PointFeature[]

      // Build set of unique countries from the live data
      const conflictCountries = new Map<string, { severity: string; detail: string }>()
      for (const f of points) {
        // GDELT sets detail as "CountryName · Xh ago" — extract country from detail
        const country = f.detail?.split('·')[0]?.trim() ?? ''
        if (!country) continue
        const existing = conflictCountries.get(country)
        // Prefer critical over elevated over normal
        if (!existing || (f.severity === 'critical' && existing.severity !== 'critical')) {
          conflictCountries.set(country, { severity: f.severity ?? 'elevated', detail: f.name })
        }
      }

      // Shade country polygons
      const geo = await loadWorldGeoJson()
      if (geo) {
        const filteredGeo = {
          ...geo,
          features: geo.features.filter((feat: any) => {
            const name = feat.properties?.name ?? ''
            return conflictCountries.has(name) || conflictCountries.has(resolveGeoName(name))
          }),
        }

        if (filteredGeo.features.length > 0) {
          const geoLayer = L.geoJSON(filteredGeo, {
            style: (feat: any) => {
              const name = feat.properties?.name ?? ''
              const info = conflictCountries.get(name) ?? conflictCountries.get(resolveGeoName(name))
              const isCritical = info?.severity === 'critical'
              return {
                color: '#ff1744',
                weight: 1.5,
                opacity: 0.9,
                fillColor: '#ff1744',
                fillOpacity: isCritical ? 0.28 : 0.14,
              }
            },
            onEachFeature: (feat: any, layer: any) => {
              const name = feat.properties?.name ?? ''
              const info = conflictCountries.get(name) ?? conflictCountries.get(resolveGeoName(name))
              if (info) {
                layer.bindTooltip(
                  tip(name, info.detail, '#ff1744'),
                  { sticky: true, className: 'nb-leaflet-tooltip', opacity: 1 },
                )
              }
            },
          })
          geoLayer.addTo(map)
          objs.push(geoLayer)
        }
      }

      // Point markers on top
      for (const f of points) {
        const c = SEVERITY_HEX[f.severity ?? 'elevated']
        const size = severitySize(f.severity, 10)
        objs.push(addCircle(L, map, f.lat, f.lng, c, size, tip(f.name, f.detail, c)))
      }
      break
    }
    case 'climate': {
      for (const f of data as PointFeature[]) {
        const size = severitySize(f.severity, 10)
        const src = f.source ? ` [${f.source}]` : ''
        objs.push(addCircle(L, map, f.lat, f.lng, '#00e5ff', size,
          tip(f.name, f.detail + src, '#00e5ff')))
      }
      break
    }
    case 'cyber': {
      for (const f of data as PointFeature[]) {
        const size = severitySize(f.severity, 9)
        objs.push(addDiamond(L, map, f.lat, f.lng, '#2979ff', size, tip(f.name, f.detail, '#2979ff')))
      }
      break
    }
    case 'sanctions': {
      for (const f of data as PointFeature[]) {
        const c = SEVERITY_HEX[f.severity ?? 'elevated']
        const size = severitySize(f.severity, 9)
        const src = (f.source as string | undefined) ? ` — ${f.source}` : ''
        objs.push(addSquare(L, map, f.lat, f.lng, c, size, tip(f.name, f.detail + src, c)))
      }
      break
    }
    case 'economic': {
      for (const f of data as PointFeature[]) {
        const tier = (f.tier as number | undefined) ?? 2
        const size = tier === 1 ? 13 : 10
        objs.push(addSquare(L, map, f.lat, f.lng, color, size, tip(f.name, f.detail, color)))
      }
      break
    }
    case 'minerals': {
      for (const f of data as PointFeature[]) {
        const c = SEVERITY_HEX[f.severity ?? 'normal']
        const size = severitySize(f.severity, 9)
        objs.push(addDiamond(L, map, f.lat, f.lng, c, size, tip(f.name, f.detail, c)))
      }
      break
    }
    case 'datacenters': {
      for (const f of data as PointFeature[]) {
        const op = (f.operator as string | undefined) ?? ''
        objs.push(addSquare(L, map, f.lat, f.lng, color, 9, tip(f.name, `${f.detail}${op ? ' · ' + op : ''}`, color)))
      }
      break
    }
    case 'pipelines': {
      for (const f of data as LineFeature[]) {
        objs.push(addPolyline(L, map, f.coords, f.color, tip(f.name, f.detail, f.color)))
      }
      break
    }
    case 'cables': {
      for (const f of data as LineFeature[]) {
        objs.push(addPolyline(L, map, f.coords, f.color, tip(f.name, f.detail, f.color)))
      }
      break
    }
  }

  return objs
}

// ─── 2D Map ───────────────────────────────────────────────────────────────────
function Map2D({
  chokepoints,
  activeLayers,
}: {
  chokepoints: Chokepoint[]
  activeLayers: Set<LayerId>
}) {
  const mapRef          = useRef<HTMLDivElement>(null)
  const leafletMapRef   = useRef<any>(null)
  const leafletRef      = useRef<any>(null)
  const initializedRef  = useRef(false)
  const layerObjectsRef = useRef<Partial<Record<LayerId, any[]>>>({})
  // Holds the latest sync fn so init() can call it once the map is ready
  const pendingSyncRef  = useRef<(() => void) | null>(null)

  // ── Init Leaflet once ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || initializedRef.current) return
    initializedRef.current = true

    async function init() {
      const L = await import('leaflet')
      // @ts-ignore
      await import('leaflet/dist/leaflet.css')
      if (!mapRef.current) return

      const map = L.map(mapRef.current, {
        center: [25, 15],
        zoom: 2,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false,
        zoomSnap: 0.5,
      })

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        minZoom: 2,
        maxZoom: 19,
      }).addTo(map)

      leafletRef.current    = L
      leafletMapRef.current = map
      map.invalidateSize()

      // Run any sync that was queued before the map was ready
      pendingSyncRef.current?.()
      pendingSyncRef.current = null
    }

    init()

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
        leafletRef.current    = null
        initializedRef.current = false
      }
    }
  }, [])

  // ── Sync layers whenever activeLayers or chokepoints change ───────────────
  useEffect(() => {
    async function sync() {
      // If map isn't ready yet, park this sync — init() will call it
      if (!leafletMapRef.current || !leafletRef.current) {
        pendingSyncRef.current = sync
        return
      }
      const map = leafletMapRef.current
      const L   = leafletRef.current

      // Clear stale live layers so they re-fetch on next render
      for (const id of ['conflict', 'climate', 'cyber', 'sanctions'] as LayerId[]) {
        const cached = layerCache[id]
        if (cached && Date.now() - cached.ts >= LIVE_TTL_MS) {
          delete layerCache[id]
          const objs = layerObjectsRef.current[id] ?? []
          objs.forEach(o => o.remove())
          layerObjectsRef.current[id] = []
        }
      }

      for (const layer of LAYERS) {
        const id = layer.id
        const active = activeLayers.has(id)
        const rendered = (layerObjectsRef.current[id] ?? []).length > 0

        if (!active && rendered) {
          layerObjectsRef.current[id]!.forEach(o => o.remove())
          layerObjectsRef.current[id] = []
          continue
        }

        if (active && !rendered) {
          if (id === 'chokepoints') {
            // Render live chokepoint data
            const objs: any[] = []
            for (const cp of chokepoints) {
              const coords = CHOKEPOINT_COORDS[cp.name]
              if (!coords) continue
              const color = RISK_HEX[cp.risk_level] ?? RISK_HEX.normal
              const size  = cp.risk_level === 'critical' ? 18 : cp.risk_level === 'elevated' ? 14 : 10

              const icon = L.divIcon({
                className: '',
                html: `<div style="width:${size}px;height:${size}px;background:${color};border:2.5px solid #0a0a0a;border-radius:50%;box-shadow:2px 2px 0 #0a0a0a;animation:pulse2d 2s ease-out infinite;"></div>`,
                iconSize: [size, size],
                iconAnchor: [size / 2, size / 2],
              })

              const tickerHtml = cp.top_tickers.length
                ? cp.top_tickers.map(t =>
                    `<span style="font-weight:700">${t.symbol}</span> <span style="color:${t.direction === 'bullish' ? '#00c853' : '#d50000'};font-weight:700">${t.direction.toUpperCase()}</span>`
                  ).join(' &nbsp;·&nbsp; ')
                : '<span style="color:#888">No active signals</span>'

              const m = L.marker([coords[0], coords[1]], { icon })
              m.bindTooltip(`
                <div style="background:#fff;border:2.5px solid #0a0a0a;padding:8px 12px;font-family:monospace;font-size:12px;box-shadow:3px 3px 0 #0a0a0a;border-radius:0;width:220px;box-sizing:border-box;overflow:hidden;">
                  <div style="font-weight:800;margin-bottom:4px;">${cp.name}</div>
                  <div style="color:${color};font-weight:700;margin-bottom:4px;">${cp.risk_level.toUpperCase()}</div>
                  <div>${tickerHtml}</div>
                </div>`, { sticky: false, className: 'nb-leaflet-tooltip', opacity: 1 })
              m.addTo(map)
              objs.push(m)
            }
            layerObjectsRef.current['chokepoints'] = objs
          } else {
            // Fetch from backend (cached after first load)
            const data = await loadLayer(id, chokepoints)
            if (data) {
              const objs = await renderLayer(id, data, L, map)
              layerObjectsRef.current[id] = objs
            }
          }
        }
      }
    }

    sync()
  }, [activeLayers, chokepoints])

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      <style>{`
        .nb-leaflet-tooltip .leaflet-tooltip {
          background: none !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          white-space: normal !important;
          max-width: none !important;
        }
        @keyframes pulse2d {
          0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.6); }
          70%  { box-shadow: 0 0 0 8px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }
      `}</style>
    </div>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function MapLegend({ activeLayers }: { activeLayers: Set<LayerId> }) {
  const active = LAYERS.filter(l => activeLayers.has(l.id))
  if (active.length === 0) return null

  return (
    <div className="bg-white border-2 border-[#0a0a0a] shadow-[3px_3px_0_#0a0a0a] px-2.5 py-2">
      <p className="text-[9px] font-black uppercase tracking-wider text-[#0a0a0a] mb-1.5">Active Layers</p>
      {active.map(layer => (
        <div key={layer.id} className="flex items-center gap-1.5 mb-1">
          <layer.Icon size={10} color={layer.color} />
          <span className="text-[9px] font-bold uppercase" style={{ color: layer.color }}>
            {layer.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Persist active layers to localStorage ────────────────────────────────────
const STORAGE_KEY = 'signal_active_layers'

function loadPersistedLayers(): Set<LayerId> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const arr = JSON.parse(raw) as LayerId[]
      if (Array.isArray(arr) && arr.length > 0) return new Set(arr)
    }
  } catch { /* ignore */ }
  return new Set(['chokepoints'])
}

function persistLayers(layers: Set<LayerId>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...layers]))
  } catch { /* ignore */ }
}

// ─── WorldMap ─────────────────────────────────────────────────────────────────
export default function WorldMap() {
  const [chokepoints, setChokepoints]   = useState<Chokepoint[]>([])
  const [showLayers, setShowLayers]     = useState(false)
  const [activeLayers, setActiveLayers] = useState<Set<LayerId>>(loadPersistedLayers)

  useEffect(() => {
    fetchChokepoints().then(setChokepoints)
    const interval = setInterval(() => fetchChokepoints().then(setChokepoints), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const toggleLayer = useCallback((id: LayerId) => {
    setActiveLayers(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      persistLayers(next)
      return next
    })
  }, [])

  return (
    <div className="relative w-full h-full">
      {/* Map renders first so controls sit on top in DOM order */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <Map2D chokepoints={chokepoints} activeLayers={activeLayers} />
      </div>

      {/* Controls — rendered after map, z-index above Leaflet's ceiling (700) */}
      <div className="absolute top-2 right-2 flex items-center gap-1" style={{ zIndex: 1000 }}>
        <button
          onClick={() => setShowLayers(v => !v)}
          title="Map Layers"
          className={`px-2.5 py-1 text-[11px] font-black uppercase tracking-wider border-2 border-[#0a0a0a] transition-none
            ${showLayers
              ? 'bg-[#ffd700] text-[#0a0a0a] shadow-[2px_2px_0_#0a0a0a]'
              : 'bg-white text-[#0a0a0a] shadow-[2px_2px_0_#0a0a0a] hover:bg-[#f5f0e8]'
            }`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
            <polygon points="12 2 22 8.5 12 15 2 8.5 12 2" />
            <polyline points="2 15.5 12 22 22 15.5" />
            <polyline points="2 12 12 18.5 22 12" />
          </svg>
        </button>
      </div>

      {showLayers && (
        <div className="absolute top-[42px] right-2" style={{ zIndex: 1000 }}>
          <LayerPanel
            activeLayers={activeLayers}
            onToggle={toggleLayer}
            onClose={() => setShowLayers(false)}
          />
        </div>
      )}

      <div className="absolute bottom-2 left-2" style={{ zIndex: 1000 }}>
        <MapLegend activeLayers={activeLayers} />
      </div>
    </div>
  )
}
