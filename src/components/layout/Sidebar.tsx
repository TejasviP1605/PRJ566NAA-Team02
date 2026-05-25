'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Home,
  Receipt,
  CreditCard,
  Wrench,
  FileText,
  Activity,
  Users,
  Shield,
  ScrollText,
  ChevronLeft,
  Building2,
} from 'lucide-react';
import { cn, formatRole } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { Avatar } from '@/components/ui/Avatar';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
  badge?: number;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/app/dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
    roles: ['tenant', 'leaseholder', 'property_manager', 'admin'],
  },
  {
    label: 'Household',
    href: '/app/household',
    icon: <Home className="w-4 h-4" />,
    roles: ['tenant', 'leaseholder'],
  },
  {
    label: 'Expenses',
    href: '/app/expenses',
    icon: <Receipt className="w-4 h-4" />,
    roles: ['tenant', 'leaseholder'],
  },
  {
    label: 'Payments',
    href: '/app/payments',
    icon: <CreditCard className="w-4 h-4" />,
    roles: ['tenant', 'leaseholder'],
  },
  {
    label: 'Maintenance',
    href: '/app/maintenance',
    icon: <Wrench className="w-4 h-4" />,
    roles: ['tenant', 'leaseholder', 'property_manager'],
  },
  {
    label: 'Documents',
    href: '/app/documents',
    icon: <FileText className="w-4 h-4" />,
    roles: ['tenant', 'leaseholder', 'property_manager'],
  },
  {
    label: 'Activity',
    href: '/app/activity',
    icon: <Activity className="w-4 h-4" />,
    roles: ['tenant', 'leaseholder', 'admin'],
  },
  {
    label: 'Users',
    href: '/app/admin/users',
    icon: <Users className="w-4 h-4" />,
    roles: ['admin'],
  },
  {
    label: 'Audit Logs',
    href: '/app/admin/logs',
    icon: <ScrollText className="w-4 h-4" />,
    roles: ['admin'],
  },
  {
    label: 'Security',
    href: '/app/admin/security',
    icon: <Shield className="w-4 h-4" />,
    roles: ['admin'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const visibleItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 240 : 64 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="hidden md:flex flex-col bg-surface-900 h-screen sticky top-0 shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-800">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="text-white font-bold text-lg whitespace-nowrap"
            >
              RentRight
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col gap-0.5 px-2">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!sidebarOpen ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-surface-400 hover:bg-surface-800 hover:text-white'
                )}
              >
                <span className="shrink-0">{item.icon}</span>
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Info */}
      {user && (
        <div className="border-t border-surface-800 p-3">
          <div className="flex items-center gap-3">
            <Avatar
              firstName={user.firstName}
              lastName={user.lastName}
              size="sm"
              className="shrink-0"
            />
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-white truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-surface-400 truncate">{formatRole(user.role)}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute top-5 -right-3 w-6 h-6 bg-surface-700 border border-surface-600 rounded-full flex items-center justify-center text-surface-400 hover:text-white hover:bg-surface-600 transition-colors z-10 hidden md:flex"
      >
        <motion.div animate={{ rotate: sidebarOpen ? 0 : 180 }} transition={{ duration: 0.2 }}>
          <ChevronLeft className="w-3.5 h-3.5" />
        </motion.div>
      </button>
    </motion.aside>
  );
}
