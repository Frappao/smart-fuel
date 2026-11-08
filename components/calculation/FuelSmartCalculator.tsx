'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'motion/react'

import {
  fetchNearbyStations,
  fetchRouteMatrix,
} from '../../lib/api/rifornioApiClient'
import {
  getStationDisplayName,
  rankNearbyStations,
  selectNearbyCandidates,
  type RankedStationResult,
} from '../../lib/calculation/rankNearbyStations'
import { SUPPORTED_FUEL_TYPE_LABELS } from '../../lib/fuels/supportedFuelTypes'
import {
  formatStationLocation,
  toDisplayCase,
} from '../../lib/stations/formatStationText'
import { getCurrentPosition } from '../../lib/location/getCurrentPosition'
import AdSlot from '../ads/AdSlot'
import { useResultsMap, type MapCoordinates } from '../map/ResultsMapContext'
import { StationsResultMap } from '../map/StationsResultMap'
import ShareResultButtons from '../share/ShareResultButtons'
import RefuelForm, { type RefuelCalculationInput } from './RefuelForm'
import { RoadSignPrice } from './RoadSignPrice'

const distanceFormatter = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const litersFormatter = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const euroFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const rankedResultsLimit = 10

function haveEquivalentDisplayedNetFuelLiters(
  first: RankedStationResult,
  second: RankedStationResult,
): boolean {
  return (
    litersFormatter.format(first.netFuelLiters) ===
    litersFormatter.format(second.netFuelLiters)
  )
}

function compareRankedResults(
  first: RankedStationResult,
  second: RankedStationResult,
): number {
  const netFuelLitersDifference =
    second.netFuelLiters - first.netFuelLiters

  if (!haveEquivalentDisplayedNetFuelLiters(first, second)) {
    return netFuelLitersDifference
  }

  return (
    first.routeDistanceMeters - second.routeDistanceMeters ||
    netFuelLitersDifference
  )
}

const priceCommunicatedAtFormatter = new Intl.DateTimeFormat('it-IT', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Europe/Rome',
})

const searchErrorMessage =
  'Non riesco a cercare i distributori in questo momento. Riprova tra poco.'
const routeDistanceErrorMessage =
  'Non riesco a calcolare le distanze stradali in questo momento. Riprova tra poco.'
const noValidRoutesMessage =
  'Ho trovato dei distributori, ma non posso confrontarli perché le distanze stradali non sono disponibili.'

function getNoCandidatesMessage(
  fuelType: RefuelCalculationInput['fuelType'],
  isSelf: boolean,
): string {
  const serviceModeLabel = isSelf ? 'Self' : 'Servito'

  return `Non ho trovato distributori vicini con ${SUPPORTED_FUEL_TYPE_LABELS[fuelType]} ${serviceModeLabel} disponibile.`
}

function formatPriceCommunicatedAt(value: string | null): string | null {
  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? null
    : priceCommunicatedAtFormatter.format(date)
}

function getGoogleMapsNavigationUrl(
  latitude: number,
  longitude: number,
): string | null {
  if (
    typeof latitude !== 'number' ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== 'number' ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null
  }

  const navigationUrl = new URL('https://www.google.com/maps/dir/')
  navigationUrl.searchParams.set('api', '1')
  navigationUrl.searchParams.set('destination', `${latitude},${longitude}`)
  navigationUrl.searchParams.set('travelmode', 'driving')
  navigationUrl.searchParams.set('dir_action', 'navigate')

  return navigationUrl.toString()
}

interface StationResultCardProps {
  result: RankedStationResult
  index: number
  winnerAdvantageLiters: number | null
  winnerNetFuelLiters?: number
  onSelectOnMap?: (stationId: number) => void
  isSelectedOnMap?: boolean
  mobileMap?: React.ReactNode
  showAllToggle?: React.ReactNode
}

