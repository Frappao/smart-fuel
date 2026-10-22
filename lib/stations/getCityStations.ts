import 'server-only'

import type { SupportedFuelType } from '../fuels/supportedFuelTypes'
import { createSupabaseServerClient } from '../supabase/server'

export interface CityStationPrice {
  fuelType: SupportedFuelType | string
  price: number
  isSelf: boolean
  communicatedAt: string | null
}

export interface CityStation {
  id: number
  mimitId: number
  name: string | null
  brand: string | null
  address: string | null
  city: string | null
  province: string | null
  latitude: number | null
  longitude: number | null
  prices: CityStationPrice[]
}

export interface FuelStatSummary {
  min: number
  avg: number
  max: number
  stationCount: number
}

export interface CityFuelData {
  cityName: string
  province: string | null
  stations: CityStation[]
  stats: {
    benzinaSelf?: FuelStatSummary
    gasolioSelf?: FuelStatSummary
    gpl?: FuelStatSummary
  }
}

interface RawFuelPriceRow {
  fuel_type: string
  price: number | string
  is_self: boolean
  communicated_at: string | null
}

interface RawStationRow {
  id: number
  mimit_id: number
  name: string | null
  brand: string | null
  address: string | null
  city: string | null
  province: string | null
  latitude: number | null
  longitude: number | null
  fuel_prices: RawFuelPriceRow[] | null
}

function calculateStat(prices: number[]): FuelStatSummary | undefined {
  if (prices.length === 0) return undefined
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const sum = prices.reduce((acc, curr) => acc + curr, 0)
  const avg = Math.round((sum / prices.length) * 1000) / 1000
  return { min, max, avg, stationCount: prices.length }
}

export async function getCityStations(cityName: string): Promise<CityFuelData> {
  const normalizedCity = cityName.trim()

  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('stations')
      .select(`
        id,
        mimit_id,
        name,
        brand,
        address,
        city,
        province,
        latitude,
        longitude,
        fuel_prices (
          fuel_type,
          price,
          is_self,
          communicated_at
        )
      `)
      .ilike('city', normalizedCity)
      .limit(60)

    if (error) {
      throw new Error(`Failed to load stations for ${normalizedCity}: ${error.message}`)
    }

    const rawStations = (data ?? []) as RawStationRow[]

    const stations: CityStation[] = rawStations.map((s) => {
      const prices: CityStationPrice[] = (s.fuel_prices ?? []).map((p) => ({
        fuelType: p.fuel_type,
        price: Number(p.price),
        isSelf: Boolean(p.is_self),
        communicatedAt: p.communicated_at,
      }))

      return {
        id: s.id,
        mimitId: s.mimit_id,
        name: s.name,
        brand: s.brand,
        address: s.address,
        city: s.city,
        province: s.province,
        latitude: s.latitude,
        longitude: s.longitude,
        prices,
      }
    })

    const benzinaPrices: number[] = []
    const gasolioPrices: number[] = []
    const gplPrices: number[] = []

    for (const station of stations) {
      for (const price of station.prices) {
        if (price.fuelType === 'Benzina' && price.isSelf) {
          benzinaPrices.push(price.price)
        } else if (price.fuelType === 'Gasolio' && price.isSelf) {
          gasolioPrices.push(price.price)
        } else if (price.fuelType === 'GPL') {
          gplPrices.push(price.price)
        }
      }
    }

    const detectedProvince = stations.find((s) => s.province)?.province ?? null

    return {
      cityName: normalizedCity,
      province: detectedProvince,
      stations,
      stats: {
        benzinaSelf: calculateStat(benzinaPrices),
        gasolioSelf: calculateStat(gasolioPrices),
        gpl: calculateStat(gplPrices),
      },
    }
  } catch (err) {
    return {
      cityName: normalizedCity,
      province: null,
      stations: [],
      stats: {},
    }
  }
}
