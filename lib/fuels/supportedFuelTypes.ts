export const SUPPORTED_FUEL_TYPES = ['Benzina', 'Gasolio', 'GPL'] as const

export type SupportedFuelType = (typeof SUPPORTED_FUEL_TYPES)[number]

export const SUPPORTED_FUEL_TYPE_LABELS = {
  Benzina: 'Benzina',
  Gasolio: 'Gasolio',
  GPL: 'GPL',
} as const satisfies Record<SupportedFuelType, string>

export function isSupportedFuelType(
  value: string,
): value is SupportedFuelType {
  return SUPPORTED_FUEL_TYPES.some((fuelType) => fuelType === value)
}
