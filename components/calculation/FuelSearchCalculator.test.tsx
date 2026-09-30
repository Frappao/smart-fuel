// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import FuelSearchCalculator from './FuelSearchCalculator'

describe('FuelSearchCalculator', () => {
  afterEach(() => {
    cleanup()
  })

  it('keeps nearby search as default and allows switching to trip planning', () => {
    render(<FuelSearchCalculator />)

    expect(screen.getByText('Il tuo rifornimento')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Vicino a me' }).getAttribute(
        'aria-pressed',
      ),
    ).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: 'Lungo un percorso' }))

    expect(screen.getByText('Pianifica il viaggio')).toBeTruthy()
    expect(screen.queryByText('Il tuo rifornimento')).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Lungo un percorso' }).getAttribute(
        'aria-pressed',
      ),
    ).toBe('true')
  })
})