function StationIdentity({
  result,
  stationName,
}: {
  result: RankedStationResult
  stationName: string
}) {
  const brand = toDisplayCase(result.station.brand?.trim() || null)
  const showBrand =
    brand !== null &&
    !stationName.toLocaleLowerCase('it-IT').includes(brand.toLocaleLowerCase('it-IT'))
  const location = formatStationLocation(
    result.station.address,
    result.station.city,
  )

  if (!showBrand && !location) {
    return null
  }

  return (
    <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-zinc-400">
      {showBrand ? (
        <span className="shrink-0 rounded-md border border-zinc-700/80 bg-zinc-800/70 px-1.5 py-0.5 font-semibold text-zinc-200">
          {brand}
        </span>
      ) : null}
      {location ? <span className="truncate">{location}</span> : null}
    </p>
  )
}

function CalculationDetails({
  result,
  travelDistanceKm,
  compact = false,
}: {
  result: RankedStationResult
  travelDistanceKm: number
  compact?: boolean
}) {
  const formattedPriceCommunicatedAt = formatPriceCommunicatedAt(
    result.station.communicatedAt,
  )

  return (
    <details
      className={
        compact
          ? 'group mt-2 text-xs text-zinc-300'
          : 'group mt-3 rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5 text-xs text-zinc-300'
      }
      onClick={(event) => event.stopPropagation()}
    >
      <summary
        className={
          compact
            ? 'inline-flex cursor-pointer list-none items-center gap-1 py-1 font-medium select-none text-zinc-400 hover:text-zinc-100'
            : 'flex cursor-pointer list-none items-center justify-between font-medium select-none text-zinc-300 hover:text-zinc-100'
        }
      >
        <span>Dettagli del calcolo</span>
        <span aria-hidden="true" className="text-[10px] text-zinc-400 transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="mt-2 space-y-1 border-t border-zinc-800 pt-2 text-zinc-400">
        <p className="tabular-nums">
          Distanza stradale stimata A/R: {distanceFormatter.format(travelDistanceKm)} km
        </p>
        <p className="tabular-nums">
          Prezzo: <RoadSignPrice price={result.station.fuelPrice} /> €/L
        </p>
        <p className="tabular-nums">
          Litri acquistati: {litersFormatter.format(result.litersPurchased)} L
        </p>
        <p className="tabular-nums">
          Litri stimati consumati per il viaggio: {litersFormatter.format(result.travelFuelLiters)} L
        </p>
        <p className="tabular-nums">
          Litri netti: {litersFormatter.format(result.netFuelLiters)} L
        </p>
        <p>
          {formattedPriceCommunicatedAt
            ? `Prezzo comunicato: ${formattedPriceCommunicatedAt}`
            : 'Data prezzo non disponibile'}
        </p>
      </div>
    </details>
  )
}

