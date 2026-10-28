'use client'

import {
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import dynamic from 'next/dynamic'

const VehicleCustomizer3D = dynamic(
  () => import('../3d/VehicleCustomizer3D'),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
    ),
  },
)

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
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [show3DGarage, setShow3DGarage] = useState(false)

  if (selected !== lastSelected) {
    setLastSelected(selected)
    setVehicleName(selected?.name ?? '')
    setConsumption(selected ? String(selected.consumption) : '')
    setUnit(selected?.consumption_unit ?? 'L/100 km')
    setFuelType(selected?.fuel_type ?? 'Benzina')
    setErrors({})
    setIsManageOpen(!selected)
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
      className="flex w-full flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-950"
      aria-busy={isLoading}
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800/60">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h2>
      </div>

      {/* 1. SELEZIONE AUTO ALL'INIZIO DEL CALCOLATORE (PER UTENTI LOGGATI) */}
      {account?.user && (
        <section aria-labelledby="vehicle-selector-title" className="flex min-w-0 flex-col gap-3.5 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2.5 dark:border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" aria-hidden="true">🚗</span>
              <h3 id="vehicle-selector-title" className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                La tua auto
              </h3>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {selected ? 'Profilo salvato' : 'Nuovo inserimento'}
            </span>
          </div>

          <ChoiceGroup
            label="Le tue auto"
            value={selected?.id ?? ''}
            disabled={isLoading || account.busy}
            onChange={id => {
              setSaveFeedback('')
              account.select(id)
            }}
            options={[
              ...account.vehicles.map(vehicle => ({
                value: vehicle.id,
                label: vehicle.name,
                description: `${vehicle.consumption} ${vehicle.consumption_unit}`,
              })),
              { value: '', label: '+ Nuova auto' },
            ]}
          />
          {account.busy && (
            <p className="text-xs text-zinc-500 animate-pulse" role="status">
              Aggiornamento auto in corso…
            </p>
          )}

          {/* Menù a scomparsa per modificare l'auto già selezionata */}
          {selected ? (
            <details
              className="group rounded-xl border border-zinc-200/90 bg-white/90 shadow-2xs transition-all dark:border-zinc-800 dark:bg-zinc-950/80"
              open={isManageOpen}
              onToggle={e => setIsManageOpen(e.currentTarget.open)}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3.5 text-xs sm:text-sm font-medium select-none hover:bg-zinc-50/70 dark:hover:bg-zinc-900/60 rounded-xl transition-colors">
                <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                  <svg className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <path d="M9 17h6" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                  <span className="font-semibold text-zinc-900 truncate dark:text-zinc-100">
                    {selected.name}
                  </span>
                  <span className="inline-flex shrink-0 items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {fuelType} • {consumption} {unit}
                  </span>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:text-emerald-800 dark:text-emerald-400 dark:group-hover:text-emerald-300">
                  <span className="group-open:hidden">Modifica auto</span>
                  <span className="hidden group-open:inline">Chiudi</span>
                  <svg className="size-3.5 transition-transform duration-200 group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </span>
              </summary>
              <div className="space-y-4 border-t border-zinc-100 p-4 dark:border-zinc-800">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200" htmlFor="vehicle-name">
                    Nome e modello auto
                  </label>
                  <input
                    id="vehicle-name"
                    ref={vehicleNameRef}
                    disabled={isLoading || account.busy}
                    className="min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400 dark:border-zinc-700 dark:bg-zinc-900"
                    placeholder="Es. Fiat Panda di famiglia"
                    maxLength={80}
                    value={vehicleName}
                    aria-invalid={Boolean(errors.vehicleName)}
                    aria-describedby={errors.vehicleName ? 'vehicle-name-error' : undefined}
                    onChange={event => {
                      setVehicleName(event.target.value)
                      setErrors(previous => ({ ...previous, vehicleName: undefined }))
                      setSaveFeedback('')
                    }}
                  />
                  {errors.vehicleName && (
                    <p id="vehicle-name-error" className="text-xs text-red-700 dark:text-red-300" role="alert">
                      {errors.vehicleName}
                    </p>
                  )}
                </div>

                <ChoiceGroup
                  label="Carburante"
                  value={fuelType}
                  disabled={isLoading}
                  onChange={setFuelType}
                  options={SUPPORTED_FUEL_TYPES.map(value => ({ value, label: SUPPORTED_FUEL_TYPE_LABELS[value] }))}
                />

                <div className="flex min-w-0 flex-col gap-2">
                  <ChoiceGroup
                    label="Unità di consumo"
                    value={unit}
                    disabled={isLoading}
                    onChange={next => {
                      if (next !== unit) {
                        setConsumption(convertConsumption(consumption, 'km/L'))
                        setUnit(next)
                      }
                    }}
                    options={[
                      { value: 'L/100 km', label: 'L/100 km', description: 'Litri ogni 100 km' },
                      { value: 'km/L', label: 'km/L', description: 'Chilometri con un litro' },
                    ]}
                  />
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
                    onChange={event => {
                      setConsumption(event.target.value)
                      setErrors(previous => ({ ...previous, consumption: undefined }))
                      setSaveFeedback('')
                    }}
                  />
                  <p id="average-consumption-help" className="text-xs text-zinc-500 dark:text-zinc-400">
                    Trovi il consumo medio nel computer di bordo: usa il valore in {unit}.
                  </p>
                  {errors.consumption && (
                    <p className="text-xs text-red-700 dark:text-red-300" id="average-consumption-error" role="alert">
                      {errors.consumption}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isLoading || account.busy}
                    className="min-h-11 flex-1 rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-50 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
                    onClick={async () => {
                      const nextErrors: FormErrors = {}
                      if (!vehicleName.trim()) nextErrors.vehicleName = 'Inserisci il nome o il modello dell’auto.'
                      if (toLitersPer100Km(Number(consumption), unit) === null) nextErrors.consumption = 'Il consumo medio deve essere maggiore di 0.'
                      setErrors(nextErrors)
                      setSaveFeedback('')
                      if (nextErrors.vehicleName || nextErrors.consumption) {
                        setIsManageOpen(true)
                        setSaveFeedback('Completa nome e consumo per salvare l’auto.')
                        if (nextErrors.vehicleName) vehicleNameRef.current?.focus()
                        else consumptionRef.current?.focus()
                        return
                      }
                      const saved = await account.save({ name: vehicleName.trim(), consumption: Number(consumption), consumption_unit: unit, fuel_type: fuelType }, selected?.id)
                      setSaveFeedback(saved ? 'Profilo auto salvato.' : 'Auto non salvata. Riprova tra poco.')
                    }}
                  >
                    {account.busy ? 'Attendi…' : 'Salva modifiche auto'}
                  </button>
                  <button
                    type="button"
                    className="min-h-11 rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    onClick={() => setIsManageOpen(false)}
                  >
                    Chiudi modifiche ▴
                  </button>
                  <button
                    type="button"
                    disabled={isLoading || account.busy}
                    className="min-h-11 rounded-xl border border-zinc-200 px-3 py-2.5 text-xs sm:text-sm text-zinc-500 transition hover:border-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-red-950/20"
                    onClick={() => {
                      if (window.confirm(`Eliminare ${selected.name} dalle auto salvate?`)) void account.remove(selected.id)
                    }}
                  >
                    Elimina auto
                  </button>
                </div>
                {saveFeedback && <p role="status" className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{saveFeedback}</p>}
              </div>
            </details>
          ) : (
            /* Pannello: Aggiungi nuova auto */
            <div className="rounded-xl border border-dashed border-emerald-300 bg-white/90 p-4 shadow-xs dark:border-emerald-800 dark:bg-zinc-950/90 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 dark:border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">➕</span>
                  <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Aggiungi nuova auto
                  </h4>
                </div>
                {account.vehicles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      account.select(account.vehicles[0].id)
                      setSaveFeedback('')
                    }}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    ✕ Chiudi / Torna all&apos;auto salvata
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200" htmlFor="vehicle-name">
                  Nome e modello auto
                </label>
                <input
                  id="vehicle-name"
                  ref={vehicleNameRef}
                  disabled={isLoading || account.busy}
                  className="min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400 dark:border-zinc-700 dark:bg-zinc-900"
                  placeholder="Es. Fiat Panda di famiglia"
                  maxLength={80}
                  value={vehicleName}
                  aria-invalid={Boolean(errors.vehicleName)}
                  aria-describedby={errors.vehicleName ? 'vehicle-name-error' : undefined}
                  onChange={event => {
                    setVehicleName(event.target.value)
                    setErrors(previous => ({ ...previous, vehicleName: undefined }))
                    setSaveFeedback('')
                  }}
                />
                {errors.vehicleName && (
                  <p id="vehicle-name-error" className="text-xs text-red-700 dark:text-red-300" role="alert">
                    {errors.vehicleName}
                  </p>
                )}
              </div>

              <ChoiceGroup
                label="Carburante"
                value={fuelType}
                disabled={isLoading}
                onChange={setFuelType}
                options={SUPPORTED_FUEL_TYPES.map(value => ({ value, label: SUPPORTED_FUEL_TYPE_LABELS[value] }))}
              />

              <div className="flex min-w-0 flex-col gap-2">
                <ChoiceGroup
                  label="Unità di consumo"
                  value={unit}
                  disabled={isLoading}
                  onChange={next => {
                    if (next !== unit) {
                      setConsumption(convertConsumption(consumption, 'km/L'))
                      setUnit(next)
                    }
                  }}
                  options={[
                    { value: 'L/100 km', label: 'L/100 km', description: 'Litri ogni 100 km' },
                    { value: 'km/L', label: 'km/L', description: 'Chilometri con un litro' },
                  ]}
                />
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
                  onChange={event => {
                    setConsumption(event.target.value)
                    setErrors(previous => ({ ...previous, consumption: undefined }))
                    setSaveFeedback('')
                  }}
                />
                <p id="average-consumption-help" className="text-xs text-zinc-500 dark:text-zinc-400">
                  Trovi il consumo medio nel computer di bordo: usa il valore in {unit}.
                </p>
                {errors.consumption && (
                  <p className="text-xs text-red-700 dark:text-red-300" id="average-consumption-error" role="alert">
                    {errors.consumption}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={isLoading || account.busy}
                  className="min-h-11 flex-1 rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-50 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
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
                    const saved = await account.save({ name: vehicleName.trim(), consumption: Number(consumption), consumption_unit: unit, fuel_type: fuelType })
                    setSaveFeedback(saved ? 'Profilo auto salvato.' : 'Auto non salvata. Riprova tra poco.')
                  }}
                >
                  {account.busy ? 'Attendi…' : 'Salva nuova auto'}
                </button>
                {account.vehicles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      account.select(account.vehicles[0].id)
                      setSaveFeedback('')
                    }}
                    className="min-h-11 rounded-xl border border-zinc-200 px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Annulla
                  </button>
                )}
              </div>
              {saveFeedback && <p role="status" className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{saveFeedback}</p>}
            </div>
          )}
        </section>
      )}

      {/* 2. PROFILO AUTO PER UTENTI NON REGISTRATI (GUEST) */}
      {!account?.user && (
        <section aria-labelledby="guest-vehicle-title" className="flex min-w-0 flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3 dark:border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <span className="flex size-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">1</span>
              <h3 id="guest-vehicle-title" className="font-semibold text-base text-zinc-900 dark:text-zinc-100">La tua auto</h3>
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setShow3DGarage(!show3DGarage)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 active:scale-[0.98] disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <span>{show3DGarage ? '▲ Chiudi 3D' : '🚗 Garage 3D'}</span>
            </button>
          </div>

          {show3DGarage && (
            <div className="pt-1">
              <VehicleCustomizer3D
                vehicleName={vehicleName || 'La tua auto'}
                fuelType={fuelType}
                consumptionL100km={toLitersPer100Km(Number(consumption), unit) ?? 6.5}
              />
            </div>
          )}

          <ChoiceGroup
            label="Carburante"
            value={fuelType}
            disabled={isLoading}
            onChange={setFuelType}
            options={SUPPORTED_FUEL_TYPES.map(value => ({ value, label: SUPPORTED_FUEL_TYPE_LABELS[value] }))}
          />

          <div className="flex min-w-0 flex-col gap-2">
            <ChoiceGroup
              label="Unità di consumo"
              value={unit}
              disabled={isLoading}
              onChange={next => {
                if (next !== unit) {
                  setConsumption(convertConsumption(consumption, 'km/L'))
                  setUnit(next)
                }
              }}
              options={[
                { value: 'L/100 km', label: 'L/100 km', description: 'Litri ogni 100 km' },
                { value: 'km/L', label: 'km/L', description: 'Chilometri con un litro' },
              ]}
            />
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
              onChange={event => {
                setConsumption(event.target.value)
                setErrors(previous => ({ ...previous, consumption: undefined }))
              }}
            />
            <p id="average-consumption-help" className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              Trovi il consumo medio nel computer di bordo: usa il valore in {unit}.
            </p>
            {errors.consumption && (
              <p className="text-sm text-red-700 dark:text-red-300" id="average-consumption-error" role="alert">
                {errors.consumption}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Se ci sono elementi figli aggiuntivi (es. partenza e arrivo nel calcolatore percorso) */}
      {children}

      {/* 3. IL CALCOLATORE: QUESTO RIFORNIMENTO (DISTINTO E SEPARATO) */}
      <section aria-labelledby="refuel-details-title" className="flex min-w-0 flex-col gap-5 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3 dark:border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white dark:bg-emerald-500 dark:text-zinc-950">
              {account?.user ? '⛽' : '2'}
            </span>
            <h3 id="refuel-details-title" className="font-semibold text-base text-zinc-900 dark:text-zinc-100">
              Questo rifornimento
            </h3>
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Importo e pompa</span>
        </div>

        <ChoiceGroup
          label="Modalità di servizio"
          value={isSelf ? 'true' : 'false'}
          disabled={isLoading}
          onChange={value => setIsSelf(value === 'true')}
          options={[
            { value: 'true', label: 'Self' },
            { value: 'false', label: 'Servito' },
          ]}
        />

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
            onChange={event => {
              setRefuelAmount(event.target.value)
              setErrors(previous => ({ ...previous, refuelAmount: undefined }))
            }}
          />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Importi rapidi">
            {[20, 50, 100].map(amount => (
              <button
                key={amount}
                type="button"
                disabled={isLoading}
                aria-pressed={parsePositiveNumber(refuelAmount) === amount}
                onClick={() => {
                  setRefuelAmount(String(amount))
                  setErrors(previous => ({ ...previous, refuelAmount: undefined }))
                }}
                className="min-h-11 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.96] hover:border-zinc-400 aria-pressed:border-emerald-600 aria-pressed:bg-emerald-50 aria-pressed:text-emerald-800 aria-pressed:shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-60 dark:border-zinc-700 dark:aria-pressed:border-emerald-400 dark:aria-pressed:bg-emerald-950 dark:aria-pressed:text-emerald-200"
              >
                {amount} €
              </button>
            ))}
          </div>
          {errors.refuelAmount && (
            <p className="text-sm text-red-700 dark:text-red-300" id="refuel-amount-error" role="alert">
              {errors.refuelAmount}
            </p>
          )}
        </div>

        <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
          {locationMessage}
        </p>

        <button
          type="submit"
          disabled={isLoading}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition-all duration-150 active:scale-[0.98] hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-wait disabled:opacity-60 dark:bg-emerald-400 dark:text-zinc-950 dark:hover:bg-emerald-300"
        >
          {isLoading && (
            <svg aria-hidden="true" className="size-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          <span>{isLoading ? loadingLabel : submitLabel}</span>
        </button>
      </section>
    </form>
  )
}
