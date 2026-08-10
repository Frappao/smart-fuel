import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createSupabaseServerClient } from '../supabase/server'
import { MIMIT_FUEL_PRICES_CSV_URL } from './constants'
import { downloadCsv } from './downloadCsv'
import { importMimitFuelPrices } from './importMimitFuelPrices'
import { parseFuelPricesCsv } from './parseFuelPricesCsv'
import type { MimitFuelPriceRow } from './types'

vi.mock('../supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))
vi.mock('./downloadCsv', () => ({ downloadCsv: vi.fn() }))
vi.mock('./parseFuelPricesCsv', () => ({ parseFuelPricesCsv: vi.fn() }))

interface MockDatabaseError {
  message: string
}

interface StationLookupRow {
  id: number
  mimit_id: number
}

interface StationPage {
  data: StationLookupRow[] | null
  error: MockDatabaseError | null
}

function makeFuelPrice(mimitId: number): MimitFuelPriceRow {
  return {
    mimitId,
    fuelType: 'Benzina',
    price: 1.799,
    isSelf: true,
    communicatedAt: '06/08/2026 13:30:09',
  }
}

function arrangeSupabaseClient({
  stationPages,
  upsertErrors = [],
  cleanupError = null,
}: {
  stationPages: StationPage[]
  upsertErrors?: Array<MockDatabaseError | null>
  cleanupError?: MockDatabaseError | null
}) {
  const range = vi.fn()

  for (const page of stationPages) {
    range.mockResolvedValueOnce(page)
  }

  const select = vi.fn(() => ({ range }))
  const upsert = vi.fn().mockResolvedValue({ error: null })

  for (const error of upsertErrors) {
    upsert.mockResolvedValueOnce({ error })
  }

  const lt = vi.fn().mockResolvedValue({ error: cleanupError })
  const deleteRows = vi.fn(() => ({ lt }))
  const from = vi.fn((table: string) => {
    if (table === 'stations') {
      return { select }
    }

    return { upsert, delete: deleteRows }
  })

  vi.mocked(createSupabaseServerClient).mockReturnValue({
    from,
  } as unknown as ReturnType<typeof createSupabaseServerClient>)

  return { deleteRows, from, lt, range, select, upsert }
}

describe('importMimitFuelPrices', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-10T08:30:00.000Z'))
    vi.mocked(downloadCsv).mockResolvedValue('fuel prices csv')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('paginates all stations, imports matched prices in batches, and skips unmatched prices', async () => {
    const firstPage = Array.from({ length: 1_000 }, (_, index) => ({
      id: index + 10_000,
      mimit_id: index + 1,
    }))
    const secondPage = [{ id: 11_000, mimit_id: 1_001 }]
    const prices = [
      ...Array.from({ length: 501 }, (_, index) => makeFuelPrice(index + 1)),
      makeFuelPrice(999_999),
    ]
    vi.mocked(parseFuelPricesCsv).mockReturnValue(prices)
    const { deleteRows, lt, range, upsert } = arrangeSupabaseClient({
      stationPages: [
        { data: firstPage, error: null },
        { data: secondPage, error: null },
      ],
    })

    await expect(importMimitFuelPrices()).resolves.toEqual({
      totalParsed: 502,
      totalImported: 501,
      totalSkipped: 1,
    })

    expect(downloadCsv).toHaveBeenCalledWith(MIMIT_FUEL_PRICES_CSV_URL)
    expect(parseFuelPricesCsv).toHaveBeenCalledWith('fuel prices csv')
    expect(range).toHaveBeenNthCalledWith(1, 0, 999)
    expect(range).toHaveBeenNthCalledWith(2, 1_000, 1_999)
    expect(upsert).toHaveBeenCalledTimes(2)
    expect(upsert.mock.calls[0][0]).toHaveLength(500)
    expect(upsert.mock.calls[1][0]).toHaveLength(1)
    expect(upsert.mock.calls[0][0][0]).toEqual(
      expect.objectContaining({
        station_id: 10_000,
        fuel_type: 'Benzina',
      }),
    )
    expect(upsert).toHaveBeenNthCalledWith(1, expect.any(Array), {
      onConflict: 'station_id,fuel_type,is_self',
    })
    expect(upsert).toHaveBeenNthCalledWith(2, expect.any(Array), {
      onConflict: 'station_id,fuel_type,is_self',
    })
    expect(lt).toHaveBeenCalledWith(
      'updated_at',
      '2026-08-10T08:30:00.000Z',
    )
    expect(upsert.mock.invocationCallOrder[1]).toBeLessThan(
      deleteRows.mock.invocationCallOrder[0],
    )
  })

  it('propagates a station pagination error before importing or cleaning up', async () => {
    const fullPage = Array.from({ length: 1_000 }, (_, index) => ({
      id: index + 1,
      mimit_id: index + 1,
    }))
    vi.mocked(parseFuelPricesCsv).mockReturnValue([makeFuelPrice(1)])
    const { deleteRows, range, upsert } = arrangeSupabaseClient({
      stationPages: [
        { data: fullPage, error: null },
        { data: null, error: { message: 'page unavailable' } },
      ],
    })

    await expect(importMimitFuelPrices()).rejects.toThrow(
      'MIMIT fuel prices import failed while loading stations page 2: page unavailable',
    )

    expect(range).toHaveBeenCalledTimes(2)
    expect(upsert).not.toHaveBeenCalled()
    expect(deleteRows).not.toHaveBeenCalled()
  })

  it('propagates an upsert error and does not run cleanup', async () => {
    const stations = Array.from({ length: 501 }, (_, index) => ({
      id: index + 1_000,
      mimit_id: index + 1,
    }))
    vi.mocked(parseFuelPricesCsv).mockReturnValue(
      Array.from({ length: 501 }, (_, index) => makeFuelPrice(index + 1)),
    )
    const { deleteRows, upsert } = arrangeSupabaseClient({
      stationPages: [{ data: stations, error: null }],
      upsertErrors: [null, { message: 'write failed' }],
    })

    await expect(importMimitFuelPrices()).rejects.toThrow(
      'MIMIT fuel prices import failed for batch 2: write failed',
    )

    expect(upsert).toHaveBeenCalledTimes(2)
    expect(deleteRows).not.toHaveBeenCalled()
  })

  it('propagates a cleanup error after every price batch succeeds', async () => {
    vi.mocked(parseFuelPricesCsv).mockReturnValue([makeFuelPrice(7)])
    const { deleteRows, upsert } = arrangeSupabaseClient({
      stationPages: [{ data: [{ id: 70, mimit_id: 7 }], error: null }],
      cleanupError: { message: 'cleanup failed' },
    })

    await expect(importMimitFuelPrices()).rejects.toThrow(
      'MIMIT fuel prices cleanup failed: cleanup failed',
    )

    expect(upsert).toHaveBeenCalledOnce()
    expect(deleteRows).toHaveBeenCalledOnce()
  })
})
