/**
 * Shared card tooltip UI — used by both RunDetail/DeckList and CardStats.
 * Uses CSS custom properties so it naturally adapts to light and dark themes.
 */

export const CODEX_BASE = 'https://spire-codex.com'

export const TYPE_LABELS: Record<string, string> = {
  attack: 'Attack',
  skill:  'Skill',
  power:  'Power',
  curse:  'Curse',
  status: 'Status',
}

const RARITY_COLORS: Record<string, string> = {
  common:   '#a09888',
  uncommon: '#4caf7a',
  rare:     '#c9a84c',
  special:  '#5b9bd5',
}

// Theme-aware aliases — these resolve via the app's CSS custom properties
const T = {
  bg:      'rgb(var(--bg-card))',
  surface: 'rgb(var(--bg-secondary))',
  border:  'rgb(var(--border-default))',
  text:    'rgb(var(--text-primary))',
  muted:   'rgb(var(--text-muted))',
  subtle:  'rgba(128,128,128,0.12)',
}

// ── Description renderer ──────────────────────────────────────────────────────
//
// Card descriptions from the Codex API use two syntaxes:
//   • [gold]Text[/gold]  — BBCode colour/style tags (strip the tags, keep text)
//   • {Stars:starIcons()} — inline icon tokens; rendered as actual images
//   • {Block:diff()}     — dynamic value placeholders we can't resolve; dropped
//   • {InCombat:...|...} — conditional blocks; dropped
//
// Tokens can be nested (a conditional containing an energy token), so we resolve
// innermost {…} first and repeat until none remain.

const STAR_PH   = '\x00STAR\x00'
const ENERGY_PH = '\x00NRG\x00'   // each copy = one icon

// Map character ID fragments → energy icon filename
const CHAR_ENERGY: Array<[string, string]> = [
  ['IRONCLAD',    'ironclad_energy_icon.webp'],
  ['SILENT',      'silent_energy_icon.webp'],
  ['DEFECT',      'defect_energy_icon.webp'],
  ['WATCHER',     'watcher_energy_icon.webp'],
  ['NECROBINDER', 'necrobinder_energy_icon.webp'],
  ['REGENT',      'regent_energy_icon.webp'],
]

function energyIconUrl(characterId?: string | null): string {
  const id = (characterId ?? '').toUpperCase().replace(/^CHARACTER\./i, '')
  const match = CHAR_ENERGY.find(([key]) => id.includes(key))
  return `${CODEX_BASE}/static/images/icons/${match ? match[1] : 'colorless_energy_icon.webp'}`
}

