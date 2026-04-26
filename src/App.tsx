import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'
import { SettingsProvider } from '@/lib/settings'
import { DataProvider } from '@/lib/dataStore'
import { CodexProvider, useCodex, type CodexStatus } from '@/lib/codexStore'
import { clearCodexCache } from '@/lib/codex'
import { useData } from '@/lib/dataStore'
import { Sidebar } from '@/components/Sidebar'
import { PathSetupModal } from '@/components/PathSetupModal'
import { RunListPage } from '@/pages/RunList/RunListPage'
import { RunDetailPage } from '@/pages/RunDetail/RunDetailPage'
import { DashboardPage } from '@/pages/Dashboard/DashboardPage'
import { CardStatsPage } from '@/pages/CardStats/CardStatsPage'
import { SettingsPage } from '@/pages/Settings/SettingsPage'

// ── Status bar ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<CodexStatus, { dot: string; label: string; title: string }> = {
  loading:   { dot: '#8a7f72', label: 'Spire Codex',           title: 'Connecting to Spire Codex…' },
  connected: { dot: '#4caf7a', label: 'Spire Codex',           title: 'Connected — card info available' },
  partial:   { dot: '#c9a84c', label: 'Spire Codex (partial)', title: 'Some API endpoints are unavailable. Card tooltips may be incomplete.' },
  offline:   { dot: '#c94040', label: 'Spire Codex',           title: 'Offline — card tooltips unavailable' },
}

const BAR_ITEM: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  padding: '0 10px', height: '100%',
  background: 'none', border: 'none',
  borderRight: '1px solid rgba(255,255,255,0.06)',
  fontSize: 11, color: 'rgb(var(--text-muted))',
  whiteSpace: 'nowrap',
}

function CodexStatusChip() {
  const { codexStatus, failedEndpoints } = useCodex()
  const cfg = STATUS_CONFIG[codexStatus]
  const isRetryable = codexStatus === 'offline' || codexStatus === 'partial'

  function handleClick() {
    if (isRetryable) { clearCodexCache(); window.location.reload() }
  }

  const failureNote = failedEndpoints.length > 0 ? `\nFailed: ${failedEndpoints.join(', ')}` : ''

  return (
    <button
      onClick={isRetryable ? handleClick : undefined}
      title={cfg.title + failureNote + (isRetryable ? '\n\nClick to retry' : '')}
      style={{
        ...BAR_ITEM,
        cursor: isRetryable ? 'pointer' : 'default',
        opacity: codexStatus === 'loading' ? 0.6 : 1,
        borderRight: 'none',
      }}
    >
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: cfg.dot, flexShrink: 0,
        boxShadow: codexStatus === 'connected' ? `0 0 5px ${cfg.dot}88` : 'none',
        animation: codexStatus === 'loading' ? 'statusPulse 1.2s ease-in-out infinite' : 'none',
      }} />
      {cfg.label}
    </button>
  )
}

const RELEASES_URL = 'https://github.com/connoryo/spire-lens/releases/latest'
const RELEASES_API = 'https://api.github.com/repos/connoryo/spire-lens/releases/latest'

type UpdateState = 'idle' | 'checking' | 'up_to_date' | 'update_available' | 'error'

function CheckForUpdatesButton() {
  const [state, setState] = useState<UpdateState>('idle')
  const [latestTag, setLatestTag] = useState<string | null>(null)

  async function handleClick() {
    if (state === 'checking') return
    if (state === 'update_available') {
      window.electronAPI?.openExternal(RELEASES_URL)
      return
    }
    setState('checking')
    try {
      const [currentVersion, release] = await Promise.all([
        window.electronAPI?.getAppVersion() ?? '0.0.0',
        window.electronAPI?.codexFetch(RELEASES_API) as Promise<{ tag_name: string }>,
      ])
      const tag = release.tag_name          // e.g. "v1.2.0"
      const latest = tag.replace(/^v/, '')  // "1.2.0"
      setLatestTag(tag)
      setState(latest === currentVersion ? 'up_to_date' : 'update_available')
    } catch {
      setState('error')
    }
  }

  const label =
    state === 'checking'         ? 'Checking…'       :
    state === 'up_to_date'       ? 'Up to date'      :
    state === 'update_available' ? `Update ${latestTag}` :
    state === 'error'            ? 'Check failed'    :
    'Check for Updates'

  const color =
    state === 'up_to_date'       ? '#4caf7a' :
    state === 'update_available' ? '#f59e0b' :
    state === 'error'            ? '#c94040' :
    'rgb(var(--text-muted))'

  return (
    <button
      onClick={handleClick}
      disabled={state === 'checking'}
      title={
        state === 'update_available'
          ? `${latestTag} is available — click to open releases page`
          : state === 'error'
          ? 'Could not reach GitHub — check your connection'
          : 'Check for app updates'
      }
      style={{
        ...BAR_ITEM,
        borderRight: 'none',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        cursor: state === 'checking' ? 'default' : 'pointer',
        color,
      }}
    >
      <RefreshCw size={10} className={state === 'checking' ? 'animate-spin' : ''} style={{ flexShrink: 0 }} />
      {label}
    </button>
  )
}

function StatusBar() {
  return (
    <div
      className="shrink-0 flex items-center justify-between border-t border-border-default bg-bg-secondary select-none"
      style={{ height: 22 }}
    >
      <style>{`@keyframes statusPulse { 0%,100%{opacity:1} 50%{opacity:0.25} }`}</style>

      {/* Left: status label + codex chip */}
      <div className="flex items-center h-full">
        <span style={{ ...BAR_ITEM, cursor: 'default' }}>Status:</span>
        <CodexStatusChip />
      </div>

      {/* Right: check for updates */}
      <CheckForUpdatesButton />
    </div>
  )
}

// ── App shell ─────────────────────────────────────────────────────────────────

function AppShell() {
  const { pathSetupNeeded } = useData()
  return (
    <>
      {pathSetupNeeded && <PathSetupModal />}
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<RunListPage />} />
            <Route path="/run/:id" element={<RunDetailPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/cards" element={<CardStatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
      <StatusBar />
    </>
  )
}

// Titlebar sits inside DataProvider so it can read run count
function TitleBar() {
  const { runs } = useData()
  const navigate = useNavigate()
  return (
    <div
      className="h-9 shrink-0 flex items-center px-2 gap-1 bg-bg-secondary border-b border-border-default select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Nav buttons — pointer-events enabled so clicks pass through drag region */}
      <div className="flex items-center gap-0.5" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={() => navigate(-1)}
          className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          title="Go back"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M8 2.5L4 6.5L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          onClick={() => navigate(1)}
          className="w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          title="Go forward"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M5 2.5L9 6.5L5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <span className="text-accent-gold font-bold text-sm tracking-tight ml-1">STS2 Viewer</span>
      {runs.length > 0 && (
        <span className="text-text-muted text-xs ml-2">{runs.length} runs</span>
      )}
    </div>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <CodexProvider>
        <DataProvider>
          <div className="flex flex-col h-screen bg-bg-primary text-text-primary overflow-hidden">
            <AppShell />
          </div>
        </DataProvider>
      </CodexProvider>
    </SettingsProvider>
  )
}
