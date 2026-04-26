import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'

const TOOLTIP = {
  contentStyle: {
    background: 'rgba(10, 10, 16, 0.96)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    color: '#ddd8f0',
    fontSize: 12,
  },
  labelStyle: { color: '#9e98b8' },
  itemStyle: { color: '#ddd8f0' },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
}
import { useData } from '@/lib/dataStore'
import { characterColor } from '@/lib/utils'
import { formatDuration, formatId } from '@/lib/parseRun'
import { Card, CardHeader, CardBody } from '@/components/Card'
import { StatBlock } from '@/components/StatBlock'
import { Spinner } from '@/components/Spinner'

export function DashboardPage() {
  const { runs, loading } = useData()

  const stats = useMemo(() => {
    if (!runs.length) return null

    const wins = runs.filter(r => r.win)
    const losses = runs.filter(r => !r.win)

    // Per-character stats
    const byChar: Record<string, { wins: number; total: number; durations: number[] }> = {}
    for (const run of runs) {
      if (!byChar[run.character]) byChar[run.character] = { wins: 0, total: 0, durations: [] }
      byChar[run.character].total++
      if (run.win) byChar[run.character].wins++
      byChar[run.character].durations.push(run.durationSeconds)
    }

    const charData = Object.entries(byChar).map(([name, d]) => ({
      name,
      wins: d.wins,
      losses: d.total - d.wins,
      winRate: Math.round((d.wins / d.total) * 100),
      avgDuration: Math.round(d.durations.reduce((a, b) => a + b, 0) / d.durations.length),
      total: d.total,
    })).sort((a, b) => b.total - a.total)

    // Killed-by breakdown (losses only)
    const killedBy: Record<string, number> = {}
    for (const run of losses) {
      const k = run.killedBy ?? 'Unknown'
      killedBy[k] = (killedBy[k] ?? 0) + 1
    }
    const killedByData = Object.entries(killedBy)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    // Ascension distribution
    const ascDist: Record<number, { wins: number; losses: number }> = {}
    for (const run of runs) {
      if (!ascDist[run.ascension]) ascDist[run.ascension] = { wins: 0, losses: 0 }
      if (run.win) ascDist[run.ascension].wins++
      else ascDist[run.ascension].losses++
    }
    const ascData = Object.entries(ascDist)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([asc, d]) => ({ asc: asc === '0' ? 'Base' : `A${asc}`, wins: d.wins, losses: d.losses }))

    // Floor distribution of losses
    const floorBuckets: Record<string, number> = {}
    for (const run of losses) {
      const bucket = `F${Math.floor(run.floorReached / 5) * 5}-${Math.floor(run.floorReached / 5) * 5 + 4}`
      floorBuckets[bucket] = (floorBuckets[bucket] ?? 0) + 1
    }

    return {
      total: runs.length,
      wins: wins.length,
      winRate: Math.round((wins.length / runs.length) * 100),
      avgDuration: Math.round(runs.reduce((a, r) => a + r.durationSeconds, 0) / runs.length),
      avgFloor: Math.round(runs.reduce((a, r) => a + r.floorReached, 0) / runs.length),
      charData,
      killedByData,
      ascData,
    }
  }, [runs])

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Spinner className="w-8 h-8" /></div>
  }

  if (!stats) {
    return <div className="flex items-center justify-center h-full text-text-muted">No run data loaded.</div>
  }

  const pieData = [
    { name: 'Wins', value: stats.wins, color: '#c9a84c' },
    { name: 'Losses', value: stats.total - stats.wins, color: '#c94040' },
  ]

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">Dashboard</h2>
        <p className="text-text-muted text-sm">Aggregate stats across all runs</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card><CardBody><StatBlock label="Total Runs" value={stats.total} /></CardBody></Card>
        <Card><CardBody><StatBlock label="Wins" value={stats.wins} valueClassName="text-accent-gold" /></CardBody></Card>
        <Card><CardBody><StatBlock label="Win Rate" value={`${stats.winRate}%`} valueClassName={stats.winRate >= 50 ? 'text-accent-green' : 'text-accent-red'} /></CardBody></Card>
        <Card><CardBody><StatBlock label="Avg Duration" value={formatDuration(stats.avgDuration)} /></CardBody></Card>
        <Card><CardBody><StatBlock label="Avg Floor" value={stats.avgFloor} /></CardBody></Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Win/Loss pie */}
        <Card>
          <CardHeader><h3 className="text-sm font-medium text-text-secondary">Overall Result</h3></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip {...TOOLTIP} />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Per-character win rates */}
        <Card className="col-span-2">
          <CardHeader><h3 className="text-sm font-medium text-text-secondary">Wins & Losses by Character</h3></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.charData} layout="vertical" margin={{ left: 20, right: 16 }}>
                <XAxis type="number" tick={{ fill: '#5e576e', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9e95b0', fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
                <Tooltip {...TOOLTIP} />
                <Bar dataKey="wins" name="Wins" stackId="a" radius={[0, 0, 0, 0]}>
                  {stats.charData.map((entry, i) => <Cell key={i} fill={characterColor(entry.name)} fillOpacity={0.9} />)}
                </Bar>
                <Bar dataKey="losses" name="Losses" stackId="a" fill="#c94040" fillOpacity={0.4} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Ascension distribution */}
        <Card>
          <CardHeader><h3 className="text-sm font-medium text-text-secondary">Results by Ascension</h3></CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.ascData} margin={{ left: -16, right: 8 }}>
                <XAxis dataKey="asc" tick={{ fill: '#5e576e', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#5e576e', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip {...TOOLTIP} />
                <Bar dataKey="wins" name="Wins" fill="#c9a84c" fillOpacity={0.85} radius={[2, 2, 0, 0]} />
                <Bar dataKey="losses" name="Losses" fill="#c94040" fillOpacity={0.6} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Top killers */}
        <Card>
          <CardHeader><h3 className="text-sm font-medium text-text-secondary">Top Causes of Death</h3></CardHeader>
          <CardBody className="p-0">
            <ul className="divide-y divide-border-default/50">
              {stats.killedByData.slice(0, 8).map(({ name, count }) => (
                <li key={name} className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-text-secondary truncate">{name}</span>
                  <span className="text-sm font-medium text-accent-red shrink-0 ml-2">{count}×</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      {/* Character table */}
      <Card>
        <CardHeader><h3 className="text-sm font-medium text-text-secondary">Character Breakdown</h3></CardHeader>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default">
              {['Character', 'Runs', 'Wins', 'Losses', 'Win Rate', 'Avg Duration'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-xs text-text-muted font-medium uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.charData.map(row => (
              <tr key={row.name} className="border-b border-border-default/50 hover:bg-bg-hover">
                <td className="px-4 py-2.5 font-medium" style={{ color: characterColor(row.name) }}>{row.name}</td>
                <td className="px-4 py-2.5 text-text-secondary">{row.total}</td>
                <td className="px-4 py-2.5 text-accent-gold">{row.wins}</td>
                <td className="px-4 py-2.5 text-accent-red">{row.losses}</td>
                <td className="px-4 py-2.5">
                  <span className={row.winRate >= 50 ? 'text-accent-green' : 'text-accent-red'}>
                    {row.winRate}%
                  </span>
                </td>
                <td className="px-4 py-2.5 text-text-muted">{formatDuration(row.avgDuration)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
