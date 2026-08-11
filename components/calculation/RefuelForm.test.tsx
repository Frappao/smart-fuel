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

    const fuelTypeSelect = screen.getByRole<HTMLSelectElement>('combobox', {
      name: 'Carburante',
    })
    const serviceModeSelect = screen.getByRole<HTMLSelectElement>('combobox', {
      name: 'Modalità di servizio',
    })
    const refuelAmountInput = screen.getByRole<HTMLInputElement>('spinbutton', {
      name: 'Importo rifornimento in euro',
    })
    const consumptionInput = screen.getByRole<HTMLInputElement>('spinbutton', {
      name: 'Consumo medio auto in L/100 km',
    })

    expect(fuelTypeSelect.value).toBe('Benzina')
    expect(serviceModeSelect.value).toBe('true')
    expect(serviceModeSelect.selectedOptions[0]?.textContent).toBe('Self')
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

      fireEvent.change(screen.getByRole('combobox', { name: 'Carburante' }), {
        target: { value: fuelType },
      })
      fireEvent.change(
        screen.getByRole('combobox', { name: 'Modalità di servizio' }),
        { target: { value: 'false' } },
      )
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

    const serviceModeSelect = screen.getByRole('combobox', {
      name: 'Modalità di servizio',
    })

    fireEvent.change(serviceModeSelect, { target: { value: 'false' } })
    fireEvent.change(serviceModeSelect, { target: { value: 'true' } })
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
