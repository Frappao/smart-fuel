import { loadEnvConfig } from '@next/env'
import { describe, expect, test } from 'vitest'

import { calculateConvenience } from '../calculation/calculateConvenience'
import {
  getStationDisplayName,
  selectNearbyCandidates,
  type PricedNearbyStation,
} from '../calculation/rankNearbyStations'
import { getNearbyStations } from '../stations/getNearbyStations'
import { getMapboxRouteMatrix } from './getMapboxRouteMatrix'
import { getRouteMatrix } from './getRouteMatrix'

loadEnvConfig(process.cwd())

const AREAS = [
  {
    name: 'Milano centro',
    latitude: 45.4642,
    longitude: 9.19,
  },
  {
    name: 'Roma centro',
    latitude: 41.9028,
    longitude: 12.4964,
  },
  {
    name: 'Torino centro',
    latitude: 45.0703,
    longitude: 7.6869,
  },
  {
    name: 'Bologna centro',
    latitude: 44.4949,
    longitude: 11.3426,
  },
  {
    name: 'Area extraurbana di Orte',
    latitude: 42.4603,
    longitude: 12.3862,
  },
] as const

const SEARCH_RADIUS_METERS = 15_000
const MAX_CANDIDATES = 20
const REFUEL_AMOUNT = 50
const CONSUMPTION_LITERS_PER_100_KM = 6.5
const LARGE_ABSOLUTE_DIFFERENCE_METERS = 2_000
const LARGE_PERCENTAGE_DIFFERENCE = 25

interface ComparisonRow {
  destinationIndex: number
  stationId: number
  mimitId: number
  stationName: string | null
  stationBrand: string | null
  latitude: number
  longitude: number
  fuelPrice: number
  postgisDistanceMeters: number
  googleRouteStatus: 'available' | 'missing'
  mapboxRouteStatus: 'available' | 'available (distance 0)' | 'null route'
  googleDistanceMeters: number | null
  mapboxDistanceMeters: number | null
  absoluteDifferenceMeters: number | null
  percentageDifference: number | null
  diagnostic: string
}

interface RankingEntry {
  destinationIndex: number
  mimitId: number
  label: string
  fuelPrice: number
  distanceMeters: number
  netFuelLiters: number
}

interface AreaSummary {
  area: string
  candidates: number
  routesCompared: number
  meanAbsoluteDifferenceMeters: number | null
  meanPercentageDifference: number | null
  maximumAbsoluteDifferenceMeters: number | null
  googleWinner: string
  mapboxWinner: string
  sameWinner: boolean
  top3SameOrder: boolean
  top3Overlap: number
  missingGoogleRoutes: number
  missingMapboxRoutes: number
  googleFirstToSecondNetFuelLitersDifference: number | null
  mapboxFirstToSecondNetFuelLitersDifference: number | null
}

interface AreaBenchmarkResult {
  summary: AreaSummary
  absoluteDifferences: number[]
  percentageDifferences: number[]
}

