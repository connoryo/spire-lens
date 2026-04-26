import { useState, useEffect } from 'react'
import { FolderOpen, RotateCcw, CheckCircle, AlertCircle, Palette, Database, Filter, ExternalLink } from 'lucide-react'
import { useSettings, type Theme } from '@/lib/settings'
import { useData } from '@/lib/dataStore'
import { Card, CardHeader, CardBody } from '@/components/Card'
import { cn } from '@/lib/utils'

// ─── Theme previews ───────────────────────────────────────────────────────────

interface ThemeOption {
  id: Theme
  label: string
  description: string
  bg: string
  secondary: string
  card: string
  accent: string
  text: string
}

const THEMES: ThemeOption[] = [
  {
    id: 'ironclad',
    label: 'Ironclad',
    description: 'Smoldering red-brown with ember orange',
    bg: '#12080a', secondary: '#1e0e08', card: '#2d1510', accent: '#e8592a', text: '#ffe8d6',
  },
  {
    id: 'silent',
    label: 'Silent',
    description: 'Shadow teal with poison green',
    bg: '#06090a', secondary: '#0a1410', card: '#11201a', accent: '#22c55e', text: '#d1f0dd',
  },
  {
    id: 'defect',
    label: 'Defect',
    description: 'Deep navy with electric cyan',
    bg: '#07080f', secondary: '#0c1420', card: '#111e30', accent: '#22d3ee', text: '#e0f2fe',
  },
  {
    id: 'necrobinder',
    label: 'Necrobinder',
    description: 'Void purple with fuchsia soul energy',
    bg: '#0d080f', secondary: '#150e1a', card: '#1f1428', accent: '#c026d3', text: '#f0e8ff',
  },
  {
    id: 'regent',
    label: 'Regent',
    description: 'Royal navy with amber gold',
    bg: '#08090f', secondary: '#0e1020', card: '#14182e', accent: '#d97706', text: '#f0e8d4',
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Classic neutral dark',
    bg: '#0d0d12', secondary: '#14141c', card: '#1c1c28', accent: '#c8a858', text: '#dad8e8',
  },
  {
    id: 'light',
    label: 'Light',
    description: 'Clean light theme',
    bg: '#f5f4f0', secondary: '#e8e6e0', card: '#fffefc', accent: '#946c1c', text: '#1c1a16',
  },
]

function ThemeCard({ theme, selected, onSelect }: {
  theme: ThemeOption
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative rounded-lg p-0.5 transition-all focus:outline-none',
        selected
          ? 'ring-2 ring-accent-gold scale-[1.02]'
          : 'ring-1 ring-border-default hover:ring-accent-gold/50 hover:scale-[1.01]'
      )}
      style={{ background: selected ? theme.accent : theme.secondary }}
    >
      {/* Mini UI preview */}
      <div className="rounded-md overflow-hidden" style={{ background: theme.bg }}>
        {/* Fake title bar */}
        <div className="px-2 py-1.5 flex items-center gap-1.5" style={{ background: theme.secondary }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: theme.accent, opacity: 0.8 }} />
          <div className="h-1 flex-1 rounded-full" style={{ background: theme.text, opacity: 0.1 }} />
        </div>
        {/* Fake content */}
        <div className="p-2 flex gap-1.5">
          <div className="w-10 rounded flex flex-col gap-1" style={{ background: theme.secondary }}>
            {[0.6, 0.4, 0.4, 0.3].map((o, i) => (
              <div key={i} className="h-1.5 rounded-sm mx-1" style={{ background: theme.text, opacity: o }} />
            ))}
          </div>
          <div className="flex-1 flex flex-col gap-1">
            {[1, 0.6, 0.6, 0.4, 0.4].map((o, i) => (
              <div key={i} className="h-1.5 rounded-sm" style={{ background: i === 0 ? theme.accent : theme.text, opacity: o }} />
            ))}
          </div>
        </div>
      </div>

      {selected && (
        <div className="absolute -top-1.5 -right-1.5">
          <CheckCircle size={16} style={{ color: theme.accent, fill: theme.bg }} />
        </div>
      )}

      <div className="mt-2 mb-1 px-1 text-left">
        <p className="text-sm font-medium" style={{ color: theme.text }}>{theme.label}</p>
        {/* <p className="text-xs opacity-60" style={{ color: theme.text }}>{theme.description}</p> */}
      </div>
    </button>
  )
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Icon size={15} className="text-accent-gold" />
          {title}
        </h3>
      </CardHeader>
      <CardBody className="space-y-4">{children}</CardBody>
    </Card>
  )
}

// ─── Profile filter ───────────────────────────────────────────────────────────

