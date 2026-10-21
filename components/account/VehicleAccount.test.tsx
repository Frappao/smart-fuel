// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import VehicleAccount, { AccountButton, RegistrationPrompt } from './VehicleAccount'
import Home from '../../app/page'
import RefuelForm from '../calculation/RefuelForm'

const mocks = vi.hoisted(() => ({
  authChange: undefined as undefined | ((event: string, session: unknown) => void),
  oauth: vi.fn(), otp: vi.fn(), verify: vi.fn(), signOut: vi.fn(), from: vi.fn(), unsubscribe: vi.fn(),
}))
vi.mock('../../lib/supabase/client', () => ({ createSupabaseClient: () => ({
  auth: {
    onAuthStateChange: (callback: typeof mocks.authChange) => {
      mocks.authChange = callback
      return { data: { subscription: { unsubscribe: mocks.unsubscribe } } }
    },
    signInWithOAuth: mocks.oauth, signInWithOtp: mocks.otp, verifyOtp: mocks.verify, signOut: mocks.signOut,
  }, from: mocks.from,
}) }))

const vehicles = [
  { id: 'a', name: 'Panda', consumption: 20, consumption_unit: 'km/L', fuel_type: 'Benzina' },
  { id: 'b', name: 'Golf', consumption: 6, consumption_unit: 'L/100 km', fuel_type: 'Gasolio' },
]
function login() { act(() => mocks.authChange?.('SIGNED_IN', { user: { id: 'owner', email: 'owner@example.com' } })) }

