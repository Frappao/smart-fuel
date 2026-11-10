'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createSupabaseClient } from '../../lib/supabase/client'
import type { SupportedFuelType } from '../../lib/fuels/supportedFuelTypes'
import type { ConsumptionUnit } from '../../lib/vehicles/consumption'
import {
  ACCOUNT_METADATA_KEY,
  EMPTY_ACCOUNT_PREFERENCES,
  parseAccountPreferences,
  serializeAccountPreferences,
  type AccountPreferences,
} from '../../lib/account/accountPreferences'
import AccountPanel from './AccountPanel'

export interface Vehicle {
  id: string
  name: string
  consumption: number
  consumption_unit: ConsumptionUnit
  fuel_type: SupportedFuelType
}
type VehicleInput = Omit<Vehicle, 'id'>
interface Account {
  openAccount: () => void
  user: User | null
  vehicles: Vehicle[]
  selected: Vehicle | undefined
  select: (id: string) => void
  save: (values: VehicleInput, id?: string) => Promise<boolean>
  remove: (id: string) => Promise<void>
  busy: boolean
  /** Preferenze dell'account; vuote senza accesso. */
  preferences: AccountPreferences
}
const AccountContext = createContext<Account | null>(null)
export const useVehicleAccount = () => useContext(AccountContext)
const fieldClass = 'min-h-12 w-full rounded-xl border border-zinc-300 bg-white p-3 transition focus:border-emerald-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900'
const buttonClass = 'min-h-11 rounded-xl border border-emerald-600 px-4 py-2 font-medium transition active:scale-[0.98] disabled:opacity-50'

export function AccountButton() {
  const account = useVehicleAccount()
  if (!account) return null
  const label = account.user ? 'Il tuo account' : 'Accedi / Registrati'
  return (
    <button
      type="button"
      onClick={account.openAccount}
      aria-haspopup="dialog"
      aria-label={label}
      className="inline-flex min-h-10 sm:min-h-11 shrink-0 whitespace-nowrap items-center justify-center gap-1.5 sm:gap-2 rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-100 shadow-2xs transition-all duration-150 active:scale-[0.97] hover:border-zinc-600 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
    >
      <svg aria-hidden="true" className="size-4 sm:size-4.5 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
      </svg>
      <span className="hidden lg:inline">{label}</span>
      <span className="inline lg:hidden">{account.user ? 'Account' : 'Accedi'}</span>
    </button>
  )
}

export function RegistrationPrompt() {
  const account = useVehicleAccount()
  if (!account || account.user) return null
  return <section aria-label="Salva le tue auto" className="flex flex-col items-start gap-4 rounded-3xl border border-zinc-800/80 bg-zinc-900/60 md:backdrop-blur-xl p-5 sm:flex-row sm:items-center sm:justify-between shadow-xl">
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-emerald-400 text-sm">✨</span>
        <h2 className="font-bold text-zinc-100 text-sm sm:text-base">Le tue auto, pronte al prossimo rifornimento</h2>
      </div>
      <p className="text-xs sm:text-sm leading-5 text-zinc-400">Crea un account e salva carburante e consumi per calcoli istantanei.</p>
    </div>
    <button type="button" onClick={account.openAccount} className="min-h-11 shrink-0 rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 text-zinc-100 px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-sm transition active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">Registrati gratis</button>
  </section>
}

