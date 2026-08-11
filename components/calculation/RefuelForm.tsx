'use client'

import { useState, type FormEvent } from 'react'

export interface RefuelCalculationInput {
  refuelAmount: number
  consumptionLitersPer100Km: number
}

interface RefuelFormProps {
  onCalculate: (values: RefuelCalculationInput) => void
}

interface FormErrors {
  refuelAmount?: string
  consumption?: string
}

function parsePositiveNumber(value: string): number | null {
  if (value.trim() === '') {
    return null
  }

  const parsedValue = Number(value)

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null
}

export default function RefuelForm({ onCalculate }: RefuelFormProps) {
  const [refuelAmount, setRefuelAmount] = useState('')
  const [consumption, setConsumption] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsedRefuelAmount = parsePositiveNumber(refuelAmount)
    const parsedConsumption = parsePositiveNumber(consumption)
    const nextErrors: FormErrors = {}

    if (parsedRefuelAmount === null) {
      nextErrors.refuelAmount =
        'Inserisci un importo di rifornimento maggiore di 0.'
    }

    if (parsedConsumption === null) {
      nextErrors.consumption = 'Il consumo medio deve essere maggiore di 0.'
    }

    setErrors(nextErrors)

    if (parsedRefuelAmount === null || parsedConsumption === null) {
      return
    }

    onCalculate({
      refuelAmount: parsedRefuelAmount,
      consumptionLitersPer100Km: parsedConsumption,
    })
  }

  return (
    <form
      className="flex max-w-sm flex-col gap-4"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="refuel-amount">Importo rifornimento in euro</label>
        <input
          id="refuel-amount"
          className="rounded border border-zinc-300 px-3 py-2"
          type="number"
          min="0"
          step="0.01"
          value={refuelAmount}
          aria-invalid={Boolean(errors.refuelAmount)}
          aria-describedby={errors.refuelAmount ? 'refuel-amount-error' : undefined}
          onChange={(event) => setRefuelAmount(event.target.value)}
        />
        {errors.refuelAmount ? (
          <p id="refuel-amount-error" role="alert">
            {errors.refuelAmount}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="average-consumption">
          Consumo medio auto in L/100 km
        </label>
        <input
          id="average-consumption"
          className="rounded border border-zinc-300 px-3 py-2"
          type="number"
          min="0"
          step="0.1"
          value={consumption}
          aria-invalid={Boolean(errors.consumption)}
          aria-describedby={
            errors.consumption ? 'average-consumption-error' : undefined
          }
          onChange={(event) => setConsumption(event.target.value)}
        />
        {errors.consumption ? (
          <p id="average-consumption-error" role="alert">
            {errors.consumption}
          </p>
        ) : null}
      </div>

      <button
        className="rounded bg-zinc-900 px-4 py-2 text-white"
        type="submit"
      >
        Calcola convenienza
      </button>
    </form>
  )
}
