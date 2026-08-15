import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../../../../lib/mimit/importMimitData', () => ({
  importMimitData: vi.fn(),
}))

import { importMimitData } from '../../../../lib/mimit/importMimitData'
import { GET } from './route'

const mockedImportMimitData = vi.mocked(importMimitData)

describe('GET /api/cron/import-mimit', () => {
  const originalCronSecret = process.env.CRON_SECRET

  beforeEach(() => {
    vi.clearAllMocks()
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
})