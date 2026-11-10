import { describe, expect, test } from 'vitest'
import { buildCityPriceTrend, formatPriceChange, fullTankSavings } from './cityPriceTrend'

describe('buildCityPriceTrend', () => {
  test('returns null with fewer than two days of data', () => {
    expect(buildCityPriceTrend('benzina_self', [])).toBeNull()
    expect(
      buildCityPriceTrend('benzina_self', [{ date: '2026-11-10', avg: 1.8, min: 1.7 }]),
    ).toBeNull()
  })

  test('sorts points and computes the change over the period', () => {
    const trend = buildCityPriceTrend('gasolio_self', [
      { date: '2026-11-10', avg: 1.75, min: 1.69 },
      { date: '2026-11-08', avg: 1.77, min: 1.7 },
    ])

    expect(trend?.points.map((p) => p.date)).toEqual(['2026-11-08', '2026-11-10'])
    expect(trend?.latestAvg).toBe(1.75)
    expect(trend?.changePeriod).toBe(-0.02)
    expect(trend?.periodDays).toBe(2)
    expect(trend?.change7d).toBeNull()
  })

  test('computes the 7-day change against the closest point at least a week old', () => {
    const trend = buildCityPriceTrend('benzina_self', [
      { date: '2026-11-01', avg: 1.8, min: 1.7 },
      { date: '2026-11-03', avg: 1.81, min: 1.7 },
      { date: '2026-11-05', avg: 1.82, min: 1.7 },
      { date: '2026-11-10', avg: 1.85, min: 1.7 },
    ])

    expect(trend?.change7d).toBe(0.04)
    expect(trend?.changePeriod).toBe(0.05)
  })

  test('ignores invalid prices', () => {
    const trend = buildCityPriceTrend('gpl', [
      { date: '2026-11-01', avg: 0, min: 0 },
      { date: '2026-11-02', avg: Number.NaN, min: 0.7 },
      { date: '2026-11-03', avg: 0.72, min: 0.7 },
    ])

    expect(trend).toBeNull()
  })
})

describe('fullTankSavings', () => {
  test('returns the saving for a full tank at the minimum price', () => {
    expect(fullTankSavings(1.85, 1.75, 50)).toBe(5)
  })

  test('never returns a negative saving', () => {
    expect(fullTankSavings(1.7, 1.7)).toBe(0)
    expect(fullTankSavings(1.6, 1.7)).toBe(0)
  })
})

describe('formatPriceChange', () => {
  test('formats increases, decreases and no change in Italian', () => {
    expect(formatPriceChange(0.012)).toBe('+0,012 €/L')
    expect(formatPriceChange(-0.02)).toBe('−0,020 €/L')
    expect(formatPriceChange(0)).toBe('±0,000 €/L')
  })
})
