/** Shared recharts Tooltip style props — works in light & dark mode. */

export const TOOLTIP_CONTENT_STYLE: React.CSSProperties = {
  background: 'var(--color-surface-0)',
  border: '1px solid var(--color-surface-200)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--color-surface-900)',
}

export const TOOLTIP_LABEL_STYLE: React.CSSProperties = {
  color: 'var(--color-surface-900)',
  fontWeight: 600,
  marginBottom: 2,
}

export const TOOLTIP_ITEM_STYLE: React.CSSProperties = {
  color: 'var(--color-surface-700)',
}

/** cursor highlight for BarChart / LineChart tooltips */
export const BAR_CURSOR = { fill: 'var(--color-surface-100)', opacity: 0.6 }
