export async function downloadCsv(url: string): Promise<string> {
  const response = await fetch(url, { method: 'GET' })

  if (!response.ok) {
    throw new Error(`Download CSV failed with HTTP ${response.status}: ${url}`)
  }

  return response.text()
}
