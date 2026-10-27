'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
import ShareResultButtons from '../share/ShareResultButtons'
import RefuelForm, { type RefuelCalculationInput } from './RefuelForm'
import {
  buildWinnerInsight,
  RoadSignPrice,
  type WinnerInsight,
} from './RoadSignPrice'

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
  winnerInsight: WinnerInsight | null
  onSelectOnMap?: (stationId: number) => void
  isSelectedOnMap?: boolean
  refuelAmount?: number
  fuelType?: string
  isSelf?: boolean
}

function StationResultCard({
  result,
  index,
  winnerAdvantageLiters,
  winnerInsight,
  onSelectOnMap,
  isSelectedOnMap,
  refuelAmount = 50,
  fuelType = 'Benzina',
  isSelf = true,
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
      ? 'min-w-0 break-words rounded-xl border-2 border-emerald-600 bg-emerald-50 p-4 shadow-md ring-2 ring-emerald-600 sm:p-5 dark:border-emerald-400 dark:bg-emerald-950/40 dark:ring-emerald-400 cursor-pointer transition-all duration-150 active:scale-[0.99]'
      : 'min-w-0 break-words rounded-xl border-2 border-emerald-600/70 bg-emerald-50/60 p-4 shadow-sm sm:p-5 dark:border-emerald-400/70 dark:bg-emerald-950/25 cursor-pointer transition-all duration-150 active:scale-[0.99] hover:border-emerald-600 hover:shadow-xs'
    : isSelectedOnMap
      ? 'min-w-0 break-words rounded-xl border-2 border-emerald-600 bg-emerald-50/50 p-4 shadow-md ring-2 ring-emerald-600/80 transition-all duration-150 dark:border-emerald-400 dark:bg-emerald-950/30 dark:ring-emerald-400 cursor-pointer active:scale-[0.99]'
      : 'min-w-0 break-words rounded-lg border border-zinc-200 bg-white p-4 transition-all duration-150 hover:border-zinc-300 hover:shadow-xs active:scale-[0.99] cursor-pointer dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-zinc-700'

  return (
    <li
      onClick={onSelectOnMap ? () => onSelectOnMap(result.station.id) : undefined}
      className={cardClasses}
    >
      {isBestResult ? (
        <p className="text-sm font-semibold leading-5 text-emerald-700 dark:text-emerald-300">
          Ti conviene questo distributore
        </p>
      ) : null}
      <h3 className={isBestResult ? 'mt-1 text-xl font-semibold' : 'font-semibold'}>
        {index + 1}. {stationName}
      </h3>
      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm leading-6 text-zinc-700 sm:grid-cols-2 dark:text-zinc-300">
        <p className={isBestResult ? 'text-lg font-semibold tabular-nums' : 'tabular-nums'}>
          Prezzo: <RoadSignPrice price={result.station.fuelPrice} /> €/L
        </p>
        <p className={isBestResult ? 'font-semibold tabular-nums' : 'tabular-nums'}>
          Distanza stradale stimata A/R:{' '}
          {distanceFormatter.format(travelDistanceKm)} km
        </p>
        <p className="text-zinc-600 dark:text-zinc-400">
          {formattedPriceCommunicatedAt
            ? `Prezzo comunicato: ${formattedPriceCommunicatedAt}`
            : 'Data prezzo non disponibile'}
        </p>
        <p className="tabular-nums">
          Litri acquistati: {litersFormatter.format(result.litersPurchased)} L
        </p>
        <p className="tabular-nums">
          Litri stimati consumati per il viaggio:{' '}
          {litersFormatter.format(result.travelFuelLiters)} L
        </p>
        <p
          className={
            isBestResult
              ? 'mt-1 rounded-lg bg-emerald-100 px-3 py-2 text-lg font-bold text-emerald-900 tabular-nums sm:col-span-2 dark:bg-emerald-900/50 dark:text-emerald-100'
              : 'tabular-nums'
          }
        >
          Litri netti: {litersFormatter.format(result.netFuelLiters)} L
        </p>
        {isBestResult && winnerAdvantageLiters !== null ? (
          <p className="mt-1 text-sm leading-6 text-emerald-800 tabular-nums sm:col-span-2 dark:text-emerald-200">
            Hai circa {litersFormatter.format(winnerAdvantageLiters)} L netti in
            più rispetto al secondo classificato.
          </p>
        ) : null}
        {isBestResult && winnerInsight ? (
          <div className="mt-1 rounded-lg border border-emerald-300/80 bg-white/80 px-3.5 py-2.5 text-sm leading-6 text-zinc-800 sm:col-span-2 dark:border-emerald-700/60 dark:bg-zinc-900/60 dark:text-zinc-200">
            <span className="mr-1.5 inline-block rounded bg-emerald-700 px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-white uppercase dark:bg-emerald-400 dark:text-emerald-950">
              {winnerInsight.badge}
            </span>
            <span>{winnerInsight.message}</span>
          </div>
        ) : null}
      </div>
      {navigationUrl ? (
        <a
          className={
            isBestResult
              ? 'mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-emerald-600 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 sm:w-auto dark:border-emerald-400 dark:text-emerald-200 dark:hover:bg-emerald-900/50 dark:focus:ring-emerald-500'
              : 'mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 sm:w-auto dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:focus:ring-emerald-500'
          }
          href={navigationUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Apri nel navigatore
        </a>
      ) : null}
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
  const [error, setError] = useState<string | null>(null)
  const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null)
  const winnerAdvantageLiters =
    results.length >= 2 &&
    !haveEquivalentDisplayedNetFuelLiters(results[0], results[1])
      ? results[0].netFuelLiters - results[1].netFuelLiters
      : null
  const winnerInsight = useMemo(
    () =>
      results.length >= 2
        ? buildWinnerInsight(
            results.map((r) => ({
              station: r.station,
              netFuelLiters: r.netFuelLiters,
              travelDistanceKm: (r.routeDistanceMeters / 1_000) * 2,
              litersPurchased: r.litersPurchased,
              travelFuelLiters: r.travelFuelLiters,
            })),
            'nearby',
          )
        : null,
    [results],
  )

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
              winnerInsight={winnerInsight}
            />
          </ol>

          {results.length > 1 ? (
            <ol className="flex min-w-0 flex-col gap-3 sm:gap-4" start={2}>
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
                  winnerInsight={null}
                />
              ))}
            </ol>
          ) : null}
        </motion.div>
      ) : null}
    </section>
  )
}
