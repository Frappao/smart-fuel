import type { MimitStationRow } from './types'

export interface StationDatabaseRow {
  mimit_id: number
  manager: string
  brand: string
  station_type: string
  name: string
  address: string
  city: string
  province: string
  latitude: number | null
  longitude: number | null
  updated_at: string
}

export function mapStationToDatabaseRow(
  row: MimitStationRow,
): StationDatabaseRow {
  return {
    mimit_id: row.mimitId,
    manager: row.manager,
    brand: row.brand,
    station_type: row.stationType,
    name: row.name,
    address: row.address,
    city: row.city,
    province: row.province,
    latitude: row.latitude,
    longitude: row.longitude,
    updated_at: new Date().toISOString(),
  }
}
