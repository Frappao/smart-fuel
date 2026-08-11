'use client'

import { useState } from 'react'

import { calculateConvenience } from '../../lib/calculation/calculateConvenience'
import { getCurrentPosition } from '../../lib/location/getCurrentPosition'
import RefuelForm, { type RefuelCalculationInput } from './RefuelForm'

interface NearbyStation {
  id: number
  name: string | null
  brand: string | null
  address: string | null
  city: string | null
  latitude: number
  longitude: number
  distanceMeters: number
  fuelPrice: number | null
}

interface PricedNearbyStation extends NearbyStation {
  fuelPrice: number
}

interface NearbyStationsResponse {
  stations: NearbyStation[]
}

interface RouteMatrixRoute {
  destinationIndex: number
  distanceMeters: number
}

interface RouteMatrixResponse {
  routes: unknown[]
}

interface ConvenienceResult {
  station: PricedNearbyStation
  routeDistanceMeters: number
  litersPurchased: number
  travelFuelLiters: number
  netFuelLiters: number
}

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

function isNearbyStationsResponse(
  value: unknown,
): value is NearbyStationsResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'stations' in value &&
    Array.isArray(value.stations)
  )
}

function isRouteMatrixRoute(value: unknown): value is RouteMatrixRoute {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return (
    'destinationIndex' in value &&
    typeof value.destinationIndex === 'number' &&
    Number.isInteger(value.destinationIndex) &&
    value.destinationIndex >= 0 &&
    'distanceMeters' in value &&
    typeof value.distanceMeters === 'number' &&
    Number.isFinite(value.distanceMeters) &&
    value.distanceMeters >= 0
  )
}

function isRouteMatrixResponse(value: unknown): value is RouteMatrixResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'routes' in value &&
    Array.isArray(value.routes)
  )
}

function isValidCandidate(
  station: NearbyStation,
): station is PricedNearbyStation {
  return (
    typeof station.latitude === 'number' &&
    Number.isFinite(station.latitude) &&
    station.latitude >= -90 &&
    station.latitude <= 90 &&
    typeof station.longitude === 'number' &&
    Number.isFinite(station.longitude) &&
    station.longitude >= -180 &&
    station.longitude <= 180 &&
    typeof station.fuelPrice === 'number' &&
    Number.isFinite(station.fuelPrice) &&
    station.fuelPrice > 0
  )
}

