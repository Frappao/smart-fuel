// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import AdSlot from './AdSlot'

const bannerScriptUrl =
  'https://www.highrevenueformat.com/2bb0b23d54c197410ffcb72321748ea6/invoke.js'

function getScriptByUrl(url: string) {
  return document.querySelector<HTMLScriptElement>(`script[src="${url}"]`)
}

describe('AdSlot', () => {
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
    vi.unstubAllEnvs()
  })

  it.each([undefined, 'false'])(
    'does not load Adsterra when NEXT_PUBLIC_ADS_ENABLED is %s',
    (flagValue) => {
      vi.stubEnv('NEXT_PUBLIC_ADS_ENABLED', flagValue)

      const { container } = render(<AdSlot />)

      expect(container.firstChild).toBeNull()
      expect(getScriptByUrl(bannerScriptUrl)).toBeNull()
    },
  )

  it('sets the 300x250 banner options before loading its script', () => {
    vi.stubEnv('NEXT_PUBLIC_ADS_ENABLED', 'true')

    render(<AdSlot />)

    expect(window.atOptions).toEqual({
      key: '2bb0b23d54c197410ffcb72321748ea6',
      format: 'iframe',
      height: 250,
      width: 300,
      params: {},
    })
    expect(getScriptByUrl(bannerScriptUrl)).toBeTruthy()
  })

  it('does not duplicate the banner script during a normal rerender', () => {
    vi.stubEnv('NEXT_PUBLIC_ADS_ENABLED', 'true')

    const { rerender } = render(<AdSlot />)

    rerender(<AdSlot />)

    expect(
      document.querySelectorAll(`script[src="${bannerScriptUrl}"]`),
    ).toHaveLength(1)
  })

  it.each(['granted', 'denied'])(
    'loads the banner independently of analytics consent being %s',
    (analyticsConsent) => {
      vi.stubEnv('NEXT_PUBLIC_ADS_ENABLED', 'true')
      window.localStorage.setItem(
        'rifornio-analytics-consent',
        analyticsConsent,
      )

      render(<AdSlot />)

      expect(screen.getByLabelText('Banner pubblicitario 300x250')).toBeTruthy()
      expect(getScriptByUrl(bannerScriptUrl)).toBeTruthy()
    },
  )
})
