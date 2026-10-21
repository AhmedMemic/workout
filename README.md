# Corner

A personal home-workout app: a daily plan, a guided workout player, habits and progress, in **English and Bosnian**.
It runs fully in the browser, works offline, and keeps all data on your device. No server, no account, no cost.

**App:** https://ahmedmemic.github.io/workout/

## Install on your phone

1. Open the link above in Chrome (Android) or Safari (iPhone).
2. Android: menu ⋮ → **Install app** / **Add to Home screen**. iPhone: Share → **Add to Home Screen**.
3. Open Corner from the home-screen icon. It works without internet after the first load.

The same works on a computer (Chrome/Edge: install icon in the address bar).

## Your data

Everything is stored in the browser on that device (IndexedDB). Phone and computer do **not** sync.
Use **Me → Export backup** now and then, and **Import backup** to move data to another device.
Clearing the browser's site data deletes it, so keep a recent backup.

## What's in v1

- **Today**: tonight's session (with a make-up for a missed strength day), desk reset, monthly challenge, steps, weigh-in, food habits, streak
- **Workout player**: warm-up → paired sets with rest timer → grip finisher → cool-down; beeps and vibration, screen stays on,
  too hard / too easy, resume an unfinished session, automatic progression to harder exercises
- **Plan**: weekly schedule, 4-week blocks (week 4 lighter), session preview, ladder positions
- **Exercises**: 69 exercises with EN/BS names, steps, muscles, equipment and YouTube how-to search
- **Monthly challenge**: calendar, ramping targets, ideas library
- **Progress**: weight with 7-day average, workout history, baseline / re-test results
- **Me**: language, program start date, step goal, playlist and walk-out song links, backup

## Development

```bash
npm install
npm run dev      # http://localhost:5173/workout/
npm test         # vitest: data integrity, schedule, progression, streak, challenge, backup, player steps
npm run build    # type-check + production build into dist/
npm run icons    # regenerate PWA icons from public/icon.svg
```

Stack: Vite + React + TypeScript, Dexie (IndexedDB), vite-plugin-pwa. Every push to `main` is tested, built and deployed to
GitHub Pages by `.github/workflows/deploy.yml`.

### Where things live

| Path | What |
| --- | --- |
| `src/data/` | Exercises, progression chains, workout templates, habits, challenges (all bilingual) |
| `src/logic/` | Pure functions: dates, schedule, progression, streak, challenge ramps |
| `src/db/` | Dexie schema, settings, queries, backup |
| `src/features/` | Screens: today, player, plan, exercises, progress, challenge, me |
| `src/i18n/` | UI strings (`en.ts`, `bs.ts`) and the language provider |
| `src/styles/tokens.css` | Graphite & Lime theme tokens |

To add a UI string, add the key to `en.ts`; TypeScript then requires it in `bs.ts` too.