function StationResultCard({
  result,
  index,
  winnerAdvantageLiters,
  winnerNetFuelLiters,
  onSelectOnMap,
  isSelectedOnMap,
  mobileMap,
  showAllToggle,
}: StationResultCardProps) {
  const stationName = getStationDisplayName(result.station)
  const travelDistanceKm = (result.routeDistanceMeters / 1_000) * 2
  const isBestResult = index === 0
  const navigationUrl = getGoogleMapsNavigationUrl(
    result.station.latitude,
    result.station.longitude,
  )

  if (!isBestResult) {
    const litersBehindWinner =
      winnerNetFuelLiters === undefined
        ? null
        : Math.max(0, winnerNetFuelLiters - result.netFuelLiters)

    return (
      <li
        onClick={onSelectOnMap ? () => onSelectOnMap(result.station.id) : undefined}
        className={`min-w-0 cursor-pointer rounded-2xl border px-3.5 py-3 transition-colors duration-150 sm:px-4 ${
          isSelectedOnMap
            ? 'border-emerald-500/80 bg-zinc-900/90 ring-1 ring-emerald-500/40'
            : 'border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900/70'
        }`}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-zinc-100 sm:text-base">
              {index + 1}. {stationName}
            </h3>
            <StationIdentity result={result} stationName={stationName} />
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-zinc-100 tabular-nums">
              {litersFormatter.format(result.netFuelLiters)}{' '}
              <span className="text-xs font-normal text-zinc-400">L netti</span>
            </p>
            {litersBehindWinner !== null ? (
              <p className="text-xs font-medium text-amber-300/90 tabular-nums">
                −{litersFormatter.format(litersBehindWinner)} L dal 1°
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 tabular-nums">
          <span>
            <RoadSignPrice price={result.station.fuelPrice} /> €/L
          </span>
          <span>{distanceFormatter.format(travelDistanceKm)} km A/R</span>
          {navigationUrl ? (
            <a
              className="ml-auto inline-flex min-h-9 items-center rounded-lg border border-zinc-700/80 bg-zinc-900 px-3 font-semibold text-zinc-100 transition hover:border-zinc-600 hover:bg-zinc-800"
              href={navigationUrl}
              onClick={(event) => event.stopPropagation()}
              rel="noopener noreferrer"
              target="_blank"
            >
              Apri nel navigatore
            </a>
          ) : null}
        </div>

        <CalculationDetails
          compact
          result={result}
          travelDistanceKm={travelDistanceKm}
        />
      </li>
    )
  }

  const cardClasses = isSelectedOnMap
    ? 'min-w-0 break-words rounded-3xl border-2 border-emerald-500 bg-zinc-900/95 p-5 sm:p-6 shadow-2xl ring-2 ring-emerald-500/50 cursor-pointer transition-all duration-150 active:scale-[0.99] shadow-emerald-500/15'
    : 'min-w-0 break-words rounded-3xl border-2 border-emerald-500/80 bg-zinc-900/90 p-5 sm:p-6 shadow-2xl ring-1 ring-emerald-500/30 cursor-pointer transition-all duration-150 active:scale-[0.99] hover:border-emerald-400 shadow-emerald-500/10'

  return (
    <li
      onClick={onSelectOnMap ? () => onSelectOnMap(result.station.id) : undefined}
      className={cardClasses}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Ti conviene questo distributore
        </span>
      </div>
      <h3 className="mt-2.5 text-xl sm:text-2xl font-bold tracking-tight text-zinc-50">
        {index + 1}. {stationName}
      </h3>
      <StationIdentity result={result} stationName={stationName} />

      <div className="mt-3.5 grid grid-cols-3 gap-2 sm:gap-3 text-left">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-2.5 sm:p-3 shadow-inner">
          <p className="text-[11px] sm:text-xs font-medium text-zinc-400">Prezzo</p>
          <p className="mt-0.5 text-sm sm:text-base font-bold text-zinc-100 tabular-nums">
            <RoadSignPrice price={result.station.fuelPrice} /> <span className="text-[11px] sm:text-xs font-normal text-zinc-400">€/L</span>
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-2.5 sm:p-3 shadow-inner">
          <p className="text-[11px] sm:text-xs font-medium text-zinc-400">Distanza A/R</p>
          <p className="mt-0.5 text-sm sm:text-base font-bold text-zinc-100 tabular-nums">
            {distanceFormatter.format(travelDistanceKm)} <span className="text-[11px] sm:text-xs font-normal text-zinc-400">km</span>
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/15 p-2.5 sm:p-3 shadow-sm shadow-emerald-500/10">
          <p className="text-[11px] sm:text-xs font-bold text-emerald-300">Litri netti</p>
          <p className="mt-0.5 text-sm sm:text-base font-extrabold text-emerald-300 tabular-nums">
            {litersFormatter.format(result.netFuelLiters)}{' '}
            <span className="text-[11px] sm:text-xs font-normal text-emerald-300/80">L</span>
          </p>
        </div>
      </div>

      {winnerAdvantageLiters !== null ? (
        <p className="mt-2.5 text-xs font-semibold text-emerald-300 tabular-nums">
          Hai circa {litersFormatter.format(winnerAdvantageLiters)} L netti in più rispetto al secondo classificato
          {' '}(≈ {euroFormatter.format(winnerAdvantageLiters * result.station.fuelPrice)} di carburante).
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        {navigationUrl ? (
          <a
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-md shadow-emerald-500/20 transition active:scale-[0.98] sm:w-auto"
            href={navigationUrl}
            onClick={(event) => event.stopPropagation()}
            rel="noopener noreferrer"
            target="_blank"
          >
            Apri nel navigatore
          </a>
        ) : null}
      </div>

      {/* Mappa in primo piano subito dopo l'azione principale */}
      {mobileMap ? (
        <div className="mt-4 pt-3 border-t border-emerald-800/60 lg:hidden" onClick={(e) => e.stopPropagation()}>
          {mobileMap}
        </div>
      ) : null}

      <CalculationDetails result={result} travelDistanceKm={travelDistanceKm} />

      {showAllToggle ? (
        <div className="mt-3 lg:hidden" onClick={(e) => e.stopPropagation()}>
          {showAllToggle}
        </div>
      ) : null}
    </li>
  )
}

export default function FuelSmartCalculator() {
  const calculationInFlight = useRef(false)
  const resultsRef = useRef<HTMLDivElement>(null)
  const resultsMap = useResultsMap()
  const [calculationInput, setCalculationInput] =
    useState<RefuelCalculationInput | null>(null)
  const [originCoords, setOriginCoords] = useState<MapCoordinates | null>(null)
  const [results, setResults] = useState<RankedStationResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAllMobileResults, setShowAllMobileResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null)
  const winnerAdvantageLiters =
    results.length >= 2 &&
    !haveEquivalentDisplayedNetFuelLiters(results[0], results[1])
      ? results[0].netFuelLiters - results[1].netFuelLiters
      : null

  const setMapData = resultsMap?.setMapData

  useEffect(() => {
    if (!setMapData) return

    if (results.length === 0) {
      setMapData(null)
      return
    }

    setMapData({
      mode: 'nearby',
      fuelType: calculationInput
        ? SUPPORTED_FUEL_TYPE_LABELS[calculationInput.fuelType]
        : 'Benzina',
      isSelf: calculationInput?.isSelf ?? true,
      origin: originCoords,
      stations: results.map((result, idx) => {
        const travelKm = (result.routeDistanceMeters / 1_000) * 2
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
          travelDistanceKm: travelKm,
          travelFuelLiters: result.travelFuelLiters,
          navigationHref: getGoogleMapsNavigationUrl(
            result.station.latitude,
            result.station.longitude,
          ),
          navigationLabel: 'Apri nel navigatore',
          distanceSummary: `Distanza A/R: ${distanceFormatter.format(travelKm)} km`,
        }
      }),
    })
  }, [results, originCoords, calculationInput, setMapData])

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

  async function handleCalculate(values: RefuelCalculationInput) {
    if (calculationInFlight.current) return
    calculationInFlight.current = true
    setCalculationInput(values)
    setShowAllMobileResults(false)
    setResults([])
    setError(null)
    setEmptyStateMessage(null)
    setIsLoading(true)

    try {
      const position = await getCurrentPosition()
      setOriginCoords({
        latitude: position.latitude,
        longitude: position.longitude,
      })
      let nearbyStationsResponse

      try {
        nearbyStationsResponse = await fetchNearbyStations({
          latitude: position.latitude,
          longitude: position.longitude,
          radius: 15_000,
          limit: 20,
          fuelType: values.fuelType,
          isSelf: values.isSelf,
        })
      } catch {
        throw new Error(searchErrorMessage)
      }

      const candidateStations = selectNearbyCandidates(
        nearbyStationsResponse.stations,
      )
      let routeMatrixRoutes: unknown[] = []

      if (candidateStations.length > 0) {
        let routeMatrixResponse

        try {
          routeMatrixResponse = await fetchRouteMatrix({
            origin: {
              latitude: position.latitude,
              longitude: position.longitude,
            },
            destinations: candidateStations.map((station) => ({
              latitude: station.latitude,
              longitude: station.longitude,
            })),
          })
        } catch {
          throw new Error(routeDistanceErrorMessage)
        }

        routeMatrixRoutes = routeMatrixResponse.routes
      } else {
        setEmptyStateMessage(
          getNoCandidatesMessage(values.fuelType, values.isSelf),
        )
      }

      const rankedResults = rankNearbyStations({
        candidates: candidateStations,
        routes: routeMatrixRoutes,
        refuelAmount: values.refuelAmount,
        consumptionLitersPer100Km: values.consumptionLitersPer100Km,
        limit: candidateStations.length,
      })
        .sort(compareRankedResults)
        .slice(0, rankedResultsLimit)

      if (candidateStations.length > 0 && rankedResults.length === 0) {
        setEmptyStateMessage(noValidRoutesMessage)
      }

      setResults(rankedResults)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Non è stato possibile calcolare la convenienza.',
      )
    } finally {
      calculationInFlight.current = false
      setIsLoading(false)
    }
  }

  return (
    <section className="flex min-w-0 flex-col gap-6 sm:gap-8">
      <AdSlot />

      <RefuelForm onCalculate={handleCalculate} isLoading={isLoading} />

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
            <span>Sto cercando i distributori più convenienti...</span>
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
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {!isLoading &&
      !error &&
      calculationInput &&
      results.length === 0 &&
      emptyStateMessage ? (
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          {emptyStateMessage}
        </p>
      ) : null}

      {results.length > 0 ? (
        <motion.div
          ref={resultsRef}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="flex min-w-0 flex-col gap-3 sm:gap-4 scroll-mt-6"
        >
          <ol>
            <StationResultCard
              index={0}
              isSelectedOnMap={
                resultsMap?.selectedStationId === results[0].station.id
              }
              onSelectOnMap={resultsMap?.setSelectedStationId}
              result={results[0]}
              winnerAdvantageLiters={winnerAdvantageLiters}
              mobileMap={
                resultsMap?.mapData ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      <span className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        Mappa completa dei distributori
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
                results.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setShowAllMobileResults(!showAllMobileResults)}
                    aria-expanded={showAllMobileResults}
                    className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-zinc-700/80 bg-zinc-900 px-4 py-3 text-left text-sm font-semibold text-zinc-100 transition active:scale-[0.99] hover:bg-zinc-800"
                  >
                    <span className="flex items-center gap-2">
                      <span>
                        {showAllMobileResults
                          ? 'Nascondi gli altri distributori'
                          : `Vedi gli altri ${results.length - 1} distributori in classifica`}
                      </span>
                    </span>
                    <span aria-hidden="true" className={`text-emerald-400 transition-transform ${showAllMobileResults ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  </button>
                ) : null
              }
            />
          </ol>

          {results.length > 1 ? (
            <ol
              aria-label="Altri distributori in classifica"
              className={`min-w-0 flex-col gap-2.5 ${
                showAllMobileResults ? 'flex' : 'hidden lg:flex'
              }`}
              start={2}
            >
              {results.slice(1).map((result, index) => (
                <StationResultCard
                  index={index + 1}
                  isSelectedOnMap={
                    resultsMap?.selectedStationId === result.station.id
                  }
                  key={result.station.id}
                  onSelectOnMap={resultsMap?.setSelectedStationId}
                  result={result}
                  winnerAdvantageLiters={winnerAdvantageLiters}
                  winnerNetFuelLiters={results[0].netFuelLiters}
                />
              ))}
            </ol>
          ) : null}

          <ShareResultButtons
            className="mt-1"
            stationName={getStationDisplayName(results[0].station)}
            brand={results[0].station.brand}
            city={results[0].station.city}
            fuelPrice={results[0].station.fuelPrice}
            netFuelLiters={results[0].netFuelLiters}
            fuelType={
              calculationInput
                ? SUPPORTED_FUEL_TYPE_LABELS[calculationInput.fuelType]
                : 'Benzina'
            }
            isSelf={calculationInput?.isSelf ?? true}
            refuelAmount={calculationInput?.refuelAmount ?? 50}
          />
        </motion.div>
      ) : null}
    </section>
  )
}
