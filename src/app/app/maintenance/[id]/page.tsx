'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, CheckCircle, Clock, Wrench, AlertTriangle, User } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { maintenanceService } from '@/lib/api/maintenance.service';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatRelativeDate, capitalize } from '@/lib/utils';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Spinner';
import type { MaintenanceStatus } from '@/types';

const STATUS_FLOW: { status: MaintenanceStatus; label: string; next: MaintenanceStatus | null }[] = [
  { status: 'submitted', label: 'Submitted', next: 'in_progress' },
  { status: 'in_progress', label: 'In Progress', next: 'resolved' },
  { status: 'resolved', label: 'Resolved', next: null },
];

const PRIORITY_CONFIG = {
  urgent: { icon: <AlertTriangle className="w-5 h-5 text-red-600" />, bg: 'bg-red-100', label: 'Urgent' },
  high: { icon: <AlertTriangle className="w-5 h-5 text-amber-600" />, bg: 'bg-amber-100', label: 'High' },
  medium: { icon: <Wrench className="w-5 h-5 text-sky-600" />, bg: 'bg-sky-100', label: 'Medium' },
  low: { icon: <Wrench className="w-5 h-5 text-surface-400" />, bg: 'bg-surface-100', label: 'Low' },
};

export default function MaintenanceDetailPage() {
  const params = useParams();
  const { user } = useAuthStore();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [updateModal, setUpdateModal] = useState(false);
  const [updateNote, setUpdateNote] = useState('');
  const requestId = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance-request', requestId],
    queryFn: () => maintenanceService.getRequest(requestId),
  });

  const updateMutation = useMutation({
    mutationFn: ({ status, note }: { status: MaintenanceStatus; note: string }) =>
      maintenanceService.updateStatus(requestId, status, note, user?.id ?? '', `${user?.firstName} ${user?.lastName}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-request', requestId] });
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      success('Status updated');
      setUpdateModal(false);
      setUpdateNote('');
    },
    onError: () => error('Failed to update status'),
  });

  const request = data?.data;
  const canUpdate = user?.role === 'property_manager' || user?.role === 'leaseholder' || user?.role === 'admin';

  if (isLoading) return <PageLoader />;
  if (!request) return <div className="page-container"><p>Request not found.</p></div>;

  const currentStatusIndex = STATUS_FLOW.findIndex((s) => s.status === request.status);
  const nextStatus = STATUS_FLOW[currentStatusIndex]?.next;
  const priorityConfig = PRIORITY_CONFIG[request.priority];

  return (
    <div className="page-container max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/app/maintenance" className="text-surface-400 hover:text-surface-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="page-title">{request.title}</h1>
          <p className="page-subtitle capitalize">{request.category} · {formatDate(request.createdAt)}</p>
        </div>
        {canUpdate && nextStatus && (
          <Button size="sm" onClick={() => setUpdateModal(true)}>
            Update Status
          </Button>
        )}
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        {/* Header Card */}
        <Card>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${priorityConfig.bg}`}>
              {priorityConfig.icon}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant={request.priority === 'urgent' ? 'danger' : request.priority === 'high' ? 'warning' : 'info'} size="md">
                  {priorityConfig.label} Priority
                </Badge>
                <Badge
                  variant={request.status === 'submitted' ? 'info' : request.status === 'in_progress' ? 'warning' : 'success'}
                  size="md"
                >
                  {request.status === 'in_progress' ? 'In Progress' : capitalize(request.status)}
                </Badge>
              </div>
              <p className="text-sm text-surface-700 leading-relaxed">{request.description}</p>
              <div className="grid sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-surface-100">
                <div>
                  <p className="text-xs text-surface-500 uppercase tracking-wide">Submitted by</p>
                  <p className="text-sm font-medium text-surface-800 mt-0.5">{request.submittedByName}</p>
                </div>
                {request.assignedToName && (
                  <div>
                    <p className="text-xs text-surface-500 uppercase tracking-wide">Assigned to</p>
                    <p className="text-sm font-medium text-surface-800 mt-0.5">{request.assignedToName}</p>
                  </div>
                )}
                {request.resolvedAt && (
                  <div>
                    <p className="text-xs text-surface-500 uppercase tracking-wide">Resolved</p>
                    <p className="text-sm font-medium text-surface-800 mt-0.5">{formatDate(request.resolvedAt)}</p>
                  </div>
                )}
                {request.actualCost != null && (
                  <div>
                    <p className="text-xs text-surface-500 uppercase tracking-wide">Actual Cost</p>
                    <p className="text-sm font-medium text-surface-800 mt-0.5">${request.actualCost}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Progress Timeline */}
        <Card>
          <CardHeader title="Progress" />
          <div className="mt-4">
            {/* Status dots */}
            <div className="flex items-center gap-0 mb-4">
              {STATUS_FLOW.map((step, i) => {
                const isCompleted = i <= currentStatusIndex;
                const isCurrent = i === currentStatusIndex;
                return (
                  <div key={step.status} className="flex items-center flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                      isCurrent ? 'border-brand-600 bg-brand-600' :
                      isCompleted ? 'border-emerald-500 bg-emerald-500' : 'border-surface-200 bg-white'
                    }`}>
                      {isCompleted && !isCurrent ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : isCurrent ? (
                        <Clock className="w-4 h-4 text-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-surface-200" />
                      )}
                    </div>
                    {i < STATUS_FLOW.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 ${isCompleted && i < currentStatusIndex ? 'bg-emerald-500' : 'bg-surface-100'}`} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between">
              {STATUS_FLOW.map((step) => (
                <span key={step.status} className="text-xs text-surface-500 w-1/3 text-center first:text-left last:text-right">
                  {step.label}
                </span>
              ))}
            </div>
          </div>

          {/* History */}
          <div className="mt-5 pt-4 border-t border-surface-100 space-y-4">
            {request.statusHistory.map((entry, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    entry.status === 'resolved' ? 'bg-emerald-100' :
                    entry.status === 'in_progress' ? 'bg-amber-100' : 'bg-sky-100'
                  }`}>
                    {entry.status === 'resolved' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> :
                     entry.status === 'in_progress' ? <Wrench className="w-3.5 h-3.5 text-amber-600" /> :
                     <Clock className="w-3.5 h-3.5 text-sky-600" />}
                  </div>
                  {i < request.statusHistory.length - 1 && (
                    <div className="w-px flex-1 bg-surface-100 my-1" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-xs font-semibold text-surface-800">{entry.updatedByName}</p>
                  <p className="text-xs text-surface-600 mt-0.5">{entry.note}</p>
                  <p className="text-xs text-surface-400 mt-0.5">{formatRelativeDate(entry.updatedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Update Modal */}
      <Modal
        isOpen={updateModal}
        onClose={() => { setUpdateModal(false); setUpdateNote(''); }}
        title="Update Status"
        description={nextStatus ? `Move ticket to "${capitalize(nextStatus)}"` : ''}
        size="sm"
      >
        <div className="space-y-4">
          <Textarea
            label="Update note"
            placeholder="Describe what actions were taken or are planned..."
            rows={3}
            value={updateNote}
            onChange={(e) => setUpdateNote(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setUpdateModal(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              isLoading={updateMutation.isPending}
              disabled={!updateNote.trim()}
              onClick={() => nextStatus && updateMutation.mutate({ status: nextStatus, note: updateNote })}
            >
              {nextStatus === 'in_progress' ? 'Start Progress' : 'Mark Resolved'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
