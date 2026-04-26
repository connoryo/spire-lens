import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  fetchCodexData,
  normalizeId,
  stripBBCode,
  type CodexData,
  type CodexBadgeTier,
  type CodexCard,
  type CodexRelic,
  type CodexEnchantment,
} from './codex'
import { formatId as formatIdFallback } from './parseRun'

// ── Context ───────────────────────────────────────────────────────────────────

/** Connection state of the Spire Codex API. */
export type CodexStatus =
  | 'loading'      // fetch in progress
  | 'connected'    // all endpoints OK (or loaded from cache)
  | 'partial'      // some endpoints failed but cards/enchantments work
  | 'offline'      // cards endpoint failed — no tooltip data available

interface CodexCtx {
  data: CodexData | null
  ready: boolean
  /** Overall API connection status. */
  codexStatus: CodexStatus
  /** Which endpoint paths failed (empty when connected or offline-from-cache). */
  failedEndpoints: string[]
  /** Proper display name for any entity ID (card, relic, monster, event, encounter).
   *  Falls back to formatId() heuristic if the codex doesn't have it. */
  name: (id: string) => string
  /** Full card data for a given run-file card ID, or null if not in codex. */
  cardData: (id: string) => CodexCard | null
  /** Full relic data for a given run-file relic ID, or null if not in codex. */
  relicData: (id: string) => CodexRelic | null
  /** Full enchantment data for a given run-file enchantment ID (e.g. "ENCHANTMENT.SOULS_POWER"), or null. */
  enchantmentData: (id: string) => CodexEnchantment | null
  /**
   * Resolves an event choice title key (e.g. "DROWNING_BEACON.pages.INITIAL.options.BOTTLE.title")
   * to its human-readable option title using the events API data.
   * Returns null if the key can't be resolved (caller should fall back to key parsing).
   */
  resolveEventKey: (key: string) => string | null
  /** Badge info for a given badge ID + rarity tier. */
  badgeInfo: (id: string, rarity: 'bronze' | 'silver' | 'gold') => { name: string; description: string }
}

const Ctx = createContext<CodexCtx>({
  data: null,
  ready: false,
  codexStatus: 'loading',
  failedEndpoints: [],
  name: formatIdFallback,
  cardData: () => null,
  relicData: () => null,
  enchantmentData: () => null,
  resolveEventKey: () => null,
  badgeInfo: (id) => ({ name: formatIdFallback(id), description: '' }),
})

// ── Provider ──────────────────────────────────────────────────────────────────

export function CodexProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<CodexData | null>(null)
  const [ready, setReady] = useState(false)
  const [codexStatus, setCodexStatus] = useState<CodexStatus>('loading')
  const [failedEndpoints, setFailedEndpoints] = useState<string[]>([])

  useEffect(() => {
    fetchCodexData()
      .then(({ data: d, failedEndpoints: failed, fromCache }) => {
        setData(d)
        setReady(true)
        setFailedEndpoints(failed)
        const hasCards = Object.keys(d.cards).length > 0
        if (!hasCards) {
          setCodexStatus('offline')
        } else if (fromCache || failed.length === 0) {
          setCodexStatus('connected')
        } else {
          setCodexStatus('partial')
        }
      })
      .catch(err => {
        console.warn('Spire Codex API unavailable, falling back to local data.', err)
        setReady(true)
        setCodexStatus('offline')
      })
  }, [])

  function cardData(id: string): CodexCard | null {
    return data?.cards[normalizeId(id)] ?? null
  }

  function relicData(id: string): CodexRelic | null {
    return data?.relics[normalizeId(id)] ?? null
  }

  function enchantmentData(id: string): CodexEnchantment | null {
    // Run files use "ENCHANTMENT.SOULS_POWER"; strip prefix then look up
    const key = id.replace(/^ENCHANTMENT\./i, '').toUpperCase()
    return data?.enchantments?.[key] ?? null
  }

  function name(id: string): string {
    if (!data) return formatIdFallback(id)
    const key = normalizeId(id)
    const entity =
      data.cards[key] ??
      data.relics[key] ??
      data.monsters[key] ??
      data.encounters[key] ??
      data.events[key] ??
      data.characters[key]
    return entity ? entity.name : formatIdFallback(id)
  }

  function resolveEventKey(key: string): string | null {
    if (!data) return null
    // Key format: "EVENT_ID.pages.PAGE_ID.options.OPTION_ID.title"
    const parts = key.split('.')
    if (parts.length < 6 || parts[1] !== 'pages' || parts[3] !== 'options') return null
    const [eventId, , pageId, , optionId] = parts
    const event = data.events[eventId.toUpperCase()]
    const page = event?.pages?.find(p => p.id === pageId)
    const option = page?.options?.find(o => o.id === optionId)
    return option?.title ?? null
  }

  function badgeInfo(
    id: string,
    rarity: 'bronze' | 'silver' | 'gold',
  ): { name: string; description: string } {
    if (data) {
      const badge = data.badges[id.toUpperCase()]
      if (badge) {
        const tier: CodexBadgeTier | undefined =
          badge.tiers.find(t => t.rarity === rarity) ?? badge.tiers[0]
        if (tier) {
          return {
            name: tier.title,
            description: stripBBCode(tier.description),
          }
        }
      }
    }
    // Static fallback (badgeData.ts)
    return getBadgeInfoStatic(id, rarity)
  }

  return (
    <Ctx.Provider value={{ data, ready, codexStatus, failedEndpoints, name, cardData, relicData, enchantmentData, resolveEventKey, badgeInfo }}>
      {children}
    </Ctx.Provider>
  )
}

export function useCodex() {
  return useContext(Ctx)
}

// ── Static fallback (keeps working if API is down) ────────────────────────────

import { getBadgeInfo as getBadgeInfoStatic } from './badgeData'
