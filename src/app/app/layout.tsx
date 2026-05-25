'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { notificationService } from '@/lib/api/activity.service';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { MobileDrawer } from '@/components/layout/MobileDrawer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { setNotifications } = useUIStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user) {
      notificationService.getNotifications(user.id).then((res) => {
        setNotifications(res.data);
      });
    }
  }, [isAuthenticated, user, router, setNotifications]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      <Sidebar />
      <MobileDrawer />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
