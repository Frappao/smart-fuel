// @vitest-environment jsdom

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HeroConvenienceVisual from './HeroConvenienceVisual'

describe('HeroConvenienceVisual', () => {
  it('renders the convenience comparison and formula explanation', () => {
    render(<HeroConvenienceVisual />)

    expect(screen.getByText('Come decide Rifornio')).toBeTruthy()
    expect(screen.getByText('Litri Netti')).toBeTruthy()
    expect(screen.getByText('Distributore lontano')).toBeTruthy()
    expect(screen.getByText('Distributore vicino')).toBeTruthy()
    expect(screen.getByText('VINCE')).toBeTruthy()
    expect(screen.getByText(/28,0 L netti/)).toBeTruthy()
    expect(screen.getByText(/\+0,4 L nel serbatoio/)).toBeTruthy()
  })
})
