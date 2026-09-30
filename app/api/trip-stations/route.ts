import { isSupportedFuelType } from '../../../lib/fuels/supportedFuelTypes'
import { rankStationsAlongRoute } from '../../../lib/calculation/rankStationsAlongRoute'
import { selectNearbyCandidates } from '../../../lib/calculation/rankNearbyStations'
import { getMapboxDirections } from '../../../lib/maps/getMapboxDirections'
import { getMapboxRouteMatrix } from '../../../lib/maps/getMapboxRouteMatrix'
import { getMapboxRoutesToDestination } from '../../../lib/maps/getMapboxRoutesToDestination'
import { getStationsAlongRoute } from '../../../lib/stations/getStationsAlongRoute'

interface Coordinates {
  latitude: number
  longitude: number
}

const CORRIDOR_METERS = 2_000
const CANDIDATE_LIMIT = 20
const RESULT_LIMIT = 10

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isCoordinates(value: unknown): value is Coordinates {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.latitude === 'number' &&
    Number.isFinite(value.latitude) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    typeof value.longitude === 'number' &&
    Number.isFinite(value.longitude) &&
    value.longitude >= -180 &&
    value.longitude <= 180
  )
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function invalidInputResponse(): Response {
  return Response.json(
    {
      error:
        'Invalid input. Provide valid origin, destination, refuel amount, consumption, fuel type, and service mode.',
    },
    { status: 400 },
  )
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return invalidInputResponse()
  }

  if (!isRecord(body)) {
    return invalidInputResponse()
  }

  const {
    origin,
    destination,
    refuelAmount,
    consumptionLitersPer100Km,
    fuelType,
    isSelf,
  } = body

  if (
    !isCoordinates(origin) ||
    !isCoordinates(destination) ||
    !isPositiveFiniteNumber(refuelAmount) ||
    !isPositiveFiniteNumber(consumptionLitersPer100Km) ||
    typeof fuelType !== 'string' ||
    !isSupportedFuelType(fuelType) ||
    typeof isSelf !== 'boolean'
  ) {
    return invalidInputResponse()
  }

  try {
    const baseRoute = await getMapboxDirections(origin, destination)
    const stations = await getStationsAlongRoute(
      baseRoute.geometry,
      CORRIDOR_METERS,
      CANDIDATE_LIMIT,
      fuelType,
      isSelf,
    )
    const candidates = selectNearbyCandidates(stations, CANDIDATE_LIMIT)

    if (candidates.length === 0) {
      return Response.json({
        baseRouteDistanceMeters: baseRoute.distanceMeters,
        results: [],
      })
    }

    const candidateCoordinates = candidates.map(({ latitude, longitude }) => ({
      latitude,
      longitude,
    }))
    const [routesFromOrigin, routesToDestination] = await Promise.all([
      getMapboxRouteMatrix(origin, candidateCoordinates),
      getMapboxRoutesToDestination(candidateCoordinates, destination),
    ])
    const originDistanceByIndex = new Map(
      routesFromOrigin.map(({ destinationIndex, distanceMeters }) => [
        destinationIndex,
        distanceMeters,
      ]),
    )
    const destinationDistanceByIndex = new Map(
      routesToDestination.map(({ destinationIndex, distanceMeters }) => [
        destinationIndex,
        distanceMeters,
      ]),
    )
    const routeDetours = candidates.flatMap((_, destinationIndex) => {
      const originToStationDistanceMeters =
        originDistanceByIndex.get(destinationIndex)
      const stationToDestinationDistanceMeters =
        destinationDistanceByIndex.get(destinationIndex)

      if (
        originToStationDistanceMeters === undefined ||
        stationToDestinationDistanceMeters === undefined
      ) {
        return []
      }

      return [
        {
          destinationIndex,
          originToStationDistanceMeters,
          stationToDestinationDistanceMeters,
        },
      ]
    })
    const results = rankStationsAlongRoute({
      candidates,
      routes: routeDetours,
      baseRouteDistanceMeters: baseRoute.distanceMeters,
      refuelAmount,
      consumptionLitersPer100Km,
      limit: RESULT_LIMIT,
    })

    return Response.json({
      baseRouteDistanceMeters: baseRoute.distanceMeters,
      results,
    })
  } catch {
    return Response.json(
      { error: 'Unable to find stations along this route.' },
      { status: 502 },
    )
  }
}