function requireBenchmarkCredentials(): void {
  const requiredVariables = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SECRET_KEY',
    'GOOGLE_MAPS_API_KEY',
    'MAPBOX_ACCESS_TOKEN',
  ] as const
  const missingVariables = requiredVariables.filter(
    (variableName) => !process.env[variableName],
  )

  if (missingVariables.length > 0) {
    throw new Error(
      `Route provider comparison requires ${missingVariables.join(', ')}.`,
    )
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function indexRoutes(
  providerName: string,
  routes: unknown,
  destinationCount: number,
): Map<number, number> {
  if (!Array.isArray(routes)) {
    throw new Error(`${providerName} returned a non-array route payload.`)
  }

  const routesByDestinationIndex = new Map<number, number>()

  for (const route of routes) {
    if (!isRecord(route)) {
      throw new Error(`${providerName} returned an invalid route entry.`)
    }

    const { destinationIndex, distanceMeters } = route

    if (
      typeof destinationIndex !== 'number' ||
      !Number.isInteger(destinationIndex) ||
      destinationIndex < 0 ||
      destinationIndex >= destinationCount ||
      typeof distanceMeters !== 'number' ||
      !Number.isFinite(distanceMeters) ||
      distanceMeters < 0
    ) {
      throw new Error(`${providerName} returned an invalid route mapping.`)
    }

    if (routesByDestinationIndex.has(destinationIndex)) {
      throw new Error(
        `${providerName} returned duplicate destinationIndex ${destinationIndex}.`,
      )
    }

    routesByDestinationIndex.set(destinationIndex, distanceMeters)
  }

  return routesByDestinationIndex
}

function getDiagnostic(
  hasGoogleRoute: boolean,
  hasMapboxRoute: boolean,
  mapboxDistanceMeters: number | null,
  absoluteDifferenceMeters: number | null,
  percentageDifference: number | null,
): string {
  const diagnostics: string[] = []

  if (!hasGoogleRoute) {
    diagnostics.push('Google route missing')
  }

  if (!hasMapboxRoute) {
    diagnostics.push('Mapbox route null')
  } else if (mapboxDistanceMeters === 0) {
    diagnostics.push('Mapbox distance = 0 (valid route value)')
  }

  if (
    (absoluteDifferenceMeters !== null &&
      absoluteDifferenceMeters >= LARGE_ABSOLUTE_DIFFERENCE_METERS) ||
    (percentageDifference !== null &&
      percentageDifference >= LARGE_PERCENTAGE_DIFFERENCE)
  ) {
    diagnostics.push(
      'large provider difference: inspect coordinates and route snapping',
    )
  }

  return diagnostics.join('; ') || 'routes available'
}

function buildComparisonRows(
  candidates: PricedNearbyStation[],
  googleRoutes: Map<number, number>,
  mapboxRoutes: Map<number, number>,
): ComparisonRow[] {
  return candidates.map((candidate, destinationIndex) => {
    const hasGoogleRoute = googleRoutes.has(destinationIndex)
    const hasMapboxRoute = mapboxRoutes.has(destinationIndex)
    const googleDistanceMeters = googleRoutes.get(destinationIndex) ?? null
    const mapboxDistanceMeters = mapboxRoutes.get(destinationIndex) ?? null
    const absoluteDifferenceMeters =
      googleDistanceMeters === null || mapboxDistanceMeters === null
        ? null
        : Math.abs(googleDistanceMeters - mapboxDistanceMeters)
    const percentageDifference =
      absoluteDifferenceMeters === null ||
      googleDistanceMeters === null ||
      googleDistanceMeters === 0
        ? null
        : (absoluteDifferenceMeters / googleDistanceMeters) * 100

    return {
      destinationIndex,
      stationId: candidate.id,
      mimitId: candidate.mimitId,
      stationName: candidate.name,
      stationBrand: candidate.brand,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      fuelPrice: candidate.fuelPrice,
      postgisDistanceMeters: candidate.distanceMeters,
      googleRouteStatus: hasGoogleRoute ? 'available' : 'missing',
      mapboxRouteStatus: !hasMapboxRoute
        ? 'null route'
        : mapboxDistanceMeters === 0
          ? 'available (distance 0)'
          : 'available',
      googleDistanceMeters,
      mapboxDistanceMeters,
      absoluteDifferenceMeters,
      percentageDifference,
      diagnostic: getDiagnostic(
        hasGoogleRoute,
        hasMapboxRoute,
        mapboxDistanceMeters,
        absoluteDifferenceMeters,
        percentageDifference,
      ),
    }
  })
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null
  }

  return values.reduce((total, value) => total + value, 0) / values.length
}

function round(value: number | null, fractionDigits = 2): number | null {
  return value === null ? null : Number(value.toFixed(fractionDigits))
}