export default function FuelSmartCalculator() {
  const [calculationInput, setCalculationInput] =
    useState<RefuelCalculationInput | null>(null)
  const [results, setResults] = useState<ConvenienceResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const winnerAdvantageLiters =
    results.length >= 2
      ? results[0].netFuelLiters - results[1].netFuelLiters
      : null

  async function handleCalculate(values: RefuelCalculationInput) {
    setCalculationInput(values)
    setResults([])
    setError(null)
    setIsLoading(true)

    try {
      const position = await getCurrentPosition()
      const searchParams = new URLSearchParams({
        lat: String(position.latitude),
        lng: String(position.longitude),
        radius: '15000',
        limit: '20',
      })
      let response: Response

      try {
        response = await fetch(`/api/nearby-stations?${searchParams}`)
      } catch {
        throw new Error(
          'Non è stato possibile contattare il servizio dei distributori.',
        )
      }

      if (!response.ok) {
        throw new Error(
          'Non è stato possibile recuperare i distributori vicini. Riprova.',
        )
      }

      let responseBody: unknown

      try {
        responseBody = await response.json()
      } catch {
        throw new Error('La risposta del servizio dei distributori non è valida.')
      }

      if (!isNearbyStationsResponse(responseBody)) {
        throw new Error('La risposta del servizio dei distributori non è valida.')
      }

      const candidateStations = responseBody.stations
        .filter(isValidCandidate)
        .slice(0, 20)
      let routeMatrixRoutes: RouteMatrixRoute[] = []

      if (candidateStations.length > 0) {
        let routeMatrixResponse: Response

        try {
          routeMatrixResponse = await fetch('/api/route-matrix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              origin: {
                latitude: position.latitude,
                longitude: position.longitude,
              },
              destinations: candidateStations.map((station) => ({
                latitude: station.latitude,
                longitude: station.longitude,
              })),
            }),
          })
        } catch {
          throw new Error(
            'Non è stato possibile contattare il servizio delle distanze stradali.',
          )
        }

        if (!routeMatrixResponse.ok) {
          throw new Error(
            'Non è stato possibile recuperare le distanze stradali. Riprova.',
          )
        }

        let routeMatrixBody: unknown

        try {
          routeMatrixBody = await routeMatrixResponse.json()
        } catch {
          throw new Error('La risposta del servizio delle distanze non è valida.')
        }

        if (!isRouteMatrixResponse(routeMatrixBody)) {
          throw new Error('La risposta del servizio delle distanze non è valida.')
        }

        routeMatrixRoutes = routeMatrixBody.routes.filter(isRouteMatrixRoute)
      }

      const rankedResults = routeMatrixRoutes
        .flatMap((route): ConvenienceResult[] => {
          const station = candidateStations[route.destinationIndex]

          if (!station) {
            return []
          }

          // Google Routes returns the estimated one-way driving distance. For
          // this MVP, the round trip is approximated by doubling that distance.
          const travelDistanceKm = (route.distanceMeters / 1_000) * 2
          const convenience = calculateConvenience({
            pricePerLiter: station.fuelPrice,
            refuelAmount: values.refuelAmount,
            travelDistanceKm,
            consumptionLitersPer100Km: values.consumptionLitersPer100Km,
          })

          return [
            {
              station,
              routeDistanceMeters: route.distanceMeters,
              ...convenience,
            },
          ]
        })
        .sort((first, second) => second.netFuelLiters - first.netFuelLiters)
        .slice(0, 10)

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
    <section className="flex flex-col gap-6">
      <RefuelForm onCalculate={handleCalculate} />

      {isLoading ? <p aria-live="polite">Calcolo in corso...</p> : null}
      {error ? <p role="alert">{error}</p> : null}

      {!isLoading && !error && calculationInput && results.length === 0 ? (
        <p>Nessun distributore classificabile.</p>
      ) : null}

      {results.length > 0 ? (
        <ol className="flex flex-col gap-4">
          {results.map((result, index) => {
            const stationName =
              result.station.name ?? result.station.brand ?? 'Distributore'
            const travelDistanceKm =
              (result.routeDistanceMeters / 1_000) * 2
            const isBestResult = index === 0

            return (
              <li
                className={
                  isBestResult
                    ? 'rounded-xl border-2 border-emerald-600 bg-emerald-50 p-5 shadow-sm dark:border-emerald-400 dark:bg-emerald-950/30'
                    : 'rounded-lg border border-zinc-200 p-4 dark:border-zinc-800'
                }
                key={result.station.id}
              >
                {isBestResult ? (
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    Ti conviene questo distributore
                  </p>
                ) : null}
                <h3
                  className={
                    isBestResult ? 'mt-1 text-xl font-semibold' : 'font-semibold'
                  }
                >
                  {index + 1}. {stationName}
                </h3>
                <div className="mt-3 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                  <p className={isBestResult ? 'text-lg font-semibold' : undefined}>
                    Prezzo: {priceFormatter.format(result.station.fuelPrice)} €/L
                  </p>
                  <p className={isBestResult ? 'font-semibold' : undefined}>
                    Distanza stradale stimata A/R:{' '}
                    {distanceFormatter.format(travelDistanceKm)} km
                  </p>
                  <p>
                    Litri acquistati:{' '}
                    {litersFormatter.format(result.litersPurchased)} L
                  </p>
                  <p>
                    Litri stimati consumati per il viaggio:{' '}
                    {litersFormatter.format(result.travelFuelLiters)} L
                  </p>
                  <p
                    className={
                      isBestResult
                        ? 'mt-3 rounded-lg bg-emerald-100 px-3 py-2 text-lg font-bold text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-100'
                        : undefined
                    }
                  >
                    Litri netti: {litersFormatter.format(result.netFuelLiters)} L
                  </p>
                  {isBestResult && winnerAdvantageLiters !== null ? (
                    <p className="mt-3 text-sm text-emerald-800 dark:text-emerald-200">
                      Hai circa {litersFormatter.format(winnerAdvantageLiters)} L
                      netti in più rispetto al secondo classificato.
                    </p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      ) : null}
    </section>
  )
}
