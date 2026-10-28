'use client'

interface StationComparisonCardProps {
  title: string
  subtitle: string
  isWinner?: boolean
  litersPurchased: number
  travelFuelLiters: number
  netFuelLiters: number
}

function StationComparisonCard({
  title,
  subtitle,
  isWinner = false,
  litersPurchased,
  travelFuelLiters,
  netFuelLiters,
}: StationComparisonCardProps) {
  const burnPercent = Math.min(100, Math.round((travelFuelLiters / litersPurchased) * 100))
  const netPercent = 100 - burnPercent

  return (
    <div
      className={`rounded-2xl border p-5 transition-all ${
        isWinner
          ? 'border-emerald-500/80 bg-emerald-50/60 shadow-sm dark:border-emerald-500/50 dark:bg-emerald-950/30'
          : 'border-zinc-200 bg-white/80 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isWinner
              ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950'
              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
          }`}
        >
          {isWinner ? '🏆 Più litri netti' : 'Meno conveniente'}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</span>
      </div>

      <h3 className="mt-2 text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>

      {/* Visual tank bar representation */}
      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-emerald-700 dark:text-emerald-300">
            Nel serbatoio: <strong>{netFuelLiters.toFixed(1)} L</strong>
          </span>
          <span className="text-amber-700 dark:text-amber-400">
            Bruciati in strada: <strong>{travelFuelLiters.toFixed(1)} L</strong>
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 flex">
          <div
            className={`h-full transition-all duration-500 ${
              isWinner ? 'bg-emerald-500' : 'bg-emerald-600/70'
            }`}
            style={{ width: `${netPercent}%` }}
            title={`Litri netti: ${netFuelLiters.toFixed(1)} L`}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${burnPercent}%` }}
            title={`Consumati nel tragitto: ${travelFuelLiters.toFixed(1)} L`}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <div>
          <span className="text-zinc-500 dark:text-zinc-400">Litri acquistati:</span>
          <p className="font-semibold text-zinc-800 dark:text-zinc-200">{litersPurchased.toFixed(1)} L</p>
        </div>
        <div>
          <span className="text-zinc-500 dark:text-zinc-400">Consumo viaggio A/R:</span>
          <p className="font-semibold text-amber-600 dark:text-amber-400">−{travelFuelLiters.toFixed(1)} L</p>
        </div>
      </div>
    </div>
  )
}

export default function FuelTankComparisonSection() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <StationComparisonCard
        title="Distributore Vicino"
        subtitle="1 km da te"
        isWinner={true}
        litersPurchased={27.5}
        travelFuelLiters={0.8}
        netFuelLiters={26.7}
      />
      <StationComparisonCard
        title="Distributore Discount Lontano"
        subtitle="15 km da te"
        isWinner={false}
        litersPurchased={28.9}
        travelFuelLiters={3.4}
        netFuelLiters={25.5}
      />
    </div>
  )
}
