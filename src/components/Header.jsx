import { Home, LogOut, RotateCcw, UserCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Header() {
  const { currentMember, logout, resetDemo } = useApp()

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-teal-700 flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900">RentRight</span>
            <p className="text-xs text-slate-500 hidden sm:block">
              Shared rental management
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            type="button"
            onClick={resetDemo}
            title="Reset demo data"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="hidden sm:flex items-center gap-1 text-slate-600 text-sm">
            <UserCircle className="w-5 h-5" />
            <span>{currentMember?.name}</span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>
    </header>
  )
}
