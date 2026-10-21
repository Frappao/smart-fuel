// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import RefuelForm from './RefuelForm'

describe('RefuelForm', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders both numeric fields with Benzina Self selected by default', () => {
    render(<RefuelForm onCalculate={vi.fn()} />)

    const refuelAmountInput = screen.getByRole<HTMLInputElement>('spinbutton', {
      name: 'Importo rifornimento in euro',
    })
    const consumptionInput = screen.getByRole<HTMLInputElement>('spinbutton', {
      name: 'Consumo medio auto in L/100 km',
    })

    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'Benzina' }).checked).toBe(true)
    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'Self' }).checked).toBe(true)
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
    expect(document.activeElement).toBe(screen.getByLabelText('Importo rifornimento in euro'))
    fireEvent.click(screen.getByRole('button', { name: '50 €' }))
    expect(screen.queryByText('Inserisci un importo di rifornimento maggiore di 0.')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Calcola convenienza' }))
    expect(document.activeElement).toBe(screen.getByLabelText('Consumo medio auto in L/100 km'))
    fireEvent.change(screen.getByLabelText('Consumo medio auto in L/100 km'), { target: { value: '6' } })
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('selects quick amounts without submitting and clears their pressed state on manual input', () => {
    const onCalculate = vi.fn()
    render(<RefuelForm onCalculate={onCalculate} />)
    const input = screen.getByLabelText<HTMLInputElement>('Importo rifornimento in euro')
    for (const amount of [20, 50, 100]) {
      fireEvent.click(screen.getByRole('button', { name: `${amount} €` }))
      expect(input.value).toBe(String(amount))
      expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1)
      expect(screen.getByRole('button', { name: `${amount} €` }).getAttribute('aria-pressed')).toBe('true')
    }
    expect(onCalculate).not.toHaveBeenCalled()
    fireEvent.change(input, { target: { value: '35' } })
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0)
    fireEvent.change(screen.getByLabelText('Consumo medio auto in L/100 km'), { target: { value: '6' } })
    fireEvent.click(screen.getByRole('button', { name: '20 €' }))
    fireEvent.click(screen.getByRole('button', { name: 'Calcola convenienza' }))
    expect(onCalculate).toHaveBeenCalledWith({ refuelAmount: 20, consumptionLitersPer100Km: 6, fuelType: 'Benzina', isSelf: true })
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
      fuelType: 'Benzina',
      isSelf: true,
    })
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it.each(['Gasolio', 'GPL'] as const)(
    'submits the selected %s fuel type in Servito mode',
    (fuelType) => {
      const onCalculate = vi.fn()
      render(<RefuelForm onCalculate={onCalculate} />)

      fireEvent.click(screen.getByRole('radio', { name: fuelType }))
      fireEvent.click(screen.getByRole('radio', { name: 'Servito' }))
      fireEvent.change(
        screen.getByRole('spinbutton', {
          name: 'Importo rifornimento in euro',
        }),
        { target: { value: '50' } },
      )
      fireEvent.change(
        screen.getByRole('spinbutton', {
          name: 'Consumo medio auto in L/100 km',
        }),
        { target: { value: '6.5' } },
      )
      fireEvent.click(
        screen.getByRole('button', { name: 'Calcola convenienza' }),
      )

      expect(onCalculate).toHaveBeenCalledWith({
        refuelAmount: 50,
        consumptionLitersPer100Km: 6.5,
        fuelType,
        isSelf: false,
      })
    },
  )

  it('can switch from Servito back to Self', () => {
    const onCalculate = vi.fn()
    render(<RefuelForm onCalculate={onCalculate} />)

    fireEvent.click(screen.getByRole('radio', { name: 'Servito' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Self' }))
    fireEvent.change(
      screen.getByRole('spinbutton', {
        name: 'Importo rifornimento in euro',
      }),
      { target: { value: '50' } },
    )
    fireEvent.change(
      screen.getByRole('spinbutton', {
        name: 'Consumo medio auto in L/100 km',
      }),
      { target: { value: '6.5' } },
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Calcola convenienza' }),
    )

    expect(onCalculate).toHaveBeenCalledWith({
      refuelAmount: 50,
      consumptionLitersPer100Km: 6.5,
      fuelType: 'Benzina',
      isSelf: true,
    })
  })
})

it('converts an existing consumption when changing units and submits L/100 km', () => {
  const onCalculate = vi.fn()
  render(<RefuelForm onCalculate={onCalculate} />)
  fireEvent.click(screen.getByRole('button', { name: '50 €' }))
  fireEvent.change(screen.getByLabelText('Consumo medio auto in L/100 km'), { target: { value: '5' } })
  fireEvent.click(screen.getByRole('radio', { name: 'km/L' }))
  expect(screen.getByLabelText<HTMLInputElement>('Consumo medio auto in km/L').value).toBe('20')
  fireEvent.click(screen.getByRole('button', { name: 'Calcola convenienza' }))
  expect(onCalculate).toHaveBeenCalledWith({ refuelAmount: 50, consumptionLitersPer100Km: 5, fuelType: 'Benzina', isSelf: true })
  cleanup()
})
