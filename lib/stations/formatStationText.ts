// I dati MIMIT arrivano spesso tutti in maiuscolo ("STAROIL MILANO",
// "VIA TORINO 12"). Per la sola visualizzazione li riportiamo a una forma
// leggibile, lasciando intatti i testi già scritti con maiuscole e minuscole.

const KEEP_UPPERCASE = new Set([
  'IP',
  'API',
  'Q8',
  'SP',
  'SS',
  'SR',
  'SC',
  'SPA',
  'SRL',
  'SNC',
  'SAS',
  'GPL',
  'ENI',
  'IES',
  'KM',
])

const KEEP_LOWERCASE = new Set([
  'di',
  'da',
  'del',
  'dei',
  'degli',
  'della',
  'delle',
  'dello',
  'dal',
  'dalla',
  'al',
  'alla',
  'alle',
  'e',
  'ed',
  'in',
  'per',
  'con',
  'su',
  'sul',
  'sulla',
])

function hasLowercaseLetters(value: string): boolean {
  return value !== value.toUpperCase()
}

function formatWord(word: string, isFirstWord: boolean): string {
  if (!/\p{L}/u.test(word)) {
    return word
  }

  if (KEEP_UPPERCASE.has(word) || /\d/.test(word)) {
    return word
  }

  const lower = word.toLocaleLowerCase('it-IT')

  if (!isFirstWord && KEEP_LOWERCASE.has(lower)) {
    return lower
  }

  // Capitalizza anche dopo apostrofi e trattini: "SANT'ANNA" → "Sant'Anna".
  return lower.replace(
    /(^|['’\-./(])(\p{L})/gu,
    (_match, separator: string, letter: string) =>
      `${separator}${letter.toLocaleUpperCase('it-IT')}`,
  )
}

export function toDisplayCase(value: string): string
export function toDisplayCase(value: string | null | undefined): string | null
export function toDisplayCase(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null
  }

  if (hasLowercaseLetters(value)) {
    return value
  }

  return value
    .split(/(\s+)/)
    .map((part, index) =>
      /^\s+$/.test(part) ? part : formatWord(part, index === 0),
    )
    .join('')
}

export function formatStationLocation(
  address: string | null | undefined,
  city: string | null | undefined,
): string | null {
  const parts = [toDisplayCase(address?.trim()), toDisplayCase(city?.trim())]
    .filter((part): part is string => Boolean(part))
    // Evita "Via Roma 1 Milano · Milano" quando l'indirizzo contiene già la città.
    .filter(
      (part, index, all) =>
        index === 0 ||
        !all[0].toLocaleLowerCase('it-IT').includes(part.toLocaleLowerCase('it-IT')),
    )

  return parts.length > 0 ? parts.join(' · ') : null
}
