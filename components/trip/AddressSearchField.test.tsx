// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchGeocodingResults } from '../../lib/api/rifornioApiClient'
import AddressSearchField from './AddressSearchField'

vi.mock('../../lib/api/rifornioApiClient', () => ({
  fetchGeocodingResults: vi.fn(),
}))

const milano = {
  id: 'milano',
  label: 'Milano, Lombardia, Italia',
  latitude: 45.4642,
  longitude: 9.19,
}
const milanoCentrale = {
  id: 'milano-centrale',
  label: 'Milano Centrale, Piazza Duca d’Aosta, Milano',
  latitude: 45.4863,
  longitude: 9.2045,
}

describe('AddressSearchField', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('searches a normalized query and requires an explicit result selection', async () => {
    const onSelect = vi.fn()
    vi.mocked(fetchGeocodingResults).mockResolvedValue({
      results: [milano, milanoCentrale],
    })
    render(
      <AddressSearchField
        id="destination"
        label="Destinazione"
        onSelect={onSelect}
      />,
    )

    fireEvent.change(screen.getByLabelText('Destinazione'), {
      target: { value: '  Milano  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cerca' }))

    expect(await screen.findByText(milano.label)).toBeTruthy()
    expect(fetchGeocodingResults).toHaveBeenCalledWith('Milano', undefined)
    expect(onSelect).toHaveBeenLastCalledWith(null)

    fireEvent.click(screen.getByLabelText(milanoCentrale.label))
    expect(onSelect).toHaveBeenLastCalledWith(milanoCentrale)
  })

  it('clears the selected location when the query changes', async () => {
    const onSelect = vi.fn()
    vi.mocked(fetchGeocodingResults).mockResolvedValue({ results: [milano] })
    render(
      <AddressSearchField id="origin" label="Partenza" onSelect={onSelect} />,
    )

    fireEvent.change(screen.getByLabelText('Partenza'), {
      target: { value: 'Milano' },
    })
    fireEvent.keyDown(screen.getByLabelText('Partenza'), { key: 'Enter' })
    fireEvent.click(await screen.findByLabelText(milano.label))
    fireEvent.change(screen.getByLabelText('Partenza'), {
      target: { value: 'Bologna' },
    })

    expect(onSelect).toHaveBeenLastCalledWith(null)
    expect(screen.queryByText(milano.label)).toBeNull()
  })

  it('blocks concurrent searches and restores controls after an error', async () => {
    let rejectSearch!: (reason: Error) => void
    vi.mocked(fetchGeocodingResults).mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectSearch = reject
      }),
    )
    const onSelect = vi.fn()
    render(
      <AddressSearchField
        id="destination"
        label="Destinazione"
        onSelect={onSelect}
      />,
    )
    const input = screen.getByLabelText<HTMLInputElement>('Destinazione')

    fireEvent.change(input, { target: { value: 'Roma' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cerca' }))

    expect(fetchGeocodingResults).toHaveBeenCalledOnce()
    expect(input.disabled).toBe(true)
    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Ricerca…' })
        .disabled,
    ).toBe(true)

    fireEvent.keyDown(input, { key: 'Enter' })
    expect(fetchGeocodingResults).toHaveBeenCalledOnce()

    await act(async () => {
      rejectSearch(new Error('network error'))
    })

    expect(screen.getByRole('alert').textContent).toContain(
      'Non riesco a cercare questa località',
    )
    expect(input.disabled).toBe(false)
    expect(screen.getByRole('button', { name: 'Cerca' })).toBeTruthy()
  })

  it('validates short queries and reports empty results', async () => {
    const onSelect = vi.fn()
    render(
      <AddressSearchField
        id="destination"
        label="Destinazione"
        onSelect={onSelect}
      />,
    )

    fireEvent.change(screen.getByLabelText('Destinazione'), {
      target: { value: 'a' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cerca' }))
    expect(screen.getByRole('alert').textContent).toBe(
      'Inserisci almeno 2 caratteri.',
    )
    expect(fetchGeocodingResults).not.toHaveBeenCalled()

    vi.mocked(fetchGeocodingResults).mockResolvedValueOnce({ results: [] })
    fireEvent.change(screen.getByLabelText('Destinazione'), {
      target: { value: 'Località inesistente' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cerca' }))
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Nessuna località trovata',
    )
  })
})
