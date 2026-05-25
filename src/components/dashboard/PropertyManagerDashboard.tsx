'use client';

import { useQuery } from '@tanstack/react-query';
import { Wrench, Clock, CheckCircle, AlertTriangle, ArrowRight, Filter } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

import type { User } from '@/types';
import { maintenanceService } from '@/lib/api/maintenance.service';
import { formatDate, formatRelativeDate, capitalize } from '@/lib/utils';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';

const weeklyData = [
  { day: 'Mon', submitted: 2, resolved: 1 },
  { day: 'Tue', submitted: 1, resolved: 2 },
  { day: 'Wed', submitted: 3, resolved: 1 },
  { day: 'Thu', submitted: 0, resolved: 3 },
  { day: 'Fri', submitted: 1, resolved: 1 },
  { day: 'Sat', submitted: 2, resolved: 0 },
  { day: 'Sun', submitted: 0, resolved: 1 },
];

const priorityColors: Record<string, string> = {
  urgent: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'muted',
};

const statusColors: Record<string, 'info' | 'warning' | 'success' | 'muted'> = {
  submitted: 'info',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'muted',
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export function PropertyManagerDashboard({ user }: { user: User }) {
  const { data: maintenanceData, isLoading } = useQuery({
    queryKey: ['maintenance-all'],
    queryFn: () => maintenanceService.getRequests('household-1'),
  });

  const tickets = maintenanceData?.data.data ?? [];

  const submitted = tickets.filter((t) => t.status === 'submitted').length;
  const inProgress = tickets.filter((t) => t.status === 'in_progress').length;
  const resolved = tickets.filter((t) => t.status === 'resolved').length;
  const urgent = tickets.filter((t) => t.priority === 'urgent').length;

  if (isLoading) return <PageLoader />;

  return (
    <div className="page-container">
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item} className="page-header">
          <div>
            <h1 className="page-title">Maintenance Overview</h1>
            <p className="page-subtitle">Track and manage all maintenance requests</p>
          </div>
          <Button leftIcon={<Filter className="w-4 h-4" />} variant="outline" size="sm" href="/app/maintenance">
            View All Tickets
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Submitted"
            value={submitted}
            subtitle="Awaiting action"
            icon={<Clock className="w-5 h-5 text-sky-600" />}
            iconBg="bg-sky-100"
          />
          <StatCard
            title="In Progress"
            value={inProgress}
            subtitle="Being addressed"
            icon={<Wrench className="w-5 h-5 text-amber-600" />}
            iconBg="bg-amber-100"
          />
          <StatCard
            title="Resolved"
            value={resolved}
            subtitle="This month"
            icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
            iconBg="bg-emerald-100"
          />
          <StatCard
            title="Urgent"
            value={urgent}
            subtitle={urgent > 0 ? 'Needs immediate attention' : 'No urgent tickets'}
            icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
            iconBg="bg-red-100"
          />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Weekly Activity Chart */}
          <motion.div variants={item} className="lg:col-span-2">
            <Card>
              <CardHeader title="Weekly Activity" subtitle="Tickets submitted vs resolved this week" />
              <div className="mt-4 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Bar dataKey="submitted" fill="#6366f1" radius={[4, 4, 0, 0]} name="Submitted" />
                    <Bar dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} name="Resolved" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Priority Breakdown */}
          <motion.div variants={item}>
            <Card className="h-full">
              <CardHeader title="By Priority" />
              <div className="mt-4 space-y-3">
                {(['urgent', 'high', 'medium', 'low'] as const).map((priority) => {
                  const count = tickets.filter((t) => t.priority === priority).length;
                  const pct = tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0;
                  return (
                    <div key={priority}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-surface-700 capitalize">{priority}</span>
                        <span className="text-xs text-surface-500">{count}</span>
                      </div>
                      <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${priority === 'urgent' ? 'bg-red-500' : priority === 'high' ? 'bg-amber-500' : priority === 'medium' ? 'bg-brand-500' : 'bg-surface-300'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* All Tickets Table */}
        <motion.div variants={item}>
          <Card padding="none">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
              <div>
                <h3 className="text-sm font-semibold text-surface-900">All Tickets</h3>
                <p className="text-xs text-surface-500 mt-0.5">{tickets.length} total maintenance requests</p>
              </div>
              <Link href="/app/maintenance" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-surface-100">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/app/maintenance/${ticket.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-surface-50/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800 group-hover:text-brand-600 transition-colors truncate">
                      {ticket.title}
                    </p>
                    <p className="text-xs text-surface-500 mt-0.5">
                      {ticket.submittedByName} · {formatDate(ticket.createdAt, 'MMM d')}
                    </p>
                  </div>
                  <div className="hidden sm:block text-xs text-surface-500">
                    {capitalize(ticket.category)}
                  </div>
                  <Badge variant={priorityColors[ticket.priority] as 'danger' | 'warning' | 'info' | 'muted'} size="sm">
                    {capitalize(ticket.priority)}
                  </Badge>
                  <Badge variant={statusColors[ticket.status]} size="sm">
                    {ticket.status === 'in_progress' ? 'In Progress' : capitalize(ticket.status)}
                  </Badge>
                </Link>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
