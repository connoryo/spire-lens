import type { RawRunEntry } from '@/types/ipc'
import type { ProcessedRun } from '@/types/run'

const CHARACTER_LABELS: Record<string, string> = {
  'CHARACTER.IRONCLAD': 'Ironclad',
  'CHARACTER.SILENT': 'Silent',
  'CHARACTER.DEFECT': 'Defect',
  'CHARACTER.REGENT': 'Regent',
  'CHARACTER.NECROBINDER': 'Necrobinder',
}

export function characterLabel(id: string): string {
  return CHARACTER_LABELS[id] ?? id.replace('CHARACTER.', '')
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m >= 60) {
    const h = Math.floor(m / 60)
    return `${h}h ${m % 60}m`
  }
  return `${m}m ${s}s`
}

export function formatId(id: string): string {
  return id
    .replace(/^(CARD|RELIC|ENCOUNTER|MONSTER|EVENT|POTION|ACT|CHARACTER)\./i, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\bFtl\b/g, 'FTL')
}

export function parseRun(entry: RawRunEntry): ProcessedRun {
  const { id, filePath, profileId, steamId, data } = entry
  const player = data.players.find(p => String(p.id) === steamId) ?? data.players[0]
  const mainPlayerId = player?.id

  // Count total floors = total map points across all acts
  const floorReached = data.map_point_history.reduce((sum, act) => sum + act.length, 0)

  // Aggregate stats for the local player only (not co-op partners)
  let totalDamageTaken = 0
  let peakHp = 0
  let goldEarned = 0
  let peakMaxHp = 0

  for (const act of data.map_point_history) {
    for (const point of act) {
      const myStats = mainPlayerId != null
        ? (point.player_stats.find(s => s.player_id === mainPlayerId) ?? point.player_stats[0])
        : point.player_stats[0]
      if (!myStats) continue
      totalDamageTaken += myStats.damage_taken
      goldEarned += myStats.gold_gained
      if (myStats.max_hp > peakMaxHp) peakMaxHp = myStats.max_hp
      if (myStats.current_hp > peakHp) peakHp = myStats.current_hp
    }
  }

  const killedBy =
    data.killed_by_encounter !== 'NONE.NONE'
      ? formatId(data.killed_by_encounter)
      : data.killed_by_event !== 'NONE.NONE'
      ? formatId(data.killed_by_event)
      : null

  return {
    id,
    filePath,
    profileId,
    steamId,
    raw: data,
    character: characterLabel(player?.character ?? ''),
    ascension: data.ascension,
    win: data.win,
    abandoned: data.was_abandoned,
    startTime: new Date(data.start_time * 1000),
    durationSeconds: data.run_time,
    floorReached,
    actCount: data.acts.length,
    killedBy,
    finalDeckSize: player?.deck?.length ?? 0,
    finalRelicCount: player?.relics?.length ?? 0,
    peakHp: peakMaxHp,
    totalDamageTaken,
    goldEarned,
    badges: player?.badges ?? [],
    isMultiplayer: data.players.length > 1,
    playerCount: data.players.length,
  }
}
