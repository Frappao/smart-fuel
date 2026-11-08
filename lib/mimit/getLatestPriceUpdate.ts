import 'server-only'

import { createSupabaseServerClient } from '../supabase/server'

/**
 * Data di comunicazione del prezzo più recente presente nel database.
 * Restituisce null se non disponibile o in caso di errore (la UI non deve
 * rompersi per un problema di lettura).
 */
export async function getLatestPriceUpdate(
  now: Date = new Date(),
): Promise<string | null> {
  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('fuel_prices')
      .select('communicated_at')
      .not('communicated_at', 'is', null)
      // Esclude eventuali date future errate comunicate dai gestori.
      .lte('communicated_at', now.toISOString())
      .order('communicated_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Unable to read latest price update:', error.message)
      return null
    }

    return data?.[0]?.communicated_at ?? null
  } catch (error) {
    console.error('Unable to read latest price update:', error)
    return null
  }
}
