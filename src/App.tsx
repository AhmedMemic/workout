import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { Placeholder } from './features/Placeholder'
import { ExercisesPage } from './features/exercises/ExercisesPage'
import { ExerciseDetailPage } from './features/exercises/ExerciseDetailPage'
import styles from './App.module.css'

export function App() {
  return (
    <HashRouter>
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<Placeholder titleKey="today.title" />} />
          <Route path="/plan" element={<Placeholder titleKey="plan.title" />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/exercises/:id" element={<ExerciseDetailPage />} />
          <Route path="/progress" element={<Placeholder titleKey="progress.title" />} />
          <Route path="/me" element={<Placeholder titleKey="me.title" />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </HashRouter>
  )
}
