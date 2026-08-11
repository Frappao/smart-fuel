import { describe, expect, it } from 'vitest'

import { calculateConvenience } from './calculateConvenience'

describe('calculateConvenience', () => {
  it('calcola il carburante acquistato, consumato e netto', () => {
    const result = calculateConvenience({
      pricePerLiter: 1.7,
      refuelAmount: 30,
      travelDistanceKm: 12,
      consumptionLitersPer100Km: 6.5,
    })

    expect(result.litersPurchased).toBeCloseTo(17.647, 3)
    expect(result.travelFuelLiters).toBeCloseTo(0.78, 2)
    expect(result.netFuelLiters).toBeCloseTo(16.867, 3)
  })

  it('restituisce come carburante netto tutto quello acquistato a distanza zero', () => {
    const result = calculateConvenience({
      pricePerLiter: 1.7,
      refuelAmount: 30,
      travelDistanceKm: 0,
      consumptionLitersPer100Km: 6.5,
    })

    expect(result.travelFuelLiters).toBe(0)
    expect(result.netFuelLiters).toBe(result.litersPurchased)
  })

  it('premia la stazione vicina per un piccolo rifornimento e quella economica per uno grande', () => {
    const consumptionLitersPer100Km = 6.5
    const nearbyExpensiveStation = {
      pricePerLiter: 1.8,
      travelDistanceKm: 4,
    }
    const fartherCheaperStation = {
      pricePerLiter: 1.7,
      travelDistanceKm: 20,
    }

    const nearbyWithSmallRefuel = calculateConvenience({
      ...nearbyExpensiveStation,
      refuelAmount: 10,
      consumptionLitersPer100Km,
    })
    const fartherWithSmallRefuel = calculateConvenience({
      ...fartherCheaperStation,
      refuelAmount: 10,
      consumptionLitersPer100Km,
    })
    const nearbyWithLargeRefuel = calculateConvenience({
      ...nearbyExpensiveStation,
      refuelAmount: 100,
      consumptionLitersPer100Km,
    })
    const fartherWithLargeRefuel = calculateConvenience({
      ...fartherCheaperStation,
      refuelAmount: 100,
      consumptionLitersPer100Km,
    })

    expect(nearbyWithSmallRefuel.netFuelLiters).toBeGreaterThan(
      fartherWithSmallRefuel.netFuelLiters,
    )
    expect(fartherWithLargeRefuel.netFuelLiters).toBeGreaterThan(
      nearbyWithLargeRefuel.netFuelLiters,
    )
  })
})
