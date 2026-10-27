'use client'

import dynamic from 'next/dynamic'

const ConvenienceSimulator3D = dynamic(
  () => import('./ConvenienceSimulator3D'),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 w-full animate-pulse rounded-3xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
    ),
  },
)

export default function ConvenienceSimulatorSection() {
  return (
    <div className="pt-2">
      <ConvenienceSimulator3D />
    </div>
  )
}
