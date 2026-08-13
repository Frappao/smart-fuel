import { useState } from 'react'

import RefuelForm, {
  type RefuelCalculationInput,
} from '../../components/calculation/RefuelForm'
import {
  fetchNearbyStations,
  fetchRouteMatrix,
  RifornioApiError,
} from '../../lib/api/rifornioApiClient'
import {
  getStationDisplayName,
  rankNearbyStations,
  selectNearbyCandidates,
  type RankedStationResult,
} from '../../lib/calculation/rankNearbyStations'
import { SUPPORTED_FUEL_TYPE_LABELS } from '../../lib/fuels/supportedFuelTypes'
import { MOBILE_TEST_POSITION, RIFORNIO_API_BASE_URL } from './config'

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

const tooManyRequestsMessage =
  'Hai effettuato troppe richieste in poco tempo. Attendi un minuto e riprova.'
const nearbyErrorMessage =
  'Non riesco a cercare i distributori in questo momento. Riprova tra poco.'
const routeErrorMessage =
  'Non riesco a calcolare le distanze stradali in questo momento. Riprova tra poco.'
const noValidRoutesMessage =
  'Ho trovato dei distributori, ma non posso confrontarli perché le distanze stradali non sono disponibili.'

function getNoCandidatesMessage({
  fuelType,
  isSelf,
}: RefuelCalculationInput): string {
  const serviceMode = isSelf ? 'Self' : 'Servito'

  return `Non ho trovato distributori vicini con ${SUPPORTED_FUEL_TYPE_LABELS[fuelType]} ${serviceMode} disponibile.`
}

function getRequestErrorMessage(error: unknown, fallback: string): string {
  return error instanceof RifornioApiError && error.status === 429
    ? tooManyRequestsMessage
    : fallback
}

interface MobileStationResultProps {
  result: RankedStationResult
  index: number
  winnerAdvantageLiters: number | null
}

function MobileStationResult({
  result,
  index,
  winnerAdvantageLiters,
}: MobileStationResultProps) {
  const isWinner = index === 0
  const roundTripDistanceKm = (result.routeDistanceMeters / 1_000) * 2

  return (
    <li className={isWinner ? 'result-card winner-card' : 'result-card'}>
      {isWinner ? (
        <p className="winner-label">Ti conviene questo distributore</p>
      ) : null}
      <h3>
        {index + 1}. {getStationDisplayName(result.station)}
      </h3>
      <dl className="result-values">
        <div>
          <dt>Prezzo</dt>
          <dd>{priceFormatter.format(result.station.fuelPrice)} €/L</dd>
        </div>
        <div>
          <dt>Distanza stradale stimata A/R</dt>
          <dd>{distanceFormatter.format(roundTripDistanceKm)} km</dd>
        </div>
        <div>
          <dt>Litri acquistati</dt>
          <dd>{litersFormatter.format(result.litersPurchased)} L</dd>
        </div>
        <div>
          <dt>Carburante stimato per il viaggio</dt>
          <dd>{litersFormatter.format(result.travelFuelLiters)} L</dd>
        </div>
        <div className="net-fuel-value">
          <dt>Litri netti</dt>
          <dd>{litersFormatter.format(result.netFuelLiters)} L</dd>
        </div>
      </dl>
      {isWinner && winnerAdvantageLiters !== null ? (
        <p className="winner-advantage">
          Hai circa {litersFormatter.format(winnerAdvantageLiters)} L netti in
          più rispetto al secondo classificato.
        </p>
      ) : null}
    </li>
  )
}

export default function MobileCalculator() {
  const [results, setResults] = useState<RankedStationResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emptyState, setEmptyState] = useState<string | null>(null)
  const winnerAdvantageLiters =
    results.length >= 2
      ? results[0].netFuelLiters - results[1].netFuelLiters
      : null

  async function handleCalculate(values: RefuelCalculationInput) {
    setResults([])
    setError(null)
    setEmptyState(null)
    setIsLoading(true)

    try {
      let nearbyResponse

      try {
        nearbyResponse = await fetchNearbyStations(
          {
            latitude: MOBILE_TEST_POSITION.latitude,
            longitude: MOBILE_TEST_POSITION.longitude,
            radius: 15_000,
            limit: 20,
            fuelType: values.fuelType,
            isSelf: values.isSelf,
          },
          RIFORNIO_API_BASE_URL,
        )
      } catch (requestError) {
        throw new Error(
          getRequestErrorMessage(requestError, nearbyErrorMessage),
        )
      }

      const candidates = selectNearbyCandidates(nearbyResponse.stations)

      if (candidates.length === 0) {
        setEmptyState(getNoCandidatesMessage(values))
        return
      }

      let routeResponse

      try {
        routeResponse = await fetchRouteMatrix(
          {
            origin: MOBILE_TEST_POSITION,
            destinations: candidates.map(({ latitude, longitude }) => ({
              latitude,
              longitude,
            })),
          },
          RIFORNIO_API_BASE_URL,
        )
      } catch (requestError) {
        throw new Error(getRequestErrorMessage(requestError, routeErrorMessage))
      }

      const rankedResults = rankNearbyStations({
        candidates,
        routes: routeResponse.routes,
        refuelAmount: values.refuelAmount,
        consumptionLitersPer100Km: values.consumptionLitersPer100Km,
      })

      if (rankedResults.length === 0) {
        setEmptyState(noValidRoutesMessage)
        return
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
    <main className="mobile-shell">
      <header className="mobile-header">
        <p className="eyebrow">Rifornio Mobile</p>
        <h1>Trova il rifornimento più conveniente</h1>
        <p>
          Confronta prezzo, distanza stradale e consumo della tua auto.
        </p>
        <p className="test-position-notice">
          Posizione di test: Piazza del Duomo, Milano
        </p>
      </header>

      <section className="calculator-form" aria-label="Dati del rifornimento">
        <RefuelForm onCalculate={handleCalculate} />
      </section>

      {isLoading ? (
        <p className="status-message" aria-live="polite">
          Sto cercando i distributori più convenienti...
        </p>
      ) : null}
      {error ? (
        <p className="status-message error-message" role="alert">
          {error}
        </p>
      ) : null}
      {!isLoading && !error && emptyState ? (
        <p className="status-message">{emptyState}</p>
      ) : null}

      {results.length > 0 ? (
        <section className="results-section" aria-label="Classifica distributori">
          <h2>Risultati</h2>
          <ol className="results-list">
            {results.map((result, index) => (
              <MobileStationResult
                index={index}
                key={result.station.id}
                result={result}
                winnerAdvantageLiters={winnerAdvantageLiters}
              />
            ))}
          </ol>
        </section>
      ) : null}
    </main>
  )
}
