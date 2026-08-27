import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}))

const getUser = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: () => ({
    auth: { getUser: (...args: unknown[]) => getUser(...args) },
    from: () => ({
      select: () => ({
        in: () => ({ data: [], error: null }),
      }),
      upsert: () => ({
        select: () => ({ data: [], error: null }),
      }),
    }),
  }),
}))

function authedRequest(body: unknown): Request {
  const request = new Request('http://localhost/api/ingredients/user', {
    method: 'POST',
    headers: { authorization: 'Bearer test-token' },
    body: body === null ? null : JSON.stringify(body),
  })
  return request
}

describe('POST /api/ingredients/user request validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
  })

  it('returns 400 for a null body', async () => {
    const res = await POST(authedRequest(null))
    expect(res.status).toBe(400)
  })

  it('returns 400 for a body with no ids or rows', async () => {
    const res = await POST(authedRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 400 for rows containing a null entry', async () => {
    const res = await POST(authedRequest({ rows: [null] }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for rows entries missing ingredient_id', async () => {
    const res = await POST(authedRequest({ rows: [{ quantity: '2' }] }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for an unauthorized request', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: 'nope' } })
    const request = new Request('http://localhost/api/ingredients/user', {
      method: 'POST',
      headers: { authorization: 'Bearer bad-token' },
      body: JSON.stringify({ ids: ['a'] }),
    })
    const res = await POST(request)
    expect(res.status).toBe(401)
  })
})
