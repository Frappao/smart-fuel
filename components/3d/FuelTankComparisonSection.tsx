'use client'

import dynamic from 'next/dynamic'

const FuelTank3D = dynamic(
  () => import('./FuelTank3D'),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full animate-pulse rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
    ),
  },
)

export default function FuelTankComparisonSection() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <FuelTank3D
        stationName="Distributore Vicino (Vincitore)"
        litersPurchased={27.5}
        travelFuelLiters={0.8}
        netFuelLiters={26.7}
        tankCapacity={55}
      />
      <FuelTank3D
        stationName="Distributore Discount Lontano"
        litersPurchased={28.9}
        travelFuelLiters={3.4}
        netFuelLiters={25.5}
        tankCapacity={55}
      />
    </div>
  )
}
