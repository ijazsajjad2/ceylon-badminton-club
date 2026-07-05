import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_AXIS_STYLE, CHART_COLORS } from '../../lib/chartTheme.ts'
import { MONTHS, lastNMonths } from '../../lib/format.js'
import ChartTooltip from './ChartTooltip.tsx'

interface Match {
  date: string
  live?: boolean
}

/** Club-wide matches played per month, over a rolling window ending this month. */
export default function MonthlyActivityChart({ matches, months = 6 }: { matches: Match[]; months?: number }) {
  const keys = lastNMonths(months)
  const counts: Record<string, number> = {}
  for (const m of matches) {
    if (m.live) continue
    const key = m.date.slice(0, 7)
    counts[key] = (counts[key] || 0) + 1
  }
  const data = keys.map((key) => ({
    key,
    label: MONTHS[Number(key.slice(5)) - 1],
    matches: counts[key] || 0,
  }))
  const allZero = data.every((d) => d.matches === 0)

  return (
    <div className="rc-wrap" style={{ height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.goldBright} stopOpacity={0.45} />
              <stop offset="100%" stopColor={CHART_COLORS.goldBright} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis dataKey="label" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            cursor={{ stroke: CHART_COLORS.goldBright, strokeWidth: 1, strokeDasharray: '3 3' }}
            content={<ChartTooltip render={(p) => (
              <div className="chart-tooltip-row"><span className="chart-tooltip-dot" />{p[0].value} match{p[0].value === 1 ? '' : 'es'}</div>
            )} />}
          />
          <Area type="monotone" dataKey="matches" stroke={CHART_COLORS.goldBright} strokeWidth={2.5} fill="url(#activityFill)" />
        </AreaChart>
      </ResponsiveContainer>
      {allZero && <div className="rc-empty">No matches recorded in this window yet.</div>}
    </div>
  )
}
