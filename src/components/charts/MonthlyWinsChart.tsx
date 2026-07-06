import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHART_AXIS_STYLE, CHART_COLORS } from '../../lib/chartTheme.ts'
import { MONTHS, lastNMonths } from '../../lib/format.js'
import ChartTooltip from './ChartTooltip.tsx'

interface MonthlyWinsChartProps {
  /** Player stats row's `monthly` map: 'YYYY-MM' -> win count. */
  monthly: Record<string, number>
  months?: number
}

/** Wins per month for a single player, over a rolling window ending this month. */
export default function MonthlyWinsChart({ monthly, months = 6 }: MonthlyWinsChartProps) {
  const keys = lastNMonths(months)
  const data = keys.map((key) => ({
    key,
    label: MONTHS[Number(key.slice(5)) - 1],
    wins: monthly[key] || 0,
  }))
  const allZero = data.every((d) => d.wins === 0)

  return (
    <div className="rc-wrap" style={{ height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis dataKey="label" tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={CHART_AXIS_STYLE} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            content={<ChartTooltip render={(p) => (
              <div className="chart-tooltip-row"><span className="chart-tooltip-dot" />{p[0].value} win{p[0].value === 1 ? '' : 's'}</div>
            )} />}
          />
          <Bar dataKey="wins" fill={CHART_COLORS.goldBright} radius={[6, 6, 0, 0]} maxBarSize={30} />
        </BarChart>
      </ResponsiveContainer>
      {allZero && <div className="rc-empty">No wins recorded in this window yet.</div>}
    </div>
  )
}
