import React, { createContext, useContext, useEffect, useState } from 'react'
import type { ProcessedRun } from '@/types/run'
import type { ProgressFile } from '@/types/progress'
import type { Theme } from './settings'
import { parseRun } from './parseRun'
import { useSettings } from './settings'

const CHAR_THEME_MAP: Record<string, Theme> = {
  'Ironclad': 'ironclad',
  'Silent': 'silent',
  'Defect': 'defect',
  'Necrobinder': 'necrobinder',
  'Regent': 'regent',
}

interface DataState {
  runs: ProcessedRun[]
  progress: Record<string, ProgressFile>
  loading: boolean
  errors: string[]
  defaultSavePath: string
  pathSetupNeeded: boolean
  reload: () => void
}

const DataContext = createContext<DataState>({
  runs: [],
  progress: {},
  loading: true,
  errors: [],
  defaultSavePath: '',
  pathSetupNeeded: false,
  reload: () => {},
})

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { settings, update } = useSettings()
  const [runs, setRuns] = useState<ProcessedRun[]>([])
  const [progress, setProgress] = useState<Record<string, ProgressFile>>({})
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])
  const [defaultSavePath, setDefaultSavePath] = useState('')
  const [pathSetupNeeded, setPathSetupNeeded] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const customPath = settings.customSavePath || undefined
      const result = await window.electronAPI.loadAllData(customPath)
      let processed = result.runs.map(parseRun)

      // Filter by enabled profiles if any are specified
      if (settings.enabledProfiles.length > 0) {
        processed = processed.filter(r =>
          settings.enabledProfiles.includes(`${r.steamId}/${r.profileId}`)
        )
      }

      processed.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      setRuns(processed)
      setProgress(result.progress)
      setErrors(result.errors)
      setPathSetupNeeded(result.errors.some(e => e.includes('Save directory not found')))

      // Auto-set theme to most-played character on first run
      if (!settings.themeAutoSet) {
        if (processed.length > 0) {
          const counts: Record<string, number> = {}
          for (const r of processed) counts[r.character] = (counts[r.character] ?? 0) + 1
          const topChar = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
          update({ theme: CHAR_THEME_MAP[topChar] ?? 'dark', themeAutoSet: true })
        } else {
          update({ theme: 'dark', themeAutoSet: true })
        }
      }
    } catch (e) {
      setErrors([String(e)])
    } finally {
      setLoading(false)
    }
  }

  // Reload when save path or profile filter changes
  useEffect(() => { load() }, [settings.customSavePath, settings.enabledProfiles])

  useEffect(() => {
    window.electronAPI.getDefaultSavePath().then(setDefaultSavePath)
  }, [])

  return (
    <DataContext.Provider value={{ runs, progress, loading, errors, defaultSavePath, pathSetupNeeded, reload: load }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}
