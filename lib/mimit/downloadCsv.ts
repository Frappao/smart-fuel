const CSV_REQUEST_HEADERS = {
  Accept: 'text/csv,text/plain;q=0.9,*/*;q=0.8',
  'Accept-Language': 'it-IT,it;q=0.9',
  'User-Agent': 'Mozilla/5.0 (compatible; Rifornio/1.0; +https://rifornio.it)',
}

// Budget pensato per il maxDuration di 300s della route cron: nel caso
// peggiore due download (impianti + prezzi) costano ~2 × (3 × 30s + 2s + 5s).
const DEFAULT_ATTEMPTS = 3
const DEFAULT_TIMEOUT_MS = 30_000
const DEFAULT_RETRY_DELAYS_MS = [2_000, 5_000]

export interface DownloadCsvOptions {
  attempts?: number
  timeoutMs?: number
  retryDelaysMs?: number[]
}

function describeError(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error)
  }

  // undici espone il motivo reale (es. UND_ERR_CONNECT_TIMEOUT) in `cause`.
  const cause = error.cause as { code?: string; message?: string } | undefined
  const causeText = cause?.code ?? cause?.message

  return causeText ? `${error.message} (${causeText})` : error.message
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function downloadCsvOnce(url: string, timeoutMs: number): Promise<string> {
  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers: CSV_REQUEST_HEADERS,
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!response.ok) {
    throw new Error(`Download CSV failed with HTTP ${response.status}: ${url}`)
  }

  const text = await response.text()

  if (text.trimStart().startsWith('<')) {
    throw new Error(
      `Download CSV failed: received HTML instead of CSV from ${url}`,
    )
  }

  return text
}

export async function downloadCsv(
  url: string,
  options: DownloadCsvOptions = {},
): Promise<string> {
  const attempts = Math.max(1, options.attempts ?? DEFAULT_ATTEMPTS)
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const retryDelaysMs = options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const startedAt = Date.now()

    try {
      const text = await downloadCsvOnce(url, timeoutMs)

      console.info(
        `[mimit] download ok ${url} (tentativo ${attempt}/${attempts}, ${Date.now() - startedAt} ms, ${text.length} caratteri)`,
      )

      return text
    } catch (error) {
      lastError = error
      const delayMs =
        retryDelaysMs[Math.min(attempt - 1, retryDelaysMs.length - 1)] ?? 0
      const willRetry = attempt < attempts

      console.warn(
        `[mimit] download fallito ${url} (tentativo ${attempt}/${attempts}, ${Date.now() - startedAt} ms): ${describeError(error)}` +
          (willRetry ? ` — nuovo tentativo tra ${delayMs} ms` : ''),
      )

      if (willRetry && delayMs > 0) {
        await wait(delayMs)
      }
    }
  }

  throw new Error(
    `Download CSV failed after ${attempts} attempts: ${describeError(lastError)}`,
    { cause: lastError },
  )
}
