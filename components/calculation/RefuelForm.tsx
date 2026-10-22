'use client'

import {
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'

import {
  SUPPORTED_FUEL_TYPE_LABELS,
  SUPPORTED_FUEL_TYPES,
  type SupportedFuelType,
} from '../../lib/fuels/supportedFuelTypes'

import ChoiceGroup from '../ui/ChoiceGroup'
import { useVehicleAccount } from '../account/VehicleAccount'
import { convertConsumption, toLitersPer100Km, type ConsumptionUnit } from '../../lib/vehicles/consumption'

export interface RefuelCalculationInput {
  refuelAmount: number
  consumptionLitersPer100Km: number
  fuelType: SupportedFuelType
  isSelf: boolean
}

interface RefuelFormProps {
  onCalculate: (values: RefuelCalculationInput) => void
  isLoading?: boolean
  children?: ReactNode
  title?: string
  locationMessage?: string
  submitLabel?: string
  loadingLabel?: string
}

interface FormErrors {
  vehicleName?: string
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

export default function RefuelForm({
  onCalculate,
  isLoading = false,
  children,
  title = 'Il tuo rifornimento',
  locationMessage =
    'La posizione serve a trovare i distributori vicini e viene richiesta quando avvii il calcolo.',
  submitLabel = 'Calcola convenienza',
  loadingLabel = 'Calcolo in corso…',
}: RefuelFormProps) {
  const account = useVehicleAccount()
  const selected = account?.selected
  const [lastSelected, setLastSelected] = useState(selected)
  const [vehicleName, setVehicleName] = useState(selected?.name ?? '')
  const [unit, setUnit] = useState<ConsumptionUnit>(selected?.consumption_unit ?? 'L/100 km')
  const vehicleNameRef = useRef<HTMLInputElement>(null)
  const [saveFeedback, setSaveFeedback] = useState('')
  const amountRef = useRef<HTMLInputElement>(null)
  const consumptionRef = useRef<HTMLInputElement>(null)
  const [refuelAmount, setRefuelAmount] = useState('')
  const [consumption, setConsumption] = useState(selected ? String(selected.consumption) : '')
  const [fuelType, setFuelType] = useState<SupportedFuelType>(selected?.fuel_type ?? 'Benzina')
  const [isSelf, setIsSelf] = useState(true)
  const [errors, setErrors] = useState<FormErrors>({})

  if (selected !== lastSelected) {
    setLastSelected(selected)
    setVehicleName(selected?.name ?? '')
    setConsumption(selected ? String(selected.consumption) : '')
    setUnit(selected?.consumption_unit ?? 'L/100 km')
    setFuelType(selected?.fuel_type ?? 'Benzina')
    setErrors({})
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading) return

    const parsedRefuelAmount = parsePositiveNumber(refuelAmount)
    const parsedConsumption = toLitersPer100Km(Number(consumption), unit)
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
      if (parsedRefuelAmount === null) amountRef.current?.focus()
      else consumptionRef.current?.focus()
      return
    }

    onCalculate({
      refuelAmount: parsedRefuelAmount,
      consumptionLitersPer100Km: parsedConsumption,
      fuelType,
      isSelf,
    })
  }

  return (
    <form
      className="flex w-full flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-950"
      aria-busy={isLoading}
      noValidate
      onSubmit={handleSubmit}
    >
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
      <section aria-labelledby="vehicle-details-title" className="flex min-w-0 flex-col gap-5 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">1</span>
            <h3 id="vehicle-details-title" className="font-semibold text-base text-zinc-900 dark:text-zinc-100">La tua auto</h3>
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Profilo e consumi</span>
        </div>
      {account?.user && <div className="space-y-4">
        <ChoiceGroup label="Le tue auto" value={selected?.id ?? ''} disabled={isLoading || account.busy} onChange={id => { setSaveFeedback(''); account.select(id) }} options={[
          ...account.vehicles.map(vehicle => ({ value: vehicle.id, label: vehicle.name, description: `${vehicle.consumption} ${vehicle.consumption_unit}` })),
          { value: '', label: '+ Nuova auto' },
        ]} />
        {account.busy && <p className="text-sm text-zinc-500" role="status">Aggiornamento auto in corso…</p>}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="vehicle-name">Nome e modello auto</label>
          <input id="vehicle-name" ref={vehicleNameRef} disabled={isLoading || account.busy} className="min-h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400 dark:border-zinc-700 dark:bg-zinc-950" placeholder="Es. Fiat Panda di famiglia" maxLength={80} value={vehicleName} aria-invalid={Boolean(errors.vehicleName)} aria-describedby={errors.vehicleName ? 'vehicle-name-error' : undefined} onChange={event => { setVehicleName(event.target.value); setErrors(previous => ({ ...previous, vehicleName: undefined })); setSaveFeedback('') }} />
          {errors.vehicleName && <p id="vehicle-name-error" className="text-sm text-red-700 dark:text-red-300" role="alert">{errors.vehicleName}</p>}
        </div>
      </div>}
      <ChoiceGroup label="Carburante" value={fuelType} disabled={isLoading} onChange={setFuelType} options={SUPPORTED_FUEL_TYPES.map(value => ({ value, label: SUPPORTED_FUEL_TYPE_LABELS[value] }))} />
      <div className="flex min-w-0 flex-col gap-2">
        <ChoiceGroup label="Unità di consumo" value={unit} disabled={isLoading} onChange={next => {
          if (next !== unit) {
            setConsumption(convertConsumption(consumption, 'km/L'))
            setUnit(next)
          }
        }} options={[
          { value: 'L/100 km', label: 'L/100 km', description: 'Litri ogni 100 km' },
          { value: 'km/L', label: 'km/L', description: 'Chilometri con un litro' },
        ]} />
        <label className="text-sm font-medium" htmlFor="average-consumption">
          Consumo medio auto in {unit}
        </label>
        <input
          id="average-consumption"
          ref={consumptionRef}
          disabled={isLoading}
          placeholder={unit === 'km/L' ? 'Es. 15' : 'Es. 6.5'}
          inputMode="decimal"
          className="min-h-12 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-emerald-400 dark:focus:ring-emerald-500"
          type="number"
          min="0"
          step="0.1"
          value={consumption}
          aria-invalid={Boolean(errors.consumption)}
          aria-describedby={
            errors.consumption
              ? 'average-consumption-help average-consumption-error'
              : 'average-consumption-help'
          }
          onChange={(event) => { setConsumption(event.target.value); setErrors(previous => ({ ...previous, consumption: undefined })); setSaveFeedback('') }}
        />
        <p id="average-consumption-help" className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Trovi il consumo medio nel computer di bordo: usa il valore in {unit}.
        </p>
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

      {account?.user && (
        <div className="space-y-3 rounded-xl border border-dashed border-zinc-300 bg-white/80 p-3.5 dark:border-zinc-700 dark:bg-zinc-950/60">
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Salva nome, carburante e consumo nel tuo account per i prossimi accessi.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isLoading || account.busy}
              className="min-h-11 flex-1 rounded-xl border border-emerald-600/80 bg-emerald-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100 hover:border-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-50 dark:border-emerald-500/50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
              onClick={async () => {
                const nextErrors: FormErrors = {}
                if (!vehicleName.trim()) nextErrors.vehicleName = 'Inserisci il nome o il modello dell’auto.'
                if (toLitersPer100Km(Number(consumption), unit) === null) nextErrors.consumption = 'Il consumo medio deve essere maggiore di 0.'
                setErrors(nextErrors)
                setSaveFeedback('')
                if (nextErrors.vehicleName || nextErrors.consumption) {
                  setSaveFeedback('Completa nome e consumo per salvare l’auto.')
                  if (nextErrors.vehicleName) vehicleNameRef.current?.focus()
                  else consumptionRef.current?.focus()
                  return
                }
                const saved = await account.save({ name: vehicleName.trim(), consumption: Number(consumption), consumption_unit: unit, fuel_type: fuelType }, selected?.id)
                setSaveFeedback(saved ? 'Profilo auto salvato.' : 'Auto non salvata. Riprova tra poco.')
              }}
            >
              {account.busy ? 'Attendi…' : selected ? 'Salva modifiche auto' : 'Salva nuova auto'}
            </button>
            {selected && (
              <button
                type="button"
                disabled={isLoading || account.busy}
                className="min-h-11 rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs sm:text-sm text-zinc-600 transition hover:border-red-400 hover:bg-red-50/50 hover:text-red-600 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-red-950/20"
                onClick={() => {
                  if (window.confirm(`Eliminare ${selected.name} dalle auto salvate?`)) void account.remove(selected.id)
                }}
              >
                Elimina auto
              </button>
            )}
          </div>
          {saveFeedback && <p role="status" className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{saveFeedback}</p>}
        </div>
      )}

      </section>

      <section aria-labelledby="refuel-details-title" className="flex min-w-0 flex-col gap-5 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white dark:bg-emerald-500 dark:text-zinc-950">2</span>
            <h3 id="refuel-details-title" className="font-semibold text-base text-zinc-900 dark:text-zinc-100">Questo rifornimento</h3>
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Importo e pompa</span>
        </div>

        <ChoiceGroup label="Modalità di servizio" value={isSelf ? 'true' : 'false'} disabled={isLoading} onChange={value => setIsSelf(value === 'true')} options={[
          { value: 'true', label: 'Self' },
          { value: 'false', label: 'Servito' },
        ]} />

        <div className="flex min-w-0 flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="refuel-amount">
            Importo rifornimento in euro
          </label>
          <input
            id="refuel-amount"
            ref={amountRef}
            disabled={isLoading}
            placeholder="Es. 50"
            inputMode="decimal"
            className="min-h-12 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-base outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-emerald-400 dark:focus:ring-emerald-500"
            type="number"
            min="0"
            step="0.01"
            value={refuelAmount}
            aria-invalid={Boolean(errors.refuelAmount)}
            aria-describedby={errors.refuelAmount ? 'refuel-amount-error' : undefined}
            onChange={(event) => { setRefuelAmount(event.target.value); setErrors(previous => ({ ...previous, refuelAmount: undefined })) }}
          />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Importi rapidi">
            {[20, 50, 100].map((amount) => (
              <button
                key={amount}
                type="button"
                disabled={isLoading}
                aria-pressed={parsePositiveNumber(refuelAmount) === amount}
                onClick={() => { setRefuelAmount(String(amount)); setErrors(previous => ({ ...previous, refuelAmount: undefined })) }}
                className="min-h-11 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium aria-pressed:border-emerald-600 aria-pressed:bg-emerald-50 aria-pressed:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-60 dark:border-zinc-700 dark:aria-pressed:border-emerald-400 dark:aria-pressed:bg-emerald-950 dark:aria-pressed:text-emerald-200"
              >
                {amount} €
              </button>
            ))}
          </div>
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
      </section>

      {locationMessage ? (
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {locationMessage}
        </p>
      ) : null}
      <button
        disabled={isLoading}
        className="min-h-14 w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-base font-bold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 dark:bg-emerald-400 dark:text-emerald-950 dark:hover:bg-emerald-300 dark:focus:ring-emerald-500 dark:focus:ring-offset-zinc-950"
        type="submit"
      >
        {isLoading ? loadingLabel : submitLabel}
      </button>
    </form>
  )
}
