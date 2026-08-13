'use client'

import { useState } from 'react'

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
import RefuelForm, { type RefuelCalculationInput } from './RefuelForm'

const priceFormatter = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

const distanceFormatter = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const litersFormatter = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
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
}

function StationResultCard({
  result,
  index,
  winnerAdvantageLiters,
}: StationResultCardProps) {
  const stationName = getStationDisplayName(result.station)
  const travelDistanceKm = (result.routeDistanceMeters / 1_000) * 2
  const isBestResult = index === 0
  const navigationUrl = getGoogleMapsNavigationUrl(
    result.station.latitude,
    result.station.longitude,
  )

  return (
    <li
      className={
        isBestResult
          ? 'min-w-0 break-words rounded-xl border-2 border-emerald-600 bg-emerald-50 p-4 shadow-sm sm:p-5 dark:border-emerald-400 dark:bg-emerald-950/30'
          : 'min-w-0 break-words rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/40'
      }
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
        <p className={isBestResult ? 'text-lg font-semibold' : undefined}>
          Prezzo: {priceFormatter.format(result.station.fuelPrice)} €/L
        </p>
        <p className={isBestResult ? 'font-semibold' : undefined}>
          Distanza stradale stimata A/R:{' '}
          {distanceFormatter.format(travelDistanceKm)} km
        </p>
        <p>
          Litri acquistati: {litersFormatter.format(result.litersPurchased)} L
        </p>
        <p>
          Litri stimati consumati per il viaggio:{' '}
          {litersFormatter.format(result.travelFuelLiters)} L
        </p>
        <p
          className={
            isBestResult
              ? 'mt-1 rounded-lg bg-emerald-100 px-3 py-2 text-lg font-bold text-emerald-900 sm:col-span-2 dark:bg-emerald-900/50 dark:text-emerald-100'
              : undefined
          }
        >
          Litri netti: {litersFormatter.format(result.netFuelLiters)} L
        </p>
        {isBestResult && winnerAdvantageLiters !== null ? (
          <p className="mt-1 text-sm leading-6 text-emerald-800 sm:col-span-2 dark:text-emerald-200">
            Hai circa {litersFormatter.format(winnerAdvantageLiters)} L netti in
            più rispetto al secondo classificato.
          </p>
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
    </li>
  )
}

export default function FuelSmartCalculator() {
  const [calculationInput, setCalculationInput] =
    useState<RefuelCalculationInput | null>(null)
  const [results, setResults] = useState<RankedStationResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null)
  const winnerAdvantageLiters =
    results.length >= 2
      ? results[0].netFuelLiters - results[1].netFuelLiters
      : null

  async function handleCalculate(values: RefuelCalculationInput) {
    setCalculationInput(values)
    setResults([])
    setError(null)
    setEmptyStateMessage(null)
    setIsLoading(true)

    try {
      const position = await getCurrentPosition()
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
      })

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
      setIsLoading(false)
    }
  }

  return (
    <section className="flex min-w-0 flex-col gap-6 sm:gap-8">
      <RefuelForm onCalculate={handleCalculate} />

      {isLoading ? (
        <p
          aria-live="polite"
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
        >
          Sto cercando i distributori più convenienti...
        </p>
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
        <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
          <ol>
            <StationResultCard
              index={0}
              result={results[0]}
              winnerAdvantageLiters={winnerAdvantageLiters}
            />
          </ol>

          <AdSlot />

          {results.length > 1 ? (
            <ol className="flex min-w-0 flex-col gap-3 sm:gap-4" start={2}>
              {results.slice(1).map((result, index) => (
                <StationResultCard
                  index={index + 1}
                  key={result.station.id}
                  result={result}
                  winnerAdvantageLiters={winnerAdvantageLiters}
                />
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
