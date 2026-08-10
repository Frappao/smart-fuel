// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getCurrentPosition } from '../../lib/location/getCurrentPosition'
import LocationButton from './LocationButton'

vi.mock('../../lib/location/getCurrentPosition', () => ({
  getCurrentPosition: vi.fn(),
}))

describe('LocationButton', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows the initial button, loading state, and resolved coordinates', async () => {
    let resolvePosition!: (
      position: Awaited<ReturnType<typeof getCurrentPosition>>,
    ) => void
    const positionPromise = new Promise<
      Awaited<ReturnType<typeof getCurrentPosition>>
    >((resolve) => {
      resolvePosition = resolve
    })

    vi.mocked(getCurrentPosition).mockReturnValue(positionPromise)
    render(<LocationButton />)

    const initialButton = screen.getByRole('button', {
      name: 'Usa la mia posizione',
    })

    expect(initialButton).toBeTruthy()

    fireEvent.click(initialButton)

    const loadingButton = screen.getByRole('button', {
      name: 'Ricerca posizione...',
    })

    expect(loadingButton).toBeTruthy()

    resolvePosition({
      latitude: 45.4642,
      longitude: 9.19,
      accuracy: 20,
    })

    expect(await screen.findByText('Posizione trovata')).toBeTruthy()
    expect(screen.getByText('latitude: 45.4642')).toBeTruthy()
    expect(screen.getByText('longitude: 9.19')).toBeTruthy()
    expect(screen.getByText('accuracy: 20')).toBeTruthy()
  })

  it('shows a readable error and re-enables the button', async () => {
    vi.mocked(getCurrentPosition).mockRejectedValue(
      new Error('Il permesso alla posizione è stato negato.'),
    )
    render(<LocationButton />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Usa la mia posizione' }),
    )

    const alert = await screen.findByRole('alert')
    const button = screen.getByRole<HTMLButtonElement>('button', {
      name: 'Usa la mia posizione',
    })

    expect(alert.textContent).toBe(
      'Il permesso alla posizione è stato negato.',
    )
    expect(button.disabled).toBe(false)
  })
})
