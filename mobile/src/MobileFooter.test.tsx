// @vitest-environment jsdom

import { AppLauncher } from '@capacitor/app-launcher'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import MobileFooter, { openExternalUrl } from './MobileFooter'

vi.mock('@capacitor/app-launcher', () => ({
  AppLauncher: {
    openUrl: vi.fn(),
  },
}))

const openUrlMock = vi.mocked(AppLauncher.openUrl)

describe('MobileFooter', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the privacy policy and support links with valid URLs', () => {
    render(<MobileFooter />)

    const privacyLink = screen.getByRole('link', {
      name: 'Informativa sulla Privacy',
    })
    expect(privacyLink).toBeTruthy()
    expect(privacyLink.getAttribute('href')).toBe('https://rifornio.it/privacy')
    expect(privacyLink.getAttribute('target')).toBe('_blank')
    expect(privacyLink.getAttribute('rel')).toBe('noopener noreferrer')

    const supportLink = screen.getByRole('link', { name: 'Supporto' })
    expect(supportLink).toBeTruthy()
    expect(supportLink.getAttribute('href')).toBe('https://rifornio.it/supporto')
  })

  it('opens native browser via AppLauncher when clicking the privacy link', async () => {
    openUrlMock.mockResolvedValueOnce({ completed: true })
    render(<MobileFooter />)

    const privacyLink = screen.getByRole('link', {
      name: 'Informativa sulla Privacy',
    })
    fireEvent.click(privacyLink)

    expect(openUrlMock).toHaveBeenCalledWith({
      url: 'https://rifornio.it/privacy',
    })
  })

  it('opens native browser via AppLauncher when clicking the support link', async () => {
    openUrlMock.mockResolvedValueOnce({ completed: true })
    render(<MobileFooter />)

    const supportLink = screen.getByRole('link', { name: 'Supporto' })
    fireEvent.click(supportLink)

    expect(openUrlMock).toHaveBeenCalledWith({
      url: 'https://rifornio.it/supporto',
    })
  })

  it('falls back to window.open if AppLauncher fails', async () => {
    openUrlMock.mockRejectedValueOnce(new Error('Plugin error'))
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

    await openExternalUrl('https://rifornio.it/privacy')

    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://rifornio.it/privacy',
      '_blank',
      'noopener,noreferrer',
    )
    windowOpenSpy.mockRestore()
  })
})
