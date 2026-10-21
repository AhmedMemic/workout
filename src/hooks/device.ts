import { useEffect } from 'react'

/** Keeps the screen on while mounted (where the browser supports it). */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen')
        if (cancelled) void lock.release()
      } catch {
        // denied (e.g. low battery) — the workout still works
      }
    }
    void acquire()
    // the lock is dropped when the tab is hidden; take it again on return
    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void lock?.release()
    }
  }, [active])
}

let audio: AudioContext | null = null

/** Short beeps + vibration at the end of a timer. Plays over music from other apps. */
export function signal(times = 2) {
  try {
    audio ??= new AudioContext()
    const ctx = audio
    for (let i = 0; i < times; i++) {
      const t = ctx.currentTime + i * 0.25
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.16)
    }
  } catch {
    // no audio available
  }
  navigator.vibrate?.(times > 1 ? [150, 100, 150] : 150)
}

/** Browsers only allow audio after a tap; call this from the Start button. */
export function unlockAudio() {
  try {
    audio ??= new AudioContext()
    void audio.resume()
  } catch {
    // ignore
  }
}
