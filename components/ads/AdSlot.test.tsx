// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import AdSlot from './AdSlot'

describe('AdSlot', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllEnvs()
  })

  it.each([undefined, 'false'])(
    'does not render when NEXT_PUBLIC_ADS_ENABLED is %s',
    (flagValue) => {
      vi.stubEnv('NEXT_PUBLIC_ADS_ENABLED', flagValue)

      const { container } = render(<AdSlot />)

      expect(container.firstChild).toBeNull()
    },
  )

  it('renders a neutral placeholder when NEXT_PUBLIC_ADS_ENABLED is true', () => {
    vi.stubEnv('NEXT_PUBLIC_ADS_ENABLED', 'true')

    render(<AdSlot />)

    expect(screen.getByLabelText('Spazio pubblicitario').textContent).toBe(
      'Spazio pubblicitario',
    )
  })
})
