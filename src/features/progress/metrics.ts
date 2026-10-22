import type { GoalMetric } from '../../db/db'
import type { MessageKey } from '../../i18n/en'

/** Labels and units for anything a goal or chart can track. */
export const metricInfo: Record<GoalMetric, { label: MessageKey; unit: MessageKey; how?: MessageKey }> = {
  weight: { label: 'progress.weight', unit: 'unit.kg' },
  waistCm: { label: 'metric.waist', unit: 'unit.cm', how: 'testHow.waist' },
  pushups: { label: 'metric.pushups', unit: 'unit.reps', how: 'testHow.pushups' },
  plankSec: { label: 'metric.plank', unit: 'unit.seconds', how: 'testHow.plank' },
  squats60: { label: 'metric.squats', unit: 'unit.reps', how: 'testHow.squats' },
  hangSec: { label: 'metric.hang', unit: 'unit.seconds', how: 'testHow.hang' },
}

export const goalMetrics: GoalMetric[] = ['weight', 'waistCm', 'pushups', 'plankSec', 'squats60', 'hangSec']
export const testMetrics = goalMetrics.filter((m) => m !== 'weight') as Exclude<GoalMetric, 'weight'>[]
