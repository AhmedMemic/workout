import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Countdown based on an end timestamp, so it stays right when the phone sleeps
 * or the tab is in the background. Calls onDone once when it reaches zero.
 */
export function useCountdown(seconds: number, onDone: () => void, autoStart = true) {
  const [endAt, setEndAt] = useState<number | null>(autoStart ? Date.now() + seconds * 1000 : null)
  const [pausedLeft, setPausedLeft] = useState<number | null>(autoStart ? null : seconds * 1000)
  const [now, setNow] = useState(Date.now())
  const doneRef = useRef(onDone)
  doneRef.current = onDone
  const fired = useRef(false)

  useEffect(() => {
    if (endAt === null) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [endAt])

  const leftMs = endAt !== null ? Math.max(0, endAt - now) : (pausedLeft ?? 0)

  useEffect(() => {
    if (endAt !== null && leftMs === 0 && !fired.current) {
      fired.current = true
      doneRef.current()
    }
  }, [endAt, leftMs])

  const pause = useCallback(() => {
    if (endAt === null) return
    setPausedLeft(Math.max(0, endAt - Date.now()))
    setEndAt(null)
  }, [endAt])

  const resume = useCallback(() => {
    if (endAt !== null) return
    setEndAt(Date.now() + (pausedLeft ?? 0))
    setNow(Date.now())
    setPausedLeft(null)
  }, [endAt, pausedLeft])

  const add = useCallback((s: number) => {
    if (endAt !== null) setEndAt(endAt + s * 1000)
    else setPausedLeft((p) => (p ?? 0) + s * 1000)
  }, [endAt])

  return { left: Math.ceil(leftMs / 1000), running: endAt !== null, pause, resume, add }
}

/** Seconds since a start time, ticking every second. */
export function useElapsed(startedAt: number | null): number {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (startedAt === null) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [startedAt])
  return startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000))
}

export function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
