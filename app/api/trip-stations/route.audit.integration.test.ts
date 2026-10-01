import { loadEnvConfig } from '@next/env'
import { describe, expect, test } from 'vitest'

import { selectNearbyCandidates } from '../../../lib/calculation/rankNearbyStations'
import { calculateConvenience } from '../../../lib/calculation/calculateConvenience'
import {
  rankStationsAlongRoute,
  type RankedRouteStationResult,
  type StationRouteDetour,
} from '../../../lib/calculation/rankStationsAlongRoute'
import { getMapboxDirections } from '../../../lib/maps/getMapboxDirections'
import { getMapboxRouteMatrix } from '../../../lib/maps/getMapboxRouteMatrix'
import { getMapboxRoutesToDestination } from '../../../lib/maps/getMapboxRoutesToDestination'
import type { Coordinates } from '../../../lib/maps/getRouteMatrix'
import { getStationsAlongRoute } from '../../../lib/stations/getStationsAlongRoute'
import { POST } from './route'

loadEnvConfig(process.cwd())

const origin = { latitude: 45.625, longitude: 9.035 }
const destination = { latitude: 41.9028, longitude: 12.4964 }
const refuelAmount = 50
const consumptionLitersPer100Km = 6
const fuelType = 'Benzina'
const isSelf = true
const STANDARD_CANDIDATE_LIMIT = 20
const AUDIT_CANDIDATE_LIMIT = 100
const MATRIX_BATCH_SIZE = 20

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function coordinatePair({ latitude, longitude }: Coordinates): string {
  return `${longitude},${latitude}`
}

