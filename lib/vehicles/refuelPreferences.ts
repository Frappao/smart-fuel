import {
  isSupportedFuelType,
  type SupportedFuelType,
} from '../fuels/supportedFuelTypes'
import type { ConsumptionUnit } from './consumption'

/**
 * Ultimi valori del form di rifornimento, ricordati solo su questo
 * dispositivo (localStorage) per chi usa Rifornio senza account.
 * Non vengono mai inviati al server.
 */
export interface RefuelPreferences {
  fuelType: SupportedFuelType
  unit: ConsumptionUnit
  consumption: string
  isSelf: boolean
  refuelAmount: string
}

export const REFUEL_PREFERENCES_STORAGE_KEY = 'rifornio_refuel_preferences_v1'

const MAX_FIELD_LENGTH = 12

function readField(value: unknown): string | null {
  return typeof value === 'string' && value.length <= MAX_FIELD_LENGTH
    ? value
    : null
}

export function loadRefuelPreferences(): Partial<RefuelPreferences> | null {
  try {
    const raw = window.localStorage.getItem(REFUEL_PREFERENCES_STORAGE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null

    const data = parsed as Record<string, unknown>
    const preferences: Partial<RefuelPreferences> = {}

    if (typeof data.fuelType === 'string' && isSupportedFuelType(data.fuelType)) {
      preferences.fuelType = data.fuelType
    }
    if (data.unit === 'L/100 km' || data.unit === 'km/L') {
      preferences.unit = data.unit
    }
    if (typeof data.isSelf === 'boolean') {
      preferences.isSelf = data.isSelf
    }
    const consumption = readField(data.consumption)
    if (consumption !== null) preferences.consumption = consumption
    const refuelAmount = readField(data.refuelAmount)
    if (refuelAmount !== null) preferences.refuelAmount = refuelAmount

    return preferences
  } catch {
    // localStorage non disponibile (navigazione privata) o JSON corrotto.
    return null
  }
}

export function saveRefuelPreferences(preferences: RefuelPreferences): void {
  try {
    window.localStorage.setItem(
      REFUEL_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    )
  } catch {
    // Ignora: il form funziona anche senza memoria.
  }
}
