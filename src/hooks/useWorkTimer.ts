import { useCallback, useEffect, useRef, useState } from 'react'
import { signal, tick } from './device'

export type WorkPhase = 'idle' | 'ready' | 'work' | 'done'

interface Options {
  /** Work time in seconds. */
  seconds: number
  /** Get-ready countdown before the work starts (0 = none). */
  readySec: number
  autoStart?: boolean
  onFinish: () => void
}

/**
 * Get-ready countdown, then a work countdown that stops at zero.
 * Beeps 3-2-1 before the start and the end; timestamp based like useCountdown.
 */
export function useWorkTimer({ seconds, readySec, autoStart = false, onFinish }: Options) {
  const [phase, setPhase] = useState<WorkPhase>('idle')
  const [endAt, setEndAt] = useState<number | null>(null)
  const [pausedLeft, setPausedLeft] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const finishRef = useRef(onFinish)
  finishRef.current = onFinish
  const lastTick = useRef<number | null>(null)

  const begin = useCallback((next: WorkPhase, secs: number) => {
    const t = Date.now()
    lastTick.current = null
    setPhase(next)
    setPausedLeft(null)
    setNow(t)
    setEndAt(t + secs * 1000)
  }, [])

  const start = useCallback(() => {
    if (readySec > 0) begin('ready', readySec)
    else {
      tick(true)
      begin('work', seconds)
    }
  }, [begin, readySec, seconds])

  useEffect(() => {
    if (autoStart) start()
    // only when the step opens
  }, [])

  useEffect(() => {
    if (endAt === null) return
    const id = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(id)
  }, [endAt])

  const leftMs =
    endAt !== null ? Math.max(0, endAt - now) : (pausedLeft ?? (phase === 'idle' ? seconds * 1000 : 0))
  const left = Math.ceil(leftMs / 1000)

  useEffect(() => {
    if (endAt === null) return
    const beepLast3 = phase === 'ready' || seconds >= 10
    if (beepLast3 && left > 0 && left <= 3 && lastTick.current !== left) {
      lastTick.current = left
      tick()
    }
    if (leftMs > 0) return
    if (phase === 'ready') {
      tick(true)
      begin('work', seconds)
    } else if (phase === 'work') {
      setEndAt(null)
      setPhase('done')
      signal(2)
      finishRef.current()
    }
  }, [begin, endAt, left, leftMs, phase, seconds])

  const pause = useCallback(() => {
    if (endAt === null) return
    setPausedLeft(Math.max(0, endAt - Date.now()))
    setEndAt(null)
  }, [endAt])

  const resume = useCallback(() => {
    if (endAt !== null || pausedLeft === null) return
    setEndAt(Date.now() + pausedLeft)
    setNow(Date.now())
    setPausedLeft(null)
  }, [endAt, pausedLeft])

  const reset = useCallback(() => {
    lastTick.current = null
    setEndAt(null)
    setPausedLeft(null)
    setPhase('idle')
  }, [])

  const workElapsed = phase === 'work' ? seconds - left : phase === 'done' ? seconds : 0
  return { phase, left, running: endAt !== null, start, pause, resume, reset, workElapsed }
}
