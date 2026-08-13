import type { NearbyStation } from '../api/rifornioApiClient'
import { calculateConvenience } from './calculateConvenience'

export interface PricedNearbyStation extends NearbyStation {
  fuelPrice: number
}

export interface RouteMatrixRoute {
  destinationIndex: number
  distanceMeters: number
}

export interface RankedStationResult {
  station: PricedNearbyStation
  routeDistanceMeters: number
  litersPurchased: number
  travelFuelLiters: number
  netFuelLiters: number
}

interface RankNearbyStationsInput {
  candidates: PricedNearbyStation[]
  routes: unknown[]
  refuelAmount: number
  consumptionLitersPer100Km: number
  limit?: number
}

export function isRouteMatrixRoute(value: unknown): value is RouteMatrixRoute {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return (
    'destinationIndex' in value &&
    typeof value.destinationIndex === 'number' &&
    Number.isInteger(value.destinationIndex) &&
    value.destinationIndex >= 0 &&
    'distanceMeters' in value &&
    typeof value.distanceMeters === 'number' &&
    Number.isFinite(value.distanceMeters) &&
    value.distanceMeters >= 0
  )
}

export function isValidCandidate(
  station: NearbyStation,
): station is PricedNearbyStation {
  return (
    typeof station.latitude === 'number' &&
    Number.isFinite(station.latitude) &&
    station.latitude >= -90 &&
    station.latitude <= 90 &&
    typeof station.longitude === 'number' &&
    Number.isFinite(station.longitude) &&
    station.longitude >= -180 &&
    station.longitude <= 180 &&
    typeof station.fuelPrice === 'number' &&
    Number.isFinite(station.fuelPrice) &&
    station.fuelPrice > 0
  )
}

export function selectNearbyCandidates(
  stations: NearbyStation[],
  limit = 20,
): PricedNearbyStation[] {
  return stations.filter(isValidCandidate).slice(0, limit)
}

function getDescriptiveLabel(value: string | null): string | null {
  const normalizedValue = value?.trim()

  if (!normalizedValue || /^[\d\s]+$/.test(normalizedValue)) {
    return null
  }

  return normalizedValue
}

export function getStationDisplayName(
  station: Pick<NearbyStation, 'name' | 'brand' | 'city'>,
): string {
  const name = getDescriptiveLabel(station.name)

  if (name) {
    return name
  }

  const brand = getDescriptiveLabel(station.brand)

  if (brand) {
    return brand
  }

  const city = getDescriptiveLabel(station.city)

  return city ? `Distributore a ${city}` : 'Distributore'
}

export function rankNearbyStations({
  candidates,
  routes,
  refuelAmount,
  consumptionLitersPer100Km,
  limit = 10,
}: RankNearbyStationsInput): RankedStationResult[] {
  return routes
    .filter(isRouteMatrixRoute)
    .flatMap((route): RankedStationResult[] => {
      const station = candidates[route.destinationIndex]

      if (!station) {
        return []
      }

      // Google Routes returns the estimated one-way driving distance. For
      // this MVP, the round trip is approximated by doubling that distance.
      const travelDistanceKm = (route.distanceMeters / 1_000) * 2
      const convenience = calculateConvenience({
        pricePerLiter: station.fuelPrice,
        refuelAmount,
        travelDistanceKm,
        consumptionLitersPer100Km,
      })

      return [
        {
          station,
          routeDistanceMeters: route.distanceMeters,
          ...convenience,
        },
      ]
    })
    .sort((first, second) => second.netFuelLiters - first.netFuelLiters)
    .slice(0, limit)
}
