'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
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
  X,
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
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/app/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['tenant', 'leaseholder', 'property_manager', 'admin'] },
  { label: 'Household', href: '/app/household', icon: <Home className="w-5 h-5" />, roles: ['tenant', 'leaseholder'] },
  { label: 'Expenses', href: '/app/expenses', icon: <Receipt className="w-5 h-5" />, roles: ['tenant', 'leaseholder'] },
  { label: 'Payments', href: '/app/payments', icon: <CreditCard className="w-5 h-5" />, roles: ['tenant', 'leaseholder'] },
  { label: 'Maintenance', href: '/app/maintenance', icon: <Wrench className="w-5 h-5" />, roles: ['tenant', 'leaseholder', 'property_manager'] },
  { label: 'Documents', href: '/app/documents', icon: <FileText className="w-5 h-5" />, roles: ['tenant', 'leaseholder', 'property_manager'] },
  { label: 'Activity', href: '/app/activity', icon: <Activity className="w-5 h-5" />, roles: ['tenant', 'leaseholder', 'admin'] },
  { label: 'Users', href: '/app/admin/users', icon: <Users className="w-5 h-5" />, roles: ['admin'] },
  { label: 'Audit Logs', href: '/app/admin/logs', icon: <ScrollText className="w-5 h-5" />, roles: ['admin'] },
  { label: 'Security', href: '/app/admin/security', icon: <Shield className="w-5 h-5" />, roles: ['admin'] },
];

export function MobileDrawer() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { mobileDrawerOpen, setMobileDrawerOpen } = useUIStore();

  const visibleItems = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <AnimatePresence>
      {mobileDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-surface-900/60 md:hidden"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-surface-900 flex flex-col md:hidden"
          >
            <div className="flex items-center justify-between px-4 py-5 border-b border-surface-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold text-lg">RentRight</span>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="text-surface-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 overflow-y-auto">
              <div className="flex flex-col gap-0.5 px-3">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                        isActive
                          ? 'bg-brand-600 text-white'
                          : 'text-surface-400 hover:bg-surface-800 hover:text-white'
                      )}
                    >
                      {item.icon}
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {user && (
              <div className="border-t border-surface-800 p-4">
                <div className="flex items-center gap-3">
                  <Avatar firstName={user.firstName} lastName={user.lastName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-surface-400">{formatRole(user.role)}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
