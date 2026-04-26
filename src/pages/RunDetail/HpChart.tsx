import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import type { ProcessedRun } from '@/types/run'
import { characterColor } from '@/lib/utils'
import { formatId } from '@/lib/parseRun'
import { useSettings } from '@/lib/settings'

interface DataPoint {
  floor: number
  hp: number
  maxHp: number
  label: string
  type: string
}

// Read a CSS custom property as an rgb() / rgba() string. Re-reads on every
// render so it stays in sync when the theme changes.
function cssVar(name: string, alpha = 1): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return alpha < 1 ? `rgba(${value}, ${alpha})` : `rgb(${value})`
}

export function HpChart({ run, playerId }: { run: ProcessedRun; playerId?: number }) {
  // Subscribe to settings so the chart re-renders whenever the theme changes
  useSettings()

  const playerData = playerId != null
    ? (run.raw.players.find(p => p.id === playerId) ?? run.raw.players[0])
    : run.raw.players[0]
  const color = characterColor(playerData ? formatId(playerData.character ?? '') : run.character)

  const data: DataPoint[] = []
  let floor = 0

  for (const act of run.raw.map_point_history) {
    for (const point of act) {
      floor++
      const stats = playerId != null
        ? (point.player_stats.find(s => s.player_id === playerId) ?? point.player_stats[0])
        : point.player_stats[0]
      if (!stats) continue
      const room = point.rooms[0]
      data.push({
        floor,
        hp: stats.current_hp,
        maxHp: stats.max_hp,
        label: room?.model_id ? formatId(room.model_id) : point.map_point_type,
        type: point.map_point_type,
      })
    }
  }

  const maxHp = Math.max(...data.map(d => d.maxHp), 1)

  const mutedColor    = cssVar('--text-secondary')
  const secondaryColor = cssVar('--text-secondary')
  const bgCard        = cssVar('--bg-card')
  const bgSecondary   = cssVar('--bg-secondary')
  const borderColor   = cssVar('--border-default')

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 16 }}>
        <defs>
          <linearGradient id={`hpGrad-${playerId ?? 'solo'}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
          <linearGradient id="maxHpGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.25} />
            <stop offset="95%" stopColor={secondaryColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="floor"
          tick={{ fill: mutedColor, fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          label={{ value: 'Floor', position: 'insideBottomRight', fill: mutedColor, fontSize: 10, offset: -4 }}
        />
        <YAxis
          domain={[0, maxHp + 5]}
          tick={{ fill: mutedColor, fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: bgCard,
            border: `1px solid ${borderColor}`,
            borderRadius: 6,
            fontSize: 12,
            color: cssVar('--text-primary'),
          }}
          labelStyle={{ color: mutedColor }}
          itemStyle={{ color: cssVar('--text-primary') }}
          formatter={(value: number, name: string) => [value, name === 'hp' ? 'HP' : 'Max HP']}
          labelFormatter={(floor: number, payload) => {
            const item = payload?.[0]?.payload as DataPoint | undefined
            return `Floor ${floor}: ${item?.label ?? ''}`
          }}
        />
        <Area
          type="monotone"
          dataKey="maxHp"
          stroke={secondaryColor}
          strokeWidth={1}
          fill="url(#maxHpGradient)"
          dot={false}
          animationDuration={200}
        />
        <Area
          type="monotone"
          dataKey="hp"
          stroke={color}
          strokeWidth={2}
          fill={`url(#hpGrad-${playerId ?? 'solo'})`}
          dot={false}
          activeDot={{ r: 4, fill: color }}
          animationDuration={200}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
