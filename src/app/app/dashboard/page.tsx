'use client';

import { useAuthStore } from '@/store/auth.store';
import { TenantDashboard } from '@/components/dashboard/TenantDashboard';
import { LeaseholderDashboard } from '@/components/dashboard/LeaseholderDashboard';
import { PropertyManagerDashboard } from '@/components/dashboard/PropertyManagerDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';

export default function DashboardPage() {
  const { user } = useAuthStore();

  if (!user) return null;

  switch (user.role) {
    case 'tenant':
      return <TenantDashboard user={user} />;
    case 'leaseholder':
      return <LeaseholderDashboard user={user} />;
    case 'property_manager':
      return <PropertyManagerDashboard user={user} />;
    case 'admin':
      return <AdminDashboard user={user} />;
    default:
      return <TenantDashboard user={user} />;
  }
}
