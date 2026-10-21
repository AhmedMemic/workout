import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en, type MessageKey } from './en'
import { bs } from './bs'

export type Lang = 'en' | 'bs'

/** Any user-facing text that lives in data (exercise names, steps, habits…). */
export type L10n = Record<Lang, string>

const messages: Record<Lang, Record<MessageKey, string>> = { en, bs }
const STORAGE_KEY = 'corner.lang'

function readStoredLang(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'en' || v === 'bs') return v
  } catch {
    // storage blocked (private mode) — fall through to default
  }
  return 'en'
}

interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
  /** UI string by key, with optional {name} replacements. */
  t: (key: MessageKey, vars?: Record<string, string | number>) => string
  /** Pick the current language from a bilingual data value. */
  l: (text: L10n) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // not persisted; still switches for this session
    }
  }, [])

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => {
        let s = messages[lang][key] ?? en[key]
        if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
        return s
      },
      l: (text) => text[lang] || text.en,
    }),
    [lang, setLang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useT() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useT must be used inside I18nProvider')
  return ctx
}
