import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../../../lib/mimit/verifyPriceFreshness', () => ({
  verifyPriceFreshness: vi.fn(),
}))

import { verifyPriceFreshness } from '../../../lib/mimit/verifyPriceFreshness'
import { GET } from './route'

const mockedVerifyPriceFreshness = vi.mocked(verifyPriceFreshness)

describe('GET /api/price-freshness', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns 200 when price data is fresh', async () => {
    const report = {
      status: 'fresh' as const,
      isUpdating: true,
      checkedAt: '2026-10-26T10:30:00.000Z',
      totalStations: 23922,
      totalPrices: 92695,
      lastUpdatedAt: '2026-10-26T08:30:00.000Z',
      lastCommunicatedAt: '2026-10-25T08:01:19.000Z',
      hoursSinceLastImport: 2,
      hoursSinceLastCommunication: 26.5,
      communicatedLast24h: 12000,
      communicatedLast48h: 45000,
      communicatedLast7d: 89087,
      activeCoverage7dRatio: 0.9611,
    }
    mockedVerifyPriceFreshness.mockResolvedValue(report)

    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(report)
  })

  test('returns 503 with report when price data is stale', async () => {
    const report = {
      status: 'stale' as const,
      isUpdating: false,
      checkedAt: '2026-10-26T10:30:00.000Z',
      totalStations: 23961,
      totalPrices: 92674,
      lastUpdatedAt: '2026-10-16T08:51:08.082Z',
      lastCommunicatedAt: '2026-10-15T08:01:42.000Z',
      hoursSinceLastImport: 241.6,
      hoursSinceLastCommunication: 266.5,
      communicatedLast24h: 0,
      communicatedLast48h: 0,
      communicatedLast7d: 0,
      activeCoverage7dRatio: 0,
    }
    mockedVerifyPriceFreshness.mockResolvedValue(report)

    const response = await GET()

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual(report)
  })

  test('returns 500 when verification throws an unexpected error', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockedVerifyPriceFreshness.mockRejectedValue(new Error('DB connection lost'))

    const response = await GET()

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      error: 'Unable to verify price freshness.',
    })
    errorSpy.mockRestore()
  })
})
