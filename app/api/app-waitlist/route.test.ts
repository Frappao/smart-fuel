import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createSupabaseServerClient } from '../../../lib/supabase/server'
import { POST } from './route'

vi.mock('../../../lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

const insert = vi.fn()
const from = vi.fn()

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/app-waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('POST /api/app-waitlist', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    from.mockReturnValue({ insert })
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      from,
    } as unknown as ReturnType<typeof createSupabaseServerClient>)
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('saves the normalized email for the chosen platform', async () => {
    insert.mockResolvedValue({ error: null })

    const response = await POST(
      createRequest({ email: '  Tester@Gmail.com ', platform: 'android' }),
    )

    expect(from).toHaveBeenCalledWith('app_waitlist')
    expect(insert).toHaveBeenCalledWith({
      email: 'tester@gmail.com',
      platform: 'android',
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
  })

  it('treats an already registered email as a success', async () => {
    insert.mockResolvedValue({
      error: { code: '23505', message: 'duplicate key value' },
    })

    const response = await POST(
      createRequest({ email: 'tester@gmail.com', platform: 'ios' }),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
  })

  it('reports an error when the database does not save the email', async () => {
    insert.mockResolvedValue({
      error: {
        code: 'PGRST205',
        message: "Could not find the table 'public.app_waitlist'",
      },
    })

    const response = await POST(
      createRequest({ email: 'tester@gmail.com', platform: 'android' }),
    )

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({
      error: 'Non riesco a registrare la richiesta ora. Riprova tra poco.',
    })
  })

  it('reports an error when the server environment is not configured', async () => {
    vi.mocked(createSupabaseServerClient).mockImplementation(() => {
      throw new Error('Missing SUPABASE_SECRET_KEY')
    })

    const response = await POST(
      createRequest({ email: 'tester@gmail.com', platform: 'android' }),
    )

    expect(response.status).toBe(503)
    expect(insert).not.toHaveBeenCalled()
  })

  it('rejects an invalid email without touching the database', async () => {
    const response = await POST(
      createRequest({ email: 'non-una-mail', platform: 'android' }),
    )

    expect(response.status).toBe(400)
    expect(createSupabaseServerClient).not.toHaveBeenCalled()
  })

  it('rejects an unknown platform without touching the database', async () => {
    const response = await POST(
      createRequest({ email: 'tester@gmail.com', platform: 'windows' }),
    )

    expect(response.status).toBe(400)
    expect(createSupabaseServerClient).not.toHaveBeenCalled()
  })

  it('rejects a body that is not JSON', async () => {
    const response = await POST(createRequest('{non json'))

    expect(response.status).toBe(400)
    expect(createSupabaseServerClient).not.toHaveBeenCalled()
  })
})
