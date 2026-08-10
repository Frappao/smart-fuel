import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createSupabaseServerClient } from '../supabase/server'
import { MIMIT_STATIONS_CSV_URL } from './constants'
import { downloadCsv } from './downloadCsv'
import { importMimitStations } from './importMimitStations'
import { parseStationsCsv } from './parseStationsCsv'
import type { MimitStationRow } from './types'

vi.mock('../supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))
vi.mock('./downloadCsv', () => ({ downloadCsv: vi.fn() }))
vi.mock('./parseStationsCsv', () => ({ parseStationsCsv: vi.fn() }))

interface MockDatabaseError {
  message: string
}

function makeStation(mimitId: number): MimitStationRow {
  return {
    mimitId,
    manager: `Manager ${mimitId}`,
    brand: 'Fuel Smart',
    stationType: 'Stradale',
    name: `Station ${mimitId}`,
    address: `Via Test ${mimitId}`,
    city: 'Roma',
    province: 'RM',
    latitude: 41.9028,
    longitude: 12.4964,
  }
}

function arrangeSupabaseClient({
  upsertErrors = [],
  cleanupError = null,
}: {
  upsertErrors?: Array<MockDatabaseError | null>
  cleanupError?: MockDatabaseError | null
} = {}) {
  const upsert = vi.fn().mockResolvedValue({ error: null })

  for (const error of upsertErrors) {
    upsert.mockResolvedValueOnce({ error })
  }

  const lt = vi.fn().mockResolvedValue({ error: cleanupError })
  const deleteRows = vi.fn(() => ({ lt }))
  const from = vi.fn(() => ({ upsert, delete: deleteRows }))

  vi.mocked(createSupabaseServerClient).mockReturnValue({
    from,
  } as unknown as ReturnType<typeof createSupabaseServerClient>)

  return { deleteRows, from, lt, upsert }
}

describe('importMimitStations', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-10T08:30:00.000Z'))
    vi.mocked(downloadCsv).mockResolvedValue('stations csv')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('imports every station in batches of 500, then cleans up stale rows', async () => {
    const stations = Array.from({ length: 501 }, (_, index) =>
      makeStation(index + 1),
    )
    vi.mocked(parseStationsCsv).mockReturnValue(stations)
    const { deleteRows, lt, upsert } = arrangeSupabaseClient()

    await expect(importMimitStations()).resolves.toEqual({
      totalParsed: 501,
      totalImported: 501,
    })

    expect(downloadCsv).toHaveBeenCalledWith(MIMIT_STATIONS_CSV_URL)
    expect(parseStationsCsv).toHaveBeenCalledWith('stations csv')
    expect(upsert).toHaveBeenCalledTimes(2)
    expect(upsert.mock.calls[0][0]).toHaveLength(500)
    expect(upsert.mock.calls[1][0]).toHaveLength(1)
    expect(upsert.mock.calls[0][0][0]).toEqual(
      expect.objectContaining({ mimit_id: 1 }),
    )
    expect(upsert).toHaveBeenNthCalledWith(
      1,
      expect.any(Array),
      { onConflict: 'mimit_id' },
    )
    expect(upsert).toHaveBeenNthCalledWith(
      2,
      expect.any(Array),
      { onConflict: 'mimit_id' },
    )
    expect(lt).toHaveBeenCalledWith(
      'updated_at',
      '2026-08-10T08:30:00.000Z',
    )
    expect(upsert.mock.invocationCallOrder[1]).toBeLessThan(
      deleteRows.mock.invocationCallOrder[0],
    )
  })

  it('propagates a batch error and does not run cleanup', async () => {
    vi.mocked(parseStationsCsv).mockReturnValue(
      Array.from({ length: 501 }, (_, index) => makeStation(index + 1)),
    )
    const { deleteRows, upsert } = arrangeSupabaseClient({
      upsertErrors: [null, { message: 'write failed' }],
    })

    await expect(importMimitStations()).rejects.toThrow(
      'MIMIT stations import failed for batch 2: write failed',
    )

    expect(upsert).toHaveBeenCalledTimes(2)
    expect(deleteRows).not.toHaveBeenCalled()
  })

  it('propagates a cleanup error after all batches succeed', async () => {
    vi.mocked(parseStationsCsv).mockReturnValue([makeStation(1)])
    const { deleteRows, upsert } = arrangeSupabaseClient({
      cleanupError: { message: 'cleanup failed' },
    })

    await expect(importMimitStations()).rejects.toThrow(
      'MIMIT stations cleanup failed: cleanup failed',
    )

    expect(upsert).toHaveBeenCalledOnce()
    expect(deleteRows).toHaveBeenCalledOnce()
  })
})
