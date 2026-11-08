import { describe, expect, it } from 'vitest'

import { formatStationLocation, toDisplayCase } from './formatStationText'

describe('toDisplayCase', () => {
  it('riporta in forma leggibile i testi tutti maiuscoli', () => {
    expect(toDisplayCase('STAROIL MILANO')).toBe('Staroil Milano')
    expect(toDisplayCase('STAZIONE IL POLO DANTE ALIGHIERI')).toBe(
      'Stazione Il Polo Dante Alighieri',
    )
  })

  it('mantiene sigle, numeri e preposizioni', () => {
    expect(toDisplayCase('IP API')).toBe('IP API')
    expect(toDisplayCase('BUSTO GAROLFO SP 109')).toBe('Busto Garolfo SP 109')
    expect(toDisplayCase('VIA DELLA REPUBBLICA 12/A')).toBe(
      'Via della Repubblica 12/A',
    )
    expect(toDisplayCase("PIAZZA SANT'ANNA")).toBe("Piazza Sant'Anna")
  })

  it('non tocca i testi già scritti con maiuscole e minuscole', () => {
    expect(toDisplayCase('Api-Ip')).toBe('Api-Ip')
    expect(toDisplayCase('Milano - Tabacchi')).toBe('Milano - Tabacchi')
  })

  it('gestisce valori assenti', () => {
    expect(toDisplayCase(null)).toBeNull()
    expect(toDisplayCase(undefined)).toBeNull()
  })
})

describe('formatStationLocation', () => {
  it('unisce indirizzo e città', () => {
    expect(formatStationLocation('VIA TORINO 12', 'MILANO')).toBe(
      'Via Torino 12 · Milano',
    )
  })

  it('evita di ripetere la città già presente nell’indirizzo', () => {
    expect(formatStationLocation('VIA ROMA 1 MILANO', 'MILANO')).toBe(
      'Via Roma 1 Milano',
    )
  })

  it('restituisce null senza dati', () => {
    expect(formatStationLocation(null, '  ')).toBeNull()
  })
})
