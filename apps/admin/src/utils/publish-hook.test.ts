import { afterEach, describe, expect, it, vi } from 'vitest'
import { publishHook } from './publish-hook'

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('publishHook', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('logs when the purge endpoint responds with a non-ok status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    publishHook('page', 1, 2)
    await flush()

    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls[0]?.join(' ')).toContain('page')
    expect(errorSpy.mock.calls[0]?.join(' ')).toContain('500')
  })

  it('logs when the purge request itself fails (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    publishHook('post', 3, 4)
    await flush()

    expect(errorSpy).toHaveBeenCalledTimes(1)
  })

  it('does not log anything on a successful purge', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    publishHook('site', 5, 5)
    await flush()

    expect(errorSpy).not.toHaveBeenCalled()
  })
})
