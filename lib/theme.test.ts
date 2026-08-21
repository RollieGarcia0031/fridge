import { afterEach, describe, expect, it, vi } from 'vitest'
import { themeInitScript } from './theme'

function runScript() {
  ;(0, eval)(themeInitScript)
}

function stubStorageGetItem(impl: () => string | null) {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(impl)
}

function stubMatchMedia(prefersDark: boolean) {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: prefersDark }))
}

describe('themeInitScript', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('prefers the stored theme over the system preference', () => {
    localStorage.setItem('theme', 'light')
    stubMatchMedia(true)

    runScript()

    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('applies dark when stored theme is dark', () => {
    localStorage.setItem('theme', 'dark')
    stubMatchMedia(false)

    runScript()

    expect(document.documentElement).toHaveClass('dark')
  })

  it('falls back to the system preference when nothing is stored', () => {
    stubStorageGetItem(() => null)
    stubMatchMedia(true)

    runScript()

    expect(document.documentElement).toHaveClass('dark')
  })

  it('still applies the system preference when localStorage.getItem throws', () => {
    stubStorageGetItem(() => {
      throw new Error('storage blocked')
    })
    stubMatchMedia(true)

    runScript()

    expect(document.documentElement).toHaveClass('dark')
  })

  it('stays light when getItem throws and system preference is light', () => {
    stubStorageGetItem(() => {
      throw new Error('storage blocked')
    })
    stubMatchMedia(false)

    runScript()

    expect(document.documentElement).not.toHaveClass('dark')
  })
})
