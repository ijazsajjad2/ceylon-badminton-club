// Shared Recharts theming — kept in sync with the CSS custom properties in
// global.css by hand (Recharts renders to SVG/canvas outside the DOM's CSS
// cascade, so custom properties can't be read directly at style-time).
export const CHART_COLORS = {
  gold: '#e23b3b',
  goldBright: '#ff6b6b',
  maroonBright: '#2f7bf0',
  greenBright: '#2fae6b',
  text: '#f2f5fb',
  textDim: '#d4dce9',
  textFaint: '#aab5c8',
  grid: 'rgba(255,255,255,0.08)',
  panelSolid: '#111a36',
  strokeStrong: 'rgba(255,255,255,0.16)',
} as const

export const CHART_AXIS_STYLE = {
  fontSize: 11.5,
  fontFamily: "'Inter', system-ui, sans-serif",
  fill: CHART_COLORS.textFaint,
}

export const CHART_TOOLTIP_WRAPPER_STYLE = { outline: 'none' }
