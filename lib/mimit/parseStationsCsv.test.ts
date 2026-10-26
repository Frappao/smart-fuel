import { describe, expect, it } from 'vitest'

import { parseStationsCsv } from './parseStationsCsv'

describe('parseStationsCsv', () => {
  it('parsa un estratto realistico dell\'anagrafica MIMIT', () => {
    const csv = [
      'Estrazione del 2026-08-06',
      'idImpianto|Gestore|Bandiera|Tipo Impianto|Nome Impianto|Indirizzo|Comune|Provincia|Latitudine|Longitudine',
      '59183| ENIMOOV S.P.A. | Agip Eni | Stradale | ENI 59183 | Via Roma 1 | Milano | MI | 45.464211 | 9.191383',
      '59184|GESTORE INDIPENDENTE|Pompe Bianche|Stradale|STAZIONE CENTRO|Via Verdi 2|Bologna|BO||',
      '',
    ].join('\r\n')

    expect(parseStationsCsv(csv)).toEqual([
      {
        mimitId: 59183,
        manager: 'ENIMOOV S.P.A.',
        brand: 'Agip Eni',
        stationType: 'Stradale',
        name: 'ENI 59183',
        address: 'Via Roma 1',
        city: 'Milano',
        province: 'MI',
        latitude: 45.464211,
        longitude: 9.191383,
      },
      {
        mimitId: 59184,
        manager: 'GESTORE INDIPENDENTE',
        brand: 'Pompe Bianche',
        stationType: 'Stradale',
        name: 'STAZIONE CENTRO',
        address: 'Via Verdi 2',
        city: 'Bologna',
        province: 'BO',
        latitude: null,
        longitude: null,
      },
    ])
  })

  it('scarta righe con idImpianto non valido e deduplica per mimitId', () => {
    const csv = [
      'Estrazione del 2026-08-06',
      'idImpianto|Gestore|Bandiera|Tipo Impianto|Nome Impianto|Indirizzo|Comune|Provincia|Latitudine|Longitudine',
      'abc|GESTORE|Eni|Stradale|Stazione|Via 1|Roma|RM|41.9|12.5',
      '59183|VECCHIO GESTORE|Eni|Stradale|Stazione 1|Via 1|Roma|RM|41.9|12.5',
      '59183|NUOVO GESTORE|Eni|Stradale|Stazione 1|Via 1|Roma|RM|41.9|12.5',
    ].join('\n')

    expect(parseStationsCsv(csv)).toEqual([
      {
        mimitId: 59183,
        manager: 'NUOVO GESTORE',
        brand: 'Eni',
        stationType: 'Stradale',
        name: 'Stazione 1',
        address: 'Via 1',
        city: 'Roma',
        province: 'RM',
        latitude: 41.9,
        longitude: 12.5,
      },
    ])
  })
})
