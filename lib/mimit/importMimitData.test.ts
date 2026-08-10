import { beforeEach, describe, expect, it, vi } from 'vitest'

import { importMimitData } from './importMimitData'
import { importMimitFuelPrices } from './importMimitFuelPrices'
import { importMimitStations } from './importMimitStations'

vi.mock('./importMimitFuelPrices', () => ({
  importMimitFuelPrices: vi.fn(),
}))
vi.mock('./importMimitStations', () => ({
  importMimitStations: vi.fn(),
}))

const stationsResult = {
  totalParsed: 2_000,
  totalImported: 2_000,
}
const fuelPricesResult = {
  totalParsed: 5_000,
  totalImported: 4_900,
  totalSkipped: 100,
}

describe('importMimitData', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('imports stations before fuel prices and returns both results', async () => {
    vi.mocked(importMimitStations).mockResolvedValue(stationsResult)
    vi.mocked(importMimitFuelPrices).mockResolvedValue(fuelPricesResult)

    await expect(importMimitData()).resolves.toEqual({
      stations: stationsResult,
      fuelPrices: fuelPricesResult,
    })

    expect(importMimitStations).toHaveBeenCalledOnce()
    expect(importMimitFuelPrices).toHaveBeenCalledOnce()
    expect(
      vi.mocked(importMimitStations).mock.invocationCallOrder[0],
    ).toBeLessThan(
      vi.mocked(importMimitFuelPrices).mock.invocationCallOrder[0],
    )
  })

  it('propagates a stations error without starting the fuel prices import', async () => {
    const stationsError = new Error('stations unavailable')
    vi.mocked(importMimitStations).mockRejectedValue(stationsError)

    await expect(importMimitData()).rejects.toBe(stationsError)

    expect(importMimitFuelPrices).not.toHaveBeenCalled()
  })

  it('propagates a fuel prices error after stations succeed', async () => {
    const fuelPricesError = new Error('prices unavailable')
    vi.mocked(importMimitStations).mockResolvedValue(stationsResult)
    vi.mocked(importMimitFuelPrices).mockRejectedValue(fuelPricesError)

    await expect(importMimitData()).rejects.toBe(fuelPricesError)

    expect(importMimitStations).toHaveBeenCalledOnce()
    expect(importMimitFuelPrices).toHaveBeenCalledOnce()
  })
})
