import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createSupabaseServerClient } from '../supabase/server'
import {
  evaluatePriceFreshness,
  verifyPriceFreshness,
} from './verifyPriceFreshness'

vi.mock('../supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

describe('evaluatePriceFreshness', () => {
  const now = new Date('2026-10-26T10:30:00.000Z')

  it('classifies database as fresh when updated within 26h and communicated within 48h', () => {
    const report = evaluatePriceFreshness(
      {
        totalStations: 23922,
        totalPrices: 92695,
        lastUpdatedAt: '2026-10-26T08:30:00.000Z',
        lastCommunicatedAt: '2026-10-25T08:01:19.000Z',
        communicatedLast24h: 12000,
        communicatedLast48h: 45000,
        communicatedLast7d: 89087,
      },
      now,
    )

    expect(report).toEqual({
      status: 'fresh',
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
    })
  })

  it('classifies database as warning when import is between 26h and 50h old', () => {
    const report = evaluatePriceFreshness(
      {
        totalStations: 23922,
        totalPrices: 92695,
        lastUpdatedAt: '2026-10-25T06:30:00.000Z',
        lastCommunicatedAt: '2026-10-24T08:00:00.000Z',
        communicatedLast24h: 0,
        communicatedLast48h: 15000,
        communicatedLast7d: 80000,
      },
      now,
    )

    expect(report.status).toBe('warning')
    expect(report.isUpdating).toBe(false)
    expect(report.hoursSinceLastImport).toBe(28)
  })

  it('classifies database as stale when import is older than 50h', () => {
    const report = evaluatePriceFreshness(
      {
        totalStations: 23961,
        totalPrices: 92674,
        lastUpdatedAt: '2026-10-16T08:51:08.082Z',
        lastCommunicatedAt: '2026-10-15T08:01:42.000Z',
        communicatedLast24h: 0,
        communicatedLast48h: 0,
        communicatedLast7d: 0,
      },
      now,
    )

    expect(report.status).toBe('stale')
    expect(report.isUpdating).toBe(false)
    expect(report.hoursSinceLastImport).toBe(241.6)
  })

  it('classifies database as empty when totalPrices is 0', () => {
    const report = evaluatePriceFreshness(
      {
        totalStations: 0,
        totalPrices: 0,
        lastUpdatedAt: null,
        lastCommunicatedAt: null,
        communicatedLast24h: 0,
        communicatedLast48h: 0,
        communicatedLast7d: 0,
      },
      now,
    )

    expect(report.status).toBe('empty')
    expect(report.isUpdating).toBe(false)
    expect(report.activeCoverage7dRatio).toBe(0)
  })
})

describe('verifyPriceFreshness', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('queries Supabase and returns a freshness report', async () => {
    const from = vi.fn((table: string) => {
      if (table === 'stations') {
        return {
          select: vi.fn().mockResolvedValue({ count: 23922, error: null }),
        }
      }

      return {
        select: vi.fn((columns: string, options?: { head?: boolean }) => {
          if (options?.head) {
            return {
              count: 92695,
              error: null,
              gte: vi.fn((_col: string, iso: string) => {
                if (iso.startsWith('2026-10-25')) {
                  return Promise.resolve({ count: 12000, error: null })
                }
                if (iso.startsWith('2026-10-24')) {
                  return Promise.resolve({ count: 45000, error: null })
                }
                return Promise.resolve({ count: 89087, error: null })
              }),
            }
          }

          if (columns === 'updated_at') {
            return {
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: [{ updated_at: '2026-10-26T08:30:00.000Z' }],
                  error: null,
                }),
              })),
            }
          }

          return {
            not: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: [{ communicated_at: '2026-10-25T08:01:19.000Z' }],
                  error: null,
                }),
              })),
            })),
          }
        }),
      }
    })

    vi.mocked(createSupabaseServerClient).mockReturnValue({
      from,
    } as unknown as ReturnType<typeof createSupabaseServerClient>)

    const report = await verifyPriceFreshness(
      new Date('2026-10-26T10:30:00.000Z'),
    )

    expect(report.status).toBe('fresh')
    expect(report.isUpdating).toBe(true)
    expect(report.totalStations).toBe(23922)
    expect(report.totalPrices).toBe(92695)
    expect(report.communicatedLast7d).toBe(89087)
  })
})
