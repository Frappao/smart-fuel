'use client'

import dynamic from 'next/dynamic'

const HeroNozzle3D = dynamic(
  () => import('./HeroNozzle3D'),
  {
    ssr: false,
    loading: () => null,
  },
)

export default function HeroNozzleSection() {
  return <HeroNozzle3D />
}
