import 'server-only'

import { POPULAR_CITIES } from '../cities/popularCities'
import { createSupabaseServerClient } from '../supabase/server'

/**
 * Salva la fotografia giornaliera dei prezzi medi delle città con pagina
 * dedicata (public.city_fuel_price_daily).
 * Non lancia mai: lo storico è un extra e non deve far fallire il cron.
 * Restituisce il numero di righe scritte, oppure null in caso di errore.
 */
export async function snapshotCityPrices(): Promise<number | null> {
  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase.rpc('snapshot_city_fuel_prices', {
      p_cities: POPULAR_CITIES.map((city) => city.name),
    })

    if (error) {
      console.error('[mimit] impossibile salvare lo storico città:', error.message)
      return null
    }

    return typeof data === 'number' ? data : null
  } catch (error) {
    console.error('[mimit] impossibile salvare lo storico città:', error)
    return null
  }
}