function buildRanking(
  candidates: PricedNearbyStation[],
  routes: Map<number, number>,
): RankingEntry[] {
  return Array.from(routes, ([destinationIndex, distanceMeters]) => {
    const candidate = candidates[destinationIndex]

    if (!candidate) {
      throw new Error(`Missing benchmark candidate ${destinationIndex}.`)
    }

    const travelDistanceKm = (distanceMeters / 1_000) * 2
    const { netFuelLiters } = calculateConvenience({
      pricePerLiter: candidate.fuelPrice,
      refuelAmount: REFUEL_AMOUNT,
      travelDistanceKm,
      consumptionLitersPer100Km: CONSUMPTION_LITERS_PER_100_KM,
    })

    return {
      destinationIndex,
      mimitId: candidate.mimitId,
      label: getStationDisplayName(candidate),
      fuelPrice: candidate.fuelPrice,
      distanceMeters,
      netFuelLiters,
    }
  }).sort(
    (first, second) =>
      second.netFuelLiters - first.netFuelLiters ||
      first.destinationIndex - second.destinationIndex,
  )
}

function printableComparisonRows(rows: ComparisonRow[]) {
  return rows.map((row) => ({
    ...row,
    fuelPrice: round(row.fuelPrice, 3),
    postgisDistanceMeters: round(row.postgisDistanceMeters),
    googleDistanceMeters: round(row.googleDistanceMeters),
    mapboxDistanceMeters: round(row.mapboxDistanceMeters),
    absoluteDifferenceMeters: round(row.absoluteDifferenceMeters),
    percentageDifference: round(row.percentageDifference),
  }))
}

function firstToSecondNetFuelDifference(
  ranking: RankingEntry[],
): number | null {
  if (ranking.length < 2) {
    return null
  }

  return ranking[0].netFuelLiters - ranking[1].netFuelLiters
}

function winnerLabel(winner: RankingEntry | undefined): string {
  return winner ? `${winner.label} (MIMIT ${winner.mimitId})` : 'No valid route'
}

function haveSameTop3Order(
  googleRanking: RankingEntry[],
  mapboxRanking: RankingEntry[],
): boolean {
  const googleTop3 = googleRanking.slice(0, 3)
  const mapboxTop3 = mapboxRanking.slice(0, 3)

  return (
    googleTop3.length === mapboxTop3.length &&
    googleTop3.every(
      (entry, index) =>
        entry.destinationIndex === mapboxTop3[index]?.destinationIndex,
    )
  )
}

function top3Overlap(
  googleRanking: RankingEntry[],
  mapboxRanking: RankingEntry[],
): number {
  const mapboxTop3Indexes = new Set(
    mapboxRanking.slice(0, 3).map((entry) => entry.destinationIndex),
  )

  return googleRanking
    .slice(0, 3)
    .filter((entry) => mapboxTop3Indexes.has(entry.destinationIndex)).length
}