function ProfileFilter() {
  const { settings, update } = useSettings()
  const { runs } = useData()

  // Collect all unique profile keys from loaded runs
  const profiles = [...new Set(runs.map(r => `${r.steamId}/${r.profileId}`))]
    .sort()

  if (profiles.length <= 1) {
    return (
      <p className="text-sm text-text-muted">
        Only one profile detected. Filtering is available when multiple profiles or Steam accounts are present.
      </p>
    )
  }

  function toggle(key: string) {
    const enabled = settings.enabledProfiles
    update({
      enabledProfiles: enabled.includes(key)
        ? enabled.filter(k => k !== key)
        : [...enabled, key],
    })
  }

  const allEnabled = settings.enabledProfiles.length === 0

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer group">
        <input
          type="checkbox"
          checked={allEnabled}
          onChange={() => update({ enabledProfiles: [] })}
          className="accent-[rgb(var(--accent-gold))] w-4 h-4"
        />
        <span className="text-sm text-text-primary group-hover:text-text-primary">
          All profiles
        </span>
        <span className="text-xs text-text-muted">({runs.length} runs)</span>
      </label>

      {profiles.map(key => {
        const [steamId, profileId] = key.split('/')
        const count = runs.filter(r => `${r.steamId}/${r.profileId}` === key).length
        const isEnabled = allEnabled || settings.enabledProfiles.includes(key)
        return (
          <label key={key} className="flex items-center gap-2 ml-4 cursor-pointer group">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={() => toggle(key)}
              className="accent-[rgb(var(--accent-gold))] w-4 h-4"
            />
            <span className="text-sm text-text-secondary group-hover:text-text-primary font-mono">
              {steamId}
            </span>
            <span className="text-xs text-text-muted">/ {profileId}</span>
            <span className="text-xs text-text-muted">({count} runs)</span>
          </label>
        )
      })}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { settings, update, reset } = useSettings()
  const { defaultSavePath, reload } = useData()
  const [pathInput, setPathInput] = useState(settings.customSavePath)
  const [pathStatus, setPathStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Keep input in sync if settings change from elsewhere
  useEffect(() => { setPathInput(settings.customSavePath) }, [settings.customSavePath])

  async function handleBrowse() {
    const selected = await window.electronAPI.openFolderDialog()
    if (selected) {
      setPathInput(selected)
      applyPath(selected)
    }
  }

  function applyPath(path: string) {
    try {
      update({ customSavePath: path })
      reload()
      setPathStatus('saved')
      setTimeout(() => setPathStatus('idle'), 2000)
    } catch {
      setPathStatus('error')
    }
  }

  function handlePathSubmit(e: React.FormEvent) {
    e.preventDefault()
    applyPath(pathInput.trim())
  }

  function clearCustomPath() {
    setPathInput('')
    update({ customSavePath: '' })
    reload()
  }

  return (
    <div className="p-6 space-y-6 overflow-auto h-full max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Settings</h2>
        {/* <p className="text-text-muted text-sm">Preferences are saved locally in your browser storage.</p> */}
      </div>

      {/* ── Appearance ── */}
      <Section icon={Palette} title="Appearance">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide mb-3">Theme</p>
          <div className="grid grid-cols-5 gap-3">
            {THEMES.map(theme => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                selected={settings.theme === theme.id}
                onSelect={() => update({ theme: theme.id, themeAutoSet: true })}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* ── Data Source ── */}
      <Section icon={Database} title="Data Source">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Save Directory</p>
          <p className="text-xs text-text-muted mb-3">
            Default: <span className="font-mono text-text-secondary">{defaultSavePath || '…'}</span>
          </p>
          <form onSubmit={handlePathSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={pathInput}
              onChange={e => setPathInput(e.target.value)}
              placeholder={defaultSavePath || 'Custom path…'}
              className="flex-1 bg-bg-secondary border border-border-default rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold/60 font-mono"
            />
            <button
              type="button"
              onClick={handleBrowse}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm bg-bg-hover border border-border-default text-text-secondary hover:text-text-primary transition-colors"
            >
              <FolderOpen size={14} /> Browse
            </button>
            <button
              type="submit"
              className="px-3 py-2 rounded-md text-sm bg-accent-gold/10 border border-accent-gold/30 text-accent-gold hover:bg-accent-gold/20 transition-colors"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => {
                const path = settings.customSavePath || defaultSavePath
                if (path) window.electronAPI.openSaveFolder(path)
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm bg-bg-hover border border-border-default text-text-secondary hover:text-text-primary transition-colors"
              title="Open save folder in Explorer"
            >
              <ExternalLink size={14} />
            </button>
          </form>

          {/* Status feedback */}
          {pathStatus === 'saved' && (
            <p className="flex items-center gap-1.5 text-xs text-accent-green mt-2">
              <CheckCircle size={12} /> Path applied and data reloaded.
            </p>
          )}
          {pathStatus === 'error' && (
            <p className="flex items-center gap-1.5 text-xs text-accent-red mt-2">
              <AlertCircle size={12} /> Failed to apply path.
            </p>
          )}

          {settings.customSavePath && (
            <button
              onClick={clearCustomPath}
              className="text-xs text-text-muted hover:text-accent-red mt-2 transition-colors"
            >
              ✕ Clear custom path (revert to default)
            </button>
          )}
        </div>
      </Section>

      {/* ── Profile Filter ── */}
      <Section icon={Filter} title="Profile Filter">
        <ProfileFilter />
      </Section>

      {/* ── Display ── */}
      <Section icon={Filter} title="Display">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-xs text-text-muted uppercase tracking-wide block mb-2">
              Card Stats — Minimum Times Seen
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={50}
                value={settings.cardStatsMinSeen}
                onChange={e => update({ cardStatsMinSeen: Number(e.target.value) })}
                className="flex-1 accent-[rgb(var(--accent-gold))]"
              />
              <span className="text-sm text-text-primary w-6 text-right">{settings.cardStatsMinSeen}</span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Hide cards with fewer total appearances than this threshold.
            </p>
          </div>

          <div>
            <label className="text-xs text-text-muted uppercase tracking-wide block mb-2">
              Run List — Page Size
            </label>
            <select
              value={settings.runListPageSize}
              onChange={e => update({ runListPageSize: Number(e.target.value) })}
              className="bg-bg-secondary border border-border-default rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-gold/60 w-full"
            >
              <option value={0}>Show all runs</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>
      </Section>

      {/* ── Reset ── */}
      <div className="border-t border-border-default pt-4">
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-accent-red transition-colors"
          >
            <RotateCcw size={13} /> Reset all settings to defaults
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm text-text-secondary">Reset everything?</p>
            <button
              onClick={() => { reset(); setShowResetConfirm(false) }}
              className="text-sm text-accent-red hover:underline"
            >
              Yes, reset
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="text-sm text-text-muted hover:text-text-primary"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
