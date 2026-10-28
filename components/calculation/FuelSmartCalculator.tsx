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
  onSelectOnMap?: (stationId: number) => void
  isSelectedOnMap?: boolean
  refuelAmount?: number
  fuelType?: string
  isSelf?: boolean
  mobileMap?: React.ReactNode
  showAllToggle?: React.ReactNode
}

function StationResultCard({
  result,
  index,
  winnerAdvantageLiters,
  onSelectOnMap,
  isSelectedOnMap,
  refuelAmount = 50,
  fuelType = 'Benzina',
  isSelf = true,
  mobileMap,
  showAllToggle,
}: StationResultCardProps) {
  const stationName = getStationDisplayName(result.station)
  const travelDistanceKm = (result.routeDistanceMeters / 1_000) * 2
  const isBestResult = index === 0
  const formattedPriceCommunicatedAt = formatPriceCommunicatedAt(
    result.station.communicatedAt,
  )
  const navigationUrl = getGoogleMapsNavigationUrl(
    result.station.latitude,
    result.station.longitude,
  )

  const cardClasses = isBestResult
    ? isSelectedOnMap
      ? 'min-w-0 break-words rounded-2xl border-2 border-emerald-600 bg-emerald-50/70 p-4 shadow-md ring-2 ring-emerald-600 sm:p-5 dark:border-emerald-400 dark:bg-emerald-950/40 dark:ring-emerald-400 cursor-pointer transition-all duration-150 active:scale-[0.99]'
      : 'min-w-0 break-words rounded-2xl border-2 border-emerald-600/70 bg-emerald-50/50 p-4 shadow-sm sm:p-5 dark:border-emerald-400/70 dark:bg-emerald-950/25 cursor-pointer transition-all duration-150 active:scale-[0.99] hover:border-emerald-600 hover:shadow-xs'
    : isSelectedOnMap
      ? 'min-w-0 break-words rounded-xl border-2 border-emerald-600 bg-emerald-50/40 p-4 shadow-md ring-2 ring-emerald-600/80 transition-all duration-150 dark:border-emerald-400 dark:bg-emerald-950/30 dark:ring-emerald-400 cursor-pointer active:scale-[0.99]'
      : 'min-w-0 break-words rounded-xl border border-zinc-200 bg-white p-4 transition-all duration-150 hover:border-zinc-300 hover:shadow-xs active:scale-[0.99] cursor-pointer dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-zinc-700'

  return (
    <li
      onClick={onSelectOnMap ? () => onSelectOnMap(result.station.id) : undefined}
      className={cardClasses}
    >
      {isBestResult ? (
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ti conviene questo distributore
          </span>
        </div>
      ) : null}
      <h3 className={isBestResult ? 'mt-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50' : 'font-semibold text-zinc-900 dark:text-zinc-100'}>
        {index + 1}. {stationName}
      </h3>

      {/* Unified clean 3-stat hero grid */}
      <div className="mt-3.5 grid grid-cols-3 gap-2 sm:gap-3 text-left">
        <div className="rounded-xl border border-zinc-200/80 bg-white/90 p-2.5 sm:p-3 dark:border-zinc-800 dark:bg-zinc-900/80 shadow-2xs">
          <p className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400">Prezzo</p>
          <p className="mt-0.5 text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
            <RoadSignPrice price={result.station.fuelPrice} /> <span className="text-[11px] sm:text-xs font-normal text-zinc-500">€/L</span>
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200/80 bg-white/90 p-2.5 sm:p-3 dark:border-zinc-800 dark:bg-zinc-900/80 shadow-2xs">
          <p className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400">Distanza A/R</p>
          <p className="mt-0.5 text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
            {distanceFormatter.format(travelDistanceKm)} <span className="text-[11px] sm:text-xs font-normal text-zinc-500">km</span>
          </p>
        </div>
        <div
          className={
            isBestResult
              ? 'rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-2.5 sm:p-3 dark:border-emerald-400/40 dark:bg-emerald-400/10 shadow-2xs'
              : 'rounded-xl border border-zinc-200/80 bg-white/90 p-2.5 sm:p-3 dark:border-zinc-800 dark:bg-zinc-900/80 shadow-2xs'
          }
        >
          <p
            className={
              isBestResult
                ? 'text-[11px] sm:text-xs font-semibold text-emerald-800 dark:text-emerald-300'
                : 'text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400'
            }
          >
            Litri netti
          </p>
          <p
            className={
              isBestResult
                ? 'mt-0.5 text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-300 tabular-nums'
                : 'mt-0.5 text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tabular-nums'
            }
          >
            {litersFormatter.format(result.netFuelLiters)}{' '}
            <span
              className={
                isBestResult
                  ? 'text-[11px] sm:text-xs font-normal text-emerald-700/80 dark:text-emerald-400/80'
                  : 'text-[11px] sm:text-xs font-normal text-zinc-500'
              }
            >
              L
            </span>
          </p>
        </div>
      </div>

      {isBestResult && winnerAdvantageLiters !== null ? (
        <p className="mt-2.5 text-xs font-medium text-emerald-800 tabular-nums dark:text-emerald-300">
          Hai circa {litersFormatter.format(winnerAdvantageLiters)} L netti in più rispetto al secondo classificato.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        {navigationUrl ? (
          <a
            className={
              isBestResult
                ? 'inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-700 active:scale-[0.98] sm:w-auto dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400'
                : 'inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 active:scale-[0.98] sm:w-auto dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
            }
            href={navigationUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Apri nel navigatore
          </a>
        ) : null}
      </div>

      {/* Mappa in primo piano subito dopo l'azione principale */}
      {isBestResult && mobileMap ? (
        <div className="mt-4 pt-3 border-t border-emerald-200/80 dark:border-emerald-800/80 lg:hidden" onClick={(e) => e.stopPropagation()}>
          {mobileMap}
        </div>
      ) : null}

      {/* Dettagli tecnici secondari ordinati in disclosure discreta */}
      <details className="group mt-3 rounded-lg border border-zinc-200/60 bg-white/60 p-2.5 text-xs text-zinc-600 dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:text-zinc-400">
        <summary className="flex cursor-pointer list-none items-center justify-between font-medium select-none text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          <span>Dettagli del calcolo</span>
          <span className="text-[10px] text-zinc-400 group-open:rotate-180 transition-transform">▾</span>
        </summary>
        <div className="mt-2 space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
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

      {isBestResult ? (
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

      {isBestResult && showAllToggle ? (
        <div className="mt-3 lg:hidden" onClick={(e) => e.stopPropagation()}>
          {showAllToggle}
        </div>
      ) : null}
    </li>
  )
}

export default function FuelSmartCalculator() {
  const calculationInFlight = useRef(false)
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="flex min-w-0 flex-col gap-3 sm:gap-4"
        >
          <ol>
            <StationResultCard
              fuelType={
                calculationInput
                  ? SUPPORTED_FUEL_TYPE_LABELS[calculationInput.fuelType]
                  : 'Benzina'
              }
              index={0}
              isSelf={calculationInput?.isSelf ?? true}
              isSelectedOnMap={
                resultsMap?.selectedStationId === results[0].station.id
              }
              onSelectOnMap={resultsMap?.setSelectedStationId}
              refuelAmount={calculationInput?.refuelAmount ?? 50}
              result={results[0]}
              winnerAdvantageLiters={winnerAdvantageLiters}
              mobileMap={
                resultsMap?.mapData ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      <span className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        Mappa completa dei distributori
                      </span>
                      <span className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                        Tocca per selezionare
                      </span>
                    </div>
                    <div className="h-[340px] sm:h-[400px] overflow-hidden rounded-xl border border-emerald-300/80 bg-white shadow-xs dark:border-emerald-800/80 dark:bg-zinc-950">
                      <StationsResultMap
                        data={resultsMap.mapData}
                        selectedStationId={resultsMap.selectedStationId}
                        onSelectStation={resultsMap.setSelectedStationId}
                      />
                    </div>
                  </div>
                ) : null
              }
              showAllToggle={
                results.length > 1 ? (
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
                          : `Vedi gli altri ${results.length - 1} distributori in classifica`}
                      </span>
                    </span>
                    <span className="rounded-md bg-emerald-200/80 px-2.5 py-1 text-[11px] font-bold text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100">
                      {showAllMobileResults ? '▲ Chiudi' : '▼ Mostra tutti'}
                    </span>
                  </button>
                ) : null
              }
            />
          </ol>

          {results.length > 1 ? (
            <ol
              className={`min-w-0 flex-col gap-3 sm:gap-4 ${
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
                />
              ))}
            </ol>
          ) : null}
        </motion.div>
      ) : null}
    </section>
  )
}
