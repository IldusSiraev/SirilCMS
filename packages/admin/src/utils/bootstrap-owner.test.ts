import { describe, expect, it, vi } from 'vitest'
import { bootstrapOwner } from './bootstrap-owner'

const make = (count: number) => ({
  count: vi.fn().mockResolvedValue({ totalDocs: count }),
  create: vi.fn().mockResolvedValue({}),
  logger: { info: vi.fn() },
})

describe('bootstrapOwner', () => {
  it('creates owner when DB empty and env set', async () => {
    const p = make(0)
    expect(await bootstrapOwner(p as never, { INITIAL_OWNER_EMAIL: 'a@b.c', INITIAL_OWNER_PASSWORD: 'pw' })).toBe(true)
    expect(p.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'users', overrideAccess: true, data: expect.objectContaining({ email: 'a@b.c', role: 'owner' }),
    }))
  })
  it('skips when a user already exists', async () => {
    const p = make(1)
    expect(await bootstrapOwner(p as never, { INITIAL_OWNER_EMAIL: 'a@b.c', INITIAL_OWNER_PASSWORD: 'pw' })).toBe(false)
    expect(p.create).not.toHaveBeenCalled()
  })
  it('skips when env missing', async () => {
    const p = make(0)
    expect(await bootstrapOwner(p as never, {})).toBe(false)
    expect(p.count).not.toHaveBeenCalled()
  })
})
