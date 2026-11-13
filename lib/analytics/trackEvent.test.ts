// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CONSENT_KEY } from './consent'
import { getConsumptionBand, sanitizeEventParams, trackEvent } from './trackEvent'

describe('trackEvent', () => {
  const gtag = vi.fn()

  beforeEach(() => {
    gtag.mockReset()
    window.gtag = gtag
  })

  afterEach(() => {
    window.localStorage.clear()
    delete window.gtag
  })

  it('sends nothing without consent', () => {
    trackEvent('app_waitlist_signup', { platform: 'android' })
    window.localStorage.setItem(CONSENT_KEY, 'denied')
    trackEvent('app_waitlist_signup', { platform: 'android' })

    expect(gtag).not.toHaveBeenCalled()
  })

  it('sends the event to GA4 after consent, without empty values', () => {
    window.localStorage.setItem(CONSENT_KEY, 'granted')

    trackEvent('search_performed', {
      search_mode: 'nearby',
      fuel_type: 'Benzina',
      service: 'self',
      results_count: 3,
      city: null,
    })

    expect(gtag).toHaveBeenCalledWith('event', 'search_performed', {
      search_mode: 'nearby',
      fuel_type: 'Benzina',
      service: 'self',
      results_count: 3,
    })
  })

  it('does nothing when gtag is not loaded (e.g. in the app)', () => {
    window.localStorage.setItem(CONSENT_KEY, 'granted')
    delete window.gtag

    expect(() =>
      trackEvent('app_waitlist_signup', { platform: 'ios' }),
    ).not.toThrow()
  })

  it('never breaks the page if gtag throws', () => {
    window.localStorage.setItem(CONSENT_KEY, 'granted')
    gtag.mockImplementation(() => {
      throw new Error('blocked')
    })

    expect(() =>
      trackEvent('app_waitlist_signup', { platform: 'ios' }),
    ).not.toThrow()
  })
})

describe('sanitizeEventParams', () => {
  it('drops empty, non finite and non primitive values and caps strings', () => {
    expect(
      sanitizeEventParams({
        city: '  Milano ',
        brand: '',
        rank: Number.NaN,
        results_count: 0,
        nested: { latitude: 45 },
        long: 'x'.repeat(150),
      }),
    ).toEqual({ city: 'Milano', results_count: 0, long: 'x'.repeat(100) })
  })
})

describe('getConsumptionBand', () => {
  it('groups consumption in coarse bands', () => {
    expect(getConsumptionBand(4.2)).toBe('meno di 5')
    expect(getConsumptionBand(5)).toBe('5-7')
    expect(getConsumptionBand(8.9)).toBe('7-9')
    expect(getConsumptionBand(10)).toBe('9-12')
    expect(getConsumptionBand(15)).toBe('12 e oltre')
    expect(getConsumptionBand(Number.NaN)).toBe('sconosciuto')
  })
})
