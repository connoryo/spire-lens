import { useState, useMemo } from 'react'
import { useData } from '@/lib/dataStore'
import { useSettings } from '@/lib/settings'
import { useCodex } from '@/lib/codexStore'
import { getCardCost } from '@/lib/codex'
import { formatId } from '@/lib/parseRun'
import { Spinner } from '@/components/Spinner'
import { Tooltip } from '@/components/Tooltip'
import { CardTooltipContent, CODEX_BASE, TYPE_LABELS } from '@/components/CardTooltipContent'
import { Search, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type SortKey = 'id' | 'picked' | 'skipped' | 'won' | 'lost' | 'winRate' | 'pickRate'
type SortDir = 'asc' | 'desc'

interface CardRow {
  id: string
  name: string
  picked: number
  skipped: number
  won: number
  lost: number
  total: number
  winRate: number
  pickRate: number
}

const FRAME_COLOR = 'rgb(var(--accent-gold))'

export function CardStatsPage() {
  const { progress, loading } = useData()
  const { settings } = useSettings()
  const { name, cardData } = useCodex()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('picked')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [minSeen, setMinSeen] = useState(() => settings.cardStatsMinSeen)

  const rows: CardRow[] = useMemo(() => {
    const allCards: CardRow[] = []
    const seen = new Set<string>()

    for (const prog of Object.values(progress)) {
      for (const card of prog.card_stats) {
        if (seen.has(card.id)) continue
        seen.add(card.id)
        const total = card.times_picked + card.times_skipped
        const outcomes = card.times_won + card.times_lost
        allCards.push({
          id: card.id,
          name: formatId(card.id),
          picked: card.times_picked,
          skipped: card.times_skipped,
          won: card.times_won,
          lost: card.times_lost,
          total,
          winRate: outcomes > 0 ? Math.round((card.times_won / outcomes) * 100) : 0,
          pickRate: total > 0 ? Math.round((card.times_picked / total) * 100) : 0,
        })
      }
    }
    return allCards
  }, [progress])

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = useMemo(() => {
    let list = rows.filter(r => r.total >= minSeen)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(r => r.name.toLowerCase().includes(q))
    }
    list.sort((a, b) => {
      const av = a[sortKey as keyof CardRow] as number
      const bv = b[sortKey as keyof CardRow] as number
      return sortDir === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1)
    })
    return list
  }, [rows, search, sortKey, sortDir, minSeen])

  function SortHeader({ label, skey, className }: { label: string; skey: SortKey; className?: string }) {
    const active = sortKey === skey
    return (
      <th
        className={cn('px-4 py-2 text-left text-xs font-medium text-text-muted uppercase tracking-wide cursor-pointer hover:text-text-primary transition-colors', className)}
        onClick={() => handleSort(skey)}
      >
        <span className="flex items-center gap-1">
          {label}
          {active ? sortDir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} /> : <span className="w-3" />}
        </span>
      </th>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Spinner className="w-8 h-8" /></div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border-default flex items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Card Stats</h2>
          <p className="text-text-muted text-sm">{filtered.length} cards · from progress.save</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search card…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-bg-card border border-border-default rounded-md pl-8 pr-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-gold/50 w-44"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-text-muted">
            Min seen
            <input
              type="number"
              value={minSeen}
              min={0}
              onChange={e => setMinSeen(Number(e.target.value))}
              className="w-16 bg-bg-card border border-border-default rounded-md px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent-gold/50"
            />
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-bg-secondary z-10">
            <tr>
              <SortHeader label="Card" skey="id" />
              <SortHeader label="Picked" skey="picked" />
              <SortHeader label="Skipped" skey="skipped" />
              <SortHeader label="Pick Rate" skey="pickRate" />
              <SortHeader label="Won With" skey="won" />
              <SortHeader label="Lost With" skey="lost" />
              <SortHeader label="Win Rate" skey="winRate" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => {
              const data = cardData(row.id)
              const cardName   = name(row.id)
              const desc       = data?.description ?? null
              const imgUrl     = data?.image_url   ? `${CODEX_BASE}${data.image_url}` : null
              const type       = data?.type        ? TYPE_LABELS[data.type.toLowerCase()] ?? null : null
              const rarity     = data?.rarity      ?? null
              const energyCost = data ? getCardCost(data) : null

              const keywords   = data?.keywords ?? []
              const starCost   = data?.star_cost ?? null

              const tooltipContent = (desc || imgUrl) ? (
                <CardTooltipContent
                  cardName={cardName}
                  imgUrl={imgUrl}
                  type={type}
                  rarity={rarity}
                  energyCost={energyCost}
                  starCost={starCost}
                  desc={desc}
                  frameColor={FRAME_COLOR}
                  keywords={keywords}
                />
              ) : null

              return (
              <tr key={row.id} className="border-b border-border-default hover:bg-bg-hover transition-colors">
                <td className="px-4 py-2.5 text-sm text-text-primary font-medium">
                  <div className="flex items-center gap-1.5">
                    <span>{cardName}</span>
                    {tooltipContent && (
                      <Tooltip content={tooltipContent} side="right" maxWidth={260}>
                        <span
                          className="cursor-pointer text-text-muted hover:text-text-primary transition-colors shrink-0 select-none"
                          style={{ fontSize: 11, lineHeight: 1 }}
                        >
                          ⓘ
                        </span>
                      </Tooltip>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-sm text-accent-green">{row.picked}</td>
                <td className="px-4 py-2.5 text-sm text-text-muted">{row.skipped}</td>
                <td className="px-4 py-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-bg-secondary rounded-full overflow-hidden w-16">
                      <div className="h-full bg-accent-blue rounded-full" style={{ width: `${row.pickRate}%` }} />
                    </div>
                    <span className="text-text-secondary w-8 text-right">{row.pickRate}%</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-sm text-accent-gold">{row.won > 0 || row.lost > 0 ? row.won : <span className="text-text-muted">—</span>}</td>
                <td className="px-4 py-2.5 text-sm text-accent-red">{row.won > 0 || row.lost > 0 ? row.lost : <span className="text-text-muted">—</span>}</td>
                <td className="px-4 py-2.5 text-sm">
                  {row.won + row.lost > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-bg-secondary rounded-full overflow-hidden w-16">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${row.winRate}%`,
                            backgroundColor: row.winRate >= 50 ? '#4caf7a' : '#c94040',
                          }}
                        />
                      </div>
                      <span className={cn('w-8 text-right', row.winRate >= 50 ? 'text-accent-green' : 'text-accent-red')}>
                        {row.winRate}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
