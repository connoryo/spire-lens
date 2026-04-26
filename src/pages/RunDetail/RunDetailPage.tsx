import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, Trophy, Skull, Clock, Layers, Sword, Shield, Zap, Users } from 'lucide-react'
import { useData } from '@/lib/dataStore'
import { formatDuration, formatId } from '@/lib/parseRun'
import { characterColor, cn } from '@/lib/utils'
import { Badge } from '@/components/Badge'
import { Tooltip } from '@/components/Tooltip'
import { useCodex } from '@/lib/codexStore'
import { Card, CardHeader, CardBody } from '@/components/Card'
import { StatBlock } from '@/components/StatBlock'
import { HpChart } from './HpChart'
import { MapPath } from './MapPath'
import { DeckList } from './DeckList'
import { RelicList } from './RelicList'

export function RunDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { runs } = useData()
  const { badgeInfo } = useCodex()
  const navigate = useNavigate()

  const run = runs.find(r => r.id === id)
  const localPlayerIdx = run
    ? run.raw.players.findIndex(p => String(p.id) === run.steamId)
    : 0
  const [activePlayer, setActivePlayer] = useState(localPlayerIdx >= 0 ? localPlayerIdx : 0)

  if (!run) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted">
        Run not found.
      </div>
    )
  }

  const color = characterColor(run.character)
  const displayPlayer = run.raw.players[activePlayer] ?? run.raw.players[0]

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border-default shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-3"
        >
          <ArrowLeft size={14} /> Back to runs
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-10 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold" style={{ color }}>{run.character}</h2>
                {run.isMultiplayer && (
                  <Badge variant="blue" className="gap-1">
                    <Users size={11} /> Co-op ×{run.playerCount}
                  </Badge>
                )}
              </div>
              <p className="text-text-muted text-sm">
                {format(run.startTime, 'MMMM d, yyyy · HH:mm')} · Seed: {run.raw.seed}
                {run.ascension > 0 && ` · Ascension ${run.ascension}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {run.badges.map(b => {
              const info = badgeInfo(b.id, b.rarity)
              return (
                <Tooltip key={b.id} text={info.description}>
                  <Badge variant={b.rarity === 'gold' ? 'gold' : b.rarity === 'silver' ? 'blue' : 'muted'}>
                    {info.name}
                  </Badge>
                </Tooltip>
              )
            })}
            {run.win ? (
              <Badge variant="gold" className="gap-1 text-sm px-3 py-1">
                <Trophy size={12} /> Victory
              </Badge>
            ) : run.abandoned ? (
              <Badge variant="muted" className="gap-1 text-sm px-3 py-1">
                Abandoned
              </Badge>
            ) : (
              <Badge variant="red" className="gap-1 text-sm px-3 py-1">
                <Skull size={12} /> {run.killedBy ?? 'Defeated'}
              </Badge>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex gap-8 mt-4">
          <StatBlock label="Floors" value={run.floorReached} valueClassName="text-text-primary" />
          <StatBlock label="Duration" value={formatDuration(run.durationSeconds)} valueClassName="text-text-primary" />
          <StatBlock label="Deck Size" value={run.finalDeckSize} valueClassName="text-text-primary" />
          <StatBlock label="Relics" value={run.finalRelicCount} valueClassName="text-text-primary" />
          <StatBlock label="Damage Taken" value={run.totalDamageTaken} valueClassName="text-accent-red" />
          <StatBlock label="Gold Earned" value={run.goldEarned} valueClassName="text-accent-gold" />
          <StatBlock label="Peak HP" value={run.peakHp} valueClassName="text-accent-green" />
          <StatBlock
            label="Acts"
            value={run.raw.acts.map(a => formatId(a)).join(' → ')}
            valueClassName="text-sm text-text-secondary"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 pb-10 grid grid-cols-3 gap-4 min-h-0">
        {/* Left col: HP chart + Map path */}
        <div className="col-span-2 flex flex-col gap-4 pb-4">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                <Zap size={14} className="text-accent-gold" /> HP Over Time
              </h3>
            </CardHeader>
            <CardBody className="p-2">
              <HpChart run={run} playerId={displayPlayer?.id} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                <Layers size={14} className="text-accent-gold" /> Map Path
              </h3>
            </CardHeader>
            <CardBody className="p-0">
              <MapPath run={run} playerId={displayPlayer?.id} />
            </CardBody>
          </Card>
        </div>

        {/* Right col: player tabs (co-op), deck, relics */}
        <div className="flex flex-col gap-3 min-h-0 pb-4">
          {/* Co-op player tab switcher */}
          {run.isMultiplayer && (
            <div className="flex rounded-md border border-border-default overflow-hidden shrink-0">
              {run.raw.players.map((p, i) => {
                const charName = formatId(p.character ?? `Player ${i + 1}`)
                const isLocal = localPlayerIdx >= 0 && i === localPlayerIdx
                return (
                  <button
                    key={p.id}
                    onClick={() => setActivePlayer(i)}
                    className={cn(
                      'flex-1 px-2 py-1.5 text-xs font-medium transition-colors',
                      activePlayer === i
                        ? 'bg-accent-gold/10 text-accent-gold'
                        : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                    )}
                  >
                    {isLocal ? `${charName} (You)` : charName}
                  </button>
                )
              })}
            </div>
          )}

          {/* Deck — fills remaining height */}
          <Card className="flex-1 min-h-0 flex flex-col">
            <CardHeader>
              <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                <Sword size={14} className="text-accent-gold" />
                Final Deck ({displayPlayer?.deck?.length ?? 0})
              </h3>
            </CardHeader>
            <div className="flex-1 overflow-auto min-h-0">
              <DeckList deck={displayPlayer?.deck ?? []} characterColor={color} characterId={displayPlayer?.character} />
            </div>
          </Card>

          {/* Relics — fixed height, shrinks to content */}
          <Card className="shrink-0">
            <CardHeader>
              <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                <Shield size={14} className="text-accent-gold" />
                Relics ({displayPlayer?.relics?.length ?? 0})
              </h3>
            </CardHeader>
            <div className="overflow-auto max-h-44">
              <RelicList relics={displayPlayer?.relics ?? []} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
