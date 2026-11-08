import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { downloadCsv } from './downloadCsv'

const NO_RETRY_DELAY = { retryDelaysMs: [0] }

describe('downloadCsv', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('restituisce esattamente il CSV per una risposta HTTP valida', async () => {
    const csv = 'idImpianto|Gestore\n59183|ENIMOOV S.P.A.\n'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue(csv),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(downloadCsv('https://example.test/stations.csv')).resolves.toBe(
      csv,
    )
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.test/stations.csv',
      {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Accept: 'text/csv,text/plain;q=0.9,*/*;q=0.8',
          'Accept-Language': 'it-IT,it;q=0.9',
          'User-Agent':
            'Mozilla/5.0 (compatible; Rifornio/1.0; +https://rifornio.it)',
        },
        signal: expect.any(AbortSignal),
      },
    )
  })

  it('lancia un errore contenente lo status per una risposta HTTP non valida', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }),
    )

    await expect(
      downloadCsv('https://example.test/stations.csv', NO_RETRY_DELAY),
    ).rejects.toThrow(/500/)
  })

  it('rifiuta risposte HTML (es. pagina di blocco WAF) restituite con status 200', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: vi
          .fn()
          .mockResolvedValue(
            '<html><head><title>Request Rejected</title></head><body>The requested URL was rejected.</body></html>',
          ),
      }),
    )

    await expect(
      downloadCsv('https://example.test/stations.csv', NO_RETRY_DELAY),
    ).rejects.toThrow(/received HTML instead of CSV/)
  })

  it('riprova dopo un errore di rete e restituisce il CSV al secondo tentativo', async () => {
    const csv = 'idImpianto|Gestore\n1|TEST\n'
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(
        new TypeError('fetch failed', {
          cause: { code: 'UND_ERR_CONNECT_TIMEOUT' },
        }),
      )
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(csv),
      })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      downloadCsv('https://example.test/stations.csv', NO_RETRY_DELAY),
    ).resolves.toBe(csv)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('fallisce dopo 3 tentativi riportando la causa', async () => {
    const fetchMock = vi.fn().mockRejectedValue(
      new TypeError('fetch failed', {
        cause: { code: 'UND_ERR_CONNECT_TIMEOUT' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      downloadCsv('https://example.test/stations.csv', NO_RETRY_DELAY),
    ).rejects.toThrow(
      /failed after 3 attempts: fetch failed \(UND_ERR_CONNECT_TIMEOUT\)/,
    )
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
