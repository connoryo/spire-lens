// Spire Codex API — https://spire-codex.com/docs
// Fetched once at startup, cached in localStorage for 24 hours.

const BASE = 'https://spire-codex.com/api'
const CACHE_KEY = 'sts2viewer-codex-v4'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

// ── Types (based on observed API shape) ──────────────────────────────────────

export interface CodexBadgeTier {
  rarity: string
  title: string
  description: string
}

export interface CodexBadge {
  id: string
  name: string
  description: string
  tiered: boolean
  tiers: CodexBadgeTier[]
}

export interface CodexCardRider {
  id: string
  name: string
  description?: string
}

export interface CodexCardVariant {
  type: string
  description?: string
  /** Raw description with unresolved {token:fn()} placeholders — preferred for rendering */
  description_raw?: string
  damage?: number | null
  block?: number | null
  image_url?: string
  riders?: CodexCardRider[]
}

export interface CodexCard {
  id: string
  name: string
  description?: string
  /** Raw description with unresolved {token:fn()} placeholders */
  description_raw?: string
  /** Description shown when the card is upgraded (null = same as base) */
  upgrade_description?: string | null
  type?: string              // 'attack' | 'skill' | 'power' | 'curse' | 'status'
  rarity?: string            // 'common' | 'uncommon' | 'rare' | 'special'
  cost?: number | string
  /** True when the energy cost is X (variable) */
  is_x_cost?: boolean | null
  /** Secondary star resource cost (Regent class) */
  star_cost?: number | null
  /** True when the star cost is X (variable) */
  is_x_star_cost?: boolean | null
  image_url?: string
  /** Keywords displayed on the card (e.g. ["Ethereal", "Retain"]) */
  keywords?: string[]
  /**
   * Upgrade delta. Known keys:
   *   cost: <number>           — new energy cost after upgrade
   *   star_cost: <number>      — new star cost after upgrade
   *   remove_<keyword>: 1     — keyword removed by upgrade (e.g. remove_ethereal)
   */
  upgrade?: Record<string, number | null>
  // Cards with configurable variants (e.g. Mad Science / Tinker Time)
  type_variants?: Record<string, CodexCardVariant>
}

/** Returns the energy cost from a CodexCard, returning -1 for X-cost cards. */
export function getCardCost(card: CodexCard): number | string | null {
  if (card.is_x_cost) return -1
  const val = card.cost ?? null
  return val === null ? null : val
}

export interface CodexRelic {
  id: string
  name: string
  description?: string
  rarity?: string      // 'common' | 'uncommon' | 'rare' | 'boss' | 'shop'
  image_url?: string
}

export interface CodexEnchantment {
  id: string
  name: string
  description?: string
  image_url?: string
}

export interface CodexMonster {
  id: string
  name: string
}

export interface CodexEncounter {
  id: string
  name: string
}

export interface CodexEventOption {
  id: string
  title: string
  description?: string | null
}

export interface CodexEventPage {
  id: string
  description?: string | null
  options: CodexEventOption[] | null
}

export interface CodexEvent {
  id: string
  name: string
  description?: string | null
  options?: CodexEventOption[] | null
  pages?: CodexEventPage[] | null
}

export interface CodexCharacter {
  id: string
  name: string
}

export interface CodexData {
  badges:       Record<string, CodexBadge>
  cards:        Record<string, CodexCard>
  relics:       Record<string, CodexRelic>
  enchantments: Record<string, CodexEnchantment>
  monsters:     Record<string, CodexMonster>
  encounters:   Record<string, CodexEncounter>
  events:       Record<string, CodexEvent>
  characters:   Record<string, CodexCharacter>
  fetchedAt:    number
}

// ── BBCode / rich-text stripping ─────────────────────────────────────────────

export function stripBBCode(text: string): string {
  return text
    .replace(/\[\/?\w+(?::\w+)?\]/g, '') // [blue], [/blue], [energy:1], etc.
    .trim()
}

// ── ID normalisation ─────────────────────────────────────────────────────────
// Run files use "CARD.STRIKE", "RELIC.BURNING_BLOOD", etc.
// The API uses bare uppercase IDs: "STRIKE", "BURNING_BLOOD".

