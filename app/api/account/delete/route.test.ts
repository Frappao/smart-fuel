import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { POST } from './route'

vi.mock('../../../../lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}))

const getUser = vi.fn()
const deleteUser = vi.fn()

function createRequest(authorization?: string): Request {
  return new Request('http://localhost/api/account/delete', {
    method: 'POST',
    headers: authorization ? { Authorization: authorization } : {},
  })
}

describe('POST /api/account/delete', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      auth: { getUser, admin: { deleteUser } },
    } as unknown as ReturnType<typeof createSupabaseServerClient>)
  })

  it('deletes only the user identified by the access token', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'owner' } }, error: null })
    deleteUser.mockResolvedValue({ error: null })

    const response = await POST(createRequest('Bearer valid-token'))

    expect(getUser).toHaveBeenCalledWith('valid-token')
    expect(deleteUser).toHaveBeenCalledWith('owner')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
  })

  it('rejects requests without a bearer token', async () => {
    const response = await POST(createRequest())

    expect(response.status).toBe(401)
    expect(getUser).not.toHaveBeenCalled()
    expect(deleteUser).not.toHaveBeenCalled()
  })

  it('rejects an invalid or expired token without deleting anything', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error('invalid JWT') })

    const response = await POST(createRequest('Bearer expired'))

    expect(response.status).toBe(401)
    expect(deleteUser).not.toHaveBeenCalled()
  })

  it('reports a server error when Supabase cannot delete the user', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'owner' } }, error: null })
    deleteUser.mockResolvedValue({ error: new Error('db down') })
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await POST(createRequest('Bearer valid-token'))

    expect(response.status).toBe(500)
  })

  it('answers 503 when the server environment is not configured', async () => {
    vi.mocked(createSupabaseServerClient).mockImplementation(() => {
      throw new Error('Missing SUPABASE_SECRET_KEY')
    })

    const response = await POST(createRequest('Bearer valid-token'))

    expect(response.status).toBe(503)
  })
})
