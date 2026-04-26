import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { existsSync, readdirSync, readFileSync } from 'fs'
import type { LoadResult, RawRunEntry } from '../src/types/ipc'
import type { ProgressFile } from '../src/types/progress'
import type { RunFile } from '../src/types/run'

function getDefaultSavePath(): string {
  const home = process.env.HOME || process.env.USERPROFILE || ''
  if (process.platform === 'darwin') {
    return join(home, 'Library', 'Application Support', 'SlayTheSpire2', 'steam')
  }
  if (process.platform === 'linux') {
    return join(home, '.steam', 'steam', 'userdata')
  }
  // Windows
  const appData = process.env.APPDATA || ''
  return join(appData, 'SlayTheSpire2', 'steam')
}

function loadAllData(customPath?: string): LoadResult {
  const runs: RawRunEntry[] = []
  const progress: Record<string, ProgressFile> = {}
  const errors: string[] = []

  const steamRoot = customPath || getDefaultSavePath()

  if (!existsSync(steamRoot)) {
    errors.push(`Save directory not found: ${steamRoot}`)
    return { runs, progress, errors }
  }

  let steamIds: string[]
  try {
    steamIds = readdirSync(steamRoot, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
  } catch (e) {
    errors.push(`Failed to read steam directory: ${e}`)
    return { runs, progress, errors }
  }

  for (const steamId of steamIds) {
    const steamPath = join(steamRoot, steamId)

    // On Linux, Steam stores game saves under userdata/[id]/remote/; on Windows/Mac
    // the game uses its own directory so profiles sit directly under the steam ID folder.
    const profilesRoot = existsSync(join(steamPath, 'remote'))
      ? join(steamPath, 'remote')
      : steamPath

    let profiles: string[]
    try {
      profiles = readdirSync(profilesRoot, { withFileTypes: true })
        .filter(d => d.isDirectory() && d.name.startsWith('profile'))
        .map(d => d.name)
    } catch (e) {
      errors.push(`Failed to read profiles for ${steamId}: ${e}`)
      continue
    }

    for (const profileId of profiles) {
      const savesPath = join(profilesRoot, profileId, 'saves')

      const progressPath = join(savesPath, 'progress.save')
      if (existsSync(progressPath)) {
        try {
          const raw = readFileSync(progressPath, 'utf-8')
          progress[`${steamId}/${profileId}`] = JSON.parse(raw) as ProgressFile
        } catch (e) {
          errors.push(`Failed to parse progress.save for ${steamId}/${profileId}: ${e}`)
        }
      }

      const historyPath = join(savesPath, 'history')
      if (!existsSync(historyPath)) continue

      let runFiles: string[]
      try {
        runFiles = readdirSync(historyPath).filter(f => f.endsWith('.run'))
      } catch (e) {
        errors.push(`Failed to read history for ${steamId}/${profileId}: ${e}`)
        continue
      }

      for (const filename of runFiles) {
        const filePath = join(historyPath, filename)
        try {
          const raw = readFileSync(filePath, 'utf-8')
          const data = JSON.parse(raw) as RunFile
          const id = filename.replace('.run', '')
          runs.push({ id, filePath, profileId, steamId, data })
        } catch (e) {
          errors.push(`Failed to parse ${filePath}: ${e}`)
        }
      }
    }
  }

  return { runs, progress, errors }
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    backgroundColor: '#0f0e17',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1a1828',
      symbolColor: '#9e95b0',
      height: 36,
    },
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  ipcMain.handle('load-all-data', (_event, customPath?: string) => loadAllData(customPath))
  ipcMain.handle('get-default-save-path', () => getDefaultSavePath())
  ipcMain.handle('open-folder-dialog', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win!, {
      title: 'Select STS2 Save Directory',
      properties: ['openDirectory'],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('open-save-folder', async (_event, folderPath: string) => {
    await shell.openPath(folderPath)
  })

  ipcMain.handle('set-titlebar-overlay', (event, color: string, symbolColor: string) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.setTitleBarOverlay({ color, symbolColor, height: 36 })
  })

  // Proxy external API calls through the main process to avoid renderer CORS restrictions
  ipcMain.handle('codex-fetch', async (_event, url: string) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`codex-fetch ${url} → ${res.status}`)
    return res.json()
  })

  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
