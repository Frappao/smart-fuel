/**
 * Preferenze dell'account Rifornio, salvate nei metadati utente di Supabase
 * Auth (`user_metadata.rifornio`), così valgono su ogni dispositivo senza
 * tabelle dedicate. Sono solo valori iniziali del form: non influenzano mai
 * la classifica dei distributori.
 */
export type SearchMode = 'nearby' | 'trip'

export interface AccountPreferences {
  defaultVehicleId: string | null
  isSelf: boolean | null
  refuelAmount: number | null
  searchMode: SearchMode | null
}

export const EMPTY_ACCOUNT_PREFERENCES: AccountPreferences = {
  defaultVehicleId: null,
  isSelf: null,
  refuelAmount: null,
  searchMode: null,
}

export const ACCOUNT_METADATA_KEY = 'rifornio'
export const MAX_REFUEL_AMOUNT = 1_000

export function parseAccountPreferences(
  userMetadata: unknown,
): AccountPreferences {
  if (typeof userMetadata !== 'object' || userMetadata === null) {
    return EMPTY_ACCOUNT_PREFERENCES
  }

  const raw = (userMetadata as Record<string, unknown>)[ACCOUNT_METADATA_KEY]
  if (typeof raw !== 'object' || raw === null) {
    return EMPTY_ACCOUNT_PREFERENCES
  }

  const data = raw as Record<string, unknown>
  const amount = data.refuel_amount

  return {
    defaultVehicleId:
      typeof data.default_vehicle_id === 'string' &&
      data.default_vehicle_id.length > 0 &&
      data.default_vehicle_id.length <= 64
        ? data.default_vehicle_id
        : null,
    isSelf: typeof data.is_self === 'boolean' ? data.is_self : null,
    refuelAmount:
      typeof amount === 'number' &&
      Number.isFinite(amount) &&
      amount > 0 &&
      amount <= MAX_REFUEL_AMOUNT
        ? amount
        : null,
    searchMode:
      data.search_mode === 'nearby' || data.search_mode === 'trip'
        ? data.search_mode
        : null,
  }
}

export function serializeAccountPreferences(
  preferences: AccountPreferences,
): Record<string, string | number | boolean | null> {
  return {
    default_vehicle_id: preferences.defaultVehicleId,
    is_self: preferences.isSelf,
    refuel_amount: preferences.refuelAmount,
    search_mode: preferences.searchMode,
  }
}
