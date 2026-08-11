// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import RefuelForm from './RefuelForm'

describe('RefuelForm', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders both numeric fields', () => {
    render(<RefuelForm onCalculate={vi.fn()} />)

    const refuelAmountInput = screen.getByRole<HTMLInputElement>('spinbutton', {
      name: 'Importo rifornimento in euro',
    })
    const consumptionInput = screen.getByRole<HTMLInputElement>('spinbutton', {
      name: 'Consumo medio auto in L/100 km',
    })

    expect(refuelAmountInput.type).toBe('number')
    expect(refuelAmountInput.value).toBe('')
    expect(consumptionInput.type).toBe('number')
    expect(consumptionInput.value).toBe('')
  })

  it('shows readable errors for empty values', () => {
    const onCalculate = vi.fn()
    render(<RefuelForm onCalculate={onCalculate} />)

    fireEvent.click(
      screen.getByRole('button', { name: 'Calcola convenienza' }),
    )

    expect(
      screen.getByText('Inserisci un importo di rifornimento maggiore di 0.'),
    ).toBeTruthy()
    expect(
      screen.getByText('Il consumo medio deve essere maggiore di 0.'),
    ).toBeTruthy()
    expect(onCalculate).not.toHaveBeenCalled()
  })

  it('rejects zero and negative values', () => {
    const onCalculate = vi.fn()
    render(<RefuelForm onCalculate={onCalculate} />)

    fireEvent.change(
      screen.getByRole('spinbutton', {
        name: 'Importo rifornimento in euro',
      }),
      { target: { value: '0' } },
    )
    fireEvent.change(
      screen.getByRole('spinbutton', {
        name: 'Consumo medio auto in L/100 km',
      }),
      { target: { value: '-6.5' } },
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Calcola convenienza' }),
    )

    expect(screen.getAllByRole('alert')).toHaveLength(2)
    expect(onCalculate).not.toHaveBeenCalled()
  })

  it('submits parsed numeric values to onCalculate', () => {
    const onCalculate = vi.fn()
    render(<RefuelForm onCalculate={onCalculate} />)

    fireEvent.change(
      screen.getByRole('spinbutton', {
        name: 'Importo rifornimento in euro',
      }),
      { target: { value: '50.5' } },
    )
    fireEvent.change(
      screen.getByRole('spinbutton', {
        name: 'Consumo medio auto in L/100 km',
      }),
      { target: { value: '6.2' } },
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Calcola convenienza' }),
    )

    expect(onCalculate).toHaveBeenCalledOnce()
    expect(onCalculate).toHaveBeenCalledWith({
      refuelAmount: 50.5,
      consumptionLitersPer100Km: 6.2,
    })
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
