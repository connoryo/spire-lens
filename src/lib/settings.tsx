import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'ironclad' | 'silent' | 'defect' | 'necrobinder' | 'regent' | 'dark' | 'light'

export interface Settings {
  theme: Theme
  customSavePath: string          // empty string = use default
  enabledProfiles: string[]       // "steamId/profileId" keys; empty = all enabled
  cardStatsMinSeen: number
  runListPageSize: number         // rows per page (0 = show all)
  themeAutoSet: boolean           // true once theme has been set (auto or by user)
}

const DEFAULTS: Settings = {
  theme: 'dark',
  customSavePath: '',
  enabledProfiles: [],
  cardStatsMinSeen: 5,
  runListPageSize: 0,
  themeAutoSet: false,
}

const STORAGE_KEY = 'sts2viewer-settings'

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return DEFAULTS
  }
}

function save(s: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

interface SettingsCtx {
  settings: Settings
  update: (patch: Partial<Settings>) => void
  reset: () => void
}

const Ctx = createContext<SettingsCtx>({
  settings: DEFAULTS,
  update: () => {},
  reset: () => {},
})

const TITLEBAR_OVERLAY: Record<Theme, { color: string; symbolColor: string }> = {
  ironclad:   { color: '#1a1828', symbolColor: '#9e95b0' },
  silent:     { color: '#1a1828', symbolColor: '#9e95b0' },
  defect:     { color: '#1a1828', symbolColor: '#9e95b0' },
  regent:     { color: '#1a1828', symbolColor: '#9e95b0' },
  necrobinder:{ color: '#1a1828', symbolColor: '#9e95b0' },
  dark:       { color: '#1a1828', symbolColor: '#9e95b0' },
  light:      { color: '#e8e6e0', symbolColor: '#565044' },
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load)

  // Apply theme to <html> element and native titlebar whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme)
    const overlay = TITLEBAR_OVERLAY[settings.theme]
    window.electronAPI?.setTitlebarOverlay?.(overlay.color, overlay.symbolColor)
  }, [settings.theme])

  function update(patch: Partial<Settings>) {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      save(next)
      return next
    })
  }

  function reset() {
    save(DEFAULTS)
    setSettings(DEFAULTS)
  }

  return <Ctx.Provider value={{ settings, update, reset }}>{children}</Ctx.Provider>
}

export function useSettings() {
  return useContext(Ctx)
}