async function benchmarkArea(area: (typeof AREAS)[number]) {
  const nearbyStations = await getNearbyStations(
    area.latitude,
    area.longitude,
    SEARCH_RADIUS_METERS,
    MAX_CANDIDATES,
    'Benzina',
    true,
  )
  const candidates = selectNearbyCandidates(nearbyStations, MAX_CANDIDATES)

  if (candidates.length === 0) {
    throw new Error(
      `No valid Benzina Self Service stations found for ${area.name}.`,
    )
  }

  const origin = { latitude: area.latitude, longitude: area.longitude }
  const destinations = candidates.map(({ latitude, longitude }) => ({
    latitude,
    longitude,
  }))
  const [googlePayload, mapboxPayload] = await Promise.all([
    getRouteMatrix(origin, destinations),
    getMapboxRouteMatrix(origin, destinations),
  ])
  const googleRoutes = indexRoutes(
    'Google Routes',
    googlePayload,
    candidates.length,
  )
  const mapboxRoutes = indexRoutes(
    'Mapbox Matrix',
    mapboxPayload,
    candidates.length,
  )
  const comparisonRows = buildComparisonRows(
    candidates,
    googleRoutes,
    mapboxRoutes,
  )
  const absoluteDifferences = comparisonRows.flatMap((row) =>
    row.absoluteDifferenceMeters === null
      ? []
      : [row.absoluteDifferenceMeters],
  )
  const percentageDifferences = comparisonRows.flatMap((row) =>
    row.percentageDifference === null ? [] : [row.percentageDifference],
  )
  const googleRanking = buildRanking(candidates, googleRoutes)
  const mapboxRanking = buildRanking(candidates, mapboxRoutes)
  const googleWinner = googleRanking[0]
  const mapboxWinner = mapboxRanking[0]
  const sameWinner = Boolean(
    googleWinner &&
      mapboxWinner &&
      googleWinner.destinationIndex === mapboxWinner.destinationIndex,
  )
  const summary: AreaSummary = {
    area: area.name,
    candidates: candidates.length,
    routesCompared: absoluteDifferences.length,
    meanAbsoluteDifferenceMeters: round(average(absoluteDifferences)),
    meanPercentageDifference: round(average(percentageDifferences)),
    maximumAbsoluteDifferenceMeters: round(
      absoluteDifferences.length === 0
        ? null
        : Math.max(...absoluteDifferences),
    ),
    googleWinner: winnerLabel(googleWinner),
    mapboxWinner: winnerLabel(mapboxWinner),
    sameWinner,
    top3SameOrder: haveSameTop3Order(googleRanking, mapboxRanking),
    top3Overlap: top3Overlap(googleRanking, mapboxRanking),
    missingGoogleRoutes: candidates.length - googleRoutes.size,
    missingMapboxRoutes: candidates.length - mapboxRoutes.size,
    googleFirstToSecondNetFuelLitersDifference: round(
      firstToSecondNetFuelDifference(googleRanking),
      4,
    ),
    mapboxFirstToSecondNetFuelLitersDifference: round(
      firstToSecondNetFuelDifference(mapboxRanking),
      4,
    ),
  }

  console.table([summary])

  const diagnosticRows = comparisonRows.filter(
    (row) => row.diagnostic !== 'routes available',
  )
  const rowsToPrint = sameWinner ? diagnosticRows : comparisonRows

  if (rowsToPrint.length > 0) {
    console.log(
      sameWinner
        ? `${area.name}: route diagnostics and outliers`
        : `${area.name}: full details because provider winners differ`,
    )
    console.table(printableComparisonRows(rowsToPrint))
  }

  return { summary, absoluteDifferences, percentageDifferences }
}

describe.skipIf(process.env.RUN_ROUTE_PROVIDERS_COMPARISON !== '1')(
  'Google Routes and Mapbox Matrix comparison',
  () => {
    test(
      'compares real station distances and rankings across five Italian areas',
      async () => {
        requireBenchmarkCredentials()

        const areaResults: AreaBenchmarkResult[] = []

        for (const area of AREAS) {
          areaResults.push(await benchmarkArea(area))
        }

        const absoluteDifferences = areaResults.flatMap(
          (result) => result.absoluteDifferences,
        )
        const percentageDifferences = areaResults.flatMap(
          (result) => result.percentageDifferences,
        )
        const areasWithSameWinner = areaResults.filter(
          (result) => result.summary.sameWinner,
        ).length

        console.log('Aggregate summary:')
        console.table([
          {
            areasTested: areaResults.length,
            areasWithSameWinner,
            sameWinnerPercentage: round(
              (areasWithSameWinner / areaResults.length) * 100,
            ),
            meanAbsoluteDifferenceMeters: round(
              average(absoluteDifferences),
            ),
            meanPercentageDifference: round(average(percentageDifferences)),
            totalMissingGoogleRoutes: areaResults.reduce(
              (total, result) =>
                total + result.summary.missingGoogleRoutes,
              0,
            ),
            totalMissingMapboxRoutes: areaResults.reduce(
              (total, result) =>
                total + result.summary.missingMapboxRoutes,
              0,
            ),
          },
        ])

        expect(areaResults).toHaveLength(AREAS.length)
      },
      180_000,
    )
  },
)
