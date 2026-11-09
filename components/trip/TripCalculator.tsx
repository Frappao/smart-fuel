'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'

import {
  fetchTripStations,
  type Coordinates,
  type GeocodingResult,
} from '../../lib/api/rifornioApiClient'
import { getStationDisplayName } from '../../lib/calculation/rankNearbyStations'
import type { RankedRouteStationResult } from '../../lib/calculation/rankStationsAlongRoute'
import { SUPPORTED_FUEL_TYPE_LABELS } from '../../lib/fuels/supportedFuelTypes'
import { getCurrentPosition } from '../../lib/location/getCurrentPosition'
import AdSlot from '../ads/AdSlot'
import RefuelForm, {
  type RefuelCalculationInput,
} from '../calculation/RefuelForm'
import { RoadSignPrice } from '../calculation/RoadSignPrice'
import { useResultsMap } from '../map/ResultsMapContext'
import { StationsResultMap } from '../map/StationsResultMap'
import ShareResultButtons from '../share/ShareResultButtons'
import { AppBetaInlineOffer } from '../mobile-promo/AppBetaModal'
import AddressSearchField from './AddressSearchField'

type OriginMode = 'current' | 'custom'

const distanceFormatter = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
const litersFormatter = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function toCoordinates(location: GeocodingResult): Coordinates {
  return {
    latitude: location.latitude,
    longitude: location.longitude,
  }
}

function getTripNavigationUrl(
  origin: Coordinates,
  destination: Coordinates,
  station: Coordinates,
): string {
  const url = new URL('https://www.google.com/maps/dir/')
  url.searchParams.set('api', '1')
  url.searchParams.set('origin', `${origin.latitude},${origin.longitude}`)
  url.searchParams.set(
    'destination',
    `${destination.latitude},${destination.longitude}`,
  )
  url.searchParams.set('waypoints', `${station.latitude},${station.longitude}`)
  url.searchParams.set('travelmode', 'driving')

  return url.toString()
}

interface TripResultCardProps {
  result: RankedRouteStationResult
  index: number
  origin: Coordinates
  destination: Coordinates
  onSelectOnMap?: (stationId: number) => void
  isSelectedOnMap?: boolean
  refuelAmount?: number
  fuelType?: string
  isSelf?: boolean
  mobileMap?: React.ReactNode
  showAllToggle?: React.ReactNode
  isMobileHidden?: boolean
}

