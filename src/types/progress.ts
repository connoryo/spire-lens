export interface CharacterStat {
  character: string
  wins: number
  losses: number
}

export interface AncientStat {
  ancient_id: string
  character_stats: CharacterStat[]
}

export interface CardStat {
  id: string
  times_picked: number
  times_skipped: number
  times_won: number
  times_lost: number
}

export interface ProgressFile {
  ancient_stats: AncientStat[]
  architect_damage: number
  card_stats: CardStat[]
}
