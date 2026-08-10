export interface Station {
  id: number
  mimitId: number
  manager: string | null
  brand: string | null
  stationType: string | null
  name: string | null
  address: string | null
  city: string | null
  province: string | null
  latitude: number | null
  longitude: number | null
  sourceUpdatedAt: string | null
  updatedAt: string
}

export interface FuelPrice {
  id: number
  stationId: number
  fuelType: string
  price: number
  isSelf: boolean
  communicatedAt: string | null
  updatedAt: string
}
