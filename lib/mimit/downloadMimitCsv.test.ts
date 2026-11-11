import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createSupabaseServerClient } from '../supabase/server'
import { MIMIT_FUEL_PRICES_CSV_URL, MIMIT_STATIONS_CSV_URL } from './constants'
import { downloadCsv } from './downloadCsv'
import { downloadMimitCsv } from './downloadMimitCsv'

vi.mock('../supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))
vi.mock('./downloadCsv', () => ({ downloadCsv: vi.fn() }))

const rpc = vi.fn()
const NO_DELAYS = { relayRetryDelaysMs: [0] }

describe('downloadMimitCsv', () => {
  beforeEach(() => {
    rpc.mockReset()
    vi.mocked(downloadCsv).mockReset()
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      rpc,
    } as unknown as ReturnType<typeof createSupabaseServerClient>)
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('usa il download diretto quando MIMIT risponde, senza passare dal database', async () => {
    vi.mocked(downloadCsv).mockResolvedValue('csv diretto')

    await expect(downloadMimitCsv('stations')).resolves.toBe('csv diretto')

    expect(downloadCsv).toHaveBeenCalledWith(MIMIT_STATIONS_CSV_URL, {
      attempts: 1,
    })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('ripiega sul database quando il download diretto fallisce (cron Vercel)', async () => {
    vi.mocked(downloadCsv).mockRejectedValue(
      new Error('fetch failed (UND_ERR_CONNECT_TIMEOUT)'),
    )
    rpc.mockResolvedValue({ data: 'Estrazione del 2026-11-10\ncsv', error: null })

    await expect(downloadMimitCsv('fuel_prices', NO_DELAYS)).resolves.toBe(
      'Estrazione del 2026-11-10\ncsv',
    )

    expect(downloadCsv).toHaveBeenCalledWith(MIMIT_FUEL_PRICES_CSV_URL, {
      attempts: 1,
    })
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('fetch_mimit_csv', {
      dataset: 'fuel_prices',
    })
  })

  it('riprova il database dopo un errore temporaneo', async () => {
    vi.mocked(downloadCsv).mockRejectedValue(new Error('timeout'))
    rpc
      .mockResolvedValueOnce({ data: null, error: { message: 'HTTP 503' } })
      .mockResolvedValueOnce({ data: 'csv', error: null })

    await expect(downloadMimitCsv('stations', NO_DELAYS)).resolves.toBe('csv')
    expect(rpc).toHaveBeenCalledTimes(2)
  })

  it('scarta risposte vuote o HTML del WAF anche dal database', async () => {
    vi.mocked(downloadCsv).mockRejectedValue(new Error('timeout'))
    rpc
      .mockResolvedValueOnce({ data: '', error: null })
      .mockResolvedValueOnce({ data: '<html>Request Rejected</html>', error: null })
      .mockResolvedValueOnce({ data: null, error: null })

    await expect(downloadMimitCsv('stations', NO_DELAYS)).rejects.toThrow(
      /Via database: fetch_mimit_csv returned an empty response/,
    )
    expect(rpc).toHaveBeenCalledTimes(3)
  })

  it('riporta entrambi gli errori se falliscono tutti e due i percorsi', async () => {
    vi.mocked(downloadCsv).mockRejectedValue(
      new Error('fetch failed (UND_ERR_CONNECT_TIMEOUT)'),
    )
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'function public.fetch_mimit_csv does not exist' },
    })

    await expect(downloadMimitCsv('fuel_prices', NO_DELAYS)).rejects.toThrow(
      /Direct: fetch failed \(UND_ERR_CONNECT_TIMEOUT\)\. Via database: fetch_mimit_csv failed: function public\.fetch_mimit_csv does not exist/,
    )
    expect(rpc).toHaveBeenCalledTimes(3)
  })
})
