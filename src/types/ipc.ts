import type { RunFile } from './run'
import type { ProgressFile } from './progress'

export interface RawRunEntry {
  id: string
  filePath: string
  profileId: string
  steamId: string
  data: RunFile
}

export interface LoadResult {
  runs: RawRunEntry[]
  progress: Record<string, ProgressFile>  // key = "steamId/profileId"
  errors: string[]
}

export interface ElectronAPI {
  loadAllData: (customPath?: string) => Promise<LoadResult>
  getDefaultSavePath: () => Promise<string>
  openFolderDialog: () => Promise<string | null>  // returns selected path or null
  openSaveFolder: (folderPath: string) => Promise<void>
  setTitlebarOverlay: (color: string, symbolColor: string) => Promise<void>
  /** Fetches a URL via the main process, bypassing renderer CORS restrictions. */
  codexFetch: (url: string) => Promise<unknown>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
