import { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatId } from '@/lib/parseRun'
import { useCodex } from '@/lib/codexStore'
import type { ProcessedRun } from '@/types/run'
import type { MapPoint } from '@/types/run'

const TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  monster:   { bg: 'bg-accent-red/10 border-accent-red/30',    text: 'text-accent-red',    label: '⚔' },
  elite:     { bg: 'bg-accent-purple/10 border-accent-purple/30', text: 'text-accent-purple', label: '★' },
  boss:      { bg: 'bg-accent-gold/15 border-accent-gold/50',   text: 'text-accent-gold',   label: '👑' },
  rest_site: { bg: 'bg-accent-green/10 border-accent-green/30', text: 'text-accent-green',  label: '🔥' },
  shop:      { bg: 'bg-accent-blue/10 border-accent-blue/30',   text: 'text-accent-blue',   label: '$' },
  unknown:   { bg: 'bg-bg-card border-border-default',          text: 'text-text-secondary', label: '?' },
  treasure:  { bg: 'bg-accent-gold/10 border-accent-gold/30',   text: 'text-accent-gold',   label: '◆' },
  ancient:   { bg: 'bg-accent-purple/15 border-accent-purple/50', text: 'text-accent-purple', label: 'Ω' },
}

export function MapPath({ run, playerId }: { run: ProcessedRun; playerId?: number }) {
  const [selected, setSelected] = useState<{ act: number; idx: number } | null>(null)
  const { name } = useCodex()

  const selectedPoint =
    selected != null
      ? run.raw.map_point_history[selected.act]?.[selected.idx]
      : null

  return (
    <div className="flex gap-0">
      {/* Act columns */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-0 min-w-0">
          {run.raw.map_point_history.map((act, actIdx) => (
            <div key={actIdx} className="flex-1 min-w-0 border-r border-border-default last:border-r-0">
              <div className="px-3 py-1.5 text-xs text-text-muted border-b border-border-default bg-bg-secondary">
                {formatId(run.raw.acts[actIdx] ?? `Act ${actIdx + 1}`)}
              </div>
              <div className="flex flex-col gap-0">
                {act.map((point, idx) => {
                  const style = TYPE_STYLES[point.map_point_type] ?? TYPE_STYLES.unknown
                  const stats = playerId != null
                    ? (point.player_stats.find(s => s.player_id === playerId) ?? point.player_stats[0])
                    : point.player_stats[0]
                  const room = point.rooms[0]
                  const isSelected = selected?.act === actIdx && selected?.idx === idx

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelected(isSelected ? null : { act: actIdx, idx })}
                      className={cn(
                        'w-full text-left px-3 py-2 border-b border-border-default/50 transition-colors',
                        'hover:bg-bg-hover text-xs',
                        isSelected && 'bg-bg-hover border-l-2 border-l-accent-gold'
                      )}
                    >
                      <div className={cn('flex items-center gap-1.5 font-medium', style.text)}>
                        <span className="text-base leading-none">{style.label}</span>
                        <span className="truncate">
                          {room?.model_id
                            ? name(room.model_id)
                            : formatId(point.map_point_type)}
                        </span>
                      </div>
                      {stats && (
                        <div className="flex gap-2 mt-0.5 text-text-muted">
                          <span>❤ {stats.current_hp}/{stats.max_hp}</span>
                          {stats.damage_taken > 0 && (
                            <span className="text-accent-red">-{stats.damage_taken}</span>
                          )}
                          {stats.hp_healed > 0 && (
                            <span className="text-accent-green">+{stats.hp_healed}</span>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selectedPoint && (
        <div className="w-72 shrink-0 border-l border-border-default overflow-y-auto">
          <NodeDetail point={selectedPoint} playerId={playerId} />
        </div>
      )}
    </div>
  )
}

/**
 * Fallback: extract the option name segment from a key like
 * "DROWNING_BEACON.pages.INITIAL.options.BOTTLE.title" → "Bottle"
 */
function parseChoiceTitle(key: string): string {
  const parts = key.split('.')
  const segment = parts[parts.length - 1] === 'title' && parts.length >= 2
    ? parts[parts.length - 2]
    : parts[parts.length - 1]
  return formatId(segment ?? key)
}

function NodeDetail({ point, playerId }: { point: MapPoint; playerId?: number }) {
  const { name, resolveEventKey } = useCodex()
  const stats = playerId != null
    ? (point.player_stats.find(s => s.player_id === playerId) ?? point.player_stats[0])
    : point.player_stats[0]
  const room = point.rooms[0]

  return (
    <div className="p-3 text-xs space-y-3">
      <div>
        <p className="text-text-muted uppercase tracking-wide mb-1">
          {room ? formatId(room.room_type) : formatId(point.map_point_type)}
        </p>
        {room?.model_id && (
          <p className="text-text-primary font-medium">{name(room.model_id)}</p>
        )}
        {room?.monster_ids && room.monster_ids.length > 0 && (
          <p className="text-text-secondary">{room.monster_ids.map(id => name(id)).join(', ')}</p>
        )}
        {room?.turns_taken > 0 && (
          <p className="text-text-muted">{room.turns_taken} turns</p>
        )}
      </div>

      {stats && (
        <>
          {/* HP / Gold */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-text-muted mb-0.5">HP</p>
              <p className="text-text-primary">{stats.current_hp} / {stats.max_hp}</p>
              {stats.damage_taken > 0 && <p className="text-accent-red">-{stats.damage_taken} taken</p>}
              {stats.hp_healed > 0 && <p className="text-accent-green">+{stats.hp_healed} healed</p>}
            </div>
            <div>
              <p className="text-text-muted mb-0.5">Gold</p>
              <p className="text-text-primary">{stats.current_gold}</p>
              {stats.gold_gained > 0 && <p className="text-accent-gold">+{stats.gold_gained}</p>}
              {stats.gold_spent > 0 && <p className="text-accent-red">-{stats.gold_spent} spent</p>}
            </div>
          </div>

          {/* Card choices */}
          {stats.card_choices && stats.card_choices.length > 0 && (
            <div>
              <p className="text-text-muted mb-1">Card Choices</p>
              {stats.card_choices.map((c, i) => (
                <div key={i} className={cn('flex items-center gap-1.5 py-0.5', c.was_picked ? 'text-accent-gold' : 'text-text-muted')}>
                  <span>{c.was_picked ? '✓' : '✗'}</span>
                  <span>{formatId(c.card.id)}</span>
                  {c.card.current_upgrade_level ? <span className="text-accent-blue">+{c.card.current_upgrade_level}</span> : null}
                </div>
              ))}
            </div>
          )}

          {/* Relics */}
          {stats.relic_choices && stats.relic_choices.filter(r => r.was_picked).length > 0 && (
            <div>
              <p className="text-text-muted mb-1">Relic Gained</p>
              {stats.relic_choices.filter(r => r.was_picked).map((r, i) => (
                <p key={i} className="text-accent-gold">{formatId(r.choice)}</p>
              ))}
            </div>
          )}

          {/* Rest site */}
          {stats.rest_site_choices && stats.rest_site_choices.length > 0 && (
            <div>
              <p className="text-text-muted mb-1">Rest Choice</p>
              <p className="text-text-primary">{stats.rest_site_choices.join(', ')}</p>
              {stats.upgraded_cards?.map((c, i) => (
                <p key={i} className="text-accent-blue">↑ {formatId(c)}</p>
              ))}
            </div>
          )}

          {/* Event */}
          {stats.event_choices && stats.event_choices.length > 0 && (
            <div>
              <p className="text-text-muted mb-1">Event Choice</p>
              {stats.event_choices.map((e, i) => (
                <p key={i} className="text-text-primary">
                  {resolveEventKey(e.title.key) ?? parseChoiceTitle(e.title.key)}
                </p>
              ))}
            </div>
          )}

          {/* Potions used */}
          {stats.potion_used && stats.potion_used.length > 0 && (
            <div>
              <p className="text-text-muted mb-1">Potions Used</p>
              {stats.potion_used.map((p, i) => (
                <p key={i} className="text-accent-purple">{formatId(p)}</p>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
