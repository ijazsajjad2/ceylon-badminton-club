import type { ReactNode } from 'react'

interface ChartTooltipProps {
  active?: boolean
  label?: string | number
  children?: ReactNode
  /** Render function receiving Recharts' payload array, for full control over the row content. */
  render?: (payload: any[]) => ReactNode
  payload?: any[]
}

/** Dark glass tooltip matching the app's card aesthetic, for use as Recharts' `content` prop. */
export default function ChartTooltip({ active, label, payload, render, children }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="chart-tooltip">
      {label != null && <div className="chart-tooltip-label">{label}</div>}
      {render ? render(payload) : children}
    </div>
  )
}
