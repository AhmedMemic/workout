import { useState, type PointerEvent } from 'react'
import { diffDays, formatShort, type ISODate } from '../logic/dates'
import styles from './charts.module.css'

const W = 340
const H = 170
const M = { top: 12, right: 12, bottom: 24, left: 36 }
const PW = W - M.left - M.right
const PH = H - M.top - M.bottom

export interface Point {
  date: ISODate
  value: number
}

/** 3–5 round tick values covering [min, max]. */
function niceTicks(min: number, max: number): number[] {
  const span = Math.max(max - min, 1e-9)
  const step = [0.5, 1, 2, 5, 10, 20, 50].find((s) => span / s <= 5) ?? 100
  const ticks: number[] = []
  const end = Math.ceil(max / step - 1e-9) * step
  for (let v = Math.floor(min / step) * step; v <= end + 1e-9; v += step) ticks.push(Math.round(v * 10) / 10)
  return ticks
}

/** Tooltip position as a % of the chart width, kept away from the edges. */
const tipLeft = (svgX: number) => `${Math.min(Math.max((svgX / W) * 100, 16), 84)}%`

function useHover() {
  const [index, setIndex] = useState<number | null>(null)
  return { index, setIndex, clear: () => setIndex(null) }
}

/** SVG x (in viewBox units) of a pointer event. */
function pointerX(e: PointerEvent<SVGElement>): number {
  const rect = e.currentTarget.getBoundingClientRect()
  return ((e.clientX - rect.left) / rect.width) * W
}

interface TrendChartProps {
  /** Raw readings, drawn as small muted dots. */
  points: Point[]
  /** The trend line (e.g. 7-day average), drawn in the accent colour. */
  trend: Point[]
  goal?: number
  goalLabel?: string
  unit: string
  lang: string
  label: string
}

/** Readings as dots plus a trend line, with an optional goal line. Tap or hover to read values. */
export function TrendChart({ points, trend, goal, goalLabel, unit, lang, label }: TrendChartProps) {
  const hover = useHover()
  if (trend.length === 0) return null
  const first = trend[0].date
  const last = trend[trend.length - 1].date
  const spanDays = Math.max(diffDays(first, last), 6)
  const values = [...points.map((p) => p.value), ...trend.map((p) => p.value), ...(goal !== undefined ? [goal] : [])]
  const ticks = niceTicks(Math.min(...values) - 0.3, Math.max(...values) + 0.3)
  const lo = ticks[0]
  const hi = ticks[ticks.length - 1]
  const x = (d: ISODate) => M.left + (diffDays(first, d) / spanDays) * PW
  const y = (v: number) => M.top + (1 - (v - lo) / (hi - lo || 1)) * PH

  const active = hover.index !== null ? trend[hover.index] : null
  const raw = active && points.find((p) => p.date === active.date)

  const onMove = (e: PointerEvent<SVGElement>) => {
    const px = pointerX(e)
    let best = 0
    trend.forEach((p, i) => {
      if (Math.abs(x(p.date) - px) < Math.abs(x(trend[best].date) - px)) best = i
    })
    hover.setIndex(best)
  }

  return (
    <figure className={styles.figure}>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} role="img" aria-label={label}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={M.left} x2={W - M.right} y1={y(v)} y2={y(v)} className={styles.grid} />
            <text x={M.left - 6} y={y(v) + 4} className={styles.axis} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        <text x={M.left} y={H - 6} className={styles.axis}>
          {formatShort(first, lang)}
        </text>
        <text x={W - M.right} y={H - 6} className={styles.axis} textAnchor="end">
          {formatShort(last, lang)}
        </text>

        {goal !== undefined && (
          <g>
            <line x1={M.left} x2={W - M.right} y1={y(goal)} y2={y(goal)} className={styles.goal} />
            <text x={W - M.right} y={y(goal) - 5} className={styles.goalLabel} textAnchor="end">
              {goalLabel}
            </text>
          </g>
        )}

        {points.map((p) => (
          <circle key={p.date} cx={x(p.date)} cy={y(p.value)} r={2.5} className={styles.dot} />
        ))}
        {trend.length > 1 && (
          <polyline points={trend.map((p) => `${x(p.date)},${y(p.value)}`).join(' ')} className={styles.line} />
        )}
        {(() => {
          const end = trend[trend.length - 1]
          return <circle cx={x(end.date)} cy={y(end.value)} r={4.5} className={styles.endpoint} />
        })()}

        {active && (
          <g>
            <line x1={x(active.date)} x2={x(active.date)} y1={M.top} y2={M.top + PH} className={styles.crosshair} />
            <circle cx={x(active.date)} cy={y(active.value)} r={5} className={styles.endpoint} />
          </g>
        )}
        <rect
          x={M.left}
          y={0}
          width={PW}
          height={H}
          className={styles.hit}
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={hover.clear}
        />
      </svg>
      {active && (
        <div className={styles.tooltip} style={{ left: tipLeft(x(active.date)) }}>
          <div className={styles.tipDate}>{formatShort(active.date, lang)}</div>
          <div>
            <b>{active.value}</b> {unit}
          </div>
          {raw && raw.value !== active.value && (
            <div className={styles.tipMuted}>
              {raw.value} {unit}
            </div>
          )}
        </div>
      )}
    </figure>
  )
}

