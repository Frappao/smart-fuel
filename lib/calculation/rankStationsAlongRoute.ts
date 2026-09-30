import type { PricedNearbyStation } from './rankNearbyStations'
import { calculateConvenience } from './calculateConvenience'

export interface StationRouteDetour {
  destinationIndex: number
  originToStationDistanceMeters: number
  stationToDestinationDistanceMeters: number
}

export interface RankedRouteStationResult {
  station: PricedNearbyStation
  originToStationDistanceMeters: number
  stationToDestinationDistanceMeters: number
  routeViaStationDistanceMeters: number
  detourDistanceMeters: number
  litersPurchased: number
  detourFuelLiters: number
  netFuelLiters: number
}

interface RankStationsAlongRouteInput {
  candidates: PricedNearbyStation[]
  routes: unknown[]
  baseRouteDistanceMeters: number
  refuelAmount: number
  consumptionLitersPer100Km: number
  limit?: number
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

export function isStationRouteDetour(
  value: unknown,
): value is StationRouteDetour {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return (
    'destinationIndex' in value &&
    typeof value.destinationIndex === 'number' &&
    Number.isInteger(value.destinationIndex) &&
    value.destinationIndex >= 0 &&
    'originToStationDistanceMeters' in value &&
    isNonNegativeFiniteNumber(value.originToStationDistanceMeters) &&
    'stationToDestinationDistanceMeters' in value &&
    isNonNegativeFiniteNumber(value.stationToDestinationDistanceMeters)
  )
}

export function rankStationsAlongRoute({
  candidates,
  routes,
  baseRouteDistanceMeters,
  refuelAmount,
  consumptionLitersPer100Km,
  limit = 10,
}: RankStationsAlongRouteInput): RankedRouteStationResult[] {
  if (!isNonNegativeFiniteNumber(baseRouteDistanceMeters)) {
    return []
  }

  return routes
    .filter(isStationRouteDetour)
    .flatMap((route): RankedRouteStationResult[] => {
      const station = candidates[route.destinationIndex]

      if (!station) {
        return []
      }

      const routeViaStationDistanceMeters =
        route.originToStationDistanceMeters +
        route.stationToDestinationDistanceMeters
      const detourDistanceMeters = Math.max(
        0,
        routeViaStationDistanceMeters - baseRouteDistanceMeters,
      )
      const convenience = calculateConvenience({
        pricePerLiter: station.fuelPrice,
        refuelAmount,
        travelDistanceKm: detourDistanceMeters / 1_000,
        consumptionLitersPer100Km,
      })

      return [
        {
          station,
          originToStationDistanceMeters:
            route.originToStationDistanceMeters,
          stationToDestinationDistanceMeters:
            route.stationToDestinationDistanceMeters,
          routeViaStationDistanceMeters,
          detourDistanceMeters,
          litersPurchased: convenience.litersPurchased,
          detourFuelLiters: convenience.travelFuelLiters,
          netFuelLiters: convenience.netFuelLiters,
        },
      ]
    })
    .sort(
      (first, second) =>
        second.netFuelLiters - first.netFuelLiters ||
        first.detourDistanceMeters - second.detourDistanceMeters,
    )
    .slice(0, limit)
}
