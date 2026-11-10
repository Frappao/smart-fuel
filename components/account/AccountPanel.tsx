'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'

import {
  MAX_REFUEL_AMOUNT,
  type AccountPreferences,
  type SearchMode,
} from '../../lib/account/accountPreferences'
import {
  SUPPORTED_FUEL_TYPES,
  type SupportedFuelType,
} from '../../lib/fuels/supportedFuelTypes'
import { toLitersPer100Km, type ConsumptionUnit } from '../../lib/vehicles/consumption'
import type { Vehicle } from './VehicleAccount'

type VehicleInput = Omit<Vehicle, 'id'>

export interface AccountPanelProps {
  user: User
  vehicles: Vehicle[]
  preferences: AccountPreferences
  busy: boolean
  onSaveVehicle: (values: VehicleInput, id?: string) => Promise<boolean>
  onRemoveVehicle: (id: string) => Promise<void>
  onSavePreferences: (next: Partial<AccountPreferences>) => Promise<boolean>
  onSignOut: (scope: 'local' | 'global') => Promise<void>
  onDeleteAccount: () => Promise<void>
}

const AMOUNT_CHOICES = [20, 50, 100] as const

const sectionClass = 'space-y-3 border-t border-zinc-800 pt-5'
const sectionTitleClass = 'text-xs font-bold tracking-wide text-zinc-400 uppercase'
const secondaryButtonClass =
  'inline-flex min-h-10 items-center justify-center rounded-xl border border-zinc-700 px-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400'
const primaryButtonClass =
  'inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-500 px-4 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300'
const dangerButtonClass =
  'inline-flex min-h-10 items-center justify-center rounded-xl border border-red-500/50 px-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 active:scale-[0.98] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400'
const inputClass =
  'min-h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-base text-zinc-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40'

function getDisplayName(user: User): string {
  const metadata = user.user_metadata as Record<string, unknown> | undefined
  const fullName = metadata?.full_name ?? metadata?.name
  if (typeof fullName === 'string' && fullName.trim()) return fullName.trim()
  return user.email?.split('@')[0] ?? 'Il tuo account'
}

function getProviderLabel(user: User): string {
  return user.app_metadata?.provider === 'google'
    ? 'Accesso con Google'
    : 'Accesso con codice via email'
}