function TripResultCard({
  result,
  index,
  origin,
  destination,
  onSelectOnMap,
  isSelectedOnMap,
  refuelAmount = 50,
  fuelType = 'Benzina',
  isSelf = true,
  mobileMap,
  showAllToggle,
  isMobileHidden = false,
}: TripResultCardProps) {
  const isWinner = index === 0
  const stationName = getStationDisplayName(result.station)
  const navigationUrl = getTripNavigationUrl(origin, destination, {
    latitude: result.station.latitude,
    longitude: result.station.longitude,
  })

  const cardClasses = isWinner
    ? isSelectedOnMap
      ? 'min-w-0 break-words rounded-3xl border-2 border-emerald-500 bg-zinc-900/95 p-5 sm:p-6 shadow-2xl ring-2 ring-emerald-500/50 cursor-pointer transition-all duration-150 active:scale-[0.99] shadow-emerald-500/15'
      : 'min-w-0 break-words rounded-3xl border-2 border-emerald-500/80 bg-zinc-900/90 p-5 sm:p-6 shadow-2xl ring-1 ring-emerald-500/30 cursor-pointer transition-all duration-150 active:scale-[0.99] hover:border-emerald-400 shadow-emerald-500/10'
    : isSelectedOnMap
      ? 'min-w-0 break-words rounded-2xl border-2 border-emerald-500 bg-zinc-900/80 p-4 sm:p-5 shadow-lg ring-1 ring-emerald-500/50 transition-all duration-150 cursor-pointer active:scale-[0.99]'
      : 'min-w-0 break-words rounded-2xl border border-zinc-800/80 bg-zinc-900/50 md:backdrop-blur-md p-4 sm:p-5 transition-all duration-150 hover:border-zinc-700 hover:bg-zinc-900/70 active:scale-[0.99] cursor-pointer'

  return (
    <li
      onClick={onSelectOnMap ? () => onSelectOnMap(result.station.id) : undefined}
      className={isMobileHidden ? `${cardClasses} hidden lg:block` : cardClasses}
    >
      {isWinner ? (
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Migliore lungo questo percorso
          </span>
        </div>
      ) : null}
      <h3 className={isWinner ? 'mt-2.5 text-xl sm:text-2xl font-bold tracking-tight text-zinc-50' : 'font-semibold text-zinc-100 text-base'}>
        {index + 1}. {stationName}
      </h3>

      {/* Unified clean 3-stat hero grid */}
      <div className="mt-3.5 grid grid-cols-3 gap-2 sm:gap-3 text-left">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-2.5 sm:p-3 shadow-inner">
          <p className="text-[11px] sm:text-xs font-medium text-zinc-400">Prezzo</p>
          <p className="mt-0.5 text-sm sm:text-base font-bold text-zinc-100 tabular-nums">
            <RoadSignPrice price={result.station.fuelPrice} /> <span className="text-[11px] sm:text-xs font-normal text-zinc-400">€/L</span>
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-2.5 sm:p-3 shadow-inner">
          <p className="text-[11px] sm:text-xs font-medium text-zinc-400">Deviazione</p>
          <p className="mt-0.5 text-sm sm:text-base font-bold text-zinc-100 tabular-nums">
            +{distanceFormatter.format(result.detourDistanceMeters / 1_000)} <span className="text-[11px] sm:text-xs font-normal text-zinc-400">km</span>
          </p>
        </div>
        <div
          className={
            isWinner
              ? 'rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-2.5 sm:p-3 shadow-sm shadow-emerald-500/10'
              : 'rounded-2xl border border-zinc-800 bg-zinc-950/80 p-2.5 sm:p-3 shadow-inner'
          }
        >
          <p
            className={
              isWinner
                ? 'text-[11px] sm:text-xs font-bold text-emerald-300'
                : 'text-[11px] sm:text-xs font-medium text-zinc-400'
            }
          >
            Litri netti
          </p>
          <p
            className={
              isWinner
                ? 'mt-0.5 text-sm sm:text-base font-extrabold text-emerald-300 tabular-nums'
                : 'mt-0.5 text-sm sm:text-base font-bold text-zinc-100 tabular-nums'
            }
          >
            {litersFormatter.format(result.netFuelLiters)}{' '}
            <span
              className={
                isWinner
                  ? 'text-[11px] sm:text-xs font-normal text-emerald-300/80'
                  : 'text-[11px] sm:text-xs font-normal text-zinc-400'
              }
            >
              L
            </span>
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <a
          className={
            isWinner
              ? 'inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-md shadow-emerald-500/20 transition active:scale-[0.98] sm:w-auto'
              : 'inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800 hover:text-white active:scale-[0.98] sm:w-auto'
          }
          href={navigationUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Apri percorso con questa sosta
        </a>
      </div>

      {/* Mappa in primo piano subito dopo l'azione principale */}
      {isWinner && mobileMap ? (
        <div className="mt-4 pt-3 border-t border-emerald-200/80 dark:border-emerald-800/80 lg:hidden" onClick={(e) => e.stopPropagation()}>
          {mobileMap}
        </div>
      ) : null}

      {/* Dettagli tecnici secondari ordinati in disclosure discreta */}
      <details className="group mt-3 rounded-lg border border-zinc-200/60 bg-white/60 p-2.5 text-xs text-zinc-600 dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:text-zinc-400">
        <summary className="flex cursor-pointer list-none items-center justify-between font-medium select-none text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300">
          <span>Dettagli del calcolo</span>
          <span className="text-[10px] text-zinc-400 group-open:rotate-180 transition-transform">▾</span>
        </summary>
        <div className="mt-2 space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <p className="tabular-nums">
            Prezzo: <RoadSignPrice price={result.station.fuelPrice} /> €/L
          </p>
          <p className="tabular-nums">
            Deviazione aggiuntiva:{' '}
            {distanceFormatter.format(result.detourDistanceMeters / 1_000)} km
          </p>
          <p className="tabular-nums">
            Carburante per la deviazione:{' '}
            {litersFormatter.format(result.detourFuelLiters)} L
          </p>
          <p className="tabular-nums">
            Litri acquistati: {litersFormatter.format(result.litersPurchased)} L
          </p>
          <p className="font-semibold tabular-nums">
            Litri netti: {litersFormatter.format(result.netFuelLiters)} L
          </p>
        </div>
      </details>

      {isWinner ? (
        <ShareResultButtons
          stationName={stationName}
          brand={result.station.brand}
          city={result.station.city}
          fuelPrice={result.station.fuelPrice}
          netFuelLiters={result.netFuelLiters}
          fuelType={fuelType}
          isSelf={isSelf}
          refuelAmount={refuelAmount}
        />
      ) : null}

      {isWinner && showAllToggle ? (
        <div className="mt-3 lg:hidden" onClick={(e) => e.stopPropagation()}>
          {showAllToggle}
        </div>
      ) : null}
    </li>
  )
}

export default function TripCalculator() {
  const calculationInFlight = useRef(false)
  const resultsRef = useRef<HTMLOListElement>(null)
  const resultsMap = useResultsMap()
  const [originMode, setOriginMode] = useState<OriginMode>('current')
  const [customOrigin, setCustomOrigin] = useState<GeocodingResult | null>(null)
  const [destination, setDestination] = useState<GeocodingResult | null>(null)
  const [lastCalculationInput, setLastCalculationInput] =
    useState<RefuelCalculationInput | null>(null)
  const [results, setResults] = useState<RankedRouteStationResult[]>([])
  const [journeyCoordinates, setJourneyCoordinates] = useState<{
    origin: Coordinates
    destination: Coordinates
  } | null>(null)
  const [baseRouteDistanceMeters, setBaseRouteDistanceMeters] = useState<
    number | null
  >(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showAllMobileResults, setShowAllMobileResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emptyState, setEmptyState] = useState<string | null>(null)

  const setMapData = resultsMap?.setMapData

  useEffect(() => {
    if (!setMapData) return

    if (results.length === 0 || !journeyCoordinates) {
      setMapData(null)
      return
    }

    setMapData({
      mode: 'trip',
      fuelType: lastCalculationInput
        ? SUPPORTED_FUEL_TYPE_LABELS[lastCalculationInput.fuelType]
        : 'Benzina',
      isSelf: lastCalculationInput?.isSelf ?? true,
      origin: journeyCoordinates.origin,
      destination: journeyCoordinates.destination,
      stations: results.map((result, idx) => {
        const detourKm = result.detourDistanceMeters / 1_000
        return {
          id: result.station.id,
          rank: idx + 1,
          displayName: getStationDisplayName(result.station),
          brand: result.station.brand,
          address: result.station.address,
          city: result.station.city,
          latitude: result.station.latitude,
          longitude: result.station.longitude,
          fuelPrice: result.station.fuelPrice,
          netFuelLiters: result.netFuelLiters,
          travelDistanceKm: detourKm,
          travelFuelLiters: result.detourFuelLiters,
          navigationHref: getTripNavigationUrl(
            journeyCoordinates.origin,
            journeyCoordinates.destination,
            {
              latitude: result.station.latitude,
              longitude: result.station.longitude,
            },
          ),
          navigationLabel: 'Apri percorso con questa sosta',
          distanceSummary: `Deviazione: ${distanceFormatter.format(detourKm)} km`,
        }
      }),
    })
  }, [results, journeyCoordinates, lastCalculationInput, setMapData])

  useEffect(() => {
    return () => {
      setMapData?.(null)
    }
  }, [setMapData])

  useEffect(() => {
    if (results.length > 0 && !isLoading) {
      const timer = setTimeout(() => {
        if (typeof resultsRef.current?.scrollIntoView === 'function') {
          resultsRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [results, isLoading])

  function clearCalculatedJourney() {
    setResults([])
    setJourneyCoordinates(null)
    setBaseRouteDistanceMeters(null)
    setEmptyState(null)
  }

  async function handleCalculate(values: RefuelCalculationInput) {
    if (calculationInFlight.current) return

    if (!destination) {
      setError('Cerca e seleziona una destinazione.')
      return
    }

    if (originMode === 'custom' && !customOrigin) {
      setError('Cerca e seleziona una località di partenza.')
      return
    }

    calculationInFlight.current = true
    setLastCalculationInput(values)
    setShowAllMobileResults(false)
    setIsLoading(true)
    setError(null)
    setEmptyState(null)
    setResults([])
    setJourneyCoordinates(null)
    setBaseRouteDistanceMeters(null)

    try {
      let origin: Coordinates

      if (originMode === 'current') {
        const currentPosition = await getCurrentPosition()
        origin = {
          latitude: currentPosition.latitude,
          longitude: currentPosition.longitude,
        }
      } else {
        origin = toCoordinates(customOrigin!)
      }

      const destinationCoordinates = toCoordinates(destination)
      const response = await fetchTripStations({
        origin,
        destination: destinationCoordinates,
        ...values,
      })

      setJourneyCoordinates({ origin, destination: destinationCoordinates })
      setBaseRouteDistanceMeters(response.baseRouteDistanceMeters)
      setResults(response.results)

      if (response.results.length === 0) {
        setEmptyState(
          'Non ho trovato distributori compatibili lungo questo percorso.',
        )
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Non è stato possibile calcolare questo viaggio.',
      )
    } finally {
      calculationInFlight.current = false
      setIsLoading(false)
    }
  }

  return (
    <section className="flex min-w-0 flex-col gap-6 sm:gap-8">
      <AdSlot />
      <RefuelForm
        isLoading={isLoading}
        loadingLabel="Calcolo percorso…"
        locationMessage="Gli indirizzi e, se scelta, la posizione attuale servono solo a calcolare il percorso richiesto."
        onCalculate={handleCalculate}
        submitLabel="Trova distributore sul percorso"
        title="Pianifica il viaggio"
      >
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Partenza</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="relative flex cursor-pointer select-none items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm font-medium transition-all duration-150 has-checked:border-emerald-600 has-checked:bg-emerald-50 has-checked:text-emerald-900 has-checked:shadow-xs active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-300 dark:hover:border-zinc-700 dark:has-checked:border-emerald-500/80 dark:has-checked:bg-emerald-500/15 dark:has-checked:text-emerald-300">
              <input
                checked={originMode === 'current'}
                disabled={isLoading}
                name="origin-mode"
                type="radio"
                className="size-4 accent-emerald-600 dark:accent-emerald-400"
                onChange={() => {
                  setOriginMode('current')
                  setCustomOrigin(null)
                  setError(null)
                  clearCalculatedJourney()
                }}
              />
              <span>Usa la mia posizione attuale</span>
            </label>
            <label className="relative flex cursor-pointer select-none items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm font-medium transition-all duration-150 has-checked:border-emerald-600 has-checked:bg-emerald-50 has-checked:text-emerald-900 has-checked:shadow-xs active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-300 dark:hover:border-zinc-700 dark:has-checked:border-emerald-500/80 dark:has-checked:bg-emerald-500/15 dark:has-checked:text-emerald-300">
              <input
                checked={originMode === 'custom'}
                disabled={isLoading}
                name="origin-mode"
                type="radio"
                className="size-4 accent-emerald-600 dark:accent-emerald-400"
                onChange={() => {
                  setOriginMode('custom')
                  setError(null)
                  clearCalculatedJourney()
                }}
              />
              <span>Scegli un&apos;altra partenza</span>
            </label>
          </div>
        </fieldset>

        {originMode === 'custom' ? (
          <AddressSearchField
            disabled={isLoading}
            id="trip-origin"
            label="Località di partenza"
            onSelect={(result) => {
              setCustomOrigin(result)
              setError(null)
              clearCalculatedJourney()
            }}
          />
        ) : null}
        <AddressSearchField
          disabled={isLoading}
          id="trip-destination"
          label="Destinazione"
          onSelect={(result) => {
            setDestination(result)
            setError(null)
            clearCalculatedJourney()
          }}
        />
      </RefuelForm>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <p
            aria-live="polite"
            className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-medium leading-6 text-emerald-900 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-200"
          >
            <svg aria-hidden="true" className="size-4 animate-spin shrink-0 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span>Sto cercando i distributori migliori lungo il percorso...</span>
          </p>
          <div className="rounded-2xl border-2 border-dashed border-emerald-300/80 bg-emerald-50/40 p-5 space-y-3.5 animate-pulse dark:border-emerald-800/60 dark:bg-emerald-950/20">
            <div className="h-3.5 w-44 rounded bg-emerald-200/80 dark:bg-emerald-800/60" />
            <div className="h-6 w-3/5 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="h-4 rounded bg-zinc-200/80 dark:bg-zinc-800/80" />
              <div className="h-4 rounded bg-zinc-200/80 dark:bg-zinc-800/80" />
            </div>
          </div>
        </div>
      ) : null}
      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {!isLoading && !error && emptyState ? (
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          {emptyState}
        </p>
      ) : null}
      {baseRouteDistanceMeters !== null ? (
        <p className="text-sm font-medium text-zinc-600 tabular-nums dark:text-zinc-400">
          Percorso base stimato:{' '}
          {distanceFormatter.format(baseRouteDistanceMeters / 1_000)} km
        </p>
      ) : null}
      {results.length > 0 && journeyCoordinates ? (
        <motion.ol
          ref={resultsRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="grid gap-4 scroll-mt-6"
        >
          {results.map((result, index) => (
            <TripResultCard
              destination={journeyCoordinates.destination}
              fuelType={
                lastCalculationInput
                  ? SUPPORTED_FUEL_TYPE_LABELS[lastCalculationInput.fuelType]
                  : 'Benzina'
              }
              index={index}
              isSelf={lastCalculationInput?.isSelf ?? true}
              isSelectedOnMap={
                resultsMap?.selectedStationId === result.station.id
              }
              key={result.station.id}
              onSelectOnMap={resultsMap?.setSelectedStationId}
              origin={journeyCoordinates.origin}
              refuelAmount={lastCalculationInput?.refuelAmount ?? 50}
              result={result}
              isMobileHidden={index > 0 && !showAllMobileResults}
              mobileMap={
                index === 0 && resultsMap?.mapData ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      <span className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        Mappa distributori sul percorso
                      </span>
                      <span className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                        Tocca per selezionare
                      </span>
                    </div>
                    <StationsResultMap
                      embedded
                      data={resultsMap.mapData}
                      selectedStationId={resultsMap.selectedStationId}
                      onSelectStation={resultsMap.setSelectedStationId}
                    />
                  </div>
                ) : null
              }
              showAllToggle={
                index === 0 && results.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setShowAllMobileResults(!showAllMobileResults)}
                    className="flex min-h-12 w-full items-center justify-between rounded-xl border border-emerald-600/40 bg-emerald-50/80 px-4 py-3 text-xs font-semibold text-emerald-950 shadow-2xs transition active:scale-[0.99] hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">⛽</span>
                      <span>
                        {showAllMobileResults
                          ? 'Nascondi gli altri distributori'
                          : `Vedi gli altri ${results.length - 1} distributori lungo il percorso`}
                      </span>
                    </span>
                    <span className="rounded-md bg-emerald-200/80 px-2.5 py-1 text-[11px] font-bold text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100">
                      {showAllMobileResults ? '▲ Chiudi' : '▼ Mostra tutti'}
                    </span>
                  </button>
                ) : null
              }
            />
          ))}
        </motion.ol>
      ) : null}
      {results.length > 0 && !isLoading ? <AppBetaInlineOffer /> : null}
    </section>
  )
}
