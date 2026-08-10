export interface CalculateConvenienceInput {
  pricePerLiter: number
  refuelAmount: number
  travelDistanceKm: number
  consumptionLitersPer100Km: number
}

export interface CalculateConvenienceOutput {
  litersPurchased: number
  travelFuelLiters: number
  netFuelLiters: number
}

export function calculateConvenience({
  pricePerLiter,
  refuelAmount,
  travelDistanceKm,
  consumptionLitersPer100Km,
}: CalculateConvenienceInput): CalculateConvenienceOutput {
  const litersPurchased = refuelAmount / pricePerLiter
  const travelFuelLiters =
    (travelDistanceKm * consumptionLitersPer100Km) / 100

  return {
    litersPurchased,
    travelFuelLiters,
    netFuelLiters: litersPurchased - travelFuelLiters,
  }
}
