import type { MimitStationRow } from './types'

function parseNullableNumber(value: string | undefined): number | null {
  const normalizedValue = value?.trim() ?? ''

  if (normalizedValue === '') {
    return null
  }

  const parsedValue = Number(normalizedValue)

  return Number.isFinite(parsedValue) ? parsedValue : null
}

export function parseStationsCsv(csv: string): MimitStationRow[] {
  return csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line !== '' &&
        !line.startsWith('Estrazione del ') &&
        !line.startsWith('idImpianto|Gestore|'),
    )
    .map((line) => {
      const [
        mimitId,
        manager,
        brand,
        stationType,
        name,
        address,
        city,
        province,
        latitude,
        longitude,
      ] = line.split('|').map((field) => field.trim())

      return {
        mimitId: Number(mimitId),
        manager: manager ?? '',
        brand: brand ?? '',
        stationType: stationType ?? '',
        name: name ?? '',
        address: address ?? '',
        city: city ?? '',
        province: province ?? '',
        latitude: parseNullableNumber(latitude),
        longitude: parseNullableNumber(longitude),
      }
    })
}
