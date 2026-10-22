import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSupabaseServerClient } from '../supabase/server'
import { getCityStations } from './getCityStations'

vi.mock('../supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

describe('getCityStations', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('queries stations by city and calculates fuel stats', async () => {
    const mockSelect = vi.fn().mockReturnThis()
    const mockIlike = vi.fn().mockReturnThis()
    const mockLimit = vi.fn().mockResolvedValue({
      data: [
        {
          id: 1,
          mimit_id: 101,
          name: 'Stazione Saronno Nord',
          brand: 'Q8',
          address: 'Via Milano 10',
          city: 'Saronno',
          province: 'VA',
          latitude: 45.625,
          longitude: 9.034,
          fuel_prices: [
            { fuel_type: 'Benzina', price: 1.789, is_self: true, communicated_at: '2026-10-22' },
            { fuel_type: 'Gasolio', price: 1.689, is_self: true, communicated_at: '2026-10-22' },
          ],
        },
        {
          id: 2,
          mimit_id: 102,
          name: 'Stazione Saronno Centro',
          brand: 'Eni',
          address: 'Corso Italia 5',
          city: 'Saronno',
          province: 'VA',
          latitude: 45.627,
          longitude: 9.038,
          fuel_prices: [
            { fuel_type: 'Benzina', price: 1.829, is_self: true, communicated_at: '2026-10-22' },
            { fuel_type: 'Gasolio', price: 1.719, is_self: true, communicated_at: '2026-10-22' },
            { fuel_type: 'GPL', price: 0.729, is_self: false, communicated_at: '2026-10-22' },
          ],
        },
      ],
      error: null,
    })

    vi.mocked(createSupabaseServerClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: mockSelect,
      }),
    } as unknown as ReturnType<typeof createSupabaseServerClient>)

    mockSelect.mockReturnValue({
      ilike: mockIlike,
    })
    mockIlike.mockReturnValue({
      limit: mockLimit,
    })

    const result = await getCityStations('Saronno')

    expect(result.cityName).toBe('Saronno')
    expect(result.province).toBe('VA')
    expect(result.stations).toHaveLength(2)
    expect(result.stats.benzinaSelf).toEqual({
      min: 1.789,
      max: 1.829,
      avg: 1.809,
      stationCount: 2,
    })
    expect(result.stats.gasolioSelf).toEqual({
      min: 1.689,
      max: 1.719,
      avg: 1.704,
      stationCount: 2,
    })
    expect(result.stats.gpl).toEqual({
      min: 0.729,
      max: 0.729,
      avg: 0.729,
      stationCount: 1,
    })
  })

  it('handles client errors gracefully without throwing', async () => {
    vi.mocked(createSupabaseServerClient).mockImplementation(() => {
      throw new Error('Missing environment variable')
    })

    const result = await getCityStations('Saronno')
    expect(result.cityName).toBe('Saronno')
    expect(result.stations).toEqual([])
    expect(result.stats).toEqual({})
  })

  it('sanitizes bracketed and encoded inputs like %5Bsaronno%5D and [saronno]', async () => {
    const mockSelect = vi.fn().mockReturnThis()
    const mockIlike = vi.fn().mockReturnThis()
    const mockLimit = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    })

    vi.mocked(createSupabaseServerClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: mockSelect,
      }),
    } as unknown as ReturnType<typeof createSupabaseServerClient>)

    mockSelect.mockReturnValue({
      ilike: mockIlike,
    })
    mockIlike.mockReturnValue({
      limit: mockLimit,
    })

    await getCityStations('%5Bsaronno%5D')
    expect(mockIlike).toHaveBeenCalledWith('city', 'saronno')
  })
})

