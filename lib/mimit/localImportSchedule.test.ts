import { afterEach, describe, expect, it, vi } from 'vitest'

import { getMimitFilesLastModified, isImportNeeded } from './localImportSchedule'

function headResponse(lastModified: string | null, ok = true) {
  return {
    ok,
    headers: new Headers(lastModified ? { 'last-modified': lastModified } : {}),
  }
}

describe('isImportNeeded', () => {
  const published = new Date('2026-11-08T07:45:03Z')

  it('serve se non c’è mai stato un import riuscito', () => {
    expect(isImportNeeded(published, null)).toBe(true)
  })

  it('serve se l’ultimo import è precedente alla pubblicazione', () => {
    expect(isImportNeeded(published, new Date('2026-11-08T01:26:28Z'))).toBe(true)
  })

  it('non serve se il file è già stato importato', () => {
    expect(isImportNeeded(published, new Date('2026-11-08T08:40:00Z'))).toBe(false)
  })
})

describe('getMimitFilesLastModified', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('restituisce la data più recente fra i due CSV', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(headResponse('Sun, 08 Nov 2026 07:40:00 GMT'))
        .mockResolvedValueOnce(headResponse('Sun, 08 Nov 2026 07:45:03 GMT')),
    )

    await expect(getMimitFilesLastModified()).resolves.toEqual(
      new Date('2026-11-08T07:45:03Z'),
    )
  })

  it('restituisce null se il sito non è raggiungibile', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))

    await expect(getMimitFilesLastModified()).resolves.toBeNull()
  })

  it('restituisce null se manca Last-Modified o la risposta non è ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(headResponse(null))
        .mockResolvedValueOnce(headResponse('Sun, 08 Nov 2026 07:45:03 GMT', false)),
    )

    await expect(getMimitFilesLastModified()).resolves.toBeNull()
  })
})