function SegmentedChoice<T extends string | number>({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string
  value: T | null
  options: readonly { value: T; label: string }[]
  disabled: boolean
  onChange: (value: T) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-200">{label}</p>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = option.value === value
          return (
            <button
              key={String(option.value)}
              type="button"
              aria-pressed={isActive}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className="min-h-10 flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-2.5 text-sm whitespace-nowrap font-semibold text-zinc-300 transition hover:border-zinc-700 active:scale-[0.97] disabled:opacity-50 aria-pressed:border-emerald-500/80 aria-pressed:bg-emerald-500/15 aria-pressed:text-emerald-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function VehicleEditor({
  initial,
  busy,
  onSubmit,
  onCancel,
}: {
  initial?: Vehicle
  busy: boolean
  onSubmit: (values: VehicleInput) => Promise<boolean>
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [fuelType, setFuelType] = useState<SupportedFuelType>(initial?.fuel_type ?? 'Benzina')
  const [unit, setUnit] = useState<ConsumptionUnit>(initial?.consumption_unit ?? 'L/100 km')
  const [consumption, setConsumption] = useState(initial ? String(initial.consumption) : '')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = name.trim()
    const value = Number(consumption.replace(',', '.'))
    if (!trimmedName || toLitersPer100Km(value, unit) === null) {
      setError('Inserisci nome e un consumo maggiore di 0.')
      return
    }
    setError('')
    const saved = await onSubmit({
      name: trimmedName.slice(0, 80),
      fuel_type: fuelType,
      consumption: value,
      consumption_unit: unit,
    })
    if (saved) onCancel()
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="space-y-3 rounded-2xl border border-zinc-700 bg-zinc-900/80 p-4"
      aria-label={initial ? `Modifica ${initial.name}` : 'Nuova auto'}
    >
      <label className="block space-y-1.5 text-sm font-medium text-zinc-200">
        <span>Nome dell&apos;auto</span>
        <input
          className={inputClass}
          maxLength={80}
          placeholder="Es. Panda di famiglia"
          value={name}
          disabled={busy}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <SegmentedChoice
        label="Carburante dell'auto"
        value={fuelType}
        disabled={busy}
        options={SUPPORTED_FUEL_TYPES.map((fuel) => ({ value: fuel, label: fuel }))}
        onChange={setFuelType}
      />
      <div className="grid grid-cols-[1fr_auto] items-end gap-2">
        <label className="block space-y-1.5 text-sm font-medium text-zinc-200">
          <span>Consumo medio</span>
          <input
            className={inputClass}
            inputMode="decimal"
            placeholder={unit === 'km/L' ? 'Es. 18' : 'Es. 6,5'}
            value={consumption}
            disabled={busy}
            onChange={(event) => setConsumption(event.target.value)}
          />
        </label>
        <div role="group" aria-label="Unità del consumo" className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-950 p-1">
          {(['L/100 km', 'km/L'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={unit === option}
              disabled={busy}
              onClick={() => setUnit(option)}
              className="min-h-9 rounded-lg px-2.5 text-xs font-semibold text-zinc-400 transition aria-pressed:bg-zinc-800 aria-pressed:text-emerald-300"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      {error ? (
        <p className="text-sm text-red-300" role="alert">{error}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {initial ? 'Salva auto' : 'Aggiungi auto'}
        </button>
        <button type="button" disabled={busy} className={secondaryButtonClass} onClick={onCancel}>
          Annulla
        </button>
      </div>
    </form>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className={sectionClass}>
      <h3 className={sectionTitleClass}>{title}</h3>
      {children}
    </section>
  )
}

export default function AccountPanel({
  user,
  vehicles,
  preferences,
  busy,
  onSaveVehicle,
  onRemoveVehicle,
  onSavePreferences,
  onSignOut,
  onDeleteAccount,
}: AccountPanelProps) {
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [confirmingRemoveId, setConfirmingRemoveId] = useState<string | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const displayName = getDisplayName(user)
  const defaultVehicleId =
    vehicles.find((vehicle) => vehicle.id === preferences.defaultVehicleId)?.id ??
    vehicles[0]?.id ??
    null

  return (
    <div className="mt-4 space-y-5">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-lg font-bold text-emerald-300"
        >
          {displayName.charAt(0).toLocaleUpperCase('it-IT')}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-zinc-100">{displayName}</p>
          <p className="truncate text-sm text-zinc-400">{user.email}</p>
          <p className="text-xs text-zinc-400">{getProviderLabel(user)}</p>
        </div>
      </div>

      <Section title={`Le mie auto (${vehicles.length})`}>
        {vehicles.length === 0 && editingId !== 'new' ? (
          <p className="text-sm text-zinc-400">
            Nessuna auto salvata. Aggiungine una per trovare carburante e consumo già pronti nel calcolo.
          </p>
        ) : null}

        <ul className="space-y-2">
          {vehicles.map((vehicle) =>
            editingId === vehicle.id ? (
              <li key={vehicle.id}>
                <VehicleEditor
                  initial={vehicle}
                  busy={busy}
                  onSubmit={(values) => onSaveVehicle(values, vehicle.id)}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={vehicle.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3.5"
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-zinc-100">{vehicle.name}</p>
                    <p className="text-xs text-zinc-400 tabular-nums">
                      {vehicle.fuel_type} · {vehicle.consumption} {vehicle.consumption_unit}
                    </p>
                  </div>
                  {vehicle.id === defaultVehicleId ? (
                    <span className="shrink-0 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                      Predefinita
                    </span>
                  ) : null}
                </div>

                {confirmingRemoveId === vehicle.id ? (
                  <div className="mt-3 space-y-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3">
                    <p className="text-sm text-zinc-200">
                      Eliminare «{vehicle.name}» dalle auto salvate?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        className={dangerButtonClass}
                        onClick={async () => {
                          await onRemoveVehicle(vehicle.id)
                          setConfirmingRemoveId(null)
                        }}
                      >
                        Elimina {vehicle.name}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className={secondaryButtonClass}
                        onClick={() => setConfirmingRemoveId(null)}
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {vehicle.id !== defaultVehicleId ? (
                      <button
                        type="button"
                        disabled={busy}
                        className={secondaryButtonClass}
                        aria-label={`Rendi ${vehicle.name} l'auto predefinita`}
                        onClick={() => void onSavePreferences({ defaultVehicleId: vehicle.id })}
                      >
                        Rendi predefinita
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={busy}
                      className={secondaryButtonClass}
                      aria-label={`Modifica ${vehicle.name}`}
                      onClick={() => {
                        setConfirmingRemoveId(null)
                        setEditingId(vehicle.id)
                      }}
                    >
                      Modifica
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      className={secondaryButtonClass}
                      aria-label={`Elimina ${vehicle.name} dalle auto salvate`}
                      onClick={() => {
                        setEditingId(null)
                        setConfirmingRemoveId(vehicle.id)
                      }}
                    >
                      Elimina
                    </button>
                  </div>
                )}
              </li>
            ),
          )}
        </ul>

        {editingId === 'new' ? (
          <VehicleEditor
            busy={busy}
            onSubmit={(values) => onSaveVehicle(values)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <button
            type="button"
            disabled={busy}
            className={secondaryButtonClass}
            onClick={() => {
              setConfirmingRemoveId(null)
              setEditingId('new')
            }}
          >
            + Aggiungi auto
          </button>
        )}
      </Section>

      <Section title="Preferenze di calcolo">
        <p className="text-xs leading-5 text-zinc-400">
          Valori che trovi già impostati quando apri Rifornio, su ogni dispositivo. Non cambiano la classifica.
        </p>
        <SegmentedChoice<SearchMode>
          label="Ricerca all'apertura"
          value={preferences.searchMode ?? 'nearby'}
          disabled={busy}
          options={[
            { value: 'nearby', label: 'Vicino a me' },
            { value: 'trip', label: 'Lungo un percorso' },
          ]}
          onChange={(searchMode) => void onSavePreferences({ searchMode })}
        />
        <SegmentedChoice<'self' | 'servito'>
          label="Servizio preferito"
          value={preferences.isSelf === false ? 'servito' : 'self'}
          disabled={busy}
          options={[
            { value: 'self', label: 'Self' },
            { value: 'servito', label: 'Servito' },
          ]}
          onChange={(service) => void onSavePreferences({ isSelf: service === 'self' })}
        />
        <SegmentedChoice<number>
          label="Importo abituale"
          value={preferences.refuelAmount ?? 0}
          disabled={busy}
          options={[
            { value: 0, label: 'Nessuno' },
            ...AMOUNT_CHOICES.filter((amount) => amount <= MAX_REFUEL_AMOUNT).map((amount) => ({
              value: amount,
              label: `${amount} €`,
            })),
          ]}
          onChange={(amount) => void onSavePreferences({ refuelAmount: amount > 0 ? amount : null })}
        />
      </Section>

      <Section title="Accesso e dati">
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} className={secondaryButtonClass} onClick={() => void onSignOut('local')}>
            Esci
          </button>
          <button type="button" disabled={busy} className={secondaryButtonClass} onClick={() => void onSignOut('global')}>
            Esci da tutti i dispositivi
          </button>
        </div>

        {isConfirmingDelete ? (
          <div className="space-y-3 rounded-2xl border border-red-500/40 bg-red-500/5 p-4">
            <p className="text-sm font-semibold text-red-200">Eliminare definitivamente l&apos;account?</p>
            <p className="text-sm leading-6 text-zinc-300">
              Verranno cancellati l&apos;account {user.email}
              {vehicles.length === 0
                ? ''
                : vehicles.length === 1
                  ? ' e l’auto salvata'
                  : ` e le ${vehicles.length} auto salvate`}
              , insieme alle preferenze. L&apos;operazione non si può annullare. Il calcolo resta utilizzabile senza account.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-red-500 px-4 text-sm font-bold text-white transition hover:bg-red-400 active:scale-[0.98] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
                onClick={() => void onDeleteAccount()}
              >
                Elimina account e dati
              </button>
              <button
                type="button"
                disabled={busy}
                className={secondaryButtonClass}
                onClick={() => setIsConfirmingDelete(false)}
              >
                Annulla
              </button>
            </div>
          </div>
        ) : (
          <button type="button" disabled={busy} className={dangerButtonClass} onClick={() => setIsConfirmingDelete(true)}>
            Elimina account…
          </button>
        )}

        <p className="text-xs leading-5 text-zinc-400">
          <a className="underline underline-offset-2 hover:text-zinc-200" href="/privacy">Privacy</a>
          {' · '}
          <a className="underline underline-offset-2 hover:text-zinc-200" href="/cookie">Cookie</a>
          {' · '}
          <a className="underline underline-offset-2 hover:text-zinc-200" href="/supporto">Supporto</a>
        </p>
      </Section>
    </div>
  )
}