export default function VehicleAccount({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const client = useRef<SupabaseClient | null>(null)
  const generation = useRef(0)
  const [accountOpen, setAccountOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedId, select] = useState('')
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState('')
  const preferences = useMemo(
    () => (user ? parseAccountPreferences(user.user_metadata) : EMPTY_ACCOUNT_PREFERENCES),
    [user],
  )
  // Ultime preferenze lette dal caricamento delle auto senza farlo ripartire
  // a ogni modifica delle preferenze.
  const preferencesRef = useRef(preferences)
  useEffect(() => { preferencesRef.current = preferences }, [preferences])

  useEffect(() => {
    let active = true
    try { client.current = createSupabaseClient() } catch { return }
    const supabase = client.current
    // Supabase reads successful OAuth callbacks from the URL automatically.
    const callback = new URLSearchParams(window.location.hash.slice(1))
    const callbackFailed = callback.has('error') || new URLSearchParams(window.location.search).has('error')
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ?? null)
        if (callbackFailed && !session) setMessage('Accesso non completato. Puoi riprovare con Google o email.')
      }
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  const userId = user?.id
  useEffect(() => {
    const version = ++generation.current
    let active = true
    async function load() {
      setVehicles([])
      select('')
      if (!userId || !client.current) { setBusy(false); return }
      setBusy(true)
      try {
        const { data, error } = await client.current.from('user_vehicles').select('id,name,consumption,consumption_unit,fuel_type').order('created_at').order('id').abortSignal(AbortSignal.timeout(15000))
        if (!active || generation.current !== version) return
        if (error) throw error
        setVehicles(data ?? [])
        const defaultId = preferencesRef.current.defaultVehicleId
        select(data?.find(vehicle => vehicle.id === defaultId)?.id ?? data?.[0]?.id ?? '')
      } catch {
        if (active) setMessage('Impossibile caricare le auto. Riprova effettuando nuovamente l’accesso.')
      } finally { if (active) setBusy(false) }
    }
    void load()
    return () => { active = false }
  }, [userId])

  async function run(action: () => Promise<void>) {
    if (busy) return false
    setBusy(true)
    setMessage('')
    try { await action(); return true } catch {
      setMessage('Operazione non riuscita. Controlla la connessione e riprova; se hai richiesto un codice, attendi un minuto prima di richiederlo ancora.')
      return false
    }
    finally { setBusy(false) }
  }

  async function signInWithGoogle() {
    await run(async () => {
      if (!client.current) throw new Error('Unavailable')
      const { error } = await client.current.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
      })
      if (error) throw error
    })
  }

  async function save(values: VehicleInput, id?: string) {
    return run(async () => {
      if (!client.current || !user) throw new Error('No session')
      const version = generation.current
      const query = id
        ? client.current.from('user_vehicles').update(values).eq('id', id).eq('user_id', user.id)
        : client.current.from('user_vehicles').insert({ ...values, user_id: user.id })
      const { data, error } = await query.select('id,name,consumption,consumption_unit,fuel_type').abortSignal(AbortSignal.timeout(15000)).single()
      if (error) throw error
      if (version !== generation.current) return
      setVehicles(previous => id ? previous.map(v => v.id === id ? data : v) : [...previous, data])
      select(data.id)
      setMessage('Auto salvata.')
    })
  }

  async function remove(id: string) {
    await run(async () => {
      if (!client.current || !user) throw new Error('No session')
      const version = generation.current
      const { error } = await client.current.from('user_vehicles').delete().eq('id', id).eq('user_id', user.id).abortSignal(AbortSignal.timeout(15000))
      if (error) throw error
      if (version !== generation.current) return
      setVehicles(previous => previous.filter(v => v.id !== id))
      select('')
      setMessage('Auto eliminata.')
    })
  }

  async function savePreferences(next: Partial<AccountPreferences>) {
    return run(async () => {
      if (!client.current || !user) throw new Error('No session')
      const merged = { ...preferences, ...next }
      const { data, error } = await client.current.auth.updateUser({
        data: { [ACCOUNT_METADATA_KEY]: serializeAccountPreferences(merged) },
      })
      if (error) throw error
      if (data?.user) setUser(data.user)
      if (next.defaultVehicleId) select(next.defaultVehicleId)
      setMessage('Preferenze salvate.')
    })
  }

  function clearSession() {
    setUser(null); setVehicles([]); select(''); setToken(''); setSent(false)
  }

  async function signOut(scope: 'local' | 'global') {
    await run(async () => {
      const { error } = await client.current!.auth.signOut({ scope })
      if (error) throw error
      clearSession()
      if (scope === 'global') setMessage('Sei uscito da tutti i dispositivi.')
    })
  }

  async function deleteAccount() {
    await run(async () => {
      if (!client.current) throw new Error('Unavailable')
      const { data } = await client.current.auth.getSession()
      const accessToken = data?.session?.access_token
      if (!accessToken) throw new Error('No session')
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) throw new Error('Delete failed')
      // L'utente non esiste più: basta togliere la sessione da questo browser.
      await client.current.auth.signOut({ scope: 'local' }).catch(() => undefined)
      clearSession()
      setMessage('Account eliminato insieme alle auto salvate.')
    })
  }

  return <AccountContext.Provider value={{ openAccount: () => { dialogRef.current?.showModal(); setAccountOpen(true) }, user, vehicles, selected: vehicles.find(v => v.id === selectedId), select, save, remove, busy, preferences }}>
    {children}
    <dialog ref={dialogRef} onClose={() => setAccountOpen(false)} aria-labelledby="account-dialog-title" className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[92dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-3xl border border-b-0 border-zinc-800 bg-zinc-950 p-0 pb-[env(safe-area-inset-bottom)] text-zinc-100 shadow-2xl backdrop:bg-black/60 transition-[translate] duration-300 ease-out starting:open:translate-y-full motion-reduce:transition-none sm:inset-y-0 sm:right-0 sm:left-auto sm:h-dvh sm:max-h-none sm:w-[420px] sm:rounded-none sm:rounded-l-3xl sm:border-r-0 sm:border-b sm:starting:open:translate-x-full sm:starting:open:translate-y-0" onClick={event => {
      if (event.target === event.currentTarget) dialogRef.current?.close()
    }}>
      <div className="p-5 sm:p-6">
        <div className="sticky top-0 z-10 -mx-5 -mt-5 flex items-center justify-between gap-3 border-b border-zinc-800/80 bg-zinc-950 px-5 py-3 sm:-mx-6 sm:-mt-6 sm:px-6">
          <h2 id="account-dialog-title" className="text-xl font-semibold">{user ? 'Il tuo account' : 'Accedi o registrati'}</h2>
          <button type="button" aria-label="Chiudi account" className="flex size-11 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:hover:bg-zinc-800" onClick={() => dialogRef.current?.close()}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M6 18 18 6" /></svg>
          </button>
        </div>
      {user ? <AccountPanel
        user={user}
        vehicles={vehicles}
        preferences={preferences}
        busy={busy}
        onSaveVehicle={save}
        onRemoveVehicle={remove}
        onSavePreferences={savePreferences}
        onSignOut={signOut}
        onDeleteAccount={deleteAccount}
      /> : <form className="mt-3 space-y-3" onSubmit={event => {
        event.preventDefault()
        void run(async () => {
          if (!client.current) throw new Error('Unavailable')
          if (sent) {
            const { error } = await client.current.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'email' })
            if (error) throw error
            setToken(''); setMessage('Accesso effettuato.')
          } else {
            const { error } = await client.current.auth.signInWithOtp({ email: email.trim() })
            if (error) throw error
            setSent(true); setMessage('Controlla la tua email e inserisci il codice ricevuto.')
          }
        })
      }}>
        <p>Accedi o crea un account con Google o un codice via email. Il calcolo resta disponibile anche senza account.</p>
        <div className="grid gap-3">
          <button type="button" className={buttonClass} disabled={busy} onClick={() => void signInWithGoogle()}>Continua con Google</button>
        </div>
        <p className="text-sm">Oppure usa la tua email</p>
        <label className="block">Email<input className={fieldClass} type="email" autoComplete="email" required value={email} disabled={busy || sent} onChange={event => setEmail(event.target.value)} /></label>
        {sent && <label className="block">Codice di accesso<input className={fieldClass} autoComplete="one-time-code" inputMode="numeric" required value={token} disabled={busy} onChange={event => setToken(event.target.value)} /></label>}
        <button className={buttonClass} disabled={busy}>{sent ? 'Conferma codice' : 'Invia codice'}</button>
        {sent && <button className={buttonClass} type="button" disabled={busy} onClick={() => { setSent(false); setToken(''); setMessage('') }}>Cambia email o richiedi un nuovo codice</button>}
        <p className="text-sm">Leggi come trattiamo email e dati delle auto nella <a className="underline" href="/privacy">Privacy Policy</a>.</p>
      </form>}
      {accountOpen && message && <p className="mt-4 text-sm" role="status">{message}</p>}
      </div>
    </dialog>
    {!accountOpen && message && <p role="status" className="fixed right-4 bottom-4 left-4 z-40 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-900 shadow-lg sm:left-auto sm:max-w-md dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">{message}</p>}
  </AccountContext.Provider>
}
