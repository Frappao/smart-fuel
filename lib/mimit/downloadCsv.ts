const CSV_REQUEST_HEADERS = {
  Accept: 'text/csv,text/plain;q=0.9,*/*;q=0.8',
  'Accept-Language': 'it-IT,it;q=0.9',
  'User-Agent': 'Mozilla/5.0 (compatible; Rifornio/1.0; +https://rifornio.it)',
}

export async function downloadCsv(url: string): Promise<string> {
  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers: CSV_REQUEST_HEADERS,
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
