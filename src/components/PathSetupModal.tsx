import { useState } from 'react'
import { FolderOpen, AlertTriangle } from 'lucide-react'
import { useSettings } from '@/lib/settings'
import { useData } from '@/lib/dataStore'

export function PathSetupModal() {
  const { settings, update } = useSettings()
  const { defaultSavePath, reload } = useData()
  const [pathInput, setPathInput] = useState(settings.customSavePath)

  async function handleBrowse() {
    const selected = await window.electronAPI.openFolderDialog()
    if (selected) setPathInput(selected)
  }

  function handleApply() {
    const path = pathInput.trim()
    update({ customSavePath: path })
    reload()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-bg-card border border-border-default rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-accent-gold shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-semibold text-text-primary">Save data not found</h2>
            <p className="text-sm text-text-muted mt-1">
              STS2 run data wasn't found at the default location:
            </p>
            <p className="text-xs font-mono text-text-secondary mt-1 break-all">
              {defaultSavePath || '…'}
            </p>
            <p className="text-sm text-text-muted mt-2">
              Please set the directory where STS2 saves its data.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={pathInput}
            onChange={e => setPathInput(e.target.value)}
            placeholder="Path to save directory…"
            className="flex-1 bg-bg-secondary border border-border-default rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold/60 font-mono min-w-0"
          />
          <button
            onClick={handleBrowse}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm bg-bg-hover border border-border-default text-text-secondary hover:text-text-primary transition-colors shrink-0"
          >
            <FolderOpen size={14} /> Browse
          </button>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={handleApply}
            disabled={!pathInput.trim()}
            className="px-4 py-2 rounded-md text-sm bg-accent-gold/10 border border-accent-gold/30 text-accent-gold hover:bg-accent-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply & Reload
          </button>
        </div>
      </div>
    </div>
  )
}
