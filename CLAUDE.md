# CLAUDE.md

**Corner** is a personal home-workout PWA for one user (Ahmed). It covers a 3-day strength plan, daily mobility, a workout player, habits, progress and a monthly challenge. The UI is in English and Bosnian (EN/BS). It runs offline and costs nothing to host: everything is stored on the device, with no backend.

Live site: https://ahmedmemic.github.io/workout/. Every push to `main` deploys there.

## Commands

```bash
npm run dev       # Vite dev server
npm test          # vitest run (logic, db, data integrity, player steps)
npm run build     # tsc --noEmit && vite build -> dist/
npm run preview   # serve dist/ (needed to test the service worker / offline)
npm run icons     # regenerate PWA icons from public/icon.svg (pwa-assets.config.ts)
```

Before committing, run `npm test && npm run build`. CI runs both, and a failure blocks the deploy.

## Stack

- Vite 8, React 18, TypeScript (strict), npm.
- `react-router-dom` uses **HashRouter**. GitHub Pages has no SPA fallback, so keep hash routes.
- Vite `base: '/workout/'`. Asset paths and the PWA `start_url`/`scope` all depend on it.
- `vite-plugin-pwa` with `autoUpdate`. Workbox precaches the whole app. Font subsets that Bosnian doesn't need (cyrillic, greek, vietnamese) are excluded from the precache.
- Dexie (IndexedDB) with `dexie-react-hooks` (`useLiveQuery`) for all persisted data.
- Self-hosted fonts via `@fontsource` (Inter, Space Grotesk), so they work offline. Don't use Google Fonts or CDNs.
- Plain CSS: design tokens in `src/styles/tokens.css`, plus one CSS Module per component or feature.
- Vitest runs in a `node` environment, with `fake-indexeddb` for db tests.

## Layout

```
src/
  App.tsx            routes + layout + BottomNav
  components/        shared UI (ui.tsx: Button/Card/Chip…, Sheet, CheckRow, Icon, Page, LangToggle)
  data/              static typed content: exercises, chains (progression ladders), templates
                     (strength A/B/C, warm-up, cool-down, desk reset, cardio), habits, challenges, labels
  db/                db.ts (Dexie schema), settings.ts, queries.ts, backup.ts (JSON export/import)
  logic/             pure functions: dates, schedule, progression, streak, challenge
  features/<screen>/ today, player, plan, exercises, progress, challenge, me
  hooks/             useCountdown (timestamp-based), device (wake lock, beep, vibrate)
  i18n/              I18nProvider (t() for UI keys, l() for bilingual data), en.ts, bs.ts
```

## Conventions

- **Bilingual everything.** UI strings go in `src/i18n/en.ts` with the same key in `bs.ts`. `bs` is typed against `en`'s keys, so a missing key fails `tsc`. User-facing text inside data is an `L10n` (`{ en, bs }`). Exercise `steps` must have the same number of lines in both languages, and a test checks this. Bosnian is Latin script (č ć š ž đ).
- **Data integrity is tested** (`src/data/data.test.ts`). Ids must be unique. Chains and templates must reference real exercises. Slot measures (reps/time) must fit every exercise a slot can resolve to. When you add or rename an exercise, run the tests.
- **Logic stays pure** in `src/logic/` and gets unit tests. Components read data through `useLiveQuery` and the helpers in `db/queries.ts`.
- **Dates** are local `YYYY-MM-DD` strings (`ISODate`, from `logic/dates.ts`). Don't use `toISOString()` for days, because it shifts to UTC.
- **Schema changes:** add a new `this.version(n)` in `db.ts`. Never edit an existing version, because the user's real data lives in it. If you add a table, also add it to `tableNames` so backups include it.
- **Settings** are key/value rows (`db/settings.ts`), and defaults are merged in on load.
- **Styling:** use the tokens (`var(--accent)` etc.), not raw colors. The theme is dark "Graphite & Lime": bg `#0E0F11`, accent `#C8F25A`. Design for phone width first (about 390 px). Keep tap targets ≥ `--tap` (44 px). The user has eye problems, so keep contrast and text size generous.
- Match the existing style: small components, short comments only where they explain *why*, and no new dependencies unless they're clearly worth it.

## Domain rules (from the training plan)

- **Weekly schedule:** Mon A / Wed B / Fri C (strength). Tue/Thu are cardio or a walk, Sat is a long walk, Sun is rest. A missed strength day is offered as a make-up the next day.
- **Blocks:** 4 weeks, counted from the `startDate` setting. Block 1 uses 2 sets, later blocks 3. Week 4 is a deload (one set fewer).
- **Progression:** a template slot resolves to `chain.steps[level]`. If every set hits the top of the rep range, the level goes up next session. "Too hard / Too easy" moves one step for the remaining sets and saves the change.
- **Streak:** consecutive days with any activity (a session, a desk reset, or a full challenge day).
- **Monthly challenge:** one per month. The starter is 10 push-ups, a plank ramping 30→60 s, and 20 sit-ups. Ramps and day counts begin at `startDay`. Days before the start are not "missed".
- **Equipment:** 2×5 kg and 1×7 kg dumbbells, a stability ball, grip tools, a pedal resistance band, household items. No mat. A pull-up bar is optional.
- **Apartment:** exercises must be low-noise, so no jumping.
- **Food:** habits are tracked, but there is no calorie or diet tracking, because meals are shared with family.

## Deploy

`.github/workflows/deploy.yml` runs `npm ci`, `npm test` and `npm run build`, then deploys to GitHub Pages on every push to `main`. The repo must stay public for free Pages. Commit or push only when asked.
