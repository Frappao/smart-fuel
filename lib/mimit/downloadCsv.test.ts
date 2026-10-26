import { afterEach, describe, expect, it, vi } from 'vitest'

import { downloadCsv } from './downloadCsv'

describe('downloadCsv', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
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
      downloadCsv('https://example.test/stations.csv'),
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
      downloadCsv('https://example.test/stations.csv'),
    ).rejects.toThrow(/received HTML instead of CSV/)
  })
})
