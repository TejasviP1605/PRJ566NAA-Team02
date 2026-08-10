import { NavLink, Outlet } from 'react-router-dom'
import { Activity, Building2, FileText, LayoutDashboard, Receipt, Users, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import Header from './Header'
import { useApp } from '../context/AppContext'

export default function Layout() {
  const { household, households, householdId, members, setActiveHousehold, hasHousehold } = useApp()
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/expenses', label: 'Expenses', icon: Receipt },
    { to: '/maintenance', label: 'Maintenance', icon: Wrench },
    { to: '/documents', label: 'Documents', icon: FileText },
    { to: '/activity', label: 'Activity', icon: Activity },
  ]

  const handleHouseholdChange = async (event) => {
    const nextId = event.target.value
    if (nextId && nextId !== householdId) {
      await setActiveHousehold(nextId)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        <aside className="hidden md:flex flex-col w-64 shrink-0 space-y-4">
          {hasHousehold ? (
            <div className="p-4 bg-teal-900 rounded-xl text-teal-50 text-sm space-y-3">
              <div className="flex items-start gap-2">
                <Building2 className="w-5 h-5 opacity-80 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  {households.length > 1 ? (
                    <div>
                      <label className="text-teal-200 text-xs block mb-1">Active household</label>
                      <select
                        value={householdId ?? ''}
                        onChange={handleHouseholdChange}
                        className="w-full rounded-lg border border-teal-700 bg-teal-800 text-teal-50 text-sm px-2 py-1.5"
                      >
                        {households.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className="font-semibold truncate">{household?.name}</p>
                  )}
                  {household && (
                    <>
                      {household.unit && (
                        <p className="text-teal-100 text-xs mt-1">{household.unit}</p>
                      )}
                      <p className="text-teal-200 text-xs mt-1 leading-relaxed">{household.address}</p>
                      <p className="text-teal-300 text-xs mt-2 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {members.length} member{members.length === 1 ? '' : 's'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-sm">
              <Building2 className="w-5 h-5 mb-2 opacity-80" />
              <p className="font-semibold">No household yet</p>
              <p className="text-amber-800 text-xs mt-1">
                Create one from{' '}
                <Link to="/profile" className="font-medium underline">
                  Profile
                </Link>
                .
              </p>
            </div>
          )}

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
