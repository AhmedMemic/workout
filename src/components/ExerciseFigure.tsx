import { figures, type Gear, type Pose } from '../data/figures'
import { useT } from '../i18n/I18nProvider'
import type { MessageKey } from '../i18n/en'
import styles from './ExerciseFigure.module.css'

function GearShape({ g }: { g: Gear }) {
  switch (g.t) {
    case 'rect':
      return g.outline ? (
        <rect x={g.x} y={g.y} width={g.w} height={g.h} rx={4} className={styles.gearStroke} />
      ) : (
        <rect x={g.x} y={g.y} width={g.w} height={g.h} rx={3} className={styles.gearFill} />
      )
    case 'circle':
      return <circle cx={g.cx} cy={g.cy} r={g.r} className={g.fill ? styles.body : styles.gearStroke} />
    case 'line':
      return (
        <polyline
          points={g.pts.map((p) => p.join(',')).join(' ')}
          className={g.env ? styles.env : g.thin ? styles.band : styles.gearStroke}
        />
      )
  }
}

function PoseSvg({ pose, id }: { pose: Pose; id: string }) {
  const marker = `arrow-${id}`
  return (
    <svg viewBox="0 0 180 130" className={styles.svg} aria-hidden="true">
      <defs>
        <marker id={marker} viewBox="0 0 10 10" refX={6} refY={5} markerWidth={4} markerHeight={4} orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" className={styles.arrowHead} />
        </marker>
      </defs>
      <line x1={8} y1={121} x2={172} y2={121} className={styles.floor} />
      {pose.under?.map((g, i) => <GearShape key={i} g={g} />)}
      {pose.lines.map((pts, i) => (
        <polyline key={i} points={pts.map((p) => p.join(',')).join(' ')} className={styles.limb} />
      ))}
      {pose.head && <circle cx={pose.head[0]} cy={pose.head[1]} r={8} className={styles.body} />}
      {pose.over?.map((g, i) => <GearShape key={i} g={g} />)}
      {pose.arrows?.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className={styles.arrow} markerEnd={`url(#${marker})`} />
      ))}
    </svg>
  )
}

/** Start/end (or hold) drawings for an exercise. Renders nothing if there is no drawing. */
export function ExerciseFigure({ exerciseId, compact = false }: { exerciseId: string; compact?: boolean }) {
  const { t } = useT()
  const figure = figures[exerciseId]
  if (!figure) return null
  return (
    <div className={`${styles.frames} ${compact ? styles.compact : ''} ${figure.frames.length === 1 ? styles.single : ''}`}>
      {figure.frames.map(([caption, pose], i) => (
        <figure key={i} className={styles.frame}>
          <PoseSvg pose={pose} id={`${exerciseId}-${i}`} />
          <figcaption>{t(`fig.${caption}` as MessageKey)}</figcaption>
        </figure>
      ))}
    </div>
  )
}

/** Small single drawing for lists: the last frame, which usually shows the movement. */
export function ExerciseThumb({ exerciseId }: { exerciseId: string }) {
  const figure = figures[exerciseId]
  if (!figure) return <span className={styles.thumb} />
  const [, pose] = figure.frames[figure.frames.length - 1]
  return (
    <span className={styles.thumb}>
      <PoseSvg pose={pose} id={`thumb-${exerciseId}`} />
    </span>
  )
}
