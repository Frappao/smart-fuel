// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  CONSENT_EVENT,
  CONSENT_KEY,
  deleteGoogleAnalyticsCookies,
  getStoredConsent,
  hasAnalyticsConsent,
  reopenConsentChoice,
  saveConsent,
} from './consent'

afterEach(() => {
  window.localStorage.clear()
})

describe('consent store', () => {
  it('reads only valid stored values', () => {
    expect(getStoredConsent()).toBeNull()
    window.localStorage.setItem(CONSENT_KEY, 'maybe')
    expect(getStoredConsent()).toBeNull()
    window.localStorage.setItem(CONSENT_KEY, 'granted')
    expect(hasAnalyticsConsent()).toBe(true)
  })

  it('saves the choice and lets the user decide again', () => {
    const listener = vi.fn()
    window.addEventListener(CONSENT_EVENT, listener)

    saveConsent('denied')
    expect(getStoredConsent()).toBe('denied')

    reopenConsentChoice()
    expect(getStoredConsent()).toBeNull()
    expect(listener).toHaveBeenCalledTimes(2)

    window.removeEventListener(CONSENT_EVENT, listener)
  })
})

describe('deleteGoogleAnalyticsCookies', () => {
  it('removes only Google Analytics cookies', () => {
    document.cookie = '_ga=GA1.1.123; path=/'
    document.cookie = '_ga_0323M57ZQP=GS1.1.456; path=/'
    document.cookie = 'other=keep; path=/'

    deleteGoogleAnalyticsCookies()

    expect(document.cookie).toBe('other=keep')
    document.cookie = 'other=; Max-Age=0; path=/'
  })
})
