'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createSupabaseClient } from '../../lib/supabase/client'
import type { SupportedFuelType } from '../../lib/fuels/supportedFuelTypes'
import type { ConsumptionUnit } from '../../lib/vehicles/consumption'

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
}
const AccountContext = createContext<Account | null>(null)
export const useVehicleAccount = () => useContext(AccountContext)
const fieldClass = 'min-h-12 w-full rounded-xl border border-zinc-300 bg-white p-3 transition focus:border-emerald-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900'
const buttonClass = 'min-h-11 rounded-xl border border-emerald-600 px-4 py-2 font-medium transition active:scale-[0.98] disabled:opacity-50'

export function AccountButton() {
  const account = useVehicleAccount()
  if (!account) return null
  return <button type="button" onClick={account.openAccount} aria-haspopup="dialog" className="inline-flex min-h-12 min-w-40 items-center justify-center gap-2.5 rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm transition-all duration-150 active:scale-[0.97] hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:min-w-48 dark:border-emerald-500/60 dark:bg-emerald-950 dark:text-emerald-200 dark:hover:bg-emerald-900">
    <svg aria-hidden="true" className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></svg>
    {account.user ? 'Il tuo account' : 'Accedi / Registrati'}
  </button>
}

export function RegistrationPrompt() {
  const account = useVehicleAccount()
  if (!account || account.user) return null
  return <section aria-label="Salva le tue auto" className="flex flex-col items-start gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-800 dark:bg-emerald-950/40">
    <div className="space-y-1">
      <h2 className="font-semibold text-emerald-950 dark:text-emerald-100">Le tue auto, pronte al prossimo rifornimento</h2>
      <p className="text-sm leading-6 text-emerald-800 dark:text-emerald-300">Crea un account e salva carburante e consumi di tutte le tue auto.</p>
    </div>
    <button type="button" onClick={account.openAccount} className="min-h-12 shrink-0 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:bg-emerald-400 dark:text-zinc-950">Registrati gratis</button>
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
        select(data?.[0]?.id ?? '')
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

  return <AccountContext.Provider value={{ openAccount: () => { dialogRef.current?.showModal(); setAccountOpen(true) }, user, vehicles, selected: vehicles.find(v => v.id === selectedId), select, save, remove, busy }}>
    {children}
    <dialog ref={dialogRef} onClose={() => setAccountOpen(false)} aria-labelledby="account-dialog-title" className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 transition-all duration-200" onClick={event => {
      if (event.target === event.currentTarget) dialogRef.current?.close()
    }}>
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 id="account-dialog-title" className="text-xl font-semibold">{user ? 'Il tuo account' : 'Accedi o registrati'}</h2>
          <button type="button" aria-label="Chiudi account" className="flex size-11 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:hover:bg-zinc-800" onClick={() => dialogRef.current?.close()}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M6 18 18 6" /></svg>
          </button>
        </div>
      {user ? <div className="mt-3 space-y-3">
        <p>{user.email}</p>
        <p>Seleziona un’auto nel modulo oppure aggiungine una nuova. Al prossimo accesso troverai selezionata la prima auto salvata.</p>
        <button type="button" disabled={busy} className={buttonClass} onClick={() => void run(async () => {
          const { error } = await client.current!.auth.signOut({ scope: 'local' })
          if (error) throw error
          setUser(null); setVehicles([]); select(''); setToken(''); setSent(false)
        })}>Esci</button>
      </div> : <form className="mt-3 space-y-3" onSubmit={event => {
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
