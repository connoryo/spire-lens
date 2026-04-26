import { useCodex } from '@/lib/codexStore'
import { stripBBCode, getCardCost } from '@/lib/codex'
import { Tooltip } from '@/components/Tooltip'
import { CardTooltipContent, CODEX_BASE, TYPE_LABELS } from '@/components/CardTooltipContent'
import { formatId } from '@/lib/parseRun'
import type { CardRef } from '@/types/run'

export function DeckList({
  deck,
  characterColor,
  characterId,
}: {
  deck: CardRef[]
  characterColor?: string
  characterId?: string | null
}) {
  const { name, cardData, enchantmentData } = useCodex()
  const sorted = [...deck].sort((a, b) => name(a.id).localeCompare(name(b.id)))
  const frameColor = characterColor ?? 'rgb(var(--accent-gold))'

  return (
    <ul className="divide-y divide-border-default/50">
      {sorted.map((card, i) => {
        const data = cardData(card.id)
        const cardName  = name(card.id)
        const isUpgraded = (card.current_upgrade_level ?? 0) > 0
        const desc      = isUpgraded && data?.upgrade_description
          ? data.upgrade_description
          : (data?.description ?? null)
        const imgUrl    = data?.image_url   ? `${CODEX_BASE}${data.image_url}` : null
        const type      = data?.type        ? TYPE_LABELS[data.type.toLowerCase()] ?? null : null
        const rarity    = data?.rarity      ?? null
        const upgradeData = data?.upgrade ?? {}

        // Energy cost: use upgrade.cost override when upgraded, otherwise base cost
        const baseCost = data ? getCardCost(data) : null
        const energyCost = isUpgraded && 'cost' in upgradeData
          ? upgradeData.cost   // may be 0, so don't falsy-check
          : baseCost

        // Star cost: similarly apply upgrade.star_cost when present
        const baseStarCost = data?.star_cost ?? null
        const starCost = isUpgraded && 'star_cost' in upgradeData
          ? upgradeData.star_cost
          : baseStarCost

        // Keywords: start from base list, then remove any the upgrade drops
        const baseKeywords: string[] = data?.keywords ?? []
        const keywords = isUpgraded
          ? baseKeywords.filter(kw => !upgradeData[`remove_${kw.toLowerCase()}`])
          : baseKeywords

        const enchantment     = card.enchantment ? enchantmentData(card.enchantment.id) : null
        // Fall back to formatId if the enchantment isn't in the API yet
        const enchantmentName = enchantment?.name
          ?? (card.enchantment
            ? formatId(card.enchantment.id.replace(/^ENCHANTMENT\./i, ''))
            : null)
        const enchantmentDesc = enchantment?.description ? stripBBCode(enchantment.description) : null
        const rawProps        = card.props?.ints ?? []

        // Resolve configurable-card variants (e.g. Mad Science / Tinker Time).
        // type_variants keys arrive in the order the API returns them (attack → skill → power).
        let resolvedDesc    = desc
        let resolvedType    = type
        let resolvedImgUrl  = imgUrl
        let riderName: string | null = null
        let riderDesc: string | null = null

        const typeVariants = data?.type_variants
        if (typeVariants) {
          const tinkerType  = rawProps.find(p => p.name === 'TinkerTimeType')?.value
          const tinkerRider = rawProps.find(p => p.name === 'TinkerTimeRider')?.value
          if (tinkerType != null && tinkerRider != null) {
            const variantKeys = Object.keys(typeVariants)
            const variant     = typeVariants[variantKeys[tinkerType - 1]]
            if (variant) {
              resolvedDesc   = variant.description ?? null
              resolvedType   = variant.type ? (TYPE_LABELS[variant.type.toLowerCase()] ?? variant.type) : type
              resolvedImgUrl = variant.image_url ? `${CODEX_BASE}${variant.image_url}` : imgUrl
              // Rider index within this type: subtract rider counts of preceding types
              let riderOffset = 0
              for (let i = 0; i < tinkerType - 1; i++) {
                riderOffset += typeVariants[variantKeys[i]]?.riders?.length ?? 0
              }
              const rider = variant.riders?.[tinkerRider - 1 - riderOffset]
              if (rider) {
                riderName = rider.name
                riderDesc = rider.description ? stripBBCode(rider.description) : null
              }
            }
          }
        }

        // Hide opaque enum indices used internally by configurable cards (Mad Science / Tinker Time).
        // All other props (e.g. Genetic Algorithm's CurrentBlock / IncreasedBlock) are shown.
        const OPAQUE_PROPS = new Set(['TinkerTimeType', 'TinkerTimeRider'])
        const cardProps = rawProps.filter(p => !OPAQUE_PROPS.has(p.name))

        const tooltipContent = (resolvedDesc || resolvedImgUrl || riderName || enchantmentName) ? (
          <CardTooltipContent
            cardName={cardName}
            imgUrl={resolvedImgUrl}
            type={resolvedType}
            rarity={rarity}
            energyCost={energyCost}
            starCost={starCost}
            desc={resolvedDesc}
            frameColor={frameColor}
            characterId={characterId}
            keywords={keywords}
            enchantmentName={enchantmentName}
            enchantmentDesc={enchantmentDesc}
            riderName={riderName}
            riderDesc={riderDesc}
            cardProps={cardProps}
          />
        ) : null

        return (
          <li key={i}>
            <Tooltip
              content={tooltipContent}
              side="left"
              maxWidth={260}
              className="flex w-full items-center justify-between px-4 py-2 hover:bg-bg-hover cursor-pointer"
            >
              <span className="text-sm text-text-primary">
                {cardName}
                {(card.current_upgrade_level ?? 0) > 0 && (
                  <span className="text-base font-bold text-accent-blue leading-none">+</span>
                )}
              </span>
              {tooltipContent && (
                <span style={{ fontSize: 11, color: 'rgb(var(--text-muted))', opacity: 0.5, flexShrink: 0 }}>ⓘ</span>
              )}
            </Tooltip>
          </li>
        )
      })}
    </ul>
  )
}
