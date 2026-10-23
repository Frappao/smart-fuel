'use client'

import { getStationDisplayName } from '../../lib/calculation/rankNearbyStations'

const threeDecimalFormatter = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

const oneDecimalFormatter = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const twoDecimalFormatter = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function splitRoadSignPrice(price: number): {
  main: string
  millesimi: string
  fullText: string
} {
  const formatted = threeDecimalFormatter.format(price)
  if (formatted.length >= 2) {
    return {
      main: formatted.slice(0, -1),
      millesimi: formatted.slice(-1),
      fullText: formatted,
    }
  }
  return {
    main: formatted,
    millesimi: '',
    fullText: formatted,
  }
}

export function RoadSignPrice({
  price,
  className = '',
}: {
  price: number
  className?: string
}) {
  const { main, millesimi } = splitRoadSignPrice(price)

  return (
    <span className={` tabular-nums ${className}`.trim()}>
      {main}
      {millesimi ? (
        <sup className="ml-px text-[0.72em] font-bold leading-none">
          {millesimi}
        </sup>
      ) : null}
    </span>
  )
}

export interface WinnerInsightCandidate {
  station: {
    id: number
    name: string | null
    brand: string | null
    city: string | null
    fuelPrice: number
  }
  netFuelLiters: number
  travelDistanceKm: number
}

export interface WinnerInsight {
  badge: string
  message: string
}

export function buildWinnerInsight(
  results: WinnerInsightCandidate[],
  mode: 'nearby' | 'trip' = 'nearby',
): WinnerInsight | null {
  if (results.length < 2) {
    return null
  }

  const winner = results[0]
  const runnerUp = results[1]

  if (
    Math.round(winner.netFuelLiters * 100) <=
    Math.round(runnerUp.netFuelLiters * 100)
  ) {
    return null
  }

  const cheapestNominal = results.reduce((cheapest, candidate) =>
    candidate.station.fuelPrice < cheapest.station.fuelPrice
      ? candidate
      : cheapest,
  )

  if (
    cheapestNominal.station.id !== winner.station.id &&
    winner.station.fuelPrice - cheapestNominal.station.fuelPrice >= 0.001 &&
    Math.round(winner.netFuelLiters * 100) >
      Math.round(cheapestNominal.netFuelLiters * 100)
  ) {
    const centsDiff =
      (winner.station.fuelPrice - cheapestNominal.station.fuelPrice) * 100
    const extraKm = Math.max(
      0.1,
      cheapestNominal.travelDistanceKm - winner.travelDistanceKm,
    )
    const netLitersAdvantage =
      winner.netFuelLiters - cheapestNominal.netFuelLiters
    const realEurosSaved = netLitersAdvantage * winner.station.fuelPrice
    const cheaperName = getStationDisplayName(cheapestNominal.station)
    const distancePhrase =
      mode === 'trip'
        ? `evitando ${oneDecimalFormatter.format(extraKm)} km di deviazione in più`
        : `evitando ${oneDecimalFormatter.format(extraKm)} km di strada extra A/R`

    return {
      badge: 'La dritta di Rifornio',
      message: `Costa ${oneDecimalFormatter.format(centsDiff)} cent/L in più di ${cheaperName}, ma ${distancePhrase} risparmi davvero circa ${twoDecimalFormatter.format(realEurosSaved)} € sul pieno.`,
    }
  }

  const secondExtraKm = runnerUp.travelDistanceKm - winner.travelDistanceKm
  const netLitersAdvantage = winner.netFuelLiters - runnerUp.netFuelLiters
  const realEurosSaved = netLitersAdvantage * winner.station.fuelPrice

  if (secondExtraKm > 0.2) {
    return {
      badge: 'Doppio vantaggio',
      message: `Ha il miglior prezzo utile della zona e ti fa risparmiare circa ${twoDecimalFormatter.format(realEurosSaved)} € reali evitando ${oneDecimalFormatter.format(secondExtraKm)} km di guida inutile.`,
    }
  }

  return {
    badge: 'Scelta ottimale',
    message: `Combina il miglior prezzo alla pompa con il percorso più efficiente: risparmi circa ${twoDecimalFormatter.format(realEurosSaved)} € reali rispetto alle alternative.`,
  }
}
