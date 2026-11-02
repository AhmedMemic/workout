import { useSyncExternalStore } from 'react'
import * as D from '../logic/standing'
import { toISODate } from '../logic/dates'
import { db } from '../db/db'
import { signal, unlockAudio } from './device'

/**
 * Standing-desk session. Lives outside React (like the quick timer) so it keeps going
 * across screens, and is saved to localStorage so a reload doesn't lose it.
 */

const STORAGE_KEY = 'corner.desk'

interface Store {
  desk: D.DeskState
  sheetOpen: boolean
}

let store: Store = { desk: load(), sheetOpen: false }
const listeners = new Set<() => void>()

function load(): D.DeskState {
  try {
    return D.parseDesk(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'))
  } catch {
    return D.deskOff
  }
}

function set(patch: Partial<Store>) {
  const changedDesk = patch.desk && patch.desk !== store.desk
  store = { ...store, ...patch }
  if (changedDesk) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store.desk))
    } catch {
      // not saved; still works for this visit
    }
  }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useDesk(): Store {
  return useSyncExternalStore(subscribe, () => store)
}

/** Adds minutes to the standing total of the day the stand started on. */
export async function addStandMinutes(since: number, minutes: number): Promise<void> {
  if (minutes <= 0) return
  const date = toISODate(new Date(since))
  await db.transaction('rw', db.daily, async () => {
    const current = (await db.daily.get(date)) ?? { date }
    await db.daily.put({ ...current, standMin: (current.standMin ?? 0) + minutes })
  })
}

function switchTo(mode: D.DeskMode) {
  unlockAudio() // so the switch reminder can beep later
  const prev = store.desk
  // starting the work day is a tap, the only moment the browser lets us ask
  if (prev.mode === 'off' && mode !== 'off') void allowNotifications()
  const { state, addMin } = D.switchMode(prev, mode, Date.now())
  set({ desk: state })
  void addStandMinutes(prev.since, addMin)
}

/** Beep, vibrate, open the sheet and (if allowed) show a system notification. */
export function remind(title: string, body: string) {
  set({ desk: { ...store.desk, reminded: true }, sheetOpen: true })
  signal(3)
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  const options = { body, tag: 'corner-desk', icon: `${import.meta.env.BASE_URL}pwa-192x192.png` }
  // Android only shows notifications through the service worker
  navigator.serviceWorker?.ready
    .then((reg) => reg.showNotification(title, options))
    .catch(() => {
      try {
        new Notification(title, options)
      } catch {
        // not supported here
      }
    })
}

/** Asks for notification permission (call from a tap). Resolves to whether it's allowed. */
export async function allowNotifications(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  return (await Notification.requestPermission()) === 'granted'
}

export const deskActions = {
  open: () => set({ sheetOpen: true }),
  close: () => set({ sheetOpen: false }),
  stand: () => switchTo('standing'),
  sit: () => switchTo('sitting'),
  stop: () => switchTo('off'),
}
