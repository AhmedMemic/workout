import { useEffect, type ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { TodayPage } from './features/today/TodayPage'
import { PlayerPage } from './features/player/PlayerPage'
import { ChallengePage } from './features/challenge/ChallengePage'
import { PlanPage } from './features/plan/PlanPage'
import { ProgressPage } from './features/progress/ProgressPage'
import { MePage } from './features/me/MePage'
import { ExercisesPage } from './features/exercises/ExercisesPage'
import { ExerciseDetailPage } from './features/exercises/ExerciseDetailPage'
import { ensureStartDate } from './db/settings'
import { ensureChallenge } from './db/queries'
import { monthKey, today } from './logic/dates'
import styles from './App.module.css'

export function App() {
  useEffect(() => {
    void ensureStartDate()
    void ensureChallenge(monthKey(today()))
  }, [])

  return (
    <HashRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/exercises/:id" element={<ExerciseDetailPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/me" element={<MePage />} />
          <Route path="/challenge" element={<ChallengePage />} />
          <Route path="/workout/:templateId" element={<PlayerPage />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </Shell>
    </HashRouter>
  )
}

/** Bottom nav on every screen except the full-screen workout player. */
function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  if (pathname.startsWith('/workout/')) return <>{children}</>
  return (
    <>
      <main className={styles.main}>{children}</main>
      <BottomNav />
    </>
  )
}
