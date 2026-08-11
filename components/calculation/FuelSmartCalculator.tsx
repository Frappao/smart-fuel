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
  distanceMeters: number
  fuelPrice: number | null
}

interface PricedNearbyStation extends NearbyStation {
  fuelPrice: number
}

interface NearbyStationsResponse {
  stations: NearbyStation[]
}

interface ConvenienceResult {
  station: PricedNearbyStation
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

function hasFuelPrice(station: NearbyStation): station is PricedNearbyStation {
  return station.fuelPrice !== null
}

export default function FuelSmartCalculator() {
  const [calculationInput, setCalculationInput] =
    useState<RefuelCalculationInput | null>(null)
  const [results, setResults] = useState<ConvenienceResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      const rankedResults = responseBody.stations
        .filter(hasFuelPrice)
        .map((station) => {
          // PostGIS currently provides straight-line, one-way distance. Doubling
          // it is a temporary round-trip estimate until Google Routes replaces it.
          const travelDistanceKm = (station.distanceMeters / 1_000) * 2
          const convenience = calculateConvenience({
            pricePerLiter: station.fuelPrice,
            refuelAmount: values.refuelAmount,
            travelDistanceKm,
            consumptionLitersPer100Km: values.consumptionLitersPer100Km,
          })

          return {
            station,
            ...convenience,
          }
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
        <p>Nessun distributore con prezzo disponibile.</p>
      ) : null}

      {results.length > 0 ? (
        <ol className="flex flex-col gap-4">
          {results.map((result, index) => {
            const stationName =
              result.station.name ?? result.station.brand ?? 'Distributore'
            const travelDistanceKm =
              (result.station.distanceMeters / 1_000) * 2

            return (
              <li className="rounded border border-zinc-200 p-4" key={result.station.id}>
                <h3 className="font-semibold">
                  {index + 1}. {stationName}
                </h3>
                {index === 0 ? <p>Più conveniente</p> : null}
                <p>
                  Prezzo: {priceFormatter.format(result.station.fuelPrice)} €/L
                </p>
                <p>
                  Distanza stimata A/R:{' '}
                  {distanceFormatter.format(travelDistanceKm)} km
                </p>
                <p>
                  Litri acquistati: {litersFormatter.format(result.litersPurchased)} L
                </p>
                <p>
                  Litri stimati consumati per il viaggio:{' '}
                  {litersFormatter.format(result.travelFuelLiters)} L
                </p>
                <p>
                  Litri netti: {litersFormatter.format(result.netFuelLiters)} L
                </p>
              </li>
            )
          })}
        </ol>
      ) : null}
    </section>
  )
}
