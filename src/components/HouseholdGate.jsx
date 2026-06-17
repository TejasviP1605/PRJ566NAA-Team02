import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function HouseholdGate({ title, children }) {
  const { loading, hasHousehold, hasActiveHousehold } = useApp()

  if (loading) {
    return (
      <p className="text-slate-600 text-sm py-8 text-center">Loading…</p>
    )
  }

  if (!hasHousehold || !hasActiveHousehold) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-600 text-sm mt-1">
            Create a household on the Dashboard before using this page.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <Link
            to="/"
            className="inline-flex bg-teal-700 hover:bg-teal-800 text-white font-medium px-4 py-2 rounded-lg text-sm"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return children
}
