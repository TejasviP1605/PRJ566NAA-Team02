'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Wrench } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { maintenanceService } from '@/lib/api/maintenance.service';
import { useAuthStore } from '@/store/auth.store';
import { formatDate, formatRelativeDate, capitalize } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import { Avatar } from '@/components/ui/Avatar';
import type { MaintenancePriority, MaintenanceStatus } from '@/types';

const PRIORITY_BADGE: Record<MaintenancePriority, 'danger' | 'warning' | 'info' | 'muted'> = {
  urgent: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'muted',
};

const STATUS_BADGE: Record<MaintenanceStatus, 'info' | 'warning' | 'success' | 'muted'> = {
  submitted: 'info',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'muted',
};

const STATUS_LABEL: Record<MaintenanceStatus, string> = {
  submitted: 'Submitted',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

export default function MaintenancePage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<MaintenancePriority | 'all'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance', user?.householdId],
    queryFn: () => maintenanceService.getRequests(user?.householdId ?? ''),
  });

  const requests = data?.data.data ?? [];
  const filtered = requests.filter((r) => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || r.priority === priorityFilter;
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchPriority && matchSearch;
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Maintenance Requests</h1>
          <p className="page-subtitle">
            {requests.filter((r) => r.status !== 'resolved' && r.status !== 'closed').length} open ·{' '}
            {requests.filter((r) => r.status === 'resolved').length} resolved
          </p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} href="/app/maintenance/new">
          New Request
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 flex-wrap">
        <Input
          placeholder="Search requests..."
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:w-60"
        />
        <div className="flex gap-2 flex-wrap">
          {(['all', 'submitted', 'in_progress', 'resolved'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s ? 'bg-brand-600 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:border-surface-300'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'urgent', 'high', 'medium', 'low'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                priorityFilter === p ? 'bg-surface-800 text-white' : 'bg-white border border-surface-200 text-surface-600 hover:border-surface-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Wrench className="w-6 h-6" />}
          title="No maintenance requests"
          description="Submit a request when something needs attention in your household."
          action={
            <Button leftIcon={<Plus className="w-4 h-4" />} href="/app/maintenance/new">
              New Request
            </Button>
          }
        />
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
          {filtered.map((request) => (
            <motion.div variants={item} key={request.id}>
              <Link href={`/app/maintenance/${request.id}`}>
                <Card hover>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      request.priority === 'urgent' ? 'bg-red-100' :
                      request.priority === 'high' ? 'bg-amber-100' : 'bg-sky-100'
                    }`}>
                      <Wrench className={`w-5 h-5 ${
                        request.priority === 'urgent' ? 'text-red-600' :
                        request.priority === 'high' ? 'text-amber-600' : 'text-sky-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-sm font-semibold text-surface-900">{request.title}</p>
                          <p className="text-xs text-surface-500 mt-0.5 line-clamp-1">{request.description}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Badge variant={PRIORITY_BADGE[request.priority]} size="sm">
                            {capitalize(request.priority)}
                          </Badge>
                          <Badge variant={STATUS_BADGE[request.status]} size="sm">
                            {STATUS_LABEL[request.status]}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <span className="text-xs text-surface-500 capitalize">{request.category}</span>
                        <span className="text-xs text-surface-500">By {request.submittedByName}</span>
                        <span className="text-xs text-surface-400">{formatRelativeDate(request.createdAt)}</span>
                        {request.assignedToName && (
                          <span className="text-xs text-brand-600 font-medium">Assigned to {request.assignedToName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
