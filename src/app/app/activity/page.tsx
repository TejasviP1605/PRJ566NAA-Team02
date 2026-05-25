'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Filter } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

import { activityService } from '@/lib/api/activity.service';
import { useAuthStore } from '@/store/auth.store';
import { formatRelativeDate, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import { Avatar } from '@/components/ui/Avatar';
import type { ActivityLog, ActivityAction } from '@/types';

const ACTION_BADGE: Partial<Record<ActivityAction, 'success' | 'warning' | 'info' | 'danger' | 'muted'>> = {
  expense_created: 'info',
  expense_settled: 'success',
  payment_marked_paid: 'success',
  payment_reminder_sent: 'warning',
  maintenance_submitted: 'info',
  maintenance_resolved: 'success',
  maintenance_updated: 'warning',
  document_uploaded: 'muted',
  member_joined: 'success',
  member_removed: 'danger',
  role_changed: 'warning',
};

const ACTION_LABEL: Partial<Record<ActivityAction, string>> = {
  expense_created: 'Expense',
  expense_settled: 'Settled',
  payment_marked_paid: 'Payment',
  maintenance_submitted: 'Maintenance',
  maintenance_resolved: 'Resolved',
  maintenance_updated: 'Updated',
  document_uploaded: 'Document',
  member_joined: 'Member',
  member_removed: 'Removed',
  user_login: 'Login',
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: { duration: 0.2 } } };

export default function ActivityPage() {
  const { user } = useAuthStore();
  const [filter, setFilter] = useState<'all' | 'expense' | 'payment' | 'maintenance' | 'member'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['activity', user?.householdId],
    queryFn: () => activityService.getLogs(user?.householdId),
  });

  const logs = data?.data ?? [];
  const filtered = logs.filter((log) => {
    if (filter === 'all') return true;
    if (filter === 'expense') return log.action.startsWith('expense');
    if (filter === 'payment') return log.action.startsWith('payment');
    if (filter === 'maintenance') return log.action.startsWith('maintenance');
    if (filter === 'member') return log.action.startsWith('member') || log.action.startsWith('role');
    return true;
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="page-container max-w-3xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Log</h1>
          <p className="page-subtitle">{logs.length} events in your household</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'expense', 'payment', 'maintenance', 'member'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              filter === f ? 'bg-brand-600 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:border-surface-300'
            }`}
          >
            {f === 'all' ? 'All Activity' : f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Activity className="w-6 h-6" />}
          title="No activity yet"
          description="Household activity will appear here as events happen."
        />
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show">
          <Card padding="none">
            {/* Group by date */}
            {groupByDate(filtered).map(([dateLabel, events]) => (
              <div key={dateLabel}>
                <div className="px-5 py-3 bg-surface-50 border-b border-surface-100 first:rounded-t-xl">
                  <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">{dateLabel}</p>
                </div>
                {events.map((log, i) => (
                  <motion.div variants={item} key={log.id}>
                    <div className="flex items-start gap-4 px-5 py-4 border-b border-surface-50 last:border-0 hover:bg-surface-50/50 transition-colors">
                      <Avatar
                        firstName={log.userName.split(' ')[0] ?? 'U'}
                        lastName={log.userName.split(' ')[1] ?? ''}
                        size="sm"
                        className="mt-0.5 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <span className="text-sm font-semibold text-surface-800">{log.userName} </span>
                            <span className="text-sm text-surface-600">{log.description}</span>
                          </div>
                          {ACTION_BADGE[log.action] && ACTION_LABEL[log.action] && (
                            <Badge variant={ACTION_BADGE[log.action]!} size="sm">
                              {ACTION_LABEL[log.action]}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-surface-400 mt-1">{formatRelativeDate(log.createdAt)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function groupByDate(logs: ActivityLog[]): [string, ActivityLog[]][] {
  const groups: Record<string, ActivityLog[]> = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  logs.forEach((log) => {
    const date = new Date(log.createdAt);
    let label: string;

    if (date.toDateString() === today.toDateString()) {
      label = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = 'Yesterday';
    } else {
      label = formatDate(log.createdAt, 'EEEE, MMMM d');
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(log);
  });

  return Object.entries(groups);
}
