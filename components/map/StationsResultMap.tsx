'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { RoadSignPrice, splitRoadSignPrice } from '../calculation/RoadSignPrice'
import {
  useResultsMap,
  type MapStationItem,
  type ResultsMapData,
} from './ResultsMapContext'

interface MapLibreBoundsLike {
  extend: (lngLat: [number, number]) => void
}

interface MapLibreMarkerLike {
  setLngLat: (lngLat: [number, number]) => MapLibreMarkerLike
  addTo: (map: MapLibreMapLike) => MapLibreMarkerLike
  remove: () => void
  getElement: () => HTMLElement
}

interface MapLibreMapLike {
  addControl: (control: unknown, position?: string) => void
  fitBounds: (
    bounds: MapLibreBoundsLike,
    options?: { padding?: number; maxZoom?: number; duration?: number },
  ) => void
  flyTo: (options: {
    center: [number, number]
    zoom?: number
    duration?: number
  }) => void
  on: (event: string, callback: () => void) => void
  remove: () => void
}

interface MapLibreGlobal {
  Map: new (options: {
    container: HTMLElement
    style: string
    center: [number, number]
    zoom: number
    attributionControl?: boolean
  }) => MapLibreMapLike
  NavigationControl: new (options?: {
    showCompass?: boolean
  }) => unknown
  Marker: new (options?: {
    element?: HTMLElement
    anchor?: string
  }) => MapLibreMarkerLike
  LngLatBounds: new () => MapLibreBoundsLike
}

declare global {
  interface Window {
    maplibregl?: MapLibreGlobal
  }
}

const MAPLIBRE_CSS_URL =
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css'
const MAPLIBRE_JS_URL =
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js'
const OPENFREEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

const fuelLitersFormatter = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

let mapLibreLoaderPromise: Promise<MapLibreGlobal | null> | null = null

