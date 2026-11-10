export type CityPriceSeries = 'benzina_self' | 'gasolio_self' | 'gpl'

export interface CityPricePoint {
  date: string // YYYY-MM-DD
  avg: number
  min: number
}

export interface CityPriceTrend {
  series: CityPriceSeries
  points: CityPricePoint[]
  latestAvg: number
  /** Variazione della media rispetto a ~7 giorni prima (€/L), se disponibile. */
  change7d: number | null
  /** Variazione della media rispetto al primo punto del periodo (€/L), se disponibile. */
  changePeriod: number | null
  periodDays: number
}

const DAY_MS = 24 * 60 * 60 * 1000

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS)
}

function roundPrice(value: number): number {
  return Math.round(value * 1000) / 1000
}

/**
 * Calcola l'andamento di una serie di prezzi medi giornalieri.
 * Servono almeno 2 giorni di dati: con meno non c'è un andamento da mostrare.
 */
export function buildCityPriceTrend(
  series: CityPriceSeries,
  rawPoints: CityPricePoint[],
): CityPriceTrend | null {
  const points = [...rawPoints]
    .filter((p) => Number.isFinite(p.avg) && p.avg > 0)
    .sort((a, b) => a.date.localeCompare(b.date))

  if (points.length < 2) return null

  const latest = points[points.length - 1]
  const first = points[0]

  // Punto più recente che abbia almeno 7 giorni di distanza dall'ultimo.
  const weekAgo = [...points]
    .reverse()
    .find((p) => daysBetween(p.date, latest.date) >= 7)

  return {
    series,
    points,
    latestAvg: latest.avg,
    change7d: weekAgo ? roundPrice(latest.avg - weekAgo.avg) : null,
    changePeriod: roundPrice(latest.avg - first.avg),
    periodDays: daysBetween(first.date, latest.date),
  }
}

/**
 * Risparmio in euro per un pieno di `liters` litri scegliendo il prezzo
 * minimo invece della media della città. Solo indicativo: non considera il
 * carburante consumato per raggiungere il distributore.
 */
export function fullTankSavings(avg: number, min: number, liters = 50): number {
  if (!(avg > min)) return 0
  return Math.round((avg - min) * liters * 100) / 100
}

/** Testo leggibile per una variazione di prezzo in €/L, es. "+0,012 €/L". */
export function formatPriceChange(change: number): string {
  const sign = change > 0 ? '+' : change < 0 ? '−' : '±'
  return `${sign}${Math.abs(change).toFixed(3).replace('.', ',')} €/L`
}
