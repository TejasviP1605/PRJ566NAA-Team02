import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function ProtectedRoute() {
  const { isAuthenticated, loading, isConfigured } = useApp()
  const location = useLocation()

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 text-sm px-4 text-center">
        Add <code className="mx-1">VITE_SUPABASE_URL</code> and{' '}
        <code className="mx-1">VITE_SUPABASE_PUBLISHABLE_KEY</code> to <code>.env</code>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 text-sm">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
