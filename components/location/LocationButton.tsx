'use client'

import { useState } from 'react'

import {
  getCurrentPosition,
  type CurrentPosition,
} from '../../lib/location/getCurrentPosition'

export default function LocationButton() {
  const [position, setPosition] = useState<CurrentPosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleClick() {
    setIsLoading(true)
    setPosition(null)
    setError(null)

    try {
      const currentPosition = await getCurrentPosition()
      setPosition(currentPosition)
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

      {error ? <p role="alert">{error}</p> : null}
    </div>
  )
}
