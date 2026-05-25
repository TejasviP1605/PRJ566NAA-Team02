'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, XCircle, Trash2, Edit2, Users } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { expenseService } from '@/lib/api/expense.service';
import { paymentService } from '@/lib/api/payment.service';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, capitalize } from '@/lib/utils';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { PageLoader } from '@/components/ui/Spinner';

export default function ExpenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const expenseId = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => expenseService.getExpense(expenseId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => expenseService.deleteExpense(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      success('Expense deleted');
      router.push('/app/expenses');
    },
    onError: () => error('Failed to delete expense'),
  });

  const settleMutation = useMutation({
    mutationFn: () => expenseService.settleExpense(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense', expenseId] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      success('Expense settled');
    },
  });

  const expense = data?.data;
  const isLeaseholder = user?.role === 'leaseholder';
  const canEdit = expense?.status !== 'settled';

  if (isLoading) return <PageLoader />;
  if (!expense) return <div className="page-container"><p>Expense not found.</p></div>;

  const paidAmount = expense.splits.filter((s) => s.isPaid).reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="page-container max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/app/expenses" className="text-surface-400 hover:text-surface-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="page-title">{expense.title}</h1>
          <p className="page-subtitle">{capitalize(expense.category)} · Due {formatDate(expense.dueDate)}</p>
        </div>
        {canEdit && (isLeaseholder || expense.createdBy === user?.id) && (
          <div className="flex gap-2">
            {expense.status !== 'settled' && isLeaseholder && (
              <Button size="sm" variant="outline" leftIcon={<CheckCircle className="w-4 h-4 text-emerald-600" />} onClick={() => settleMutation.mutate()} isLoading={settleMutation.isPending}>
                Settle
              </Button>
            )}
            <Button size="sm" variant="danger" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => deleteMutation.mutate()}>
              Delete
            </Button>
          </div>
        )}
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        {/* Summary */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-3xl font-bold text-surface-900">{formatCurrency(expense.amount)}</p>
              <p className="text-sm text-surface-500 mt-1">Total expense</p>
            </div>
            <Badge
              variant={expense.status === 'settled' ? 'success' : expense.status === 'pending' ? 'warning' : 'info'}
              size="md"
            >
              {expense.status === 'partially_paid' ? 'Partially Paid' : capitalize(expense.status)}
            </Badge>
          </div>
          {expense.description && (
            <p className="text-sm text-surface-600 mt-3 pt-3 border-t border-surface-100">{expense.description}</p>
          )}
          <div className="grid sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-surface-100">
            <div>
              <p className="text-xs text-surface-500 uppercase tracking-wide">Category</p>
              <p className="text-sm font-medium text-surface-800 mt-0.5 capitalize">{expense.category}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500 uppercase tracking-wide">Split Rule</p>
              <p className="text-sm font-medium text-surface-800 mt-0.5 capitalize">{expense.splitRule}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500 uppercase tracking-wide">Created</p>
              <p className="text-sm font-medium text-surface-800 mt-0.5">{formatDate(expense.createdAt)}</p>
            </div>
          </div>

          {/* Payment progress */}
          <div className="mt-4 pt-4 border-t border-surface-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-surface-600">Collected</span>
              <span className="text-xs text-surface-500">{formatCurrency(paidAmount)} of {formatCurrency(expense.amount)}</span>
            </div>
            <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${(paidAmount / expense.amount) * 100}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Splits */}
        <Card>
          <CardHeader title="Payment Splits" subtitle={`${expense.splits.filter((s) => s.isPaid).length}/${expense.splits.length} members paid`} />
          <div className="mt-4 space-y-3">
            {expense.splits.map((split) => (
              <div key={split.userId} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl border border-surface-100">
                <Avatar
                  firstName={split.userName.split(' ')[0]}
                  lastName={split.userName.split(' ')[1] ?? ''}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800">{split.userName}</p>
                  <p className="text-xs text-surface-500">{split.percentage.toFixed(1)}% share</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-surface-900">{formatCurrency(split.amount)}</p>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    {split.isPaid ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs text-emerald-600">Paid</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs text-amber-600">Unpaid</span>
                      </>
                    )}
                  </div>
                  {split.paidAt && (
                    <p className="text-xs text-surface-400">{formatDate(split.paidAt, 'MMM d')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
