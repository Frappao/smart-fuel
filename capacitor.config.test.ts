import { describe, expect, it } from 'vitest'

import config from './capacitor.config'

describe('Capacitor configuration', () => {
  it('uses the mobile static build and native HTTP fetch patch', () => {
    expect(config.webDir).toBe('mobile/dist')
    expect(config.plugins?.CapacitorHttp?.enabled).toBe(true)
  })
})
