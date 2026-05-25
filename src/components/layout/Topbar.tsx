'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Menu, Settings, LogOut, User, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatRole, formatRelativeDate } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { authService } from '@/lib/api/auth.service';
import { Avatar } from '@/components/ui/Avatar';
import Link from 'next/link';

export function Topbar() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { toggleMobileDrawer, notifications, unreadCount, markNotificationRead, markAllNotificationsRead } =
    useUIStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    clearAuth();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-surface-200 h-14 flex items-center px-4 gap-3">
      {/* Mobile menu toggle */}
      <button
        onClick={toggleMobileDrawer}
        className="md:hidden p-2 rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-700"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      {/* Notifications */}
      <div ref={notifRef} className="relative">
        <button
          onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
          className="relative p-2 rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 bg-white border border-surface-200 rounded-xl shadow-dropdown overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100">
                <span className="text-sm font-semibold text-surface-900">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-surface-500 text-center py-8">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.actionUrl ?? '#'}
                      onClick={() => { markNotificationRead(n.id); setNotifOpen(false); }}
                      className={cn(
                        'flex gap-3 px-4 py-3 hover:bg-surface-50 transition-colors border-b border-surface-50 last:border-0',
                        !n.isRead && 'bg-brand-50/60'
                      )}
                    >
                      {!n.isRead && (
                        <div className="w-2 h-2 bg-brand-500 rounded-full mt-1.5 shrink-0" />
                      )}
                      <div className={cn('flex-1 min-w-0', n.isRead && 'ml-5')}>
                        <p className="text-xs font-semibold text-surface-800">{n.title}</p>
                        <p className="text-xs text-surface-500 mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-xs text-surface-400 mt-1">{formatRelativeDate(n.createdAt)}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile dropdown */}
      <div ref={profileRef} className="relative">
        <button
          onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-100 transition-colors"
        >
          <Avatar firstName={user.firstName} lastName={user.lastName} size="sm" />
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-surface-900 leading-none">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-surface-500 mt-0.5">{formatRole(user.role)}</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-surface-400 hidden sm:block" />
        </button>

        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-52 bg-white border border-surface-200 rounded-xl shadow-dropdown overflow-hidden"
            >
              <div className="px-3 py-2.5 border-b border-surface-100">
                <p className="text-xs font-semibold text-surface-900">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-surface-500 mt-0.5 truncate">{user.email}</p>
              </div>
              <div className="py-1">
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors">
                  <User className="w-4 h-4 text-surface-400" />
                  Profile
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors">
                  <Settings className="w-4 h-4 text-surface-400" />
                  Settings
                </button>
              </div>
              <div className="border-t border-surface-100 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
