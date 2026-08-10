import 'server-only'

import { importMimitFuelPrices } from './importMimitFuelPrices'
import { importMimitStations } from './importMimitStations'

export async function importMimitData() {
  const stations = await importMimitStations()
  const fuelPrices = await importMimitFuelPrices()

  return {
    stations,
    fuelPrices,
  }
}