interface BarChartProps {
  bars: { key: string; label: string; value: number }[]
  label: string
  /** Tooltip text for a bar. */
  describe: (value: number, label: string) => string
}

/** Simple count bars (e.g. workouts per week). Tap or hover a bar to read it. */
export function BarChart({ bars, label, describe }: BarChartProps) {
  const hover = useHover()
  const max = Math.max(4, ...bars.map((b) => b.value))
  const ticks = niceTicks(0, max).filter((v) => Number.isInteger(v))
  const top = ticks[ticks.length - 1]
  const slot = PW / bars.length
  const barW = Math.max(4, slot - 6)
  const y = (v: number) => M.top + (1 - v / top) * PH
  const active = hover.index !== null ? bars[hover.index] : null

  return (
    <figure className={styles.figure}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles.svg}
        role="img"
        aria-label={label}
        onPointerLeave={hover.clear}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line x1={M.left} x2={W - M.right} y1={y(v)} y2={y(v)} className={styles.grid} />
            <text x={M.left - 6} y={y(v) + 4} className={styles.axis} textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        {bars.map((b, i) => {
          const bx = M.left + i * slot + (slot - barW) / 2
          const h = Math.max(0, y(0) - y(b.value))
          // rounded top only: a path with 4px corners, anchored flat on the baseline
          const r = Math.min(4, barW / 2, h)
          const d =
            h > 0
              ? `M${bx},${y(0)} V${y(b.value) + r} Q${bx},${y(b.value)} ${bx + r},${y(b.value)} H${bx + barW - r} Q${bx + barW},${y(b.value)} ${bx + barW},${y(b.value) + r} V${y(0)} Z`
              : ''
          return (
            <g key={b.key}>
              {d && <path d={d} className={hover.index === i ? styles.barActive : styles.bar} />}
              <rect
                x={M.left + i * slot}
                y={M.top}
                width={slot}
                height={PH + M.bottom}
                className={styles.hit}
                onPointerEnter={() => hover.setIndex(i)}
                onPointerDown={() => hover.setIndex(i)}
              />
            </g>
          )
        })}
        <text x={M.left} y={H - 6} className={styles.axis}>
          {bars[0]?.label}
        </text>
        <text x={W - M.right} y={H - 6} className={styles.axis} textAnchor="end">
          {bars[bars.length - 1]?.label}
        </text>
      </svg>
      {active && hover.index !== null && (
        <div className={styles.tooltip} style={{ left: tipLeft(M.left + (hover.index + 0.5) * slot) }}>
          {describe(active.value, active.label)}
        </div>
      )}
    </figure>
  )
}

/** Tiny trend line for a list row; the last point is marked. */
export function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return null
  const w = 72
  const h = 24
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const px = (i: number) => 3 + (i / (values.length - 1)) * (w - 6)
  const py = (v: number) => 3 + (1 - (v - lo) / (hi - lo || 1)) * (h - 6)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={label} className={styles.spark}>
      <polyline points={values.map((v, i) => `${px(i)},${py(v)}`).join(' ')} className={styles.line} />
      <circle cx={px(values.length - 1)} cy={py(values[values.length - 1])} r={3} className={styles.endpoint} />
    </svg>
  )
}
