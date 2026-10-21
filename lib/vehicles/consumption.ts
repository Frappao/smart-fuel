export type ConsumptionUnit = 'L/100 km' | 'km/L'

export function toLitersPer100Km(value: number, unit: ConsumptionUnit): number | null {
  const result = unit === 'km/L' ? 100 / value : value
  return Number.isFinite(value) && value > 0 && Number.isFinite(result) && result > 0
    ? result : null
}

export function convertConsumption(value: string, unit: ConsumptionUnit): string {
  const converted = toLitersPer100Km(Number(value), unit)
  return converted === null ? value : String(converted)
}
