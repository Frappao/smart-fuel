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
import {
  buildWinnerInsight,
  RoadSignPrice,
  type WinnerInsight,
} from '../calculation/RoadSignPrice'
import { useResultsMap } from '../map/ResultsMapContext'
import ShareResultButtons from '../share/ShareResultButtons'
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
  winnerInsight: WinnerInsight | null
  onSelectOnMap?: (stationId: number) => void
  isSelectedOnMap?: boolean
  refuelAmount?: number
  fuelType?: string
  isSelf?: boolean
}

function TripResultCard({
  result,
  index,
  origin,
  destination,
  winnerInsight,
  onSelectOnMap,
  isSelectedOnMap,
  refuelAmount = 50,
  fuelType = 'Benzina',
  isSelf = true,
}: TripResultCardProps) {
  const isWinner = index === 0
  const stationName = getStationDisplayName(result.station)
  const navigationUrl = getTripNavigationUrl(origin, destination, {
    latitude: result.station.latitude,
    longitude: result.station.longitude,
  })

  const cardClasses = isWinner
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
      {isWinner ? (
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          Migliore lungo questo percorso
        </p>
      ) : null}
      <h3 className="mt-1 font-semibold">
        {index + 1}. {stationName}
      </h3>
      <div className="mt-3 grid gap-2 text-sm leading-6 text-zinc-700 sm:grid-cols-2 dark:text-zinc-300">
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
        <p className="font-semibold tabular-nums">
          Litri netti: {litersFormatter.format(result.netFuelLiters)} L
        </p>
        {isWinner && winnerInsight ? (
          <div className="mt-1 rounded-lg border border-emerald-300/80 bg-white/80 px-3.5 py-2.5 text-sm leading-6 text-zinc-800 sm:col-span-2 dark:border-emerald-700/60 dark:bg-zinc-900/60 dark:text-zinc-200">
            <span className="mr-1.5 inline-block rounded bg-emerald-700 px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-white uppercase dark:bg-emerald-400 dark:text-emerald-950">
              {winnerInsight.badge}
            </span>
            <span>{winnerInsight.message}</span>
          </div>
        ) : null}
      </div>
      <a
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-emerald-600 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 sm:w-auto dark:border-emerald-400 dark:text-emerald-200"
        href={navigationUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        Apri percorso con questa sosta
      </a>
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
    </li>
  )
}

export default function TripCalculator() {
  const calculationInFlight = useRef(false)
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
  const [error, setError] = useState<string | null>(null)
  const [emptyState, setEmptyState] = useState<string | null>(null)

  const winnerInsight = useMemo(
    () =>
      results.length >= 2
        ? buildWinnerInsight(
            results.map((r) => ({
              station: r.station,
              netFuelLiters: r.netFuelLiters,
              travelDistanceKm: r.detourDistanceMeters / 1_000,
              litersPurchased: r.litersPurchased,
              travelFuelLiters: r.detourFuelLiters,
            })),
            'trip',
          )
        : null,
    [results],
  )

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
            <label className="relative flex cursor-pointer select-none items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm font-medium transition-all duration-150 has-checked:border-emerald-600 has-checked:bg-emerald-50 has-checked:text-emerald-900 has-checked:shadow-xs active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:has-checked:border-emerald-400 dark:has-checked:bg-emerald-950 dark:has-checked:text-emerald-200">
              <input
                checked={originMode === 'current'}
                disabled={isLoading}
                name="origin-mode"
                type="radio"
                className="size-4 accent-emerald-600"
                onChange={() => {
                  setOriginMode('current')
                  setCustomOrigin(null)
                  setError(null)
                  clearCalculatedJourney()
                }}
              />
              <span>Usa la mia posizione attuale</span>
            </label>
            <label className="relative flex cursor-pointer select-none items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm font-medium transition-all duration-150 has-checked:border-emerald-600 has-checked:bg-emerald-50 has-checked:text-emerald-900 has-checked:shadow-xs active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-900 dark:has-checked:border-emerald-400 dark:has-checked:bg-emerald-950 dark:has-checked:text-emerald-200">
              <input
                checked={originMode === 'custom'}
                disabled={isLoading}
                name="origin-mode"
                type="radio"
                className="size-4 accent-emerald-600"
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="grid gap-4"
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
              winnerInsight={index === 0 ? winnerInsight : null}
            />
          ))}
        </motion.ol>
      ) : null}
    </section>
  )
}
