import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../../../../lib/mimit/importMimitData', () => ({
  importMimitData: vi.fn(),
}))

vi.mock('../../../../lib/mimit/recordImportRun', () => ({
  recordImportRun: vi.fn(),
}))

vi.mock('../../../../lib/mimit/snapshotCityPrices', () => ({
  snapshotCityPrices: vi.fn(),
}))

import { importMimitData } from '../../../../lib/mimit/importMimitData'
import { recordImportRun } from '../../../../lib/mimit/recordImportRun'
import { snapshotCityPrices } from '../../../../lib/mimit/snapshotCityPrices'
import { GET } from './route'

const mockedImportMimitData = vi.mocked(importMimitData)
const mockedRecordImportRun = vi.mocked(recordImportRun)
const mockedSnapshotCityPrices = vi.mocked(snapshotCityPrices)

describe('GET /api/cron/import-mimit', () => {
  const originalCronSecret = process.env.CRON_SECRET

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET
    } else {
      process.env.CRON_SECRET = originalCronSecret
    }
  })

  test('returns 503 when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET

    const response = await GET(
      new Request('https://rifornio.it/api/cron/import-mimit'),
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'Cron import is not configured.',
    })
    expect(mockedImportMimitData).not.toHaveBeenCalled()
  })

  test('returns 401 when authorization is missing or invalid', async () => {
    process.env.CRON_SECRET = 'test-secret'

    const response = await GET(
      new Request('https://rifornio.it/api/cron/import-mimit', {
        headers: {
          authorization: 'Bearer wrong-secret',
        },
      }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'Unauthorized.',
    })
    expect(mockedImportMimitData).not.toHaveBeenCalled()
  })

  test('runs the import when authorization is valid', async () => {
    process.env.CRON_SECRET = 'test-secret'

    mockedImportMimitData.mockResolvedValue({
      stations: {
        totalParsed: 23961,
        totalImported: 23961,
      },
      fuelPrices: {
        totalParsed: 93108,
        totalImported: 93108,
        totalSkipped: 0,
      },
    })

    const response = await GET(
      new Request('https://rifornio.it/api/cron/import-mimit', {
        headers: {
          authorization: 'Bearer test-secret',
        },
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      success: true,
      stations: {
        totalParsed: 23961,
        totalImported: 23961,
      },
      fuelPrices: {
        totalParsed: 93108,
        totalImported: 93108,
        totalSkipped: 0,
      },
    })
    expect(mockedImportMimitData).toHaveBeenCalledOnce()
  })

  test('records a successful run in import_runs', async () => {
    process.env.CRON_SECRET = 'test-secret'
    mockedImportMimitData.mockResolvedValue({
      stations: { totalParsed: 10, totalImported: 10 },
      fuelPrices: { totalParsed: 30, totalImported: 28, totalSkipped: 2 },
    })

    await GET(
      new Request('https://rifornio.it/api/cron/import-mimit', {
        headers: { authorization: 'Bearer test-secret' },
      }),
    )

    expect(mockedRecordImportRun).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        stationsImported: 10,
        fuelPricesImported: 28,
        fuelPricesSkipped: 2,
      }),
    )
  })

  test('saves the city price snapshot only after a successful import', async () => {
    process.env.CRON_SECRET = 'test-secret'
    mockedImportMimitData.mockResolvedValue({
      stations: { totalParsed: 10, totalImported: 10 },
      fuelPrices: { totalParsed: 30, totalImported: 30, totalSkipped: 0 },
    })
    mockedSnapshotCityPrices.mockResolvedValue(381)

    const response = await GET(
      new Request('https://rifornio.it/api/cron/import-mimit', {
        headers: { authorization: 'Bearer test-secret' },
      }),
    )

    expect(response.status).toBe(200)
    expect(mockedSnapshotCityPrices).toHaveBeenCalledOnce()
  })

  test('keeps the run successful when the city snapshot is not saved', async () => {
    process.env.CRON_SECRET = 'test-secret'
    mockedImportMimitData.mockResolvedValue({
      stations: { totalParsed: 10, totalImported: 10 },
      fuelPrices: { totalParsed: 30, totalImported: 30, totalSkipped: 0 },
    })
    mockedSnapshotCityPrices.mockResolvedValue(null)

    const response = await GET(
      new Request('https://rifornio.it/api/cron/import-mimit', {
        headers: { authorization: 'Bearer test-secret' },
      }),
    )

    expect(response.status).toBe(200)
    expect(mockedRecordImportRun).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'success' }),
    )
  })

  test('returns 500 and records the error when the import fails', async () => {
    process.env.CRON_SECRET = 'test-secret'
    mockedImportMimitData.mockRejectedValue(
      new Error('Download CSV failed after 3 attempts: fetch failed'),
    )

    const response = await GET(
      new Request('https://rifornio.it/api/cron/import-mimit', {
        headers: { authorization: 'Bearer test-secret' },
      }),
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'Unable to import MIMIT data.',
    })
    expect(mockedRecordImportRun).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        errorMessage: 'Download CSV failed after 3 attempts: fetch failed',
      }),
    )
    expect(mockedSnapshotCityPrices).not.toHaveBeenCalled()
  })
})
