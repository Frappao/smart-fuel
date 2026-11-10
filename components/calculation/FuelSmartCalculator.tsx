'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, type Variants } from 'motion/react'

import {
  fetchNearbyStations,
  fetchRouteMatrix,
  fetchRoutePath,
  type GeocodingResult,
} from '../../lib/api/rifornioApiClient'
import type { RouteLineString } from '../../lib/maps/getMapboxDirections'
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
import { useRankingVariants } from '../motion/rankingMotion'
import NavigationAppPicker from '../navigation/NavigationAppPicker'
import { useNavigationApp } from '../navigation/useNavigationApp'
import { buildStationNavigationUrl } from '../../lib/navigation/navigationApps'
import {
  NEARBY_RESULTS_SLOT_ID,
  useResultsMap,
  type MapCoordinates,
  type ResultsMapData,
} from '../map/ResultsMapContext'
import { StationsResultMap } from '../map/StationsResultMap'
import { AppBetaInlineOffer } from '../mobile-promo/AppBetaModal'
import ShareResultButtons from '../share/ShareResultButtons'
import AddressSearchField from '../trip/AddressSearchField'
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

// Nella vista focalizzata i cartelli non sono selezionabili.
function ignoreStationSelection() {}

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


function AlternativeResultRow({
  result,
  index,
  winnerNetFuelLiters,
  variants,
}: {
  result: RankedStationResult
  index: number
  winnerNetFuelLiters: number
  variants: Variants
}) {
  const stationName = getStationDisplayName(result.station)
  const travelDistanceKm = (result.routeDistanceMeters / 1_000) * 2
  const litersBehindWinner = Math.max(
    0,
    winnerNetFuelLiters - result.netFuelLiters,
  )
  const navigationApp = useNavigationApp()
  const navigationUrl = buildStationNavigationUrl(navigationApp, result.station)

  return (
    <motion.li
      variants={variants}
      className="min-w-0 border-t border-zinc-800/80 py-3 first:border-t-0"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-zinc-100">
            {index + 1}. {stationName}
          </h3>
          <StationIdentity result={result} stationName={stationName} />
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-zinc-100 tabular-nums">
            {litersFormatter.format(result.netFuelLiters)}{' '}
            <span className="text-xs font-normal text-zinc-400">L netti</span>
          </p>
          <p className="text-xs font-medium text-amber-300/90 tabular-nums">
            −{litersFormatter.format(litersBehindWinner)} L dal 1°
          </p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 tabular-nums">
        <span>
          <RoadSignPrice price={result.station.fuelPrice} /> €/L
        </span>
        <span>{distanceFormatter.format(travelDistanceKm)} km A/R</span>
        {navigationUrl ? (
          <a
            className="ml-auto inline-flex min-h-9 items-center rounded-lg border border-zinc-700/80 bg-zinc-900 px-3 font-semibold text-zinc-100 transition hover:border-zinc-600 hover:bg-zinc-800"
            href={navigationUrl}
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
    </motion.li>
  )
}

function WinnerCard({
  result,
  winnerAdvantageLiters,
  alternatives,
}: {
  result: RankedStationResult
  winnerAdvantageLiters: number | null
  alternatives: RankedStationResult[]
}) {
  const stationName = getStationDisplayName(result.station)
  const travelDistanceKm = (result.routeDistanceMeters / 1_000) * 2
  const navigationApp = useNavigationApp()
  const navigationUrl = buildStationNavigationUrl(navigationApp, result.station)
  const rankingVariants = useRankingVariants()
  // Le righe entrano a cascata ogni volta che la classifica viene aperta.
  const [isRankingOpen, setIsRankingOpen] = useState(false)

  return (
    <article
      aria-label="Distributore più conveniente"
      className="min-w-0 break-words"
    >
      <p className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-400" />
        Conviene qui
      </p>
      <h3 className="mt-1 text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl">
        {stationName}
      </h3>
      <StationIdentity result={result} stationName={stationName} />

      <dl className="mt-3.5 grid grid-cols-3 gap-2 text-left">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-2.5">
          <dt className="text-[11px] font-medium text-zinc-400">Prezzo</dt>
          <dd className="mt-0.5 text-sm font-bold text-zinc-100 tabular-nums">
            <RoadSignPrice price={result.station.fuelPrice} />{' '}
            <span className="text-[11px] font-normal text-zinc-400">€/L</span>
          </dd>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-2.5">
          <dt className="text-[11px] font-medium text-zinc-400">Strada A/R</dt>
          <dd className="mt-0.5 text-sm font-bold text-zinc-100 tabular-nums">
            {distanceFormatter.format(travelDistanceKm)}{' '}
            <span className="text-[11px] font-normal text-zinc-400">km</span>
          </dd>
        </div>
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-2.5">
          <dt className="text-[11px] font-bold text-emerald-300">Litri netti</dt>
          <dd className="mt-0.5 text-sm font-extrabold text-emerald-300 tabular-nums">
            {litersFormatter.format(result.netFuelLiters)}{' '}
            <span className="text-[11px] font-normal text-emerald-300/80">L</span>
          </dd>
        </div>
      </dl>

      {winnerAdvantageLiters !== null ? (
        <p className="mt-2.5 text-xs font-semibold text-emerald-300 tabular-nums">
          Hai circa {litersFormatter.format(winnerAdvantageLiters)} L netti in più rispetto al secondo classificato
          {' '}(≈ {euroFormatter.format(winnerAdvantageLiters * result.station.fuelPrice)} di carburante).
        </p>
      ) : null}

      <NavigationAppPicker className="mt-4" />

      {navigationUrl ? (
        <a
          className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
          href={navigationUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2 4.5 20.3l.7.7L12 18l6.8 3 .7-.7z" />
          </svg>
          Portami qui
        </a>
      ) : null}

      <CalculationDetails result={result} travelDistanceKm={travelDistanceKm} />

      {alternatives.length > 0 ? (
        <details
          className="group mt-2 rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5 text-xs"
          onToggle={event => setIsRankingOpen(event.currentTarget.open)}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-zinc-300 select-none hover:text-zinc-100">
            <span>
              Vedi {alternatives.length === 1 ? "l'altro distributore" : `gli altri ${alternatives.length}`} in classifica
            </span>
            <span aria-hidden="true" className="text-[10px] text-zinc-400 transition-transform group-open:rotate-180">▾</span>
          </summary>
          <motion.ol
            aria-label="Altri distributori in classifica"
            className="mt-2 border-t border-zinc-800 pt-1"
            start={2}
            variants={rankingVariants.list}
            initial="hidden"
            animate={isRankingOpen ? 'visible' : 'hidden'}
          >
            {alternatives.map((alternative, index) => (
              <AlternativeResultRow
                index={index + 1}
                key={alternative.station.id}
                result={alternative}
                winnerNetFuelLiters={result.netFuelLiters}
                variants={rankingVariants.item}
              />
            ))}
          </motion.ol>
        </details>
      ) : null}
    </article>
  )
}

export default function FuelSmartCalculator() {
  const calculationInFlight = useRef(false)
  const resultsRef = useRef<HTMLElement>(null)
  const resultsMap = useResultsMap()
  const navigationApp = useNavigationApp()
  const [calculationInput, setCalculationInput] =
    useState<RefuelCalculationInput | null>(null)
  const [originCoords, setOriginCoords] = useState<MapCoordinates | null>(null)
  const [results, setResults] = useState<RankedStationResult[]>([])
  const [winnerRoute, setWinnerRoute] = useState<RouteLineString | null>(null)
  const routeRequestId = useRef(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null)
  // Partenza scelta a mano quando la posizione non è disponibile (permesso
  // negato, Mac senza Wi-Fi, ricerca per un'altra zona).
  const [manualOrigin, setManualOrigin] = useState<GeocodingResult | null>(null)
  const [isPositionUnavailable, setIsPositionUnavailable] = useState(false)
  const winnerAdvantageLiters =
    results.length >= 2 &&
    !haveEquivalentDisplayedNetFuelLiters(results[0], results[1])
      ? results[0].netFuelLiters - results[1].netFuelLiters
      : null

  const setMapData = resultsMap?.setMapData

  const mapData = useMemo<ResultsMapData | null>(() => {
    if (results.length === 0) return null

    return {
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
          navigationHref: buildStationNavigationUrl(
            navigationApp,
            result.station,
          ),
          navigationLabel: 'Apri nel navigatore',
          distanceSummary: `Distanza A/R: ${distanceFormatter.format(travelKm)} km`,
        }
      }),
    }
  }, [results, originCoords, calculationInput, navigationApp])

  useEffect(() => {
    setMapData?.(mapData)
  }, [mapData, setMapData])

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

  // Percorso stradale reale fino al vincente, solo per disegnarlo sulla mappa.
  // Se non arriva la mappa mostra i soli cartelli: mai una linea in linea d'aria.
  async function loadWinnerRoute(
    origin: MapCoordinates,
    destination: MapCoordinates,
  ) {
    const requestId = routeRequestId.current

    try {
      const response = await fetchRoutePath({ origin, destination })
      if (requestId === routeRequestId.current) {
        setWinnerRoute(response.geometry)
      }
    } catch {
      if (requestId === routeRequestId.current) {
        setWinnerRoute(null)
      }
    }
  }

  async function handleCalculate(
    values: RefuelCalculationInput,
    origin: GeocodingResult | null = manualOrigin,
  ) {
    if (calculationInFlight.current) return
    calculationInFlight.current = true
    setCalculationInput(values)
    setResults([])
    setWinnerRoute(null)
    routeRequestId.current += 1
    setError(null)
    setEmptyStateMessage(null)
    setIsLoading(true)

    try {
      let position: MapCoordinates

      if (origin) {
        position = { latitude: origin.latitude, longitude: origin.longitude }
      } else {
        try {
          position = await getCurrentPosition()
        } catch (positionError) {
          setIsPositionUnavailable(true)
          throw positionError
        }
        setIsPositionUnavailable(false)
      }

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

      const winner = rankedResults[0]
      if (winner) {
        void loadWinnerRoute(
          { latitude: position.latitude, longitude: position.longitude },
          { latitude: winner.station.latitude, longitude: winner.station.longitude },
        )
      }
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

  const resultsView =
    results.length > 0 && mapData ? (
      <motion.section
        ref={resultsRef}
        aria-label="Risultato della ricerca"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        className="flex min-w-0 flex-col gap-3 scroll-mt-24 sm:gap-4"
      >
        <div className="relative min-w-0 overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900 shadow-2xl lg:h-[min(80vh,760px)] lg:min-h-[560px]">
          <div className="h-[50vh] min-h-[300px] max-h-[460px] lg:absolute lg:inset-0 lg:h-full lg:max-h-none">
            <StationsResultMap
              variant="focus"
              data={mapData}
              selectedStationId={results[0].station.id}
              onSelectStation={ignoreStationSelection}
              routeGeometry={winnerRoute}
            />
          </div>
          <div className="relative z-10 border-t border-emerald-500/40 bg-zinc-950 p-5 sm:p-6 lg:absolute lg:top-4 lg:left-4 lg:mt-0 lg:max-h-[calc(100%-2rem)] lg:w-[380px] lg:overflow-y-auto lg:overscroll-contain lg:rounded-2xl lg:border lg:bg-zinc-950/95 lg:p-5 lg:shadow-2xl">
            <WinnerCard
              alternatives={results.slice(1)}
              result={results[0]}
              winnerAdvantageLiters={winnerAdvantageLiters}
            />
          </div>
        </div>

        <ShareResultButtons
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
        <AppBetaInlineOffer />
      </motion.section>
    ) : null

  // Sulla homepage la vista risultati occupa tutta la larghezza della pagina
  // (slot sotto calcolatore e guida); altrove resta in linea.
  const resultsSlot =
    resultsView && typeof document !== 'undefined'
      ? document.getElementById(NEARBY_RESULTS_SLOT_ID)
      : null

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

      {isPositionUnavailable || manualOrigin ? (
        <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5">
          {manualOrigin ? (
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <p className="min-w-0 text-sm text-zinc-300">
                <span className="text-zinc-400">Partenza: </span>
                <span className="font-semibold text-zinc-100">{manualOrigin.label}</span>
              </p>
              <button
                type="button"
                disabled={isLoading}
                className="inline-flex min-h-10 items-center rounded-lg border border-zinc-700 px-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800 disabled:opacity-60"
                onClick={() => {
                  setManualOrigin(null)
                  setIsPositionUnavailable(false)
                  setError(null)
                }}
              >
                Usa la mia posizione
              </button>
            </div>
          ) : (
            <p className="text-sm font-semibold text-zinc-100">
              Oppure parti da un indirizzo
            </p>
          )}
          <AddressSearchField
            disabled={isLoading}
            id="nearby-origin"
            label={manualOrigin ? 'Cambia indirizzo di partenza' : 'Indirizzo o città'}
            onSelect={(result) => {
              if (!result) return
              setManualOrigin(result)
              if (calculationInput) {
                void handleCalculate(calculationInput, result)
              }
            }}
          />
        </div>
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

      {resultsView
        ? resultsSlot
          ? createPortal(resultsView, resultsSlot)
          : resultsView
        : null}
    </section>
  )
}
