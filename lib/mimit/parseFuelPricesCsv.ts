import type { MimitFuelPriceRow } from './types'

function parseIsSelf(value: string | undefined): boolean {
  const normalizedValue = value?.trim().toLowerCase()

  return normalizedValue === '1' || normalizedValue === 'true'
}

export function parseFuelPricesCsv(csv: string): MimitFuelPriceRow[] {
  return csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line !== '' &&
        !line.startsWith('Estrazione del ') &&
        !line.startsWith('idImpianto|descCarburante|'),
    )
    .map((line) => {
      const [mimitId, fuelType, price, isSelf, communicatedAt] = line
        .split('|')
        .map((field) => field.trim())

      return {
        mimitId: Number(mimitId),
        fuelType: fuelType ?? '',
        price: Number(price),
        isSelf: parseIsSelf(isSelf),
        communicatedAt: communicatedAt || null,
      }
    })
}
