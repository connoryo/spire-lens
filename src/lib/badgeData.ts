interface BadgeTier {
  name: string
  description: string
}

// Strip [color]...[/color] markup tags from wiki descriptions
function strip(text: string): string {
  return text.replace(/\[\/?\w+\]/g, '')
}

// Badge ID (from .run files) → per-rarity name + description
// Source: https://spire-codex.com/docs
const BADGES: Record<string, Partial<Record<'bronze' | 'silver' | 'gold', BadgeTier>>> = {
  BIG_DECK: {
    bronze: { name: 'Big Deck',       description: strip('Won with a deck of [blue]40[/blue] or more cards.') },
    silver: { name: 'Huge Deck',      description: strip('Won with a deck of [blue]60[/blue] or more cards.') },
    gold:   { name: 'Monster Deck',   description: strip('Won with a deck of [blue]100[/blue] or more cards.') },
  },
  CCCCOMBO: {
    bronze: { name: 'C-c-c-Combo',   description: strip('Played [blue]20[/blue] cards in a single turn.') },
  },
  CURSES: {
    bronze: { name: 'Curses!',        description: strip('Won with [blue]5[/blue] or more Curses.') },
  },
  DAMAGE_LEADER: {
    bronze: { name: 'Damage Leader',  description: 'Dealt the most damage to enemies in multiplayer.' },
  },
  DEBUFFER: {
    bronze: { name: 'Debuffer',       description: 'Applied the most Debuffs in multiplayer.' },
  },
  DOUBLE_SNECKO: {
    bronze: { name: 'Double Snecko',  description: 'Obtained both fake and real Snecko Eyes.' },
  },
  ELITE: {
    bronze: { name: 'Elite Hunter',   description: strip('Killed [blue]3[/blue] or more Elites.') },
    silver: { name: 'Elite Killer',   description: strip('Killed [blue]6[/blue] or more Elites.') },
    gold:   { name: 'Elite Slayer',   description: strip('Killed [blue]9[/blue] or more Elites.') },
  },
  FAMISHED: {
    bronze: { name: 'Famished',       description: 'Won with Max HP reduced to less than half of your starting HP.' },
  },
  FAVORITE_CARD: {
    bronze: { name: 'Favorite Card',  description: strip('Won a run and played a single card more than [blue]100[/blue] times.') },
  },
  GLUTTON: {
    bronze: { name: 'Well Fed',       description: strip('Won a run with your Max HP increased by [blue]15[/blue] or more.') },
    silver: { name: 'Stuffed',        description: strip('Won a run with your Max HP increased by [blue]30[/blue] or more.') },
    gold:   { name: 'Glutton',        description: strip('Won a run with absurdly high Max HP (increased by [blue]50[/blue] or more).') },
  },
  HEALER: {
    bronze: { name: 'Mender',         description: 'Mended an ally once. (Multiplayer)' },
    silver: { name: 'Healer',         description: 'Mended an ally twice. (Multiplayer)' },
    gold:   { name: 'Doctor',         description: strip('Mended allies over and over again (at least [blue]3[/blue] times). (Multiplayer)') },
  },
  HIGHLANDER: {
    bronze: { name: 'Highlander',     description: 'Won with a deck where no two cards are the same (excludes Starters).' },
  },
  HONED: {
    bronze: { name: 'Honed',          description: strip('Won with a deck with [blue]5[/blue] or more of the same card (excludes Starters).') },
  },
  ILIKESHINY: {
    bronze: { name: 'I Like Shiny',   description: strip('Amassed [blue]25[/blue] or more relics.') },
  },
  KACHING: {
    bronze: { name: 'Ka-Ching!',      description: strip('Spent more than [blue]1,000[/blue] Gold at the Merchant.') },
  },
  MONEY_MONEY: {
    bronze: { name: 'Money Money',    description: strip('Won with [blue]200[/blue] or more Gold.') },
    silver: { name: "Rainin' Money",  description: strip('Won with [blue]400[/blue] or more Gold.') },
    gold:   { name: 'I Like Gold',    description: strip('Won with [blue]600[/blue] or more Gold.') },
  },
  MYSTERY_MACHINE: {
    bronze: { name: 'Mystery Machine', description: strip('Traveled to [blue]15[/blue] or more ? rooms.') },
  },
  PERFECT: {
    bronze: { name: 'Flawless',       description: 'Defeated a boss without losing HP.' },
    silver: { name: 'Supreme',        description: strip('Defeated [blue]2[/blue] bosses without losing HP.') },
    gold:   { name: 'Perfect',        description: strip('Defeated [blue]3[/blue] bosses without losing HP.') },
  },
  RESTFUL: {
    bronze: { name: 'Restful',        description: 'Won a run while resting at each Rest Site.' },
  },
  RESTLESS: {
    bronze: { name: 'Restless',       description: 'Won a run without ever resting.' },
  },
  SPEEDY: {
    bronze: { name: 'Speedy',         description: strip('Won a run in under [blue]50[/blue] minutes.') },
    silver: { name: 'Speedier',       description: strip('Won a run in under [blue]40[/blue] minutes.') },
    gold:   { name: 'Speediest',      description: strip('Won a run in under [blue]30[/blue] minutes.') },
  },
  TABLET: {
    bronze: { name: 'Tablet of Truth', description: 'Won with only 1 Max HP.' },
  },
  TEAM_PLAYER: {
    bronze: { name: 'Team Player',    description: strip('Deck contained [blue]3[/blue] or more multiplayer-only cards. (Multiplayer)') },
  },
  TINY_DECK: {
    bronze: { name: 'Small Deck',     description: strip('Won with a deck of [blue]20[/blue] or fewer cards.') },
    silver: { name: 'Tiny Deck',      description: strip('Won with a deck of [blue]10[/blue] or fewer cards.') },
    gold:   { name: 'Miniscule',      description: strip('Won with a deck of [blue]5[/blue] or fewer cards.') },
  },
  WHOMPER: {
    bronze: { name: 'Whomper',        description: strip('Dealt more than [blue]100[/blue] damage with a single attack.') },
  },
}

export function getBadgeInfo(id: string, rarity: 'bronze' | 'silver' | 'gold'): BadgeTier {
  const tiers = BADGES[id]
  if (tiers) {
    return tiers[rarity] ?? tiers.bronze ?? tiers.silver ?? tiers.gold!
  }
  // Fallback: format the raw ID nicely
  const name = id.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  return { name, description: '' }
}
