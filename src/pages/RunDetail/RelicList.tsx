import { useCodex } from '@/lib/codexStore'
import { stripBBCode } from '@/lib/codex'
import { Tooltip } from '@/components/Tooltip'

const CODEX_BASE = 'https://spire-codex.com'

interface RelicEntry {
  id: string
  floor_added_to_deck: number
}

const RARITY_COLORS: Record<string, string> = {
  common:   '#a09888',
  uncommon: '#4caf7a',
  rare:     '#c9a84c',
  boss:     '#c9a84c',
  shop:     '#5b9bd5',
}

// Fixed dark palette — matches DeckList card tooltips
const DARK = {
  bg:     '#16131f',
  bar:    'rgba(0,0,0,0.45)',
  text:   '#ede9df',
  muted:  '#8a7f72',
  subtle: 'rgba(255,255,255,0.07)',
}

function RelicTooltipContent({
  relicName, imgUrl, rarity, desc,
}: { relicName: string; imgUrl: string | null; rarity: string | null; desc: string | null }) {
  const rarityColor = rarity ? (RARITY_COLORS[rarity.toLowerCase()] ?? DARK.muted) : null
  const borderColor = rarityColor ?? '#4a4560'

  return (
    <div style={{
      width: 260,
      borderRadius: 8,
      overflow: 'hidden',
      border: `2px solid ${borderColor}`,
      background: DARK.bg,
      boxShadow: `0 0 12px ${borderColor}44`,
    }}>
      {/* Header: icon + name */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px',
        background: DARK.bar,
        borderBottom: `1px solid ${DARK.subtle}`,
      }}>
        {imgUrl && (
          <img
            src={imgUrl}
            alt={relicName}
            style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        )}
        <div>
          <p style={{ color: DARK.text, fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>
            {relicName}
          </p>
          {rarity && rarityColor && (
            <p style={{ color: rarityColor, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
              {rarity}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {desc && (
        <div style={{
          padding: '8px 10px',
          fontSize: 13,
          color: DARK.text,
          lineHeight: 1.5,
        }}>
          {desc}
        </div>
      )}
    </div>
  )
}

export function RelicList({ relics }: { relics: RelicEntry[] }) {
  const { name, relicData } = useCodex()

  return (
    <ul className="divide-y divide-border-default/50">
      {relics.map((relic, i) => {
        const data      = relicData(relic.id)
        const relicName = name(relic.id)
        const desc      = data?.description ? stripBBCode(data.description) : null
        const imgUrl    = data?.image_url   ? `${CODEX_BASE}${data.image_url}` : null
        const rarity    = data?.rarity      ?? null

        const tooltipContent = (desc || imgUrl) ? (
          <RelicTooltipContent
            relicName={relicName}
            imgUrl={imgUrl}
            rarity={rarity}
            desc={desc}
          />
        ) : null

        return (
          <li key={i}>
            <Tooltip
              content={tooltipContent}
              side="left"
              maxWidth={280}
              className="flex w-full items-center justify-between px-4 py-2 hover:bg-bg-hover cursor-pointer"
            >
              <span className="text-sm text-text-primary">{relicName}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-text-muted">Floor {relic.floor_added_to_deck}</span>
                {tooltipContent && (
                  <span style={{ fontSize: 11, color: 'rgb(var(--text-muted))', opacity: 0.5 }}>ⓘ</span>
                )}
              </div>
            </Tooltip>
          </li>
        )
      })}
    </ul>
  )
}