describe('vehicle account', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    HTMLDialogElement.prototype.showModal = function () { this.open = true }
    HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event('close')) }
    mocks.oauth.mockResolvedValue({ error: null })
    mocks.otp.mockResolvedValue({ error: null })
    mocks.verify.mockResolvedValue({ error: null })
    mocks.signOut.mockResolvedValue({ error: null })
    mocks.from.mockImplementation(() => ({ select: () => ({ order: () => ({ order: () => ({ abortSignal: async () => ({ data: vehicles, error: null }) }) }) }) }))
  })
  afterEach(cleanup)

  it('shows registration on the homepage and opens the account dialog from the header', async () => {
    render(<Home />)
    const navigation = screen.getByRole('navigation', { name: 'Navigazione principale' })
    const accountButton = within(navigation).getByRole('button', { name: 'Accedi / Registrati' })
    expect(screen.getByRole('button', { name: 'Registrati gratis' })).toBeTruthy()
    fireEvent.click(accountButton)
    expect(screen.getByRole('dialog', { name: 'Accedi o registrati' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Chiudi account' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Registrati gratis' }))
    expect(screen.getByRole('dialog')).toBeTruthy()
    login()
    await screen.findByRole('radio', { name: 'Panda' })
    expect(within(navigation).getByRole('button', { name: 'Il tuo account' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Registrati gratis' })).toBeNull()
  })

  it('starts Google OAuth with a return to this website', async () => {
    render(<VehicleAccount><AccountButton /><RegistrationPrompt /><RefuelForm onCalculate={vi.fn()} /></VehicleAccount>)
    fireEvent.click(screen.getByRole('button', { name: 'Accedi / Registrati' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continua con Google' }))
    await waitFor(() => expect(mocks.oauth).toHaveBeenCalledWith({ provider: 'google', options: { redirectTo: `${window.location.origin}/` } }))
    expect(mocks.otp).not.toHaveBeenCalled()
  })

  it('shows provider errors and allows another login attempt', async () => {
    mocks.oauth.mockResolvedValue({ error: new Error('Provider disabled') })
    render(<VehicleAccount><AccountButton /><RegistrationPrompt /><RefuelForm onCalculate={vi.fn()} /></VehicleAccount>)
    fireEvent.click(screen.getByRole('button', { name: 'Accedi / Registrati' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continua con Google' }))
    await screen.findByText(/Operazione non riuscita/)
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Continua con Google' }).disabled).toBe(false)
  })

  it('requests and verifies an email code', async () => {
    render(<VehicleAccount><AccountButton /><RegistrationPrompt /><RefuelForm onCalculate={vi.fn()} /></VehicleAccount>)
    fireEvent.click(screen.getByRole('button', { name: 'Accedi / Registrati' }))
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'owner@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Invia codice' }))
    await screen.findByLabelText('Codice di accesso')
    expect(mocks.otp).toHaveBeenCalledWith({ email: 'owner@example.com' })
    fireEvent.change(screen.getByLabelText('Codice di accesso'), { target: { value: '12345678' } })
    fireEvent.click(screen.getByRole('button', { name: 'Conferma codice' }))
    await waitFor(() => expect(mocks.verify).toHaveBeenCalledWith({ email: 'owner@example.com', token: '12345678', type: 'email' }))
  })

  it('restores the first vehicle, switches consumption and fuel, and clears data on logout', async () => {
    const calculate = vi.fn()
    render(<VehicleAccount><AccountButton /><RegistrationPrompt /><RefuelForm onCalculate={calculate} /></VehicleAccount>)
    login()
    await waitFor(() => expect(screen.getByLabelText<HTMLInputElement>('Nome e modello auto').value).toBe('Panda'))
    expect(screen.getByLabelText<HTMLInputElement>('Consumo medio auto in km/L').value).toBe('20')
    fireEvent.click(screen.getByRole('button', { name: '50 €' }))
    fireEvent.click(screen.getByRole('button', { name: 'Calcola convenienza' }))
    expect(calculate).toHaveBeenLastCalledWith({ refuelAmount: 50, consumptionLitersPer100Km: 5, fuelType: 'Benzina', isSelf: true })
    fireEvent.click(screen.getByRole('radio', { name: 'Golf' }))
    fireEvent.click(screen.getByRole('button', { name: 'Calcola convenienza' }))
    expect(calculate).toHaveBeenLastCalledWith({ refuelAmount: 50, consumptionLitersPer100Km: 6, fuelType: 'Gasolio', isSelf: true })
    act(() => mocks.authChange?.('SIGNED_OUT', null))
    await waitFor(() => expect(screen.queryByRole('group', { name: 'Le tue auto' })).toBeNull())
    expect(screen.getByLabelText<HTMLInputElement>('Consumo medio auto in L/100 km').value).toBe('')
  })

  it('saves changes to the selected vehicle scoped to its owner', async () => {
    render(<VehicleAccount><AccountButton /><RegistrationPrompt /><RefuelForm onCalculate={vi.fn()} /></VehicleAccount>)
    login()
    await waitFor(() => expect(screen.getByLabelText<HTMLInputElement>('Nome e modello auto').value).toBe('Panda'))
    const single = vi.fn().mockResolvedValue({ data: { ...vehicles[0], name: 'Panda nuova' }, error: null })
    const query = { eq: vi.fn(), select: vi.fn(() => ({ abortSignal: () => ({ single }) })) }
    query.eq.mockReturnValue(query)
    const update = vi.fn(() => query)
    mocks.from.mockReturnValue({ update })
    fireEvent.change(screen.getByLabelText('Nome e modello auto'), { target: { value: 'Panda nuova' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salva modifiche auto' }))
    await screen.findByText('Auto salvata.')
    expect(update).toHaveBeenCalledWith({ name: 'Panda nuova', consumption: 20, consumption_unit: 'km/L', fuel_type: 'Benzina' })
    expect(query.eq).toHaveBeenCalledWith('user_id', 'owner')
    expect(query.eq).toHaveBeenCalledWith('id', 'a')
  })

  it('explains missing vehicle data next to save and focuses the missing field', async () => {
    render(<VehicleAccount><AccountButton /><RegistrationPrompt /><RefuelForm onCalculate={vi.fn()} /></VehicleAccount>)
    login()
    await screen.findByRole('radio', { name: 'Panda' })
    fireEvent.click(screen.getByRole('radio', { name: '+ Nuova auto' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salva nuova auto' }))
    expect(screen.getByText('Completa nome e consumo per salvare l’auto.')).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByLabelText('Nome e modello auto'))
    fireEvent.change(screen.getByLabelText('Nome e modello auto'), { target: { value: 'Clio' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salva nuova auto' }))
    expect(document.activeElement).toBe(screen.getByLabelText('Consumo medio auto in L/100 km'))
  })

  it.each(['', '50'])('saves only vehicle data with refuel amount %s', async amount => {
    render(<VehicleAccount><AccountButton /><RegistrationPrompt /><RefuelForm onCalculate={vi.fn()} /></VehicleAccount>)
    login()
    await screen.findByRole('radio', { name: 'Panda' })
    fireEvent.click(screen.getByRole('radio', { name: '+ Nuova auto' }))
    const single = vi.fn().mockResolvedValue({ data: { id: 'c', name: 'Clio', consumption: 5, consumption_unit: 'L/100 km', fuel_type: 'Gasolio' }, error: null })
    if (amount) fireEvent.click(screen.getByRole('button', { name: '50 €' }))
    const vehicleSection = screen.getByRole('region', { name: 'La tua auto' })
    expect(within(vehicleSection).queryByLabelText('Importo rifornimento in euro')).toBeNull()
    expect(within(vehicleSection).queryByRole('group', { name: 'Modalità di servizio' })).toBeNull()
    expect(within(vehicleSection).getByRole('button', { name: 'Salva nuova auto' })).toBeTruthy()
    const insert = vi.fn(() => ({ select: () => ({ abortSignal: () => ({ single }) }) }))
    mocks.from.mockReturnValue({ insert })
    fireEvent.change(screen.getByLabelText('Nome e modello auto'), { target: { value: 'Clio' } })
    fireEvent.click(screen.getByRole('radio', { name: 'Gasolio' }))
    fireEvent.change(screen.getByLabelText('Consumo medio auto in L/100 km'), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salva nuova auto' }))
    await screen.findByText('Profilo auto salvato.')
    expect(insert).toHaveBeenCalledWith({ name: 'Clio', consumption: 5, consumption_unit: 'L/100 km', fuel_type: 'Gasolio', user_id: 'owner' })
    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'Clio' }).checked).toBe(true)
    expect(screen.getByLabelText<HTMLInputElement>('Importo rifornimento in euro').value).toBe(amount)
  })

  it('reports a save error near the button and allows retry', async () => {
    render(<VehicleAccount><AccountButton /><RegistrationPrompt /><RefuelForm onCalculate={vi.fn()} /></VehicleAccount>)
    login()
    await screen.findByRole('radio', { name: 'Panda' })
    const single = vi.fn().mockResolvedValue({ data: null, error: new Error('network') })
    const query = { eq: vi.fn(), select: () => ({ abortSignal: () => ({ single }) }) }
    query.eq.mockReturnValue(query)
    mocks.from.mockReturnValue({ update: () => query })
    fireEvent.click(screen.getByRole('button', { name: 'Salva modifiche auto' }))
    await screen.findByText('Auto non salvata. Riprova tra poco.')
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Salva modifiche auto' }).disabled).toBe(false)
  })

  it('keeps guest calculation usable after a vehicle query error', async () => {
    mocks.from.mockReturnValue({ select: () => ({ order: () => ({ order: () => ({ abortSignal: async () => ({ error: new Error('offline') }) }) }) }) })
    render(<VehicleAccount><AccountButton /><RegistrationPrompt /><RefuelForm onCalculate={vi.fn()} /></VehicleAccount>)
    login()
    await screen.findByText(/Impossibile caricare le auto/)
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Calcola convenienza' }).disabled).toBe(false)
  })
})
