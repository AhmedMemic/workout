import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { Placeholder } from './features/Placeholder'
import { TodayPage } from './features/today/TodayPage'
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
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/plan" element={<Placeholder titleKey="plan.title" />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/exercises/:id" element={<ExerciseDetailPage />} />
          <Route path="/progress" element={<Placeholder titleKey="progress.title" />} />
          <Route path="/me" element={<Placeholder titleKey="me.title" />} />
          <Route path="/challenge" element={<Placeholder titleKey="today.challenge" />} />
          <Route path="/workout/:templateId" element={<Placeholder titleKey="today.start" />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </HashRouter>
  )
}
