import 'server-only'

import { createSupabaseServerClient } from '../supabase/server'

export type PriceFreshnessStatus = 'fresh' | 'warning' | 'stale' | 'empty'

export interface PriceFreshnessSnapshot {
  totalStations: number
  totalPrices: number
  lastUpdatedAt: string | null
  lastCommunicatedAt: string | null
  communicatedLast24h: number
  communicatedLast48h: number
  communicatedLast7d: number
}

export interface PriceFreshnessReport extends PriceFreshnessSnapshot {
  status: PriceFreshnessStatus
  isUpdating: boolean
  checkedAt: string
  hoursSinceLastImport: number | null
  hoursSinceLastCommunication: number | null
  activeCoverage7dRatio: number
}

const FRESH_IMPORT_MAX_HOURS = 26
const WARNING_IMPORT_MAX_HOURS = 50
const FRESH_COMMUNICATION_MAX_HOURS = 48
const WARNING_COMMUNICATION_MAX_HOURS = 72

function computeHoursSince(
  isoTimestamp: string | null,
  now: Date,
): number | null {
  if (!isoTimestamp) {
    return null
  }

  const parsedMs = Date.parse(isoTimestamp)

  if (!Number.isFinite(parsedMs)) {
    return null
  }

  const diffHours = Math.max(0, (now.getTime() - parsedMs) / 3_600_000)

  return Math.round(diffHours * 10) / 10
}

export function evaluatePriceFreshness(
  snapshot: PriceFreshnessSnapshot,
  now: Date = new Date(),
): PriceFreshnessReport {
  const hoursSinceLastImport = computeHoursSince(snapshot.lastUpdatedAt, now)
  const hoursSinceLastCommunication = computeHoursSince(
    snapshot.lastCommunicatedAt,
    now,
  )
  const activeCoverage7dRatio =
    snapshot.totalPrices > 0
      ? Math.round((snapshot.communicatedLast7d / snapshot.totalPrices) * 10_000) /
        10_000
      : 0

  let status: PriceFreshnessStatus = 'stale'

  if (snapshot.totalPrices === 0 || hoursSinceLastImport === null) {
    status = 'empty'
  } else if (
    hoursSinceLastImport <= FRESH_IMPORT_MAX_HOURS &&
    hoursSinceLastCommunication !== null &&
    hoursSinceLastCommunication <= FRESH_COMMUNICATION_MAX_HOURS
  ) {
    status = 'fresh'
  } else if (
    hoursSinceLastImport <= WARNING_IMPORT_MAX_HOURS &&
    hoursSinceLastCommunication !== null &&
    hoursSinceLastCommunication <= WARNING_COMMUNICATION_MAX_HOURS
  ) {
    status = 'warning'
  }

  return {
    ...snapshot,
    status,
    isUpdating: status === 'fresh',
    checkedAt: now.toISOString(),
    hoursSinceLastImport,
    hoursSinceLastCommunication,
    activeCoverage7dRatio,
  }
}

export async function verifyPriceFreshness(
  now: Date = new Date(),
): Promise<PriceFreshnessReport> {
  const supabase = createSupabaseServerClient()
  const iso24hAgo = new Date(now.getTime() - 24 * 3_600_000).toISOString()
  const iso48hAgo = new Date(now.getTime() - 48 * 3_600_000).toISOString()
  const iso7dAgo = new Date(now.getTime() - 7 * 24 * 3_600_000).toISOString()

  const [
    stationsCountResult,
    pricesCountResult,
    latestUpdateResult,
    latestCommunicationResult,
    comm24hResult,
    comm48hResult,
    comm7dResult,
  ] = await Promise.all([
    supabase.from('stations').select('*', { count: 'exact', head: true }),
    supabase.from('fuel_prices').select('*', { count: 'exact', head: true }),
    supabase
      .from('fuel_prices')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1),
    supabase
      .from('fuel_prices')
      .select('communicated_at')
      .not('communicated_at', 'is', null)
      .order('communicated_at', { ascending: false })
      .limit(1),
    supabase
      .from('fuel_prices')
      .select('*', { count: 'exact', head: true })
      .gte('communicated_at', iso24hAgo),
    supabase
      .from('fuel_prices')
      .select('*', { count: 'exact', head: true })
      .gte('communicated_at', iso48hAgo),
    supabase
      .from('fuel_prices')
      .select('*', { count: 'exact', head: true })
      .gte('communicated_at', iso7dAgo),
  ])

  const firstError =
    stationsCountResult.error ??
    pricesCountResult.error ??
    latestUpdateResult.error ??
    latestCommunicationResult.error ??
    comm24hResult.error ??
    comm48hResult.error ??
    comm7dResult.error

  if (firstError) {
    throw new Error(
      `Failed to verify MIMIT price freshness: ${firstError.message}`,
    )
  }

  return evaluatePriceFreshness(
    {
      totalStations: stationsCountResult.count ?? 0,
      totalPrices: pricesCountResult.count ?? 0,
      lastUpdatedAt: latestUpdateResult.data?.[0]?.updated_at ?? null,
      lastCommunicatedAt:
        latestCommunicationResult.data?.[0]?.communicated_at ?? null,
      communicatedLast24h: comm24hResult.count ?? 0,
      communicatedLast48h: comm48hResult.count ?? 0,
      communicatedLast7d: comm7dResult.count ?? 0,
    },
    now,
  )
}
