import { Home, LogOut, UserCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Header() {
  const { currentUser, currentMember, logout } = useApp()
  const displayName = currentMember?.name || currentUser?.name

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 shrink-0 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-teal-700 flex items-center justify-center shrink-0">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 leading-tight">
            <span className="block font-bold text-lg text-slate-900 tracking-tight">
              RentRight
            </span>
            <span className="block text-xs text-slate-500 truncate">
              Shared rental management
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3 shrink-0">
          {displayName && (
            <div className="hidden sm:flex items-center gap-1.5 text-slate-600 text-sm max-w-[12rem]">
              <UserCircle className="w-5 h-5 shrink-0" />
              <span className="truncate">{displayName}</span>
            </div>
          )}

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-lg"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>
    </header>
  )
}