function renderDescription(raw: string, charId?: string | null): React.ReactNode {
  // ── Phase 1: convert BBCode icon tags to placeholders ──────────────────────
  // [energy:N] and [star:N] are the two inline icon syntaxes used in descriptions.
  let text = raw
    .replace(/\[energy:(\d+)\]/gi, (_m, n) => ENERGY_PH.repeat(Math.max(1, parseInt(n) || 1)))
    .replace(/\[star:(\d+)\]/gi,   (_m, n) => STAR_PH.repeat(Math.max(1, parseInt(n) || 1)))

  // ── Phase 2: iteratively resolve {token:fn()} blocks (description_raw style)
  // Kept as a fallback for any card that only ships the raw form.
  let prev: string
  do {
    prev = text
    text = text.replace(/\{([^{}]*)\}/g, (_match, inner: string) => {
      if (inner.includes('|')) return ''       // conditional block — drop
      const colon = inner.indexOf(':')
      if (colon === -1) return ''
      const fn = inner.slice(colon + 1)
      if (fn.includes('starIcons')) return STAR_PH
      const nrgMatch = fn.match(/^energyIcons\((\d*)\)/)
      if (nrgMatch) return ENERGY_PH.repeat(Math.max(1, parseInt(nrgMatch[1] || '1') || 1))
      return ''   // diff(), rangeIcons(), etc. — drop unresolvable tokens
    })
  } while (text !== prev)

  // ── Phase 3: strip remaining BBCode tags (keep inner text) ─────────────────
  text = text.replace(/\[\/?\w+(?::[^\]]+)?\]/g, '')

  // ── Phase 3: split on placeholders and newlines, emit React nodes ──────────
  const eUrl = energyIconUrl(charId)
  const parts = text.split(/(\x00STAR\x00|\x00NRG\x00|\n)/)

  const iconStyle: React.CSSProperties = {
    width: 13, height: 13,
    display: 'inline-block',
    verticalAlign: 'middle',
    position: 'relative', top: '-0.05em',  // nudge up to sit on the visual text centre
    margin: '0 1px',
  }

  const nodes = parts.map((part, i) => {
    if (part === STAR_PH) return (
      <img key={i} src={`${CODEX_BASE}/static/images/icons/star_icon.webp`} style={iconStyle} alt="★" />
    )
    if (part === ENERGY_PH) return (
      <img key={i} src={eUrl} style={iconStyle} alt="⚡" />
    )
    if (part === '\n') return <br key={i} />
    return part || null
  })

  // If it's purely text with no special nodes, return the string for simplicity
  return <>{nodes}</>
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface CardTooltipProps {
  cardName: string
  imgUrl: string | null
  type: string | null
  rarity: string | null
  energyCost: number | string | null
  /** Secondary star-resource cost (Regent class) */
  starCost?: number | null
  /** Description string — BBCode and {tokens} are resolved here during render */
  desc: string | null
  frameColor: string
  /** Character ID (e.g. "IRONCLAD", "CHARACTER.SILENT") for energy icon selection */
  characterId?: string | null
  /** Keywords shown above the description (e.g. ["Ethereal", "Retain"]) */
  keywords?: string[]
  /** Enchantment name (e.g. "Soul's Power") — run-specific, omit for aggregate stats */
  enchantmentName?: string | null
  enchantmentDesc?: string | null
  /** Rider name for configurable cards (e.g. Mad Science) */
  riderName?: string | null
  riderDesc?: string | null
  /** Per-card tracked values (e.g. Genetic Algorithm's CurrentBlock) */
  cardProps?: Array<{ name: string; value: number }>
}

