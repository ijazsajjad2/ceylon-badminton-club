import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_AXIS_STYLE, CHART_COLORS } from '../../lib/chartTheme.ts'
import ChartTooltip from './ChartTooltip.tsx'

interface PlayerPoints {
  id: string
  name: string
  points: number
  winPct: number
}

/** Horizontal points comparison for the top N ranked players. */
export default function PointsBarChart({ players, meId }: { players: PlayerPoints[]; meId?: string | null }) {
  const data = players.map((p) => ({ ...p, short: p.name.length > 12 ? `${p.name.slice(0, 11)}…` : p.name }))
  const height = Math.max(180, data.length * 34)

  return (
    <div className="rc-wrap" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, left: 0, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="short"
            tick={CHART_AXIS_STYLE}
            axisLine={false}
            tickLine={false}
            width={92}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            content={<ChartTooltip render={(p) => {
              const row = p[0].payload as PlayerPoints
              return <div className="chart-tooltip-row"><span className="chart-tooltip-dot" />{row.points} pts · {row.winPct}% win</div>
            }} />}
          />
          <Bar dataKey="points" radius={[0, 6, 6, 0]} maxBarSize={20}>
            {data.map((d) => (
              <Cell key={d.id} fill={d.id === meId ? CHART_COLORS.maroonBright : CHART_COLORS.goldBright} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
