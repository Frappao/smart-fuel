'use client'

import { useState } from 'react'

import {
  getCurrentPosition,
  type CurrentPosition,
} from '../../lib/location/getCurrentPosition'

interface NearbyStation {
  id: number
  name: string | null
  brand: string | null
  address: string | null
  city: string | null
  distanceMeters: number
}

interface NearbyStationsResponse {
  stations: NearbyStation[]
}

const distanceFormatter = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
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

export default function LocationButton() {
  const [position, setPosition] = useState<CurrentPosition | null>(null)
  const [stations, setStations] = useState<NearbyStation[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleClick() {
    setIsLoading(true)
    setPosition(null)
    setStations([])
    setError(null)

    try {
      const currentPosition = await getCurrentPosition()
      setPosition(currentPosition)

      const searchParams = new URLSearchParams({
        lat: String(currentPosition.latitude),
        lng: String(currentPosition.longitude),
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
          'Non è stato possibile trovare i distributori vicini. Riprova.',
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

      setStations(responseBody.stations.slice(0, 20))
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Non è stato possibile recuperare la posizione.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Ricerca posizione...' : 'Usa la mia posizione'}
      </button>

      {position ? (
        <div aria-live="polite">
          <p>Posizione trovata</p>
          <p>latitude: {position.latitude}</p>
          <p>longitude: {position.longitude}</p>
          <p>accuracy: {position.accuracy}</p>
        </div>
      ) : null}

      {stations.length > 0 ? (
        <ol className="list-decimal space-y-4 pl-6">
          {stations.map((station) => {
            const displayName = station.name ?? station.brand ?? 'Distributore'
            const distanceKilometers = distanceFormatter.format(
              station.distanceMeters / 1_000,
            )

            return (
              <li key={station.id}>
                <p>
                  {displayName} - {distanceKilometers} km
                </p>
                {station.brand && station.brand !== displayName ? (
                  <p>{station.brand}</p>
                ) : null}
                {station.address ? <p>{station.address}</p> : null}
                {station.city ? <p>{station.city}</p> : null}
              </li>
            )
          })}
        </ol>
      ) : null}

      {position && !isLoading && !error && stations.length === 0 ? (
        <p>Nessun distributore trovato entro 15 km.</p>
      ) : null}

      {error ? <p role="alert">{error}</p> : null}
    </div>
  )
}
