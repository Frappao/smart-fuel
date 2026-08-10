import { describe, expect, it } from 'vitest'

import { parseMimitDateTime } from './parseMimitDateTime'

describe('parseMimitDateTime', () => {
  it('converte il formato MIMIT in un formato ISO senza timezone', () => {
    expect(parseMimitDateTime('06/08/2026 13:30:09')).toBe(
      '2026-08-06T13:30:09',
    )
  })

  it.each([null, ''])('restituisce null per un valore assente (%s)', (value) => {
    expect(parseMimitDateTime(value)).toBeNull()
  })

  it.each([
    '2026-08-06 13:30:09',
    '06/08/2026',
    '31/02/2026 10:00:00',
    '06/13/2026 10:00:00',
    '06/08/2026 24:00:00',
  ])('restituisce null per data o formato non valido: %s', (value) => {
    expect(parseMimitDateTime(value)).toBeNull()
  })

  it('accetta il 29 febbraio soltanto negli anni bisestili', () => {
    expect(parseMimitDateTime('29/02/2024 10:00:00')).toBe(
      '2024-02-29T10:00:00',
    )
    expect(parseMimitDateTime('29/02/2026 10:00:00')).toBeNull()
  })
})
