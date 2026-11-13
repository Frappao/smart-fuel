// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'

import {
  buildPlayStoreUrl,
  CAMPAIGN_STORAGE_KEY,
  captureCampaign,
  forgetStoredCampaign,
  getCampaign,
  persistCampaign,
  readCampaignFromUrl,
  resetCampaignCache,
  withCampaign,
} from './campaign'

afterEach(() => {
  resetCampaignCache()
  window.sessionStorage.clear()
})

describe('readCampaignFromUrl', () => {
  it('keeps only utm parameters, trimmed', () => {
    expect(
      readCampaignFromUrl(
        'https://rifornio.it/?utm_source=tiktok&utm_medium=social&utm_campaign=%20lancio%20&nome=Q8&utm_content=',
      ),
    ).toEqual({
      utm_source: 'tiktok',
      utm_medium: 'social',
      utm_campaign: 'lancio',
    })
  })

  it('returns null without utm parameters or with an invalid url', () => {
    expect(readCampaignFromUrl('https://rifornio.it/?condividi=1')).toBeNull()
    expect(readCampaignFromUrl('not a url')).toBeNull()
  })

  it('caps very long values', () => {
    const campaign = readCampaignFromUrl(
      `https://rifornio.it/?utm_source=${'a'.repeat(300)}`,
    )
    expect(campaign?.utm_source).toHaveLength(100)
  })
})

describe('captureCampaign', () => {
  it('keeps the first campaign of the session', () => {
    captureCampaign('https://rifornio.it/?utm_source=reddit&utm_medium=social', false)
    captureCampaign('https://rifornio.it/?utm_source=newsletter&utm_medium=email', false)

    expect(getCampaign()).toEqual({ utm_source: 'reddit', utm_medium: 'social' })
  })

  it('stores nothing in the browser without consent', () => {
    captureCampaign('https://rifornio.it/?utm_source=reddit', false)

    expect(window.sessionStorage.getItem(CAMPAIGN_STORAGE_KEY)).toBeNull()
    expect(getCampaign()).toEqual({ utm_source: 'reddit' })
  })

  it('persists for the session once consent is given', () => {
    captureCampaign('https://rifornio.it/?utm_source=instagram&utm_medium=social', true)
    resetCampaignCache()

    expect(getCampaign()).toEqual({ utm_source: 'instagram', utm_medium: 'social' })
  })

  it('persists later and forgets on revocation', () => {
    captureCampaign('https://rifornio.it/?utm_source=facebook', false)
    persistCampaign()
    expect(window.sessionStorage.getItem(CAMPAIGN_STORAGE_KEY)).toContain('facebook')

    forgetStoredCampaign()
    expect(window.sessionStorage.getItem(CAMPAIGN_STORAGE_KEY)).toBeNull()
  })
})

describe('withCampaign', () => {
  it('adds the session campaign to a url without utm parameters', () => {
    expect(
      withCampaign('https://rifornio.it/prezzi-carburanti/milano', {
        utm_source: 'tiktok',
        utm_medium: 'social',
      }),
    ).toBe(
      'https://rifornio.it/prezzi-carburanti/milano?utm_source=tiktok&utm_medium=social',
    )
  })

  it('never overrides utm parameters already in the url', () => {
    const url = 'https://rifornio.it/?utm_source=newsletter'
    expect(withCampaign(url, { utm_source: 'tiktok' })).toBe(url)
  })

  it('leaves the url unchanged without a campaign', () => {
    expect(withCampaign('https://rifornio.it/', null)).toBe('https://rifornio.it/')
  })
})

describe('buildPlayStoreUrl', () => {
  it('passes the visit campaign to Google Play as referrer', () => {
    const url = new URL(
      buildPlayStoreUrl({
        utm_source: 'tiktok',
        utm_medium: 'social',
        utm_campaign: 'lancio_app',
      }),
    )

    expect(url.origin + url.pathname).toBe(
      'https://play.google.com/store/apps/details',
    )
    expect(url.searchParams.get('id')).toBe('it.rifornio.app')
    expect(url.searchParams.get('referrer')).toBe(
      'utm_source=tiktok&utm_medium=social&utm_campaign=lancio_app',
    )
  })

  it('falls back to the website as source', () => {
    const url = new URL(buildPlayStoreUrl(null))
    expect(url.searchParams.get('referrer')).toBe(
      'utm_source=rifornio.it&utm_medium=referral&utm_campaign=sito',
    )
  })
})
