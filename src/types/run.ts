// Raw data types matching the .run JSON schema

export interface CardPropInt {
  name: string
  value: number
}

export interface CardProps {
  ints: CardPropInt[]
}

export interface CardEnchantment {
  id: string      // e.g. "ENCHANTMENT.SOULS_POWER"
  amount: number
}

export interface CardRef {
  id: string
  floor_added_to_deck?: number
  current_upgrade_level?: number
  enchantment?: CardEnchantment
  props?: CardProps
}

export interface CardChoice {
  card: CardRef
  was_picked: boolean
}

export interface RelicChoice {
  choice: string
  was_picked: boolean | undefined
}

export interface PotionChoice {
  choice: string
  was_picked: boolean
}

export interface AncientChoice {
  TextKey: string
  title: { key: string; table: string }
  was_chosen: boolean
}

export interface EventChoice {
  title: { key: string; table: string }
  variables?: Record<string, { type: string; decimal_value: number; bool_value: boolean; string_value: string | null }>
}

export interface CardTransformation {
  original_card: CardRef
  final_card: CardRef
}

export interface PlayerStats {
  player_id: number
  current_hp: number
  max_hp: number
  current_gold: number
  damage_taken: number
  hp_healed: number
  gold_gained: number
  gold_lost: number
  gold_spent: number
  gold_stolen: number
  max_hp_gained: number
  max_hp_lost: number
  // Card events
  card_choices?: CardChoice[]
  cards_gained?: CardRef[]
  cards_removed?: CardRef[]
  cards_transformed?: CardTransformation[]
  cards_enchanted?: Array<{ card: CardRef; enchantment: string }>
  upgraded_cards?: string[]
  // Relic events
  relic_choices?: RelicChoice[]
  relics_removed?: string[]
  bought_relics?: string[]
  // Potion events
  potion_choices?: PotionChoice[]
  potion_used?: string[]
  potion_discarded?: string[]
  // Event/rest
  event_choices?: EventChoice[]
  ancient_choice?: AncientChoice[]
  rest_site_choices?: string[]
}

export interface RoomInfo {
  room_type: 'monster' | 'elite' | 'boss' | 'rest_site' | 'shop' | 'event' | 'treasure'
  model_id?: string
  monster_ids?: string[]
  turns_taken: number
}

export type MapPointType = 'monster' | 'elite' | 'boss' | 'rest_site' | 'shop' | 'unknown' | 'treasure' | 'ancient'

export interface MapPoint {
  map_point_type: MapPointType
  player_stats: PlayerStats[]
  rooms: RoomInfo[]
}

export interface Badge {
  id: string
  rarity: 'bronze' | 'silver' | 'gold'
}

export interface PlayerFinalState {
  id: number
  character: string
  deck: CardRef[]
  relics: Array<{ id: string; floor_added_to_deck: number; props?: CardProps }>
  potions: Array<{ id: string }>
  max_potion_slot_count: number
  badges: Badge[]
}

export interface RunFile {
  acts: string[]
  ascension: number
  build_id: string
  game_mode: string
  killed_by_encounter: string
  killed_by_event: string
  map_point_history: MapPoint[][]
  modifiers: string[]
  platform_type: string
  players: PlayerFinalState[]
  run_time: number
  schema_version: number
  seed: string
  start_time: number
  was_abandoned: boolean
  win: boolean
}

// Processed/enriched types used by the UI

export interface ProcessedRun {
  id: string               // filename stem (= start_time)
  filePath: string
  profileId: string
  steamId: string
  raw: RunFile
  // Derived fields for easy display
  character: string
  ascension: number
  win: boolean
  abandoned: boolean
  startTime: Date
  durationSeconds: number
  floorReached: number
  actCount: number
  killedBy: string | null
  finalDeckSize: number
  finalRelicCount: number
  peakHp: number
  totalDamageTaken: number
  goldEarned: number
  badges: Badge[]
  isMultiplayer: boolean
  playerCount: number
}
