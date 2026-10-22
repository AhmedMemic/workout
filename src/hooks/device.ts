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

function tone(freq: number, at: number, length: number, volume = 0.3) {
  audio ??= new AudioContext()
  const ctx = audio
  const t = ctx.currentTime + at
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length)
  osc.connect(gain).connect(ctx.destination)
  osc.start(t)
  osc.stop(t + length + 0.01)
}

/** Short beeps + vibration at the end of a timer. Plays over music from other apps. */
export function signal(times = 2) {
  try {
    for (let i = 0; i < times; i++) tone(880, i * 0.25, 0.15)
  } catch {
    // no audio available
  }
  navigator.vibrate?.(times > 1 ? [150, 100, 150] : 150)
}

/** Countdown tick (3-2-1); `go` is the longer, higher start/finish tone. */
export function tick(go = false) {
  try {
    if (go) tone(1320, 0, 0.45, 0.35)
    else tone(660, 0, 0.12, 0.25)
  } catch {
    // no audio available
  }
  if (go) navigator.vibrate?.(200)
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

// ── Voice ───────────────────────────────────────────────────────

const voiceState = { enabled: true, lang: 'en' as 'en' | 'bs' }

export function configureVoice(enabled: boolean, lang: 'en' | 'bs') {
  voiceState.enabled = enabled
  voiceState.lang = lang
  if (!enabled) window.speechSynthesis?.cancel()
}

/** Phones rarely ship a Bosnian voice; Croatian and Serbian read Bosnian latin text well. */
function pickVoice(lang: 'en' | 'bs'): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()
  const prefixes = lang === 'bs' ? ['bs', 'hr', 'sr'] : ['en']
  for (const p of prefixes) {
    const v = voices.find((x) => x.lang.toLowerCase().startsWith(p))
    if (v) return v
  }
  return undefined
}

/** Speaks a cue. `interrupt` drops whatever is still being said (e.g. after a quick skip). */
export function say(text: string, interrupt = true) {
  if (!voiceState.enabled || !('speechSynthesis' in window)) return
  try {
    const synth = window.speechSynthesis
    if (interrupt) synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    const voice = pickVoice(voiceState.lang)
    if (voice) u.voice = voice
    u.lang = voice?.lang ?? (voiceState.lang === 'bs' ? 'bs-BA' : 'en-US')
    u.rate = 1
    synth.speak(u)
  } catch {
    // speech not available
  }
}
