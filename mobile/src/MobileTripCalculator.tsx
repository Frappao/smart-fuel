import { useRef, useState } from 'react'

import RefuelForm, {
  type RefuelCalculationInput,
} from '../../components/calculation/RefuelForm'
import AddressSearchField from '../../components/trip/AddressSearchField'
import {
  fetchTripStations,
  type Coordinates,
  type GeocodingResult,
} from '../../lib/api/rifornioApiClient'
import { getStationDisplayName } from '../../lib/calculation/rankNearbyStations'
import type { RankedRouteStationResult } from '../../lib/calculation/rankStationsAlongRoute'
import { RIFORNIO_API_BASE_URL } from './config'
import { getMobileCurrentPosition } from './location/getMobileCurrentPosition'
import MobileSearchMode from './MobileSearchMode'
import { openTripNavigation } from './navigation/openStationNavigation'

interface MobileTripCalculatorProps {
  onSelectNearby: () => void
}

const formatter = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function coordinates(location: GeocodingResult): Coordinates {
  return { latitude: location.latitude, longitude: location.longitude }
}

export default function MobileTripCalculator({
  onSelectNearby,
}: MobileTripCalculatorProps) {
  const calculationInFlight = useRef(false)
  const [originMode, setOriginMode] = useState<'current' | 'custom'>('current')
  const [customOrigin, setCustomOrigin] = useState<GeocodingResult | null>(null)
  const [destination, setDestination] = useState<GeocodingResult | null>(null)
  const [results, setResults] = useState<RankedRouteStationResult[]>([])
  const [journey, setJourney] = useState<{
    origin: Coordinates
    destination: Coordinates
  } | null>(null)
  const [baseDistanceMeters, setBaseDistanceMeters] = useState<number | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emptyState, setEmptyState] = useState<string | null>(null)

  function clearCalculatedJourney() {
    setResults([])
    setJourney(null)
    setBaseDistanceMeters(null)
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
    setJourney(null)
    setBaseDistanceMeters(null)

    try {
      let origin: Coordinates

      if (originMode === 'current') {
        const position = await getMobileCurrentPosition()
        origin = { latitude: position.latitude, longitude: position.longitude }
      } else {
        origin = coordinates(customOrigin!)
      }

      const destinationCoordinates = coordinates(destination)
      const response = await fetchTripStations(
        { origin, destination: destinationCoordinates, ...values },
        RIFORNIO_API_BASE_URL,
      )
      setJourney({ origin, destination: destinationCoordinates })
      setBaseDistanceMeters(response.baseRouteDistanceMeters)
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

  async function handleNavigation(result: RankedRouteStationResult) {
    if (!journey) return

    try {
      await openTripNavigation({
        ...journey,
        station: {
          latitude: result.station.latitude,
          longitude: result.station.longitude,
        },
      })
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Non riesco ad aprire il navigatore. Riprova.',
      )
    }
  }

  return (
    <main className="mobile-shell">
      <header className="mobile-header">
        <p className="eyebrow">Rifornio Mobile</p>
        <h1>Trova il rifornimento più conveniente</h1>
        <p>Confronta i distributori lungo un viaggio pianificato.</p>
      </header>
      <MobileSearchMode
        mode="trip"
        onChange={(mode) => {
          if (mode === 'nearby') onSelectNearby()
        }}
      />

      <section className="calculator-form" aria-label="Dati del viaggio">
        <RefuelForm
          isLoading={isLoading}
          loadingLabel="Calcolo percorso…"
          locationMessage="Gli indirizzi e la posizione servono a calcolare il percorso richiesto."
          onCalculate={handleCalculate}
          submitLabel="Trova distributore sul percorso"
          title="Pianifica il viaggio"
        >
          <fieldset className="origin-mode">
            <legend>Partenza</legend>
            <label>
              <input
                checked={originMode === 'current'}
                disabled={isLoading}
                name="mobile-origin-mode"
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
            <label>
              <input
                checked={originMode === 'custom'}
                disabled={isLoading}
                name="mobile-origin-mode"
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
              baseUrl={RIFORNIO_API_BASE_URL}
              disabled={isLoading}
              id="mobile-trip-origin"
              label="Località di partenza"
              onSelect={(result) => {
                setCustomOrigin(result)
                setError(null)
                clearCalculatedJourney()
              }}
            />
          ) : null}
          <AddressSearchField
            baseUrl={RIFORNIO_API_BASE_URL}
            disabled={isLoading}
            id="mobile-trip-destination"
            label="Destinazione"
            onSelect={(result) => {
              setDestination(result)
              setError(null)
              clearCalculatedJourney()
            }}
          />
        </RefuelForm>
      </section>

      {isLoading ? <p className="status-message">Calcolo percorso…</p> : null}
      {error ? (
        <p className="status-message error-message" role="alert">
          {error}
        </p>
      ) : null}
      {emptyState ? <p className="status-message">{emptyState}</p> : null}
      {baseDistanceMeters !== null ? (
        <p className="status-message">
          Percorso base stimato: {formatter.format(baseDistanceMeters / 1_000)} km
        </p>
      ) : null}

      {results.length > 0 ? (
        <section className="results-section" aria-label="Classifica sul percorso">
          <h2>Risultati</h2>
          <ol className="results-list">
            {results.map((result, index) => (
              <li
                className={index === 0 ? 'result-card winner-card' : 'result-card'}
                key={result.station.id}
              >
                {index === 0 ? (
                  <p className="winner-label">Migliore lungo questo percorso</p>
                ) : null}
                <h3>
                  {index + 1}. {getStationDisplayName(result.station)}
                </h3>
                <dl className="result-values">
                  <div>
                    <dt>Deviazione aggiuntiva</dt>
                    <dd>{formatter.format(result.detourDistanceMeters / 1_000)} km</dd>
                  </div>
                  <div>
                    <dt>Carburante per la deviazione</dt>
                    <dd>{formatter.format(result.detourFuelLiters)} L</dd>
                  </div>
                  <div className="net-fuel-value">
                    <dt>Litri netti</dt>
                    <dd>{formatter.format(result.netFuelLiters)} L</dd>
                  </div>
                </dl>
                <button
                  className="navigation-button"
                  type="button"
                  onClick={() => void handleNavigation(result)}
                >
                  Apri percorso con questa sosta
                </button>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </main>
  )
}
