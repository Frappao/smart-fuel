import { describe, expect, it } from 'vitest'

import type { PricedNearbyStation } from './rankNearbyStations'
import {
  isStationRouteDetour,
  rankStationsAlongRoute,
} from './rankStationsAlongRoute'

function station(
  id: number,
  fuelPrice: number,
): PricedNearbyStation {
  return {
    id,
    mimitId: id + 100,
    name: `Station ${id}`,
    brand: null,
    address: null,
    city: 'Roma',
    province: 'RM',
    latitude: 41.9 + id / 1_000,
    longitude: 12.5 + id / 1_000,
    distanceMeters: id * 100,
    fuelPrice,
    communicatedAt: null,
  }
}

describe('isStationRouteDetour', () => {
  it('accepts valid route legs and rejects invalid values', () => {
    expect(
      isStationRouteDetour({
        destinationIndex: 0,
        originToStationDistanceMeters: 40_000,
        stationToDestinationDistanceMeters: 61_000,
      }),
    ).toBe(true)
    expect(
      isStationRouteDetour({
        destinationIndex: -1,
        originToStationDistanceMeters: 40_000,
        stationToDestinationDistanceMeters: 61_000,
      }),
    ).toBe(false)
    expect(
      isStationRouteDetour({
        destinationIndex: 0,
        originToStationDistanceMeters: Number.NaN,
        stationToDestinationDistanceMeters: 61_000,
      }),
    ).toBe(false)
  })
})

describe('rankStationsAlongRoute', () => {
  it('ranks by fuel purchased minus fuel consumed only for the detour', () => {
    const results = rankStationsAlongRoute({
      candidates: [station(1, 1.8), station(2, 1.75)],
      routes: [
        {
          destinationIndex: 0,
          originToStationDistanceMeters: 40_000,
          stationToDestinationDistanceMeters: 61_000,
        },
        {
          destinationIndex: 1,
          originToStationDistanceMeters: 45_000,
          stationToDestinationDistanceMeters: 65_000,
        },
      ],
      baseRouteDistanceMeters: 100_000,
      refuelAmount: 50,
      consumptionLitersPer100Km: 6,
    })

    expect(results.map(({ station: resultStation }) => resultStation.id)).toEqual([
      2,
      1,
    ])
    expect(results[0]).toMatchObject({
      routeViaStationDistanceMeters: 110_000,
      detourDistanceMeters: 10_000,
      detourFuelLiters: 0.6,
    })
    expect(results[0].netFuelLiters).toBeCloseTo(27.9714, 4)
    expect(results[1]).toMatchObject({
      routeViaStationDistanceMeters: 101_000,
      detourDistanceMeters: 1_000,
      detourFuelLiters: 0.06,
    })
    expect(results[1].netFuelLiters).toBeCloseTo(27.7178, 4)
  })

  it('preserves candidate association by destinationIndex and skips missing routes', () => {
    const results = rankStationsAlongRoute({
      candidates: [station(1, 1.8), station(2, 1.7), station(3, 1.6)],
      routes: [
        {
          destinationIndex: 2,
          originToStationDistanceMeters: 40_000,
          stationToDestinationDistanceMeters: 60_000,
        },
        {
          destinationIndex: 0,
          originToStationDistanceMeters: 45_000,
          stationToDestinationDistanceMeters: 55_000,
        },
        {
          destinationIndex: 8,
          originToStationDistanceMeters: 1,
          stationToDestinationDistanceMeters: 1,
        },
        { destinationIndex: 1, originToStationDistanceMeters: null },
      ],
      baseRouteDistanceMeters: 100_000,
      refuelAmount: 50,
      consumptionLitersPer100Km: 6,
    })

    expect(results.map(({ station: resultStation }) => resultStation.id)).toEqual([
      3,
      1,
    ])
  })

  it('clamps small provider differences below the base route to zero detour', () => {
    const [result] = rankStationsAlongRoute({
      candidates: [station(1, 2)],
      routes: [
        {
          destinationIndex: 0,
          originToStationDistanceMeters: 49_900,
          stationToDestinationDistanceMeters: 50_000,
        },
      ],
      baseRouteDistanceMeters: 100_000,
      refuelAmount: 50,
      consumptionLitersPer100Km: 6,
    })

    expect(result.detourDistanceMeters).toBe(0)
    expect(result.detourFuelLiters).toBe(0)
    expect(result.netFuelLiters).toBe(25)
  })

  it('rejects an invalid base route and applies the result limit', () => {
    const candidates = [station(1, 1.8), station(2, 1.7)]
    const routes = candidates.map((_, destinationIndex) => ({
      destinationIndex,
      originToStationDistanceMeters: 50_000,
      stationToDestinationDistanceMeters: 50_000,
    }))

    expect(
      rankStationsAlongRoute({
        candidates,
        routes,
        baseRouteDistanceMeters: Number.NaN,
        refuelAmount: 50,
        consumptionLitersPer100Km: 6,
      }),
    ).toEqual([])
    expect(
      rankStationsAlongRoute({
        candidates,
        routes,
        baseRouteDistanceMeters: 100_000,
        refuelAmount: 50,
        consumptionLitersPer100Km: 6,
        limit: 1,
      }),
    ).toHaveLength(1)
  })
})
