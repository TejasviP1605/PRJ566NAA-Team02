import { NavLink, Outlet } from 'react-router-dom'
import { Activity, Building2, FileText, Home, Receipt, Wrench } from 'lucide-react'
import Header from './Header'
import { useApp } from '../context/AppContext'

export default function Layout() {
  const { household, hasHousehold } = useApp()
  const navItems = [
    { to: '/', label: 'Household', icon: Home, end: true },
    { to: '/expenses', label: 'Expenses', icon: Receipt },
    { to: '/maintenance', label: 'Maintenance', icon: Wrench },
    { to: '/documents', label: 'Documents', icon: FileText },
    { to: '/activity', label: 'Activity', icon: Activity },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        <aside className="hidden md:flex flex-col w-64 shrink-0 space-y-4">
          <nav className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 space-y-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-800'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          {hasHousehold ? (
            <div className="p-4 bg-teal-900 rounded-xl text-teal-50 text-sm">
              <Building2 className="w-5 h-5 mb-2 opacity-80" />
              <p className="font-semibold">{household.name}</p>
              <p className="text-teal-200 text-xs mt-1">{household.unit} · {household.address}</p>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-sm">
              <Building2 className="w-5 h-5 mb-2 opacity-80" />
              <p className="font-semibold">No household yet</p>
              <p className="text-amber-800 text-xs mt-1">Create one to start tracking rent, members, and activity.</p>
            </div>
          )}
        </aside>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex justify-around py-2 z-10">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-xs ${
                isActive ? 'text-teal-700' : 'text-slate-500'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="h-16 md:hidden" />
    </div>
  )
}
