// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { CAMPAIGN_STORAGE_KEY, resetCampaignCache } from '../../lib/analytics/campaign'
import { CONSENT_KEY } from '../../lib/analytics/consent'
import AnalyticsConsent from './AnalyticsConsent'
import CookiePreferencesButton from './CookiePreferencesButton'

const GA_DISABLE_FLAG = 'ga-disable-G-0323M57ZQP'

function flags() {
  return window as unknown as Record<string, unknown>
}

function findConfigCall(): Record<string, unknown> | undefined {
  const call = (window.dataLayer ?? []).find(
    (entry) => (entry as ArrayLike<unknown>)[0] === 'config',
  ) as ArrayLike<unknown> | undefined
  return call?.[2] as Record<string, unknown> | undefined
}

describe('AnalyticsConsent', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
  })

  afterEach(() => {
    cleanup()
    window.localStorage.clear()
    window.sessionStorage.clear()
    resetCampaignCache()
    document.getElementById('rifornio-ga4')?.remove()
    delete window.gtag
    window.dataLayer = []
    delete flags()[GA_DISABLE_FLAG]
  })

  it('shows the banner with a link to the cookie policy and loads nothing before a choice', () => {
    render(<AnalyticsConsent />)

    expect(screen.getByRole('dialog', { name: 'Preferenze Analytics' })).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'cookie policy' }).getAttribute('href'),
    ).toBe('/cookie')
    expect(document.getElementById('rifornio-ga4')).toBeNull()
  })

  it('keeps the arrival campaign for GA4 when consent comes after a page change', () => {
    window.history.replaceState(
      null,
      '',
      '/?utm_source=tiktok&utm_medium=social&utm_campaign=lancio',
    )
    render(<AnalyticsConsent />)

    // Navigazione interna prima di scegliere: l'URL perde gli utm_*.
    window.history.replaceState(null, '', '/prezzi-carburanti')
    expect(window.sessionStorage.getItem(CAMPAIGN_STORAGE_KEY)).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Accetta Analytics' }))

    expect(document.getElementById('rifornio-ga4')).not.toBeNull()
    expect(findConfigCall()?.page_location).toBe(
      'http://localhost:3000/prezzi-carburanti?utm_source=tiktok&utm_medium=social&utm_campaign=lancio',
    )
    expect(window.sessionStorage.getItem(CAMPAIGN_STORAGE_KEY)).toContain('tiktok')
  })

  it('lets the user revoke consent from "Preferenze cookie"', () => {
    window.localStorage.setItem(CONSENT_KEY, 'granted')
    render(
      <>
        <AnalyticsConsent />
        <CookiePreferencesButton />
      </>,
    )

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(flags()[GA_DISABLE_FLAG]).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Preferenze cookie' }))

    const acceptButton = screen.getByRole('button', { name: 'Accetta Analytics' })
    expect(document.activeElement).toBe(acceptButton)
    expect(flags()[GA_DISABLE_FLAG]).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Continua senza Analytics' }))

    expect(window.localStorage.getItem(CONSENT_KEY)).toBe('denied')
    expect(flags()[GA_DISABLE_FLAG]).toBe(true)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
