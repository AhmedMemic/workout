import { useSyncExternalStore } from 'react'
import type { Track } from '../db/db'
import { playOrder } from '../logic/music'

/**
 * In-app music player for songs stored on the device. It lives outside React so it keeps
 * playing across screens and with the phone locked, and shows on the lock screen through
 * the Media Session API.
 */

export interface MusicState {
  queue: Track[]
  /** Position in `queue`. */
  index: number
  playing: boolean
}

let state: MusicState = { queue: [], index: 0, playing: false }
const listeners = new Set<() => void>()
let el: HTMLAudioElement | null = null
let objectUrl: string | null = null
// songs in a row that failed to load, so a broken library doesn't skip forever
let failures = 0

const FULL = 1
const DUCKED = 0.25
let fadeTimer: ReturnType<typeof setInterval> | undefined

function set(patch: Partial<MusicState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = state.playing ? 'playing' : 'paused'
}

function audio(): HTMLAudioElement {
  if (el) return el
  el = new Audio()
  el.addEventListener('ended', () => {
    failures = 0
    next()
  })
  el.addEventListener('error', () => {
    if (++failures < state.queue.length) next()
    else set({ playing: false })
  })
  el.addEventListener('play', () => set({ playing: true }))
  el.addEventListener('pause', () => set({ playing: false }))
  if ('mediaSession' in navigator) {
    const ms = navigator.mediaSession
    ms.setActionHandler('play', play)
    ms.setActionHandler('pause', pause)
    ms.setActionHandler('nexttrack', next)
    ms.setActionHandler('previoustrack', prev)
  }
  return el
}

function load(index: number, autoplay = true) {
  const track = state.queue[index]
  if (!track) return
  const a = audio()
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = URL.createObjectURL(track.blob)
  a.src = objectUrl
  set({ index })
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: track.name, artist: 'Corner' })
  }
  if (autoplay) void a.play().catch(() => set({ playing: false }))
}

/** Starts playing `tracks`, beginning with `start`. Call from a tap: browsers block audio otherwise. */
export function playTracks(tracks: Track[], start = 0, shuffle = false) {
  if (!tracks.length) return
  failures = 0
  set({ queue: playOrder(tracks.length, start, shuffle).map((i) => tracks[i]) })
  load(0)
}

export function play() {
  if (!state.queue.length) return
  if (!el?.src) return load(state.index)
  void el.play().catch(() => set({ playing: false }))
}

export function pause() {
  el?.pause()
}

export function toggle() {
  if (state.playing) pause()
  else play()
}

export function next() {
  if (state.queue.length) load((state.index + 1) % state.queue.length)
}

/** Back to the start of the song, or to the previous one if it only just began. */
export function prev() {
  if (!state.queue.length) return
  if (el && el.currentTime > 3) {
    el.currentTime = 0
    return
  }
  load((state.index - 1 + state.queue.length) % state.queue.length)
}

export function stop() {
  el?.pause()
  if (el) el.removeAttribute('src')
  if (objectUrl) URL.revokeObjectURL(objectUrl)
  objectUrl = null
  set({ queue: [], index: 0, playing: false })
  if ('mediaSession' in navigator) navigator.mediaSession.metadata = null
}

/** Removes a deleted song from the queue, moving on if it was the one playing. */
export function forget(id: number) {
  const at = state.queue.findIndex((t) => t.id === id)
  if (at < 0) return
  const queue = state.queue.filter((t) => t.id !== id)
  if (!queue.length) return stop()
  if (at === state.index) {
    const wasPlaying = state.playing
    state = { ...state, queue }
    load(at % queue.length, wasPlaying)
  } else {
    set({ queue, index: at < state.index ? state.index - 1 : state.index })
  }
}

/** Lowers the music while the coach speaks, then fades it back. */
export function duck(on: boolean) {
  if (!el) return
  const a = el
  const target = on ? DUCKED : FULL
  clearInterval(fadeTimer)
  fadeTimer = setInterval(() => {
    const step = 0.08
    const v = a.volume + Math.sign(target - a.volume) * step
    if (Math.abs(target - a.volume) <= step) {
      a.volume = target
      clearInterval(fadeTimer)
    } else {
      a.volume = Math.min(1, Math.max(0, v))
    }
  }, 25)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useMusic(): MusicState {
  return useSyncExternalStore(subscribe, () => state)
}
