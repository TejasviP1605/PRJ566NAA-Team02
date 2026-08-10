import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Home, LogOut, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function Header() {
  const { currentUser, currentMember, logout } = useApp()
  const displayName = currentMember?.name || currentUser?.name || 'Account'
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition-colors"
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <span className="w-9 h-9 rounded-full bg-teal-700 text-white text-sm font-semibold flex items-center justify-center shrink-0">
              {initials(displayName)}
            </span>
            <span className="hidden sm:block text-sm font-medium text-slate-800 max-w-[10rem] truncate">
              {displayName}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-30">
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  logout()
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