export function normalizeId(id: string): string {
  return id
    .replace(/^(CARD|RELIC|ENCOUNTER|MONSTER|EVENT|POTION|ACT|CHARACTER)\./i, '')
    .toUpperCase()
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

/**
 * Fetches a URL, routing through the Electron main process when available
 * to avoid CORS restrictions in the renderer. Falls back to a direct fetch
 * (works in plain-browser dev if a proxy is configured).
 */
async function fetchJson(url: string): Promise<unknown> {
  if (typeof window !== 'undefined' && window.electronAPI?.codexFetch) {
    return window.electronAPI.codexFetch(url)
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`)
  return res.json()
}

async function fetchCollection<T extends { id: string }>(path: string): Promise<Record<string, T>> {
  const items = await fetchJson(`${BASE}${path}`) as T[]
  const map: Record<string, T> = {}
  for (const item of items) {
    map[item.id.toUpperCase()] = item
  }
  return map
}

// ── Cache ─────────────────────────────────────────────────────────────────────

function saveCache(data: CodexData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    // localStorage full — skip caching
  }
}

function loadCache(): CodexData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as CodexData
    if (Date.now() - data.fetchedAt > CACHE_TTL) return null
    return data
  } catch {
    return null
  }
}

// ── Main fetch ────────────────────────────────────────────────────────────────

export interface CodexFetchResult {
  data: CodexData
  /** Endpoint paths that failed (e.g. ['/badges', '/relics']).  Empty = fully connected. */
  failedEndpoints: string[]
  /** True when the result came from the local cache (no network request was made). */
  fromCache: boolean
}

/** Resolves a settled promise result to its value, or an empty object on failure. */
function settled<T>(result: PromiseSettledResult<Record<string, T>>): Record<string, T> {
  if (result.status === 'fulfilled') return result.value
  return {}
}

const ENDPOINT_PATHS = [
  '/badges',
  '/cards',
  '/relics',
  '/enchantments?lang=eng',
  '/monsters',
  '/encounters',
  '/events?lang=eng',
  '/characters',
] as const

export async function fetchCodexData(): Promise<CodexFetchResult> {
  const cached = loadCache()
  if (cached) return { data: cached, failedEndpoints: [], fromCache: true }

  // Use allSettled so a single flaky endpoint (e.g. 502 on /badges) doesn't
  // wipe out the rest — cards and enchantments keep working even if others fail.
  const results = await Promise.allSettled([
    fetchCollection<CodexBadge>('/badges'),
    fetchCollection<CodexCard>('/cards'),
    fetchCollection<CodexRelic>('/relics'),
    fetchCollection<CodexEnchantment>('/enchantments?lang=eng'),
    fetchCollection<CodexMonster>('/monsters'),
    fetchCollection<CodexEncounter>('/encounters'),
    fetchCollection<CodexEvent>('/events?lang=eng'),
    fetchCollection<CodexCharacter>('/characters'),
  ])

  const [badgesR, cardsR, relicsR, enchantmentsR, monstersR, encountersR, eventsR, charactersR] = results

  const failedEndpoints = results
    .map((r, i) => r.status === 'rejected' ? ENDPOINT_PATHS[i] : null)
    .filter((p): p is string => p !== null)

  if (failedEndpoints.length > 0) {
    console.warn('Codex: some endpoints failed:', failedEndpoints.join(', '))
  }

  const data: CodexData = {
    badges:       settled(badgesR)       as Record<string, CodexBadge>,
    cards:        settled(cardsR)        as Record<string, CodexCard>,
    relics:       settled(relicsR)       as Record<string, CodexRelic>,
    enchantments: settled(enchantmentsR) as Record<string, CodexEnchantment>,
    monsters:     settled(monstersR)     as Record<string, CodexMonster>,
    encounters:   settled(encountersR)   as Record<string, CodexEncounter>,
    events:       settled(eventsR)       as Record<string, CodexEvent>,
    characters:   settled(charactersR)   as Record<string, CodexCharacter>,
    fetchedAt: Date.now(),
  }

  // Only cache if the most important endpoints (cards) succeeded.
  if (cardsR.status === 'fulfilled') saveCache(data)
  return { data, failedEndpoints, fromCache: false }
}

export function clearCodexCache() {
  localStorage.removeItem(CACHE_KEY)
}
