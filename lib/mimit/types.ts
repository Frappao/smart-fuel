export interface MimitStationRow {
  mimitId: number
  manager: string
  brand: string
  stationType: string
  name: string
  address: string
  city: string
  province: string
  latitude: number | null
  longitude: number | null
}

export interface MimitFuelPriceRow {
  mimitId: number
  fuelType: string
  price: number
  isSelf: boolean
  communicatedAt: string | null
}
