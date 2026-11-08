// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import PriceUpdateNotice from './PriceUpdateNotice'

const NOW = new Date('2026-11-08T09:00:00Z')

describe('PriceUpdateNotice', () => {
  it('mostra la data del prezzo più recente senza avviso se recente', () => {
    render(
      <PriceUpdateNotice latestCommunicatedAt="2026-11-08T07:55:10+00:00" now={NOW} />,
    )

    expect(screen.getByText(/Prezzi aggiornati al/)).toBeTruthy()
    expect(screen.getByText('8 novembre 2026 alle ore 07:55')).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('mostra un avviso se i dati hanno più di 48 ore', () => {
    render(
      <PriceUpdateNotice latestCommunicatedAt="2026-10-25T08:01:19+00:00" now={NOW} />,
    )

    expect(screen.getByRole('status').textContent).toMatch(/più di 48 ore/)
  })

  it('non mostra nulla se la data non è disponibile', () => {
    const { container } = render(
      <PriceUpdateNotice latestCommunicatedAt={null} now={NOW} />,
    )

    expect(container.textContent).toBe('')
  })
})
