'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, AlertTriangle, CreditCard, Send, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';

import { paymentService } from '@/lib/api/payment.service';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, formatRelativeDate, isOverdue } from '@/lib/utils';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { PageLoader } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Payment, PaymentMethod } from '@/types';

const METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'venmo', label: 'Venmo' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'other', label: 'Other' },
];

const statusBadge: Record<Payment['status'], 'success' | 'warning' | 'danger' | 'info'> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
  partial: 'info',
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

export default function PaymentsPage() {
  const { user } = useAuthStore();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [markPaidPayment, setMarkPaidPayment] = useState<Payment | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('bank_transfer');

  const isTenant = user?.role === 'tenant';

  const { data: tenantData } = useQuery({
    queryKey: ['payments-tenant', user?.id],
    queryFn: () => paymentService.getMyPayments(user?.id ?? ''),
    enabled: isTenant,
  });

  const { data: allData } = useQuery({
    queryKey: ['payments-all', user?.householdId],
    queryFn: () => paymentService.getPayments(user?.householdId ?? ''),
    enabled: !isTenant,
  });

  const isLoading = isTenant ? !tenantData : !allData;

  const markPaidMutation = useMutation({
    mutationFn: ({ id, method }: { id: string; method: PaymentMethod }) =>
      paymentService.markPaid(id, method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      success('Payment marked as paid');
      setMarkPaidPayment(null);
    },
    onError: () => error('Failed to update payment'),
  });

  const remindMutation = useMutation({
    mutationFn: (id: string) => paymentService.sendReminder(id),
    onSuccess: () => success('Reminder sent'),
  });

  const payments: Payment[] = isTenant
    ? (tenantData?.data ?? [])
    : (allData?.data.data ?? []);

  const totalDue = payments.filter((p) => p.status !== 'paid').reduce((s, p) => s + p.amountDue, 0);
  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const overdueCount = payments.filter((p) => p.status === 'overdue').length;
  const pendingCount = payments.filter((p) => p.status === 'pending').length;

  const isLeaseholder = user?.role === 'leaseholder';

  if (isLoading) return <PageLoader />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">Track and manage payment statuses</p>
        </div>
      </div>

      {/* Stats */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Due"
            value={formatCurrency(totalDue)}
            subtitle="Unpaid balance"
            icon={<CreditCard className="w-5 h-5 text-brand-600" />}
            iconBg="bg-brand-100"
          />
          <StatCard
            title="Total Paid"
            value={formatCurrency(totalPaid)}
            subtitle="Confirmed payments"
            icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
            iconBg="bg-emerald-100"
          />
          <StatCard
            title="Pending"
            value={pendingCount}
            subtitle="Awaiting payment"
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            iconBg="bg-amber-100"
          />
          <StatCard
            title="Overdue"
            value={overdueCount}
            subtitle={overdueCount > 0 ? 'Needs attention' : 'All clear'}
            icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
            iconBg="bg-red-100"
          />
        </motion.div>

        {/* Payment Table */}
        <motion.div variants={item}>
          <Card padding="none">
            <div className="px-5 py-4 border-b border-surface-100">
              <h3 className="text-sm font-semibold text-surface-900">Payment History</h3>
            </div>

            {payments.length === 0 ? (
              <EmptyState
                icon={<CreditCard className="w-6 h-6" />}
                title="No payments yet"
                description="Payments will appear here as expenses are added."
              />
            ) : (
              <div className="divide-y divide-surface-100">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-surface-50/50 transition-colors"
                  >
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        payment.status === 'paid' ? 'bg-emerald-400' :
                        payment.status === 'overdue' ? 'bg-red-400' : 'bg-amber-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-800 truncate">{payment.expenseTitle}</p>
                      <p className="text-xs text-surface-500 mt-0.5">
                        {payment.payerName}
                        {payment.paidAt
                          ? ` · Paid ${formatDate(payment.paidAt, 'MMM d')}`
                          : ` · Due ${formatDate(payment.dueDate, 'MMM d')}`}
                        {payment.method && ` via ${payment.method}`}
                      </p>
                    </div>
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-bold text-surface-900">{formatCurrency(payment.amount)}</p>
                    </div>
                    <Badge variant={statusBadge[payment.status]} size="sm">
                      {payment.status === 'paid' ? 'Paid' : payment.status === 'overdue' ? 'Overdue' : 'Pending'}
                    </Badge>
                    <div className="flex gap-1.5">
                      {payment.status !== 'paid' && (
                        <>
                          <button
                            onClick={() => { setMarkPaidPayment(payment); setSelectedMethod('bank_transfer'); }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Mark as paid"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          {isLeaseholder && (
                            <button
                              onClick={() => remindMutation.mutate(payment.id)}
                              className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                              title="Send reminder"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>

      {/* Mark Paid Modal */}
      <Modal
        isOpen={!!markPaidPayment}
        onClose={() => setMarkPaidPayment(null)}
        title="Mark as Paid"
        description={`Confirm payment of ${markPaidPayment ? formatCurrency(markPaidPayment.amountDue) : ''}`}
        size="sm"
      >
        <div className="space-y-4">
          <Select
            label="Payment method"
            options={METHOD_OPTIONS}
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod)}
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setMarkPaidPayment(null)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              isLoading={markPaidMutation.isPending}
              onClick={() => markPaidPayment && markPaidMutation.mutate({ id: markPaidPayment.id, method: selectedMethod })}
            >
              Confirm Payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
