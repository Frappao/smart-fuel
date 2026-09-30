'use client'

import { useRef, useState } from 'react'

import {
  fetchTripStations,
  type Coordinates,
  type GeocodingResult,
} from '../../lib/api/rifornioApiClient'
import { getStationDisplayName } from '../../lib/calculation/rankNearbyStations'
import type { RankedRouteStationResult } from '../../lib/calculation/rankStationsAlongRoute'
import { getCurrentPosition } from '../../lib/location/getCurrentPosition'
import AdSlot from '../ads/AdSlot'
import RefuelForm, {
  type RefuelCalculationInput,
} from '../calculation/RefuelForm'
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
const priceFormatter = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
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
}

function TripResultCard({
  result,
  index,
  origin,
  destination,
}: TripResultCardProps) {
  const isWinner = index === 0
  const navigationUrl = getTripNavigationUrl(origin, destination, {
    latitude: result.station.latitude,
    longitude: result.station.longitude,
  })

  return (
    <li
      className={
        isWinner
          ? 'rounded-xl border-2 border-emerald-600 bg-emerald-50 p-4 dark:border-emerald-400 dark:bg-emerald-950/30'
          : 'rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/40'
      }
    >
      {isWinner ? (
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          Migliore lungo questo percorso
        </p>
      ) : null}
      <h3 className="mt-1 font-semibold">
        {index + 1}. {getStationDisplayName(result.station)}
      </h3>
      <div className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700 sm:grid-cols-2 dark:text-zinc-300">
        <p>Prezzo: {priceFormatter.format(result.station.fuelPrice)} €/L</p>
        <p>
          Deviazione aggiuntiva:{' '}
          {distanceFormatter.format(result.detourDistanceMeters / 1_000)} km
        </p>
        <p>
          Carburante per la deviazione:{' '}
          {litersFormatter.format(result.detourFuelLiters)} L
        </p>
        <p className="font-semibold">
          Litri netti: {litersFormatter.format(result.netFuelLiters)} L
        </p>
      </div>
      <a
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-emerald-600 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 sm:w-auto dark:border-emerald-400 dark:text-emerald-200"
        href={navigationUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        Apri percorso con questa sosta
      </a>
    </li>
  )
}

export default function TripCalculator() {
  const calculationInFlight = useRef(false)
  const [originMode, setOriginMode] = useState<OriginMode>('current')
  const [customOrigin, setCustomOrigin] = useState<GeocodingResult | null>(null)
  const [destination, setDestination] = useState<GeocodingResult | null>(null)
  const [results, setResults] = useState<RankedRouteStationResult[]>([])
  const [journeyCoordinates, setJourneyCoordinates] = useState<{
    origin: Coordinates
    destination: Coordinates
  } | null>(null)
  const [baseRouteDistanceMeters, setBaseRouteDistanceMeters] = useState<
    number | null
  >(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emptyState, setEmptyState] = useState<string | null>(null)

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
          <label className="flex items-center gap-3 text-sm">
            <input
              checked={originMode === 'current'}
              disabled={isLoading}
              name="origin-mode"
              type="radio"
              onChange={() => {
                setOriginMode('current')
                setCustomOrigin(null)
                setError(null)
                clearCalculatedJourney()
              }}
            />
            Usa la mia posizione attuale
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input
              checked={originMode === 'custom'}
              disabled={isLoading}
              name="origin-mode"
              type="radio"
              onChange={() => {
                setOriginMode('custom')
                setError(null)
                clearCalculatedJourney()
              }}
            />
            Scegli un&apos;altra partenza
          </label>
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
        <p aria-live="polite" className="text-sm text-zinc-600 dark:text-zinc-300">
          Sto cercando i distributori migliori lungo il percorso...
        </p>
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
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Percorso base stimato:{' '}
          {distanceFormatter.format(baseRouteDistanceMeters / 1_000)} km
        </p>
      ) : null}
      {results.length > 0 && journeyCoordinates ? (
        <ol className="grid gap-4">
          {results.map((result, index) => (
            <TripResultCard
              destination={journeyCoordinates.destination}
              index={index}
              key={result.station.id}
              origin={journeyCoordinates.origin}
              result={result}
            />
          ))}
        </ol>
      ) : null}
    </section>
  )
}