async function getRouteViaStationDistance(
  routeOrigin: Coordinates,
  station: Coordinates,
  routeDestination: Coordinates,
): Promise<number> {
  const accessToken = process.env.MAPBOX_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error('MAPBOX_ACCESS_TOKEN is not configured.')
  }

  const coordinates = [routeOrigin, station, routeDestination]
    .map(coordinatePair)
    .join(';')
  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}`,
  )
  url.searchParams.set('alternatives', 'false')
  url.searchParams.set('overview', 'false')
  url.searchParams.set('steps', 'false')
  url.searchParams.set('access_token', accessToken)

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `Mapbox audit Directions failed with HTTP status ${response.status}.`,
    )
  }

  const body: unknown = await response.json()
  const route =
    isRecord(body) && body.code === 'Ok' && Array.isArray(body.routes)
      ? body.routes[0]
      : null

  if (
    !isRecord(route) ||
    typeof route.distance !== 'number' ||
    !Number.isFinite(route.distance) ||
    route.distance < 0
  ) {
    throw new Error('Mapbox audit Directions returned an invalid response.')
  }

  return route.distance
}

async function getBatchedRouteDetours(
  candidates: ReturnType<typeof selectNearbyCandidates>,
): Promise<StationRouteDetour[]> {
  const routeDetours: StationRouteDetour[] = []

  for (
    let batchStart = 0;
    batchStart < candidates.length;
    batchStart += MATRIX_BATCH_SIZE
  ) {
    const batch = candidates.slice(
      batchStart,
      batchStart + MATRIX_BATCH_SIZE,
    )
    const coordinates = batch.map(({ latitude, longitude }) => ({
      latitude,
      longitude,
    }))
    const [routesFromOrigin, routesToDestination] = await Promise.all([
      getMapboxRouteMatrix(origin, coordinates),
      getMapboxRoutesToDestination(coordinates, destination),
    ])
    const originDistances = new Map(
      routesFromOrigin.map(({ destinationIndex, distanceMeters }) => [
        destinationIndex,
        distanceMeters,
      ]),
    )
    const destinationDistances = new Map(
      routesToDestination.map(({ destinationIndex, distanceMeters }) => [
        destinationIndex,
        distanceMeters,
      ]),
    )

    for (let batchIndex = 0; batchIndex < batch.length; batchIndex += 1) {
      const originToStationDistanceMeters = originDistances.get(batchIndex)
      const stationToDestinationDistanceMeters =
        destinationDistances.get(batchIndex)

      if (
        originToStationDistanceMeters === undefined ||
        stationToDestinationDistanceMeters === undefined
      ) {
        continue
      }

      routeDetours.push({
        destinationIndex: batchStart + batchIndex,
        originToStationDistanceMeters,
        stationToDestinationDistanceMeters,
      })
    }
  }

  return routeDetours
}

function createApiRequest(): Request {
  return new Request('http://localhost/api/trip-stations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin,
      destination,
      refuelAmount,
      consumptionLitersPer100Km,
      fuelType,
      isSelf,
    }),
  })
}

describe.skipIf(process.env.RUN_ROUTE_TRIP_AUDIT !== '1')(
  'route ranking audit',
  () => {
    test(
      'verifies the API winner against a wider pool and independent routes',
      async () => {
        const baseRoute = await getMapboxDirections(origin, destination)
        const stations = await getStationsAlongRoute(
          baseRoute.geometry,
          2_000,
          AUDIT_CANDIDATE_LIMIT,
          fuelType,
          isSelf,
        )
        const candidates = selectNearbyCandidates(
          stations,
          AUDIT_CANDIDATE_LIMIT,
        )

        expect(candidates.length).toBeGreaterThan(STANDARD_CANDIDATE_LIMIT)

        const routeDetours = await getBatchedRouteDetours(candidates)
        const auditedResults = rankStationsAlongRoute({
          candidates,
          routes: routeDetours,
          baseRouteDistanceMeters: baseRoute.distanceMeters,
          refuelAmount,
          consumptionLitersPer100Km,
          limit: candidates.length,
        })

        expect(auditedResults.length).toBeGreaterThan(
          STANDARD_CANDIDATE_LIMIT,
        )

        const response = await POST(createApiRequest())
        const responseBody = (await response.json()) as {
          results?: RankedRouteStationResult[]
        }

        expect(response.status).toBe(200)
        console.log({
          candidateCount: candidates.length,
          routedCandidateCount: auditedResults.length,
          apiWinnerId: responseBody.results?.[0]?.station.id,
          matrixWinnerId: auditedResults[0]?.station.id,
        })

        const matrixWinner = auditedResults[0]!
        const directionsDistanceByStationId = new Map<number, number>()
        const winnerDirectionsDistance = await getRouteViaStationDistance(
          origin,
          {
            latitude: matrixWinner.station.latitude,
            longitude: matrixWinner.station.longitude,
          },
          destination,
        )
        directionsDistanceByStationId.set(
          matrixWinner.station.id,
          winnerDirectionsDistance,
        )
        const verifiedWinnerNetFuelLiters = calculateConvenience({
          pricePerLiter: matrixWinner.station.fuelPrice,
          refuelAmount,
          travelDistanceKm:
            Math.max(
              0,
              winnerDirectionsDistance - baseRoute.distanceMeters,
            ) / 1_000,
          consumptionLitersPer100Km,
        }).netFuelLiters
        const possibleWinners = candidates.filter(
          (station) =>
            refuelAmount / station.fuelPrice >= verifiedWinnerNetFuelLiters,
        )

        expect(
          refuelAmount / candidates[candidates.length - 1]!.fuelPrice,
        ).toBeLessThanOrEqual(verifiedWinnerNetFuelLiters)

        for (
          let batchStart = 0;
          batchStart < possibleWinners.length;
          batchStart += 5
        ) {
          const batch = possibleWinners
            .slice(batchStart, batchStart + 5)
            .filter(
              (station) =>
                !directionsDistanceByStationId.has(station.id),
            )
          const distances = await Promise.all(
            batch.map((station) =>
              getRouteViaStationDistance(
                origin,
                {
                  latitude: station.latitude,
                  longitude: station.longitude,
                },
                destination,
              ),
            ),
          )

          batch.forEach((station, index) => {
            directionsDistanceByStationId.set(station.id, distances[index])
          })
        }

        const matrixResultByStationId = new Map(
          auditedResults.map((result) => [result.station.id, result]),
        )
        const independentlyRankedResults = possibleWinners
          .map((station) => {
            const directionsRouteDistanceMeters =
              directionsDistanceByStationId.get(station.id)!
            const detourDistanceMeters = Math.max(
              0,
              directionsRouteDistanceMeters - baseRoute.distanceMeters,
            )
            const convenience = calculateConvenience({
              pricePerLiter: station.fuelPrice,
              refuelAmount,
              travelDistanceKm: detourDistanceMeters / 1_000,
              consumptionLitersPer100Km,
            })
            const matrixResult = matrixResultByStationId.get(station.id)

            return {
              stationId: station.id,
              stationName: station.name,
              price: station.fuelPrice,
              detourKm: detourDistanceMeters / 1_000,
              netFuelLiters: convenience.netFuelLiters,
              matrixRouteKm:
                matrixResult === undefined
                  ? null
                  : matrixResult.routeViaStationDistanceMeters / 1_000,
              directionsRouteKm: directionsRouteDistanceMeters / 1_000,
              matrixVsDirectionsDifferenceMeters:
                matrixResult === undefined
                  ? null
                  : Math.abs(
                      directionsRouteDistanceMeters -
                        matrixResult.routeViaStationDistanceMeters,
                    ),
            }
          })
          .sort(
            (first, second) =>
              second.netFuelLiters - first.netFuelLiters ||
              first.detourKm - second.detourKm,
          )

        console.log({ independentlyCheckedCandidates: possibleWinners.length })
        console.table(independentlyRankedResults.slice(0, 10))
        expect(independentlyRankedResults[0]?.stationId).toBe(
          responseBody.results?.[0]?.station.id,
        )
      },
      120_000,
    )
  },
)
