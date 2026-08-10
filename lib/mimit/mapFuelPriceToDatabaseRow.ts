import { parseMimitDateTime } from './parseMimitDateTime'
import type { MimitFuelPriceRow } from './types'

export interface FuelPriceDatabaseRow {
  station_id: number
  fuel_type: string
  price: number
  is_self: boolean
  communicated_at: string | null
  updated_at: string
}

export function mapFuelPriceToDatabaseRow(
  row: MimitFuelPriceRow,
  stationId: number,
): FuelPriceDatabaseRow {
  return {
    station_id: stationId,
    fuel_type: row.fuelType,
    price: row.price,
    is_self: row.isSelf,
    communicated_at: parseMimitDateTime(row.communicatedAt),
    updated_at: new Date().toISOString(),
  }
}
