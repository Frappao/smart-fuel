// @vitest-environment jsdom

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HeroBrandBadge from './HeroBrandBadge'

describe('HeroBrandBadge', () => {
  it('renders the brand emblem with accessibility label', () => {
    render(<HeroBrandBadge />)

    expect(
      screen.getByLabelText('Rifornio — Risparmio reale carburanti'),
    ).toBeTruthy()
  })
})
