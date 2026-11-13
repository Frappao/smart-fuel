/**
 * Canale di provenienza della visita (parametri utm_* del link).
 *
 * Vale il primo link della sessione: i parametri restano in memoria per tutta
 * la visita e, solo dopo il consenso ad Analytics, anche nel sessionStorage
 * della scheda, così sopravvivono a un ricaricamento. Servono a:
 * - attribuire la sessione a GA4 anche quando il consenso arriva dopo aver
 *   cambiato pagina (l'URL non ha più gli utm_*);
 * - passare lo stesso canale a Google Play nei link di download dell'app.
 *
 * Convenzione dei link per canale: docs/utm.md.
 */

export const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const

export type UtmKey = (typeof UTM_KEYS)[number]

export type CampaignParams = Partial<Record<UtmKey, string>>

export const CAMPAIGN_STORAGE_KEY = 'rifornio_campaign_v1'

export const ANDROID_APP_ID = 'it.rifornio.app'

const MAX_VALUE_LENGTH = 100

let sessionCampaign: CampaignParams | null = null

function cleanValue(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().slice(0, MAX_VALUE_LENGTH)
  return trimmed === '' ? null : trimmed
}

function normalizeCampaign(source: (key: UtmKey) => unknown): CampaignParams | null {
  const campaign: CampaignParams = {}

  for (const key of UTM_KEYS) {
    const value = cleanValue(source(key))
    if (value !== null) campaign[key] = value
  }

  return Object.keys(campaign).length > 0 ? campaign : null
}

export function readCampaignFromUrl(rawUrl: string): CampaignParams | null {
  try {
    const { searchParams } = new URL(rawUrl)
    return normalizeCampaign((key) => searchParams.get(key))
  } catch {
    return null
  }
}

function readStoredCampaign(): CampaignParams | null {
  try {
    const raw = window.sessionStorage.getItem(CAMPAIGN_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const data = parsed as Record<string, unknown>
    return normalizeCampaign((key) => data[key])
  } catch {
    return null
  }
}

/** Canale della sessione corrente, se la visita è arrivata da un link con utm_*. */
export function getCampaign(): CampaignParams | null {
  if (sessionCampaign === null && typeof window !== 'undefined') {
    sessionCampaign = readStoredCampaign()
  }
  return sessionCampaign
}

/**
 * Registra gli utm_* dell'URL di arrivo. Non sovrascrive un canale già
 * registrato nella stessa sessione (vale il primo link).
 */
export function captureCampaign(rawUrl: string, canPersist: boolean): void {
  if (getCampaign() !== null) return

  const campaign = readCampaignFromUrl(rawUrl)
  if (campaign === null) return

  sessionCampaign = campaign
  if (canPersist) persistCampaign()
}

/** Da chiamare solo con il consenso ad Analytics. */
export function persistCampaign(): void {
  if (sessionCampaign === null) return
  try {
    window.sessionStorage.setItem(
      CAMPAIGN_STORAGE_KEY,
      JSON.stringify(sessionCampaign),
    )
  } catch {
    // Ignora: resta in memoria per questa pagina.
  }
}

/** Dopo una revoca: niente più copia nel browser, resta solo in memoria. */
export function forgetStoredCampaign(): void {
  try {
    window.sessionStorage.removeItem(CAMPAIGN_STORAGE_KEY)
  } catch {
    // Ignora.
  }
}

/**
 * URL con i parametri utm_* della sessione, se l'URL non ne ha già: GA4 li
 * legge dalla pagina di arrivo per attribuire la sessione al canale giusto.
 */
export function withCampaign(
  rawUrl: string,
  campaign: CampaignParams | null = getCampaign(),
): string {
  if (campaign === null) return rawUrl

  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return rawUrl
  }

  if (UTM_KEYS.some((key) => url.searchParams.has(key))) return rawUrl

  for (const key of UTM_KEYS) {
    const value = campaign[key]
    if (value) url.searchParams.set(key, value)
  }

  return url.toString()
}

const DEFAULT_PLAY_STORE_CAMPAIGN: CampaignParams = {
  utm_source: 'rifornio.it',
  utm_medium: 'referral',
  utm_campaign: 'sito',
}

/**
 * Link alla scheda Google Play con il canale nel parametro `referrer`: Play
 * Console mostra così le installazioni per sorgente e campagna. Chi arriva
 * da un link con utm_* porta con sé quel canale, gli altri risultano
 * provenienti dal sito.
 */
export function buildPlayStoreUrl(
  campaign: CampaignParams | null = getCampaign(),
): string {
  const source = campaign?.utm_source ? campaign : DEFAULT_PLAY_STORE_CAMPAIGN
  const referrer = new URLSearchParams()

  for (const key of UTM_KEYS) {
    const value = source[key]
    if (value) referrer.set(key, value)
  }

  const url = new URL('https://play.google.com/store/apps/details')
  url.searchParams.set('id', ANDROID_APP_ID)
  url.searchParams.set('referrer', referrer.toString())
  return url.toString()
}

/** Solo per i test: dimentica il canale in memoria. */
export function resetCampaignCache(): void {
  sessionCampaign = null
}
