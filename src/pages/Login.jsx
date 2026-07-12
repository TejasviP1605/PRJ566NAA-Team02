import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Login() {
  const { isAuthenticated, login, isConfigured, loading } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && isAuthenticated) return <Navigate to="/" replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    const result = await login({ email, password })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    navigate(location.state?.from?.pathname || '/', { replace: true })
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-teal-700 flex items-center justify-center shrink-0">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div className="leading-tight">
            <h1 className="text-2xl font-bold text-slate-900">RentRight</h1>
            <p className="text-sm text-slate-500">Log in to your account</p>
          </div>
        </div>

        {!isConfigured && (
          <p className="rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm px-3 py-2 mb-4">
            Add Supabase keys to <code className="text-xs">.env</code> (see <code className="text-xs">.env.example</code>).
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !isConfigured}
            className="w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-semibold px-4 py-2.5 rounded-lg text-sm"
          >
            {submitting ? 'Signing in…' : 'Log In'}
          </button>
        </form>

        <p className="text-sm text-slate-600 mt-6 text-center">
          Need an account?{' '}
          <Link to="/register" className="font-semibold text-teal-800 hover:underline">
            Register
          </Link>
        </p>

        <p className="text-xs text-slate-500 mt-4 text-center">
          Your account and household data are stored in Supabase.
        </p>
      </section>
    </main>
  )
}
