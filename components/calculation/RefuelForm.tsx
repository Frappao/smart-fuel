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
      className="flex w-full max-w-md flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-950"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="flex min-w-0 flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="refuel-amount">
          Importo rifornimento in euro
        </label>
        <input
          id="refuel-amount"
          className="min-h-12 w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400 dark:focus:ring-zinc-700"
          type="number"
          min="0"
          step="0.01"
          value={refuelAmount}
          aria-invalid={Boolean(errors.refuelAmount)}
          aria-describedby={errors.refuelAmount ? 'refuel-amount-error' : undefined}
          onChange={(event) => setRefuelAmount(event.target.value)}
        />
        {errors.refuelAmount ? (
          <p
            className="text-sm text-red-700 dark:text-red-300"
            id="refuel-amount-error"
            role="alert"
          >
            {errors.refuelAmount}
          </p>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="average-consumption">
          Consumo medio auto in L/100 km
        </label>
        <input
          id="average-consumption"
          className="min-h-12 w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-400 dark:focus:ring-zinc-700"
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
          <p
            className="text-sm text-red-700 dark:text-red-300"
            id="average-consumption-error"
            role="alert"
          >
            {errors.consumption}
          </p>
        ) : null}
      </div>

      <button
        className="min-h-12 w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300 dark:focus:ring-emerald-500 dark:focus:ring-offset-zinc-950"
        type="submit"
      >
        Calcola convenienza
      </button>
    </form>
  )
}