export function CardTooltipContent({
  cardName, imgUrl, type, rarity, energyCost, starCost = null, desc, frameColor,
  characterId = null,
  keywords = [],
  enchantmentName = null, enchantmentDesc = null,
  riderName = null, riderDesc = null,
  cardProps = [],
}: CardTooltipProps) {
  const rarityColor = rarity ? (RARITY_COLORS[rarity.toLowerCase()] ?? T.muted) : null

  return (
    <div style={{
      width: 240,
      borderRadius: 8,
      overflow: 'hidden',
      border: `2px solid ${frameColor}`,
      background: T.bg,
      boxShadow: `0 0 16px ${frameColor}44`,
    }}>

      {/* Name bar */}
      <div style={{
        background: T.surface,
        padding: '6px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        borderBottom: `1px solid ${T.subtle}`,
      }}>
        {energyCost != null && (
          <span style={{
            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
            background: T.surface,
            border: `1px solid ${frameColor}88`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: T.text,
          }}>
            {energyCost === -1 ? 'X' : energyCost}
          </span>
        )}
        {starCost != null && starCost > 0 && (
          <span style={{
            width: 18, height: 18, flexShrink: 0,
            transform: 'rotate(45deg)',
            background: 'linear-gradient(135deg, #1a3a6b, #0d1f3c)',
            border: '1px solid #60a5fa55',
            boxShadow: '0 0 6px #3b82f644',
            borderRadius: 2,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              transform: 'rotate(-45deg)',
              fontSize: 11, fontWeight: 700,
              color: '#93c5fd',
              lineHeight: 1,
            }}>
              {starCost}
            </span>
          </span>
        )}
        <span style={{
          color: T.text,
          fontWeight: 600, fontSize: 13,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {cardName}
        </span>
      </div>

      {/* Art — fixed height so the tooltip doesn't reflow when the image loads */}
      {imgUrl && (
        <div style={{ height: 160, background: T.surface, overflow: 'hidden', flexShrink: 0 }}>
          <img
            src={imgUrl}
            alt={cardName}
            style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover', objectPosition: 'top' }}
            onError={e => {
              const wrap = (e.currentTarget as HTMLImageElement).parentElement
              if (wrap) wrap.style.display = 'none'
            }}
          />
        </div>
      )}

      {/* Type / rarity strip */}
      {(type || rarity) && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '3px 8px',
          background: T.subtle,
          borderTop: `1px solid ${T.subtle}`,
          borderBottom: `1px solid ${T.subtle}`,
        }}>
          {type && (
            <span style={{ fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {type}
            </span>
          )}
          {rarity && rarityColor && (
            <span style={{ fontSize: 10, color: rarityColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {rarity}
            </span>
          )}
        </div>
      )}

      {/* Keywords */}
      {keywords.length > 0 && (
        <div style={{
          padding: '5px 8px',
          display: 'flex', flexWrap: 'wrap', gap: 4,
          borderBottom: `1px solid ${T.subtle}`,
        }}>
          {keywords.map(kw => (
            <span key={kw} style={{
              fontSize: 10, fontWeight: 600,
              padding: '1px 6px', borderRadius: 10,
              background: 'rgba(96,165,250,0.15)',
              border: '1px solid rgba(96,165,250,0.35)',
              color: '#93c5fd',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      {desc && (
        <div style={{ padding: '8px 10px', fontSize: 13, color: T.text, lineHeight: 1.6 }}>
          {renderDescription(desc, characterId)}
        </div>
      )}

      {/* Enchantment (run-specific) */}
      {enchantmentName && (
        <div style={{
          padding: '5px 10px',
          background: 'rgba(139,92,246,0.15)',
          borderTop: '1px solid rgba(139,92,246,0.3)',
          display: 'flex', alignItems: 'flex-start', gap: 5,
        }}>
          <span style={{ fontSize: 10, color: '#a78bfa', marginTop: 1 }}>✦</span>
          <div>
            <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600 }}>{enchantmentName}</div>
            {enchantmentDesc && (
              <div style={{ fontSize: 11, color: '#c4b5fd', marginTop: 2, lineHeight: 1.4 }}>{enchantmentDesc}</div>
            )}
          </div>
        </div>
      )}

      {/* Rider (configurable cards like Mad Science) */}
      {riderName && (
        <div style={{
          padding: '5px 10px',
          background: 'rgba(201,168,76,0.12)',
          borderTop: '1px solid rgba(201,168,76,0.3)',
          display: 'flex', alignItems: 'flex-start', gap: 5,
        }}>
          <span style={{ fontSize: 10, color: '#c9a84c', marginTop: 1 }}>★</span>
          <div>
            <div style={{ fontSize: 11, color: '#c9a84c', fontWeight: 600 }}>{riderName}</div>
            {riderDesc && (
              <div style={{ fontSize: 11, color: '#e0c97a', marginTop: 2, lineHeight: 1.4 }}>{riderDesc}</div>
            )}
          </div>
        </div>
      )}

      {/* Card-specific runtime props (e.g. Genetic Algorithm's CurrentBlock) */}
      {cardProps.length > 0 && (
        <div style={{
          padding: '5px 10px',
          background: T.subtle,
          borderTop: `1px solid ${T.subtle}`,
          display: 'flex', flexWrap: 'wrap', gap: '3px 12px',
        }}>
          {cardProps.map(p => (
            <span key={p.name} style={{ fontSize: 11, color: T.muted }}>
              <span style={{ color: T.text }}>
                {p.name.replace(/([A-Z])/g, ' $1').trim()}:
              </span>{' '}
              {p.value}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
