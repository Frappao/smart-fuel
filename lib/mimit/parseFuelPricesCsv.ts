import type { MimitFuelPriceRow } from './types'

function parseIsSelf(value: string | undefined): boolean {
  const normalizedValue = value?.trim().toLowerCase()

  return normalizedValue === '1' || normalizedValue === 'true'
}

export function parseFuelPricesCsv(csv: string): MimitFuelPriceRow[] {
  const byCompositeKey = new Map<string, MimitFuelPriceRow>()

  for (const rawLine of csv.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (
      line === '' ||
      line.startsWith('Estrazione del ') ||
      line.startsWith('idImpianto|descCarburante|')
    ) {
      continue
    }

    const [mimitId, fuelType, price, isSelf, communicatedAt] = line
      .split('|')
      .map((field) => field.trim())

    const parsedMimitId = Number(mimitId)
    const normalizedFuelType = fuelType ?? ''
    const parsedPrice = Number(price)
    const parsedIsSelf = parseIsSelf(isSelf)

    if (
      !Number.isInteger(parsedMimitId) ||
      parsedMimitId <= 0 ||
      normalizedFuelType === '' ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice <= 0
    ) {
      continue
    }

    const key = `${parsedMimitId}|${normalizedFuelType}|${parsedIsSelf}`

    byCompositeKey.set(key, {
      mimitId: parsedMimitId,
      fuelType: normalizedFuelType,
      price: parsedPrice,
      isSelf: parsedIsSelf,
      communicatedAt: communicatedAt || null,
    })
  }

  return Array.from(byCompositeKey.values())
}
