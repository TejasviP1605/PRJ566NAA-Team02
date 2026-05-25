'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Home,
  Activity,
  Shield,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

import type { User } from '@/types';
import { activityService } from '@/lib/api/activity.service';
import { mockUsers } from '@/data/mock';
import { formatRelativeDate, formatRole, formatDate } from '@/lib/utils';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { PageLoader } from '@/components/ui/Spinner';

const userGrowthData = [
  { month: 'Jan', users: 12 },
  { month: 'Feb', users: 18 },
  { month: 'Mar', users: 23 },
  { month: 'Apr', users: 31 },
  { month: 'May', users: 38 },
  { month: 'Jun', users: 42 },
];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export function AdminDashboard({ user }: { user: User }) {
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: () => activityService.getLogs(),
  });

  const logs = logsData?.data ?? [];
  const users = mockUsers;

  const roleBreakdown = {
    tenants: users.filter((u) => u.role === 'tenant').length,
    leaseholders: users.filter((u) => u.role === 'leaseholder').length,
    managers: users.filter((u) => u.role === 'property_manager').length,
    admins: users.filter((u) => u.role === 'admin').length,
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="page-container">
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item} className="page-header">
          <div>
            <h1 className="page-title">System Overview</h1>
            <p className="page-subtitle">Monitor platform activity, users, and system health</p>
          </div>
          <div className="flex gap-2">
            <Button leftIcon={<Users className="w-4 h-4" />} variant="outline" size="sm" href="/app/admin/users">
              Manage Users
            </Button>
            <Button leftIcon={<Activity className="w-4 h-4" />} size="sm" href="/app/admin/logs">
              Audit Logs
            </Button>
          </div>
        </motion.div>

        {/* System Health Banner */}
        <motion.div variants={item}>
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-800">All systems operational</p>
              <p className="text-xs text-emerald-600">Last checked: just now · Uptime: 99.98%</p>
            </div>
            <Badge variant="success" size="sm">Healthy</Badge>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={users.length}
            subtitle="Registered accounts"
            icon={<Users className="w-5 h-5 text-brand-600" />}
            iconBg="bg-brand-100"
            trend={{ value: 10.5, label: 'this month' }}
          />
          <StatCard
            title="Households"
            value={1}
            subtitle="Active households"
            icon={<Home className="w-5 h-5 text-emerald-600" />}
            iconBg="bg-emerald-100"
          />
          <StatCard
            title="Active Users"
            value={users.filter((u) => u.isVerified).length}
            subtitle="Verified accounts"
            icon={<CheckCircle className="w-5 h-5 text-sky-600" />}
            iconBg="bg-sky-100"
          />
          <StatCard
            title="Security Events"
            value={0}
            subtitle="Past 24 hours"
            icon={<Shield className="w-5 h-5 text-amber-600" />}
            iconBg="bg-amber-100"
          />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* User Growth Chart */}
          <motion.div variants={item} className="lg:col-span-2">
            <Card>
              <CardHeader title="User Growth" subtitle="New registrations over 6 months" />
              <div className="mt-4 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowthData}>
                    <defs>
                      <linearGradient id="gradient-users" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} fill="url(#gradient-users)" name="Users" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Role Breakdown */}
          <motion.div variants={item}>
            <Card className="h-full">
              <CardHeader title="Users by Role" />
              <div className="mt-4 space-y-3">
                {[
                  { label: 'Tenants', count: roleBreakdown.tenants, color: 'bg-brand-500' },
                  { label: 'Leaseholders', count: roleBreakdown.leaseholders, color: 'bg-emerald-500' },
                  { label: 'Property Managers', count: roleBreakdown.managers, color: 'bg-amber-500' },
                  { label: 'Admins', count: roleBreakdown.admins, color: 'bg-purple-500' },
                ].map(({ label, count, color }) => {
                  const pct = users.length > 0 ? Math.round((count / users.length) * 100) : 0;
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-surface-700">{label}</span>
                        <span className="text-xs text-surface-500">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Users */}
          <motion.div variants={item}>
            <Card>
              <CardHeader
                title="All Users"
                action={
                  <Link href="/app/admin/users" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                    Manage <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              />
              <div className="mt-4 space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3">
                    <Avatar firstName={u.firstName} lastName={u.lastName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-800 truncate">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-surface-500 truncate">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={u.role === 'admin' ? 'default' : 'muted'} size="sm">
                        {formatRole(u.role)}
                      </Badge>
                      {!u.isVerified && (
                        <p className="text-xs text-amber-500 mt-0.5">Unverified</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Activity Feed */}
          <motion.div variants={item}>
            <Card>
              <CardHeader
                title="Recent Activity"
                action={
                  <Link href="/app/admin/logs" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                    All logs <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              />
              <div className="mt-4 space-y-3">
                {logs.slice(0, 6).map((log) => (
                  <div key={log.id} className="flex gap-3">
                    <div className="w-1.5 h-1.5 bg-brand-400 rounded-full mt-2 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-surface-800">{log.userName}</p>
                      <p className="text-xs text-surface-500">{log.description}</p>
                      <p className="text-xs text-surface-400 mt-0.5">{formatRelativeDate(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
