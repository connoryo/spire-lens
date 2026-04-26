import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from '../src/types/ipc'

const api: ElectronAPI = {
  loadAllData: (customPath?: string) => ipcRenderer.invoke('load-all-data', customPath),
  getDefaultSavePath: () => ipcRenderer.invoke('get-default-save-path'),
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  openSaveFolder: (folderPath: string) => ipcRenderer.invoke('open-save-folder', folderPath),
  setTitlebarOverlay: (color: string, symbolColor: string) => ipcRenderer.invoke('set-titlebar-overlay', color, symbolColor),
  codexFetch: (url: string) => ipcRenderer.invoke('codex-fetch', url),
}

contextBridge.exposeInMainWorld('electronAPI', api)
