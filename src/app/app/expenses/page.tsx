'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Filter, Search, Trash2, Edit2, CheckCircle2, Receipt } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { expenseService } from '@/lib/api/expense.service';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, capitalize } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import type { Expense, ExpenseStatus } from '@/types';

const STATUS_OPTIONS: { value: ExpenseStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'partially_paid', label: 'Partial' },
  { value: 'settled', label: 'Settled' },
];

const statusBadge: Record<ExpenseStatus, 'warning' | 'info' | 'success'> = {
  pending: 'warning',
  partially_paid: 'info',
  settled: 'success',
};

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

export default function ExpensesPage() {
  const { user } = useAuthStore();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'all'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', user?.householdId],
    queryFn: () => expenseService.getExpenses(user?.householdId ?? ''),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      success('Expense deleted');
    },
    onError: () => error('Failed to delete expense'),
  });

  const settleMutation = useMutation({
    mutationFn: (id: string) => expenseService.settleExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      success('Expense settled', 'All splits marked as paid.');
    },
  });

  const expenses = data?.data.data ?? [];
  const filtered = expenses.filter((e) => {
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);
  const isLeaseholder = user?.role === 'leaseholder';

  if (isLoading) return <PageLoader />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">{filtered.length} expenses · {formatCurrency(totalAmount)} total</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} href="/app/expenses/new">
          Add Expense
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <Input
          placeholder="Search expenses..."
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:w-64"
        />
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === opt.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-surface-200 text-surface-600 hover:border-surface-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-6 h-6" />}
          title="No expenses found"
          description="Add a new expense to split costs with your household."
          action={
            <Button leftIcon={<Plus className="w-4 h-4" />} href="/app/expenses/new">
              Add Expense
            </Button>
          }
        />
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
          {filtered.map((expense) => (
            <motion.div variants={item} key={expense.id}>
              <ExpenseCard
                expense={expense}
                userId={user?.id ?? ''}
                isLeaseholder={isLeaseholder}
                onDelete={(id) => deleteMutation.mutate(id)}
                onSettle={(id) => settleMutation.mutate(id)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function ExpenseCard({
  expense,
  userId,
  isLeaseholder,
  onDelete,
  onSettle,
}: {
  expense: Expense;
  userId: string;
  isLeaseholder: boolean;
  onDelete: (id: string) => void;
  onSettle: (id: string) => void;
}) {
  const myShare = expense.splits.find((s) => s.userId === userId);
  const paidCount = expense.splits.filter((s) => s.isPaid).length;
  const canEdit = expense.status !== 'settled';

  return (
    <Card className="hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
          <Receipt className="w-5 h-5 text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Link
                href={`/app/expenses/${expense.id}`}
                className="text-sm font-semibold text-surface-900 hover:text-brand-600 transition-colors"
              >
                {expense.title}
              </Link>
              {expense.description && (
                <p className="text-xs text-surface-500 mt-0.5 line-clamp-1">{expense.description}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-base font-bold text-surface-900">{formatCurrency(expense.amount)}</p>
              <Badge variant={statusBadge[expense.status]} size="sm" className="mt-1">
                {expense.status === 'partially_paid' ? 'Partial' : capitalize(expense.status)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <span className="text-xs text-surface-500">
              <span className="font-medium capitalize">{expense.category}</span> · Due {formatDate(expense.dueDate, 'MMM d')}
            </span>
            <span className="text-xs text-surface-500">
              {paidCount}/{expense.splits.length} paid · {capitalize(expense.splitRule)} split
            </span>
            {myShare && (
              <span className={`text-xs font-semibold ${myShare.isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                Your share: {formatCurrency(myShare.amount)} {myShare.isPaid ? '✓' : '(unpaid)'}
              </span>
            )}
          </div>

          {/* Split progress bar */}
          <div className="mt-3 h-1.5 bg-surface-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(paidCount / expense.splits.length) * 100}%` }}
            />
          </div>
        </div>

        {canEdit && (isLeaseholder || expense.createdBy === userId) && (
          <div className="flex gap-1.5 shrink-0">
            {expense.status !== 'settled' && isLeaseholder && (
              <button
                onClick={() => onSettle(expense.id)}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Mark as settled"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
            <Link href={`/app/expenses/${expense.id}`} className="p-1.5 text-surface-400 hover:bg-surface-100 rounded-lg transition-colors">
              <Edit2 className="w-4 h-4" />
            </Link>
            <button
              onClick={() => onDelete(expense.id)}
              className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
