import { useEffect, useState, useSyncExternalStore } from 'react'
import * as T from '../logic/timer'
import { signal, unlockAudio } from './device'

/**
 * The quick timer from the header. It lives outside React so it keeps running across
 * screens, and is saved to localStorage so a reload (or the phone dropping the tab)
 * doesn't lose it.
 */

const STORAGE_KEY = 'corner.timer'
/** Stop beeping after this long; the "time's up" stays until dismissed. */
const RING_FOR_MS = 60_000
const RING_EVERY_MS = 2_000

interface Store {
  timer: T.TimerState
  sheetOpen: boolean
}

let store: Store = { timer: load(), sheetOpen: false }
const listeners = new Set<() => void>()
let ticker: ReturnType<typeof setInterval> | undefined
let dueAt = 0
let lastRing = 0

function load(): T.TimerState {
  try {
    return T.parseTimer(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'))
  } catch {
    return T.initialTimer
  }
}

function set(patch: Partial<Store>) {
  const changedTimer = patch.timer && patch.timer !== store.timer
  store = { ...store, ...patch }
  if (changedTimer) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store.timer))
    } catch {
      // not saved; the timer still runs for this visit
    }
  }
  listeners.forEach((l) => l())
  syncTicker()
}

function check() {
  const now = Date.now()
  const s = store.timer
  if (T.isDue(s, now)) {
    dueAt = s.runningSince! + s.durationSec * 1000 - s.elapsedMs
    lastRing = 0
    set({ timer: T.finish(s), sheetOpen: true })
    return
  }
  if (s.ringing && now - dueAt < RING_FOR_MS && now - lastRing >= RING_EVERY_MS) {
    lastRing = now
    signal(3)
  }
}

/** Ticks only while something needs watching, so an idle timer costs nothing. */
function syncTicker() {
  const needed = T.isRunning(store.timer) || store.timer.ringing
  if (needed && !ticker) ticker = setInterval(check, 250)
  if (!needed && ticker) {
    clearInterval(ticker)
    ticker = undefined
  }
}

// a timer saved as running picks up again on load (and rings if it ran out meanwhile)
syncTicker()

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useQuickTimer(): Store {
  return useSyncExternalStore(subscribe, () => store)
}

/** Current time, re-rendering a few times a second while `active`. */
export function useNow(active: boolean): number {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (!active) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [active])
  return now
}

export const timerActions = {
  open: () => set({ sheetOpen: true }),
  // closing the sheet during the alarm counts as stopping it
  close: () => set(store.timer.ringing ? { sheetOpen: false, timer: T.reset(store.timer) } : { sheetOpen: false }),
  start: () => {
    unlockAudio() // browsers only allow the end beep after a tap
    set({ timer: T.start(store.timer, Date.now()) })
  },
  pause: () => set({ timer: T.pause(store.timer, Date.now()) }),
  reset: () => set({ timer: T.reset(store.timer) }),
  setMode: (mode: T.TimerMode) => set({ timer: T.setMode(store.timer, mode) }),
  setDuration: (sec: number) => set({ timer: T.setDuration(store.timer, sec) }),
  addTime: (sec: number) => set({ timer: T.addTime(store.timer, sec, Date.now()) }),
  /** Picks a length and starts right away (the preset buttons). */
  startWith: (sec: number) => {
    unlockAudio()
    set({ timer: T.start(T.setDuration(T.reset(store.timer), sec), Date.now()) })
  },
}
