import type { FuelStatSummary } from '../../lib/stations/getCityStations'
import type { CityPriceHistory } from '../../lib/stations/getCityPriceHistory'
import {
  formatPriceChange,
  fullTankSavings,
  type CityPricePoint,
  type CityPriceSeries,
} from '../../lib/stations/cityPriceTrend'

interface CityPriceInsightsProps {
  cityName: string
  stats: {
    benzinaSelf?: FuelStatSummary
    gasolioSelf?: FuelStatSummary
    gpl?: FuelStatSummary
  }
  history: CityPriceHistory
}

const SERIES_LABEL: Record<CityPriceSeries, string> = {
  benzina_self: 'Benzina self',
  gasolio_self: 'Gasolio self',
  gpl: 'GPL',
}

const FULL_TANK_LITERS = 50

function formatEuro(value: number, digits = 2): string {
  return value.toLocaleString('it-IT', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

function formatShortDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Rome',
  })
}

function Sparkline({ points, label }: { points: CityPricePoint[]; label: string }) {
  const width = 240
  const height = 56
  const padding = 4
  const values = points.map((p) => p.avg)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 0.001

  const coords = points.map((p, i) => {
    const x = padding + (i / Math.max(points.length - 1, 1)) * (width - padding * 2)
    const y = padding + (1 - (p.avg - min) / range) * (height - padding * 2)
    return [x, y] as const
  })
  const path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const [lastX, lastY] = coords[coords.length - 1]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-14 w-full text-emerald-600 dark:text-emerald-400"
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      <path d={path} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={lastX} cy={lastY} r={3} fill="currentColor" />
    </svg>
  )
}

function changeTone(change: number): string {
  if (change > 0) return 'text-red-700 dark:text-red-400'
  if (change < 0) return 'text-emerald-700 dark:text-emerald-400'
  return 'text-zinc-600 dark:text-zinc-400'
}

/**
 * Riepilogo testuale + andamento dei prezzi della città.
 * Il blocco "andamento" compare solo quando esiste uno storico (almeno 2 giorni).
 */
export function CityPriceInsights({ cityName, stats, history }: CityPriceInsightsProps) {
  const benzina = stats.benzinaSelf
  const gasolio = stats.gasolioSelf
  const benzinaSavings = benzina ? fullTankSavings(benzina.avg, benzina.min, FULL_TANK_LITERS) : 0
  const gasolioSavings = gasolio ? fullTankSavings(gasolio.avg, gasolio.min, FULL_TANK_LITERS) : 0
  const trends = (Object.keys(SERIES_LABEL) as CityPriceSeries[])
    .map((series) => history[series])
    .filter((trend) => trend !== undefined)

  const benzinaTrend = history.benzina_self
  const hasSummary = Boolean(benzina || gasolio)

  if (!hasSummary && trends.length === 0) return null

  return (
    <section aria-labelledby="city-insights-title" className="mb-10 space-y-6">
      {hasSummary ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <h2 id="city-insights-title" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Quanto si risparmia a {cityName}
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
            {benzina ? (
              <p>
                Oggi la benzina self a {cityName} costa in media{' '}
                <strong className="tabular-nums">{formatEuro(benzina.avg, 3)} €/L</strong>, con una differenza di{' '}
                <strong className="tabular-nums">{formatEuro((benzina.max - benzina.min) * 100, 1)} centesimi</strong>{' '}
                tra il distributore più caro e il più economico.
                {benzinaSavings > 0 ? (
                  <>
                    {' '}Su un pieno da {FULL_TANK_LITERS} litri, scegliere il prezzo più basso invece della media fa risparmiare circa{' '}
                    <strong className="tabular-nums">{formatEuro(benzinaSavings)} €</strong>.
                  </>
                ) : null}
              </p>
            ) : null}
            {gasolio ? (
              <p>
                Il gasolio self costa in media <strong className="tabular-nums">{formatEuro(gasolio.avg, 3)} €/L</strong>
                {gasolioSavings > 0 ? (
                  <>
                    : con il distributore più economico un pieno da {FULL_TANK_LITERS} litri costa circa{' '}
                    <strong className="tabular-nums">{formatEuro(gasolioSavings)} €</strong> in meno.
                  </>
                ) : (
                  '.'
                )}
              </p>
            ) : null}
            {benzinaTrend?.change7d != null && benzinaTrend.change7d !== 0 ? (
              <p>
                Rispetto a una settimana fa la media della benzina è{' '}
                {benzinaTrend.change7d > 0 ? 'salita' : 'scesa'} di{' '}
                <strong className="tabular-nums">{formatEuro(Math.abs(benzinaTrend.change7d) * 100, 1)} centesimi</strong> al litro.
              </p>
            ) : null}
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Attenzione: il risparmio alla pompa non tiene conto della strada per arrivarci. Se il distributore più economico è lontano, il carburante consumato nel tragitto può annullarlo.
            </p>
          </div>
        </div>
      ) : null}

      {trends.length > 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Andamento dei prezzi a {cityName}
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Prezzo medio giornaliero dei distributori del comune, dati MIMIT.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trends.map((trend) => {
              const first = trend.points[0]
              const last = trend.points[trend.points.length - 1]
              const label = SERIES_LABEL[trend.series]
              return (
                <div key={trend.series} className="rounded-xl border border-zinc-100 p-4 dark:border-zinc-800">
                  <p className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">{label}</p>
                  <p className="mt-2 text-2xl font-extrabold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {formatEuro(trend.latestAvg, 3)} €
                  </p>
                  <Sparkline
                    points={trend.points}
                    label={`${label}: media da ${formatEuro(first.avg, 3)} a ${formatEuro(last.avg, 3)} euro al litro`}
                  />
                  <div className="mt-2 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs tabular-nums">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {formatShortDate(first.date)} – {formatShortDate(last.date)}
                    </span>
                    {trend.change7d != null ? (
                      <span className={changeTone(trend.change7d)}>7 giorni: {formatPriceChange(trend.change7d)}</span>
                    ) : trend.changePeriod != null ? (
                      <span className={changeTone(trend.changePeriod)}>
                        {trend.periodDays} {trend.periodDays === 1 ? 'giorno' : 'giorni'}: {formatPriceChange(trend.changePeriod)}
                      </span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </section>
  )
}
