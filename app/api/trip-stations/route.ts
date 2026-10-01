import { isSupportedFuelType } from '../../../lib/fuels/supportedFuelTypes'
import { rankStationsAlongRoute } from '../../../lib/calculation/rankStationsAlongRoute'
import { selectNearbyCandidates } from '../../../lib/calculation/rankNearbyStations'
import { getMapboxDirections } from '../../../lib/maps/getMapboxDirections'
import { getMapboxRouteMatrix } from '../../../lib/maps/getMapboxRouteMatrix'
import { getMapboxRouteViaWaypoint } from '../../../lib/maps/getMapboxRouteViaWaypoint'
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
    const preliminaryResults = rankStationsAlongRoute({
      candidates,
      routes: routeDetours,
      baseRouteDistanceMeters: baseRoute.distanceMeters,
      refuelAmount,
      consumptionLitersPer100Km,
      limit: CANDIDATE_LIMIT,
    })
    const preliminaryWinner = preliminaryResults[0]

    if (!preliminaryWinner) {
      return Response.json({
        baseRouteDistanceMeters: baseRoute.distanceMeters,
        results: [],
      })
    }

    const candidateIndexById = new Map(
      candidates.map((candidate, index) => [candidate.id, index]),
    )
    const preliminaryWinnerIndex = candidateIndexById.get(
      preliminaryWinner.station.id,
    )!
    let winnerRoute: Awaited<ReturnType<typeof getMapboxRouteViaWaypoint>>

    try {
      winnerRoute = await getMapboxRouteViaWaypoint(
        origin,
        {
          latitude: preliminaryWinner.station.latitude,
          longitude: preliminaryWinner.station.longitude,
        },
        destination,
      )
    } catch {
      return Response.json({
        baseRouteDistanceMeters: baseRoute.distanceMeters,
        results: preliminaryResults.slice(0, RESULT_LIMIT),
      })
    }
    const verifiedWinner = rankStationsAlongRoute({
      candidates,
      routes: [
        {
          destinationIndex: preliminaryWinnerIndex,
          originToStationDistanceMeters:
            winnerRoute.originToWaypointDistanceMeters,
          stationToDestinationDistanceMeters:
            winnerRoute.waypointToDestinationDistanceMeters,
        },
      ],
      baseRouteDistanceMeters: baseRoute.distanceMeters,
      refuelAmount,
      consumptionLitersPer100Km,
      limit: 1,
    })[0]!
    // Even with a zero detour, a station cannot win when its purchased liters
    // do not exceed the independently verified preliminary winner.
    const possibleWinners = preliminaryResults.filter(
      (result) =>
        refuelAmount / result.station.fuelPrice >= verifiedWinner.netFuelLiters,
    )
    const refinedRoutes = new Map(
      routeDetours.map((route) => [route.destinationIndex, route]),
    )
    refinedRoutes.set(preliminaryWinnerIndex, {
      destinationIndex: preliminaryWinnerIndex,
      originToStationDistanceMeters:
        winnerRoute.originToWaypointDistanceMeters,
      stationToDestinationDistanceMeters:
        winnerRoute.waypointToDestinationDistanceMeters,
    })

    const contenderRoutes = await Promise.allSettled(
      possibleWinners.map(async (result) => {
        const destinationIndex = candidateIndexById.get(result.station.id)!

        if (destinationIndex === preliminaryWinnerIndex) {
          return null
        }

        const route = await getMapboxRouteViaWaypoint(
          origin,
          {
            latitude: result.station.latitude,
            longitude: result.station.longitude,
          },
          destination,
        )

        return { destinationIndex, route }
      }),
    )

    for (const contenderRoute of contenderRoutes) {
      if (
        contenderRoute.status !== 'fulfilled' ||
        contenderRoute.value === null
      ) {
        continue
      }

      const { destinationIndex, route } = contenderRoute.value
      refinedRoutes.set(destinationIndex, {
        destinationIndex,
        originToStationDistanceMeters:
          route.originToWaypointDistanceMeters,
        stationToDestinationDistanceMeters:
          route.waypointToDestinationDistanceMeters,
      })
    }

    const results = rankStationsAlongRoute({
      candidates,
      routes: [...refinedRoutes.values()],
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