function loadMapLibre(): Promise<MapLibreGlobal | null> {
  if (typeof window === 'undefined') {
    return Promise.resolve(null)
  }

  if (window.maplibregl) {
    return Promise.resolve(window.maplibregl)
  }

  if (mapLibreLoaderPromise) {
    return mapLibreLoaderPromise
  }

  mapLibreLoaderPromise = new Promise((resolve) => {
    if (!document.querySelector(`link[href="${MAPLIBRE_CSS_URL}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = MAPLIBRE_CSS_URL
      document.head.appendChild(link)
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="${MAPLIBRE_JS_URL}"]`,
    )
    if (existingScript) {
      existingScript.addEventListener('load', () =>
        resolve(window.maplibregl ?? null),
      )
      existingScript.addEventListener('error', () => resolve(null))
      return
    }

    const script = document.createElement('script')
    script.src = MAPLIBRE_JS_URL
    script.async = true
    script.onload = () => resolve(window.maplibregl ?? null)
    script.onerror = () => resolve(null)
    document.head.appendChild(script)
  })

  return mapLibreLoaderPromise
}

function getTierColors(rank: number, total: number): {
  badgeBg: string
  badgeBorder: string
  badgeText: string
  tierLabel: string
} {
  if (rank === 1) {
    return {
      badgeBg: '#059669',
      badgeBorder: '#047857',
      badgeText: '#ffffff',
      tierLabel: 'Più conveniente',
    }
  }

  const ratio = total <= 2 ? (rank === 1 ? 0 : 1) : (rank - 1) / (total - 1)

  if (ratio <= 0.4) {
    return {
      badgeBg: '#ecfdf5',
      badgeBorder: '#10b981',
      badgeText: '#064e3b',
      tierLabel: 'Conveniente',
    }
  }

  if (ratio <= 0.75) {
    return {
      badgeBg: '#fffbeb',
      badgeBorder: '#f59e0b',
      badgeText: '#78350f',
      tierLabel: 'Convenienza media',
    }
  }

  return {
    badgeBg: '#fff1f2',
    badgeBorder: '#f43f5e',
    badgeText: '#881337',
    tierLabel: 'Meno conveniente',
  }
}

function shortBrandLabel(station: MapStationItem): string {
  const raw = station.brand?.trim() || station.displayName.trim()
  if (raw.length <= 10) {
    return raw
  }
  return `${raw.slice(0, 9)}…`
}

export function StationsResultMap({
  data,
  selectedStationId,
  onSelectStation,
}: {
  data: ResultsMapData
  selectedStationId: number | null
  onSelectStation: (stationId: number) => void
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<MapLibreMapLike | null>(null)
  const markersRef = useRef<MapLibreMarkerLike[]>([])
  const [vectorMapReady, setVectorMapReady] = useState(false)

  const activeStation = useMemo(
    () =>
      data.stations.find((s) => s.id === selectedStationId) ??
      data.stations[0] ??
      null,
    [data.stations, selectedStationId],
  )

  // Compute relative 2D projection coordinates for immediate/fallback interactive rendering
  const projectedPoints = useMemo(() => {
    const allLats = [
      ...data.stations.map((s) => s.latitude),
      ...(data.origin ? [data.origin.latitude] : []),
      ...(data.destination ? [data.destination.latitude] : []),
    ]
    const allLngs = [
      ...data.stations.map((s) => s.longitude),
      ...(data.origin ? [data.origin.longitude] : []),
      ...(data.destination ? [data.destination.longitude] : []),
    ]

    const minLat = Math.min(...allLats)
    const maxLat = Math.max(...allLats)
    const minLng = Math.min(...allLngs)
    const maxLng = Math.max(...allLngs)

    const latSpan = Math.max(0.008, maxLat - minLat)
    const lngSpan = Math.max(0.008, maxLng - minLng)

    const project = (lat: number, lng: number) => {
      const x = 14 + ((lng - minLng) / lngSpan) * 72
      const y = 84 - ((lat - minLat) / latSpan) * 68
      return {
        x: Math.min(88, Math.max(12, x)),
        y: Math.min(86, Math.max(14, y)),
      }
    }

    return {
      origin: data.origin
        ? project(data.origin.latitude, data.origin.longitude)
        : null,
      destination: data.destination
        ? project(data.destination.latitude, data.destination.longitude)
        : null,
      stations: data.stations.map((station) => ({
        station,
        ...project(station.latitude, station.longitude),
      })),
    }
  }, [data])

  useEffect(() => {
    let cancelled = false

    async function initMap() {
      const container = mapContainerRef.current
      if (!container) return

      const maplibregl = await loadMapLibre()
      if (cancelled || !maplibregl || !mapContainerRef.current) return

      try {
        if (!mapInstanceRef.current) {
          const initialCenter: [number, number] = data.stations[0]
            ? [data.stations[0].longitude, data.stations[0].latitude]
            : data.origin
              ? [data.origin.longitude, data.origin.latitude]
              : [9.19, 45.4642]

          const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: OPENFREEMAP_STYLE_URL,
            center: initialCenter,
            zoom: 12,
            attributionControl: false,
          })

          map.addControl(
            new maplibregl.NavigationControl({ showCompass: false }),
            'top-right',
          )

          map.on('load', () => {
            if (!cancelled) {
              setVectorMapReady(true)
            }
          })

          mapInstanceRef.current = map
        }

        const map = mapInstanceRef.current
        if (!map) return

        for (const marker of markersRef.current) {
          marker.remove()
        }
        markersRef.current = []

        const bounds = new maplibregl.LngLatBounds()

        if (data.origin) {
          const originEl = document.createElement('div')
          originEl.className = 'rifornio-map-origin'
          originEl.title = 'Punto di partenza'
          originEl.style.cssText =
            'width:18px;height:18px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 0 0 4px rgba(37,99,235,0.28),0 2px 6px rgba(0,0,0,0.35);'
          const originMarker = new maplibregl.Marker({
            element: originEl,
            anchor: 'center',
          })
            .setLngLat([data.origin.longitude, data.origin.latitude])
            .addTo(map)
          markersRef.current.push(originMarker)
          bounds.extend([data.origin.longitude, data.origin.latitude])
        }

        if (data.destination) {
          const destEl = document.createElement('div')
          destEl.title = 'Destinazione'
          destEl.style.cssText =
            'padding:2px 6px;border-radius:6px;background:#18181b;color:#ffffff;font-size:11px;font-weight:700;border:2px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.35);'
          destEl.textContent = '🏁 Arrivo'
          const destMarker = new maplibregl.Marker({
            element: destEl,
            anchor: 'bottom',
          })
            .setLngLat([data.destination.longitude, data.destination.latitude])
            .addTo(map)
          markersRef.current.push(destMarker)
          bounds.extend([data.destination.longitude, data.destination.latitude])
        }

        const reversedStations = [...data.stations].reverse()
        for (const station of reversedStations) {
          const colors = getTierColors(station.rank, data.stations.length)
          const { main, millesimi } = splitRoadSignPrice(station.fuelPrice)
          const isSelected = station.id === activeStation?.id

          const btn = document.createElement('button')
          btn.type = 'button'
          btn.setAttribute(
            'aria-label',
            `${station.rank}. ${station.displayName} - ${station.fuelPrice.toFixed(3)} €/L`,
          )
          btn.style.cssText = [
            'display:inline-flex',
            'flex-direction:column',
            'align-items:center',
            'padding:3px 7px',
            'border-radius:10px',
            `background:${colors.badgeBg}`,
            `color:${colors.badgeText}`,
            `border:2px solid ${colors.badgeBorder}`,
            'box-shadow:0 4px 12px rgba(0,0,0,0.18)',
            'cursor:pointer',
            'font-family:inherit',
            'line-height:1.1',
            `z-index:${station.rank === 1 ? 30 : isSelected ? 25 : 20 - station.rank}`,
            `transform:${isSelected ? 'scale(1.12)' : station.rank === 1 ? 'scale(1.06)' : 'scale(1)'}`,
            'transition:transform 150ms ease',
          ].join(';')

          const topRow = document.createElement('span')
          topRow.style.cssText =
            'font-size:9px;font-weight:700;letter-spacing:0.02em;opacity:0.9;max-width:76px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'
          topRow.textContent =
            station.rank === 1
              ? `★ #1 ${shortBrandLabel(station)}`
              : `#${station.rank} ${shortBrandLabel(station)}`

          const priceRow = document.createElement('span')
          priceRow.style.cssText =
            'font-size:13px;font-weight:800;font-variant-numeric:tabular-nums;'
          priceRow.textContent = main

          if (millesimi) {
            const sup = document.createElement('sup')
            sup.style.cssText = 'font-size:9px;font-weight:800;margin-left:1px;'
            sup.textContent = millesimi
            priceRow.appendChild(sup)
          }

          btn.appendChild(topRow)
          btn.appendChild(priceRow)
          btn.addEventListener('click', () => {
            onSelectStation(station.id)
          })

          const marker = new maplibregl.Marker({
            element: btn,
            anchor: 'bottom',
          })
            .setLngLat([station.longitude, station.latitude])
            .addTo(map)

          markersRef.current.push(marker)
          bounds.extend([station.longitude, station.latitude])
        }

        if (data.stations.length > 0) {
          map.fitBounds(bounds, {
            padding: 48,
            maxZoom: 14,
            duration: 500,
          })
        }
      } catch {
        // Keep interactive SVG fallback if WebGL is unavailable in the current environment
      }
    }

    void initMap()

    return () => {
      cancelled = true
    }
  }, [data, activeStation?.id, onSelectStation])

  useEffect(() => {
    if (!mapInstanceRef.current || !activeStation) return
    try {
      mapInstanceRef.current.flyTo({
        center: [activeStation.longitude, activeStation.latitude],
        duration: 450,
      })
    } catch {
      // Ignore flyTo errors if map is not yet loaded
    }
  }, [activeStation])

  useEffect(() => {
    return () => {
      for (const marker of markersRef.current) {
        marker.remove()
      }
      markersRef.current = []
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-200">
            <span className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            Mappa convenienza reale
          </span>
          <h2
            id="homepage-map-title"
            className="mt-1 text-lg font-semibold tracking-tight text-zinc-900 sm:text-xl dark:text-zinc-100"
          >
            Distributori calcolati ({data.stations.length})
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 font-semibold text-white">
            ★ #1 Top
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500 bg-emerald-50 px-1.5 py-0.5 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200">
            Conveniente
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500 bg-amber-50 px-1.5 py-0.5 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">
            Medio
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-rose-500 bg-rose-50 px-1.5 py-0.5 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200">
            Caro
          </span>
        </div>
      </div>

      {/* Map Viewport */}
      <div className="relative min-h-[280px] flex-1 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-inner sm:min-h-[320px] dark:border-zinc-800 dark:bg-zinc-950">
        <div
          ref={mapContainerRef}
          aria-label="Mappa interattiva dei distributori"
          className="absolute inset-0 h-full w-full"
        />

        {/* Immediate interactive radar/map layer before vector tiles finish loading */}
        {!vectorMapReady ? (
          <div className="absolute inset-0 flex flex-col justify-between bg-[radial-gradient(#10b98122_1px,transparent_1px)] [background-size:16px_16px] p-3">
            <div className="pointer-events-none flex items-center justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              <span>
                {data.fuelType} {data.isSelf ? 'Self' : 'Servito'} · Tocca un
                cartello per i dettagli
              </span>
              <span>OpenStreetMap</span>
            </div>

            <div className="relative h-full w-full">
              {projectedPoints.origin ? (
                <div
                  style={{
                    left: `${projectedPoints.origin.x}%`,
                    top: `${projectedPoints.origin.y}%`,
                  }}
                  title="Punto di partenza"
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                >
                  <span className="flex size-4 items-center justify-center rounded-full border-2 border-white bg-blue-600 shadow-md ring-4 ring-blue-500/25" />
                </div>
              ) : null}

              {projectedPoints.destination ? (
                <div
                  style={{
                    left: `${projectedPoints.destination.x}%`,
                    top: `${projectedPoints.destination.y}%`,
                  }}
                  title="Destinazione"
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-bold text-white shadow"
                >
                  🏁 Arrivo
                </div>
              ) : null}

              {[...projectedPoints.stations]
                .reverse()
                .map(({ station, x, y }) => {
                  const isSelected = station.id === activeStation?.id
                  const isWinner = station.rank === 1
                  const tier = getTierColors(station.rank, data.stations.length)

                  return (
                    <button
                      key={station.id}
                      type="button"
                      onClick={() => onSelectStation(station.id)}
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        backgroundColor: tier.badgeBg,
                        borderColor: tier.badgeBorder,
                        color: tier.badgeText,
                        zIndex: isWinner
                          ? 30
                          : isSelected
                            ? 25
                            : 20 - station.rank,
                      }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 px-2 py-1 text-left shadow-md transition-transform focus-visible:outline-2 focus-visible:outline-emerald-600 ${
                        isSelected
                          ? 'scale-110 ring-2 ring-emerald-500'
                          : isWinner
                            ? 'scale-105'
                            : 'hover:scale-105'
                      }`}
                    >
                      <span className="block max-w-[78px] truncate text-[9px] font-bold leading-tight">
                        {isWinner ? '★ ' : ''}#{station.rank}{' '}
                        {shortBrandLabel(station)}
                      </span>
                      <span className="block text-xs font-extrabold leading-tight">
                        <RoadSignPrice price={station.fuelPrice} />
                      </span>
                    </button>
                  )
                })}
            </div>
          </div>
        ) : null}
      </div>

      {/* Quick station selector pills */}
      <div
        aria-label="Seleziona distributore sulla mappa"
        className="flex gap-1.5 overflow-x-auto pb-1"
      >
        {data.stations.map((station) => {
          const isSelected = station.id === activeStation?.id
          return (
            <button
              key={station.id}
              type="button"
              onClick={() => onSelectStation(station.id)}
              className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm dark:border-emerald-400 dark:bg-emerald-500 dark:text-zinc-950'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-emerald-400 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-200'
              }`}
            >
              {station.rank === 1 ? '★ ' : ''}#{station.rank}{' '}
              {shortBrandLabel(station)} ·{' '}
              <RoadSignPrice price={station.fuelPrice} />
            </button>
          )
        })}
      </div>

      {/* Selected Station Detail Card */}
      {activeStation ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-800/80 dark:bg-emerald-950/30">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-md bg-emerald-700 px-2 py-0.5 text-xs font-bold text-white dark:bg-emerald-400 dark:text-emerald-950">
                  #{activeStation.rank} in classifica
                </span>
                {activeStation.brand ? (
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    {activeStation.brand}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-1 truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {activeStation.displayName}
              </h3>
              {activeStation.address || activeStation.city ? (
                <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                  {[activeStation.address, activeStation.city]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              ) : null}
            </div>

            <div className="shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-right shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                Prezzo pompa
              </p>
              <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                <RoadSignPrice price={activeStation.fuelPrice} />{' '}
                <span className="text-xs font-semibold">€/L</span>
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-white/80 p-2.5 text-xs dark:bg-zinc-900/60">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">
                Litri netti reali:
              </span>
              <p className="font-bold text-emerald-800 dark:text-emerald-300">
                {fuelLitersFormatter.format(activeStation.netFuelLiters)} L
              </p>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">
                {activeStation.distanceSummary.split(':')[0]}:
              </span>
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                {activeStation.distanceSummary.split(':')[1]?.trim() ?? ''}
              </p>
            </div>
          </div>

          {activeStation.navigationHref ? (
            <a
              href={activeStation.navigationHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex min-h-10 w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-center text-xs font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300"
            >
              {activeStation.navigationLabel}
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function HomepageRightColumn({
  defaultGuide,
}: {
  defaultGuide: ReactNode
}) {
  const resultsMap = useResultsMap()
  const [showGuideOverride, setShowGuideOverride] = useState(false)

  const hasMapResults = Boolean(
    resultsMap?.mapData && resultsMap.mapData.stations.length > 0,
  )

  if (!hasMapResults || !resultsMap?.mapData) {
    return <>{defaultGuide}</>
  }

  if (showGuideOverride) {
    return (
      <div className="flex min-w-0 flex-col gap-3 lg:min-h-0 lg:overflow-y-auto">
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 dark:border-emerald-800 dark:bg-emerald-950/40">
          <span className="text-xs font-medium text-emerald-900 dark:text-emerald-200">
            Mappa dei distributori pronta
          </span>
          <button
            type="button"
            onClick={() => setShowGuideOverride(false)}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-400 dark:text-emerald-950"
          >
            Torna alla mappa
          </button>
        </div>
        {defaultGuide}
      </div>
    )
  }

  return (
    <section
      aria-labelledby="homepage-map-title"
      tabIndex={0}
      className="flex min-w-0 flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:p-5 lg:min-h-0 lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-y-contain dark:border-zinc-800 dark:bg-zinc-900/40 dark:focus-visible:outline-emerald-400"
    >
      <StationsResultMap
        data={resultsMap.mapData}
        selectedStationId={resultsMap.selectedStationId}
        onSelectStation={resultsMap.setSelectedStationId}
      />

      <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        <span>Classifica ordinata per litri netti reali</span>
        <button
          type="button"
          onClick={() => setShowGuideOverride(true)}
          className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800 dark:text-emerald-400"
        >
          Come calcoliamo la convenienza?
        </button>
      </div>
    </section>
  )
}
