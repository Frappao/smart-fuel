import 'server-only'

import { createSupabaseServerClient } from '../supabase/server'
import {
  buildCityPriceTrend,
  type CityPricePoint,
  type CityPriceSeries,
  type CityPriceTrend,
} from './cityPriceTrend'

export type CityPriceHistory = Partial<Record<CityPriceSeries, CityPriceTrend>>

interface RawHistoryRow {
  price_date: string
  series: CityPriceSeries
  avg_price: number | string
  min_price: number | string
}

const SERIES: CityPriceSeries[] = ['benzina_self', 'gasolio_self', 'gpl']

/**
 * Storico dei prezzi medi giornalieri di una città (ultimi `days` giorni).
 * Restituisce un oggetto vuoto se lo storico non c'è ancora o in caso di
 * errore: la pagina città deve funzionare anche senza.
 */
export async function getCityPriceHistory(
  cityName: string,
  days = 30,
): Promise<CityPriceHistory> {
  const city = cityName.trim().toUpperCase()
  if (!city) return {}

  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)

    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('city_fuel_price_daily')
      .select('price_date, series, avg_price, min_price')
      .eq('city', city)
      .gte('price_date', since)
      .order('price_date', { ascending: true })

    if (error) return {}

    const rows = (data ?? []) as RawHistoryRow[]
    const history: CityPriceHistory = {}

    for (const series of SERIES) {
      const points: CityPricePoint[] = rows
        .filter((row) => row.series === series)
        .map((row) => ({
          date: row.price_date,
          avg: Number(row.avg_price),
          min: Number(row.min_price),
        }))
      const trend = buildCityPriceTrend(series, points)
      if (trend) history[series] = trend
    }

    return history
  } catch {
    return {}
  }
}
