import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import AppLayout from '@/components/layout/AppLayout'
import { lazy, Suspense } from 'react'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const ContactsPage = lazy(() => import('@/pages/ContactsPage'))
const CompaniesPage = lazy(() => import('@/pages/CompaniesPage'))
const LeadsPage = lazy(() => import('@/pages/LeadsPage'))
const PipelinePage = lazy(() => import('@/pages/PipelinePage'))
const TasksPage = lazy(() => import('@/pages/TasksPage'))
const InvoicesPage = lazy(() => import('@/pages/InvoicesPage'))
const EmailPage = lazy(() => import('@/pages/EmailPage'))
const StatsPage = lazy(() => import('@/pages/StatsPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }
  return <>{children}</>
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

function RequireRole({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

const Loader = () => (
  <div className="flex h-64 items-center justify-center">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
  </div>
)

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Loader />}>{children}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <RequireGuest><S><LoginPage /></S></RequireGuest>,
  },
  {
    path: '/register',
    element: <RequireGuest><S><RegisterPage /></S></RequireGuest>,
  },
  {
    path: '/forgot-password',
    element: <RequireGuest><S><ForgotPasswordPage /></S></RequireGuest>,
  },
  {
    path: '/reset-password',
    element: <RequireGuest><S><ResetPasswordPage /></S></RequireGuest>,
  },
  {
    element: <RequireAuth><AppLayout /></RequireAuth>,
    children: [
      { path: '/', element: <S><DashboardPage /></S> },
      { path: '/contacts', element: <S><ContactsPage /></S> },
      { path: '/companies', element: <S><CompaniesPage /></S> },
      { path: '/leads', element: <S><LeadsPage /></S> },
      { path: '/pipeline', element: <S><PipelinePage /></S> },
      { path: '/tasks', element: <S><TasksPage /></S> },
      {
        path: '/invoices',
        element: (
          <RequireRole roles={['admin', 'commercial']}>
            <S><InvoicesPage /></S>
          </RequireRole>
        ),
      },
      {
        path: '/email',
        element: (
          <RequireRole roles={['admin', 'commercial']}>
            <S><EmailPage /></S>
          </RequireRole>
        ),
      },
      {
        path: '/stats',
        element: (
          <RequireRole roles={['admin', 'commercial']}>
            <S><StatsPage /></S>
          </RequireRole>
        ),
      },
      { path: '/settings', element: <S><SettingsPage /></S> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
