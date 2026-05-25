'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

import { activityService } from '@/lib/api/activity.service';
import { formatDate, formatRelativeDate } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { PageLoader } from '@/components/ui/Spinner';
import type { ActivityAction } from '@/types';

const ACTION_BADGE: Partial<Record<ActivityAction, 'success' | 'warning' | 'info' | 'danger' | 'muted'>> = {
  expense_created: 'info',
  expense_settled: 'success',
  payment_marked_paid: 'success',
  maintenance_submitted: 'info',
  maintenance_resolved: 'success',
  document_uploaded: 'muted',
  member_joined: 'success',
  member_removed: 'danger',
  role_changed: 'warning',
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } };

export default function AdminLogsPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => activityService.getLogs(),
  });

  const logs = data?.data ?? [];
  const filtered = logs.filter((log) =>
    `${log.userName} ${log.description}`.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <PageLoader />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">{logs.length} total events</p>
        </div>
      </div>

      <div className="mb-5">
        <Input
          placeholder="Search logs..."
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <Card padding="none">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-12 px-5 py-3 border-b border-surface-100 bg-surface-50">
          <span className="col-span-3 text-xs font-semibold text-surface-500 uppercase tracking-wide">User</span>
          <span className="col-span-5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Action</span>
          <span className="col-span-2 text-xs font-semibold text-surface-500 uppercase tracking-wide">Type</span>
          <span className="col-span-2 text-xs font-semibold text-surface-500 uppercase tracking-wide">Time</span>
        </div>

        <motion.div variants={stagger} initial="hidden" animate="show">
          {filtered.map((log) => (
            <motion.div variants={item} key={log.id}>
              <div className="grid sm:grid-cols-12 px-5 py-4 border-b border-surface-50 last:border-0 hover:bg-surface-50/50 transition-colors items-center gap-3 sm:gap-0">
                <div className="sm:col-span-3 flex items-center gap-2">
                  <Avatar
                    firstName={log.userName.split(' ')[0] ?? 'U'}
                    lastName={log.userName.split(' ')[1] ?? ''}
                    size="xs"
                  />
                  <span className="text-sm font-medium text-surface-800 truncate">{log.userName}</span>
                </div>
                <div className="sm:col-span-5">
                  <p className="text-sm text-surface-600">{log.description}</p>
                </div>
                <div className="sm:col-span-2">
                  {ACTION_BADGE[log.action] && (
                    <Badge variant={ACTION_BADGE[log.action]!} size="sm">
                      {log.action.replace(/_/g, ' ')}
                    </Badge>
                  )}
                </div>
                <div className="sm:col-span-2 text-right">
                  <p className="text-xs text-surface-500">{formatRelativeDate(log.createdAt)}</p>
                  <p className="text-xs text-surface-400">{formatDate(log.createdAt, 'MMM d, HH:mm')}</p>
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-surface-400">
              <p className="text-sm">No logs found</p>
            </div>
          )}
        </motion.div>
      </Card>
    </div>
  );
}
