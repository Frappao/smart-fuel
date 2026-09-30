'use client'

import { useRef, useState } from 'react'

import {
  fetchGeocodingResults,
  type GeocodingResult,
} from '../../lib/api/rifornioApiClient'

interface AddressSearchFieldProps {
  id: string
  label: string
  disabled?: boolean
  baseUrl?: string
  onSelect: (result: GeocodingResult | null) => void
}

export default function AddressSearchField({
  id,
  label,
  disabled = false,
  baseUrl,
  onSelect,
}: AddressSearchFieldProps) {
  const searchInFlight = useRef(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch() {
    const normalizedQuery = query.trim()

    if (searchInFlight.current || disabled) return

    if (normalizedQuery.length < 2) {
      setError('Inserisci almeno 2 caratteri.')
      setResults([])
      setSelectedId(null)
      onSelect(null)
      return
    }

    searchInFlight.current = true
    setIsSearching(true)
    setError(null)
    setResults([])
    setSelectedId(null)
    onSelect(null)

    try {
      const response = await fetchGeocodingResults(normalizedQuery, baseUrl)

      setResults(response.results)

      if (response.results.length === 0) {
        setError('Nessuna località trovata. Prova con un indirizzo più preciso.')
      }
    } catch {
      setError('Non riesco a cercare questa località. Riprova tra poco.')
    } finally {
      searchInFlight.current = false
      setIsSearching(false)
    }
  }

  const controlsDisabled = disabled || isSearching
  const resultsId = `${id}-results`

  return (
    <div className="flex min-w-0 flex-col gap-2" aria-busy={isSearching}>
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={id}
          className="min-h-12 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400 disabled:cursor-wait disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-emerald-400 dark:focus:ring-emerald-500"
          disabled={controlsDisabled}
          placeholder="Es. Piazza del Duomo, Milano"
          type="search"
          value={query}
          aria-describedby={results.length > 0 ? resultsId : undefined}
          onChange={(event) => {
            setQuery(event.target.value)
            setResults([])
            setSelectedId(null)
            setError(null)
            onSelect(null)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void handleSearch()
            }
          }}
        />
        <button
          className="min-h-12 rounded-lg border border-emerald-600 px-4 py-2.5 font-semibold text-emerald-700 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-60 dark:border-emerald-400 dark:text-emerald-200 dark:hover:bg-emerald-950"
          disabled={controlsDisabled}
          type="button"
          onClick={() => void handleSearch()}
        >
          {isSearching ? 'Ricerca…' : 'Cerca'}
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      {results.length > 0 ? (
        <fieldset
          className="mt-1 space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
          disabled={controlsDisabled}
          id={resultsId}
        >
          <legend className="px-1 text-sm font-medium">
            Seleziona una località
          </legend>
          {results.map((result, index) => {
            const resultId = `${id}-result-${index}`

            return (
              <label
                className="flex cursor-pointer gap-3 rounded-md p-2 text-sm leading-6 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                htmlFor={resultId}
                key={result.id}
              >
                <input
                  checked={selectedId === result.id}
                  className="mt-1 size-4 accent-emerald-600"
                  id={resultId}
                  name={`${id}-result`}
                  type="radio"
                  value={result.id}
                  onChange={() => {
                    setSelectedId(result.id)
                    onSelect(result)
                  }}
                />
                <span>{result.label}</span>
              </label>
            )
          })}
        </fieldset>
      ) : null}
    </div>
  )
}
