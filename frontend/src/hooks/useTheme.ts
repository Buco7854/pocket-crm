import { useState, useEffect, useCallback } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'pocket-crm-theme'

function getSystemPreference(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(mode: ThemeMode) {
  const resolved = mode === 'system' ? getSystemPreference() : mode
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(
    () => (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'system',
  )

  useEffect(() => {
    applyTheme(theme)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (theme === 'system') applyTheme('system')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  // Sync theme state across all hook instances in the same tab
  useEffect(() => {
    function handler(e: Event) {
      const mode = (e as CustomEvent<ThemeMode>).detail
      setThemeState(mode)
    }
    window.addEventListener('pocket-crm-theme', handler)
    return () => window.removeEventListener('pocket-crm-theme', handler)
  }, [])

  const setTheme = useCallback((mode: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, mode)
    setThemeState(mode)
    applyTheme(mode)
    window.dispatchEvent(new CustomEvent('pocket-crm-theme', { detail: mode }))
  }, [])

  const cycleTheme = useCallback(() => {
    const modes: ThemeMode[] = ['light', 'dark', 'system']
    setTheme(modes[(modes.indexOf(theme) + 1) % modes.length])
  }, [theme, setTheme])

  return { theme, setTheme, cycleTheme }
}
