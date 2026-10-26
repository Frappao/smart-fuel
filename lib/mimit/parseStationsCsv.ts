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
  const byMimitId = new Map<number, MimitStationRow>()

  for (const rawLine of csv.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (
      line === '' ||
      line.startsWith('Estrazione del ') ||
      line.startsWith('idImpianto|Gestore|')
    ) {
      continue
    }

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

    const parsedMimitId = Number(mimitId)

    if (!Number.isInteger(parsedMimitId) || parsedMimitId <= 0) {
      continue
    }

    byMimitId.set(parsedMimitId, {
      mimitId: parsedMimitId,
      manager: manager ?? '',
      brand: brand ?? '',
      stationType: stationType ?? '',
      name: name ?? '',
      address: address ?? '',
      city: city ?? '',
      province: province ?? '',
      latitude: parseNullableNumber(latitude),
      longitude: parseNullableNumber(longitude),
    })
  }

  return Array.from(byMimitId.values())
}
