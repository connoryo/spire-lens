import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { Trophy, Skull, Clock, Layers, ChevronUp, ChevronDown, Search, Users } from 'lucide-react'
import { useData } from '@/lib/dataStore'
import { Spinner } from '@/components/Spinner'
import { Badge } from '@/components/Badge'
import { Tooltip } from '@/components/Tooltip'
import { formatDuration } from '@/lib/parseRun'
import { characterColor, cn } from '@/lib/utils'
import { useCodex } from '@/lib/codexStore'
import type { ProcessedRun } from '@/types/run'

type SortKey = 'date' | 'character' | 'ascension' | 'floor' | 'duration' | 'result'
type SortDir = 'asc' | 'desc'

const CHARACTERS = ['All', 'Ironclad', 'Silent', 'Defect', 'Regent', 'Necrobinder']

export function RunListPage() {
  const { runs, loading } = useData()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const sortKey    = (params.get('sort') as SortKey) ?? 'date'
  const sortDir    = (params.get('dir')  as SortDir) ?? 'desc'
  const filterChar = params.get('char')   ?? 'All'
  const filterResult = (params.get('result') as 'all' | 'win' | 'loss') ?? 'all'
  const search     = params.get('q')      ?? ''

  function setParam(key: string, value: string, defaultVal: string) {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      if (value === defaultVal) next.delete(key)
      else next.set(key, value)
      return next
    }, { replace: true })
  }

  function handleSort(key: SortKey) {
    const newDir = sortKey === key && sortDir === 'desc' ? 'asc' : 'desc'
    setParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('sort', key)
      if (newDir === 'desc') { next.delete('dir') } else { next.set('dir', newDir) }
      return next
    }, { replace: true })
  }

  const filtered = useMemo(() => {
    let list = [...runs]
    if (filterChar !== 'All') list = list.filter(r => r.character === filterChar)
    if (filterResult === 'win') list = list.filter(r => r.win)
    if (filterResult === 'loss') list = list.filter(r => !r.win)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.character.toLowerCase().includes(q) ||
        r.killedBy?.toLowerCase().includes(q) ||
        r.raw.seed.toLowerCase().includes(q)
      )
    }
    list.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'date': cmp = a.startTime.getTime() - b.startTime.getTime(); break
        case 'character': cmp = a.character.localeCompare(b.character); break
        case 'ascension': cmp = a.ascension - b.ascension; break
        case 'floor': cmp = a.floorReached - b.floorReached; break
        case 'duration': cmp = a.durationSeconds - b.durationSeconds; break
        case 'result': cmp = (a.win ? 1 : 0) - (b.win ? 1 : 0); break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [runs, sortKey, sortDir, filterChar, filterResult, search])

  const wins = runs.filter(r => r.win).length
  const winRate = runs.length ? Math.round((wins / runs.length) * 100) : 0

  function SortHeader({ label, skey }: { label: string; skey: SortKey }) {
    const active = sortKey === skey
    return (
      <th
        className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wide cursor-pointer select-none hover:text-text-primary transition-colors"
        onClick={() => handleSort(skey)}
      >
        <span className="flex items-center gap-1">
          {label}
          {active
            ? sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />
            : <span className="w-3" />}
        </span>
      </th>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="w-8 h-8" />
          <p className="text-text-secondary text-sm">Loading runs…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border-default flex items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-text-primary font-semibold text-lg">Run History</h2>
          <p className="text-text-muted text-sm">
            {runs.length} runs · {wins} wins · {winRate}% win rate
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={e => setParam('q', e.target.value, '')}
              className="bg-bg-card border border-border-default rounded-md pl-8 pr-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold/50 w-40"
            />
          </div>

          <select
            value={filterChar}
            onChange={e => setParam('char', e.target.value, 'All')}
            className="bg-bg-card border border-border-default rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-gold/50"
          >
            {CHARACTERS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="flex rounded-md border border-border-default overflow-hidden">
            {(['all', 'win', 'loss'] as const).map(v => (
              <button
                key={v}
                onClick={() => setParam('result', v, 'all')}
                className={cn(
                  'px-3 py-1.5 text-sm transition-colors',
                  filterResult === v
                    ? 'bg-accent-gold/10 text-accent-gold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                )}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-muted text-sm">
            No runs match your filters.
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-bg-secondary z-10">
              <tr>
                <SortHeader label="Date" skey="date" />
                <SortHeader label="Character" skey="character" />
                <SortHeader label="Asc." skey="ascension" />
                <SortHeader label="Result" skey="result" />
                <SortHeader label="Floor" skey="floor" />
                <SortHeader label="Duration" skey="duration" />
                <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wide">Killed By</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wide">Badges</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(run => (
                <RunRow key={run.id} run={run} onClick={() => navigate(`/run/${run.id}`)} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function RunRow({ run, onClick }: { run: ProcessedRun; onClick: () => void }) {
  const color = characterColor(run.character)
  const { badgeInfo } = useCodex()

  return (
    <tr
      onClick={onClick}
      className="border-b border-border-default hover:bg-bg-hover cursor-pointer transition-colors group"
    >
      <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">
        {format(run.startTime, 'MMM d, yyyy')}
        <div className="text-xs text-text-muted">{format(run.startTime, 'HH:mm')}</div>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2 font-medium text-sm" style={{ color }}>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <div>
            {run.character}
            {run.isMultiplayer && (
              <div className="flex items-center gap-1 text-xs text-accent-blue font-normal mt-0.5">
                <Users size={10} /> Co-op ×{run.playerCount}
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="px-4 py-3 text-sm text-text-secondary">
        {run.ascension > 0 ? `A${run.ascension}` : '—'}
      </td>

      <td className="px-4 py-3">
        {run.win ? (
          <Badge variant="gold" className="gap-1">
            <Trophy size={10} /> Win
          </Badge>
        ) : run.abandoned ? (
          <Badge variant="muted">Abandoned</Badge>
        ) : (
          <Badge variant="red" className="gap-1">
            <Skull size={10} /> Loss
          </Badge>
        )}
      </td>

      <td className="px-4 py-3 text-sm text-text-secondary">
        <span className="flex items-center gap-1">
          <Layers size={12} className="text-text-muted" />
          {run.floorReached}
        </span>
      </td>

      <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">
        <span className="flex items-center gap-1">
          <Clock size={12} className="text-text-muted" />
          {formatDuration(run.durationSeconds)}
        </span>
      </td>

      <td className="px-4 py-3 text-sm text-text-muted">
        {run.win
          ? <span className="text-accent-green text-xs">Completed</span>
          : run.abandoned
          ? <span className="text-text-muted text-xs">—</span>
          : (run.killedBy ?? <span className="text-text-muted text-xs">—</span>)
        }
      </td>

      <td className="px-4 py-3">
        <div className="flex gap-1 flex-wrap">
          {run.badges.map(b => {
            const info = badgeInfo(b.id, b.rarity)
            return (
              <Tooltip key={b.id} text={info.description}>
                <Badge
                  variant={b.rarity === 'gold' ? 'gold' : b.rarity === 'silver' ? 'blue' : 'muted'}
                  className="text-xs"
                >
                  {info.name}
                </Badge>
              </Tooltip>
            )
          })}
        </div>
      </td>
    </tr>
  )
}
