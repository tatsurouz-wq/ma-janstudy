import { lazy, Suspense } from 'react'
import { createHashRouter, RouterProvider } from 'react-router'
import { AppShell } from './components/layout/AppShell'
import { CalculatorPage } from './features/calculator/CalculatorPage'
import { GalleryPage } from './features/gallery/GalleryPage'
import { HomePage } from './features/home/HomePage'
import { LessonPage } from './features/lessons/LessonPage'
import { PracticePage } from './features/practice/PracticePage'
import { LessonsHomePage } from './features/lessons/LessonsHomePage'
import { QuizHomePage } from './features/quiz/QuizHomePage'
import { QuizSessionPage } from './features/quiz/QuizSessionPage'

const ExperiencePage = lazy(() => import('./features/experience/ExperiencePage'))

function ExperienceRoute() {
  return (
    <Suspense
      fallback={
        <p className="py-20 text-center text-sm text-text-secondary">
          3D体験を読み込んでいます…
        </p>
      }
    >
      <ExperiencePage />
    </Suspense>
  )
}

const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'gallery', element: <GalleryPage /> },
      { path: 'calculator', element: <CalculatorPage /> },
      { path: 'quiz', element: <QuizHomePage /> },
      { path: 'quiz/:category', element: <QuizSessionPage /> },
      { path: 'lessons', element: <LessonsHomePage /> },
      { path: 'lessons/:lessonId', element: <LessonPage /> },
      { path: 'practice', element: <PracticePage /> },
    ],
  },
  { path: '/experience', element: <ExperienceRoute /> },
])

export function App() {
  return <RouterProvider router={router} />
}
