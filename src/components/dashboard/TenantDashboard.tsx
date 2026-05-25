'use client';

import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import type { User } from '@/types';
import { paymentService } from '@/lib/api/payment.service';
import { maintenanceService } from '@/lib/api/maintenance.service';
import { expenseService } from '@/lib/api/expense.service';
import { formatCurrency, formatDate, formatRelativeDate } from '@/lib/utils';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';
import { Avatar } from '@/components/ui/Avatar';

const paymentChartData = [
  { month: 'Jan', paid: 1260, pending: 0 },
  { month: 'Feb', paid: 1260, pending: 0 },
  { month: 'Mar', paid: 1260, pending: 0 },
  { month: 'Apr', paid: 1260, pending: 0 },
  { month: 'May', paid: 1260, pending: 0 },
  { month: 'Jun', paid: 0, pending: 1260 },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function TenantDashboard({ user }: { user: User }) {
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', user.householdId],
    queryFn: () => paymentService.getMyPayments(user.id),
  });

  const { data: maintenanceData, isLoading: maintLoading } = useQuery({
    queryKey: ['maintenance', user.householdId],
    queryFn: () => maintenanceService.getRequests(user.householdId ?? ''),
  });

  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', user.householdId],
    queryFn: () => expenseService.getExpenses(user.householdId ?? ''),
  });

  const isLoading = paymentsLoading || maintLoading || expensesLoading;

  const payments = paymentsData?.data ?? [];
  const maintenance = maintenanceData?.data.data ?? [];
  const expenses = expensesData?.data.data ?? [];

  const totalOwed = payments.filter((p) => p.status !== 'paid').reduce((s, p) => s + p.amountDue, 0);
  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const overdueCount = payments.filter((p) => p.status === 'overdue').length;
  const pendingCount = payments.filter((p) => p.status === 'pending').length;
  const openMaintenance = maintenance.filter((m) => m.status !== 'resolved' && m.status !== 'closed').length;

  const recentExpenses = expenses.slice(0, 4);

  if (isLoading) return <PageLoader />;

  return (
    <div className="page-container">
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item} className="page-header">
          <div>
            <h1 className="page-title">
              Good morning, {user.firstName} 👋
            </h1>
            <p className="page-subtitle">Here&apos;s what&apos;s happening with your household</p>
          </div>
          <Button leftIcon={<Wrench className="w-4 h-4" />} variant="outline" size="sm" href="/app/maintenance/new">
            Submit Request
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Amount Owed"
            value={formatCurrency(totalOwed)}
            subtitle="Across all expenses"
            icon={<CreditCard className="w-5 h-5 text-brand-600" />}
            iconBg="bg-brand-100"
          />
          <StatCard
            title="Total Paid"
            value={formatCurrency(totalPaid)}
            subtitle="This year"
            icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
            iconBg="bg-emerald-100"
          />
          <StatCard
            title="Overdue"
            value={overdueCount}
            subtitle={overdueCount === 0 ? 'All up to date' : 'Payments overdue'}
            icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
            iconBg="bg-red-100"
          />
          <StatCard
            title="Maintenance"
            value={openMaintenance}
            subtitle="Open requests"
            icon={<Wrench className="w-5 h-5 text-amber-600" />}
            iconBg="bg-amber-100"
          />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Payment Chart */}
          <motion.div variants={item} className="lg:col-span-2">
            <Card>
              <CardHeader
                title="Payment History"
                subtitle="Your rent contributions — last 6 months"
                action={
                  <Link href="/app/payments" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              />
              <div className="mt-4 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentChartData} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `$${v}`} width={48} />
                    <Tooltip
                      formatter={(v) => [formatCurrency(v as number)]}
                      contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }}
                    />
                    <Bar dataKey="paid" fill="#6366f1" radius={[4, 4, 0, 0]} name="Paid" />
                    <Bar dataKey="pending" fill="#fca5a5" radius={[4, 4, 0, 0]} name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Upcoming Payments */}
          <motion.div variants={item}>
            <Card className="h-full">
              <CardHeader
                title="Upcoming Payments"
                action={
                  <Link href="/app/payments" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                    All <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              />
              <div className="mt-4 space-y-3">
                {payments.filter((p) => p.status !== 'paid').slice(0, 4).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-surface-50 border border-surface-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-surface-800 truncate">{payment.expenseTitle}</p>
                      <p className="text-xs text-surface-500 mt-0.5">
                        Due {formatDate(payment.dueDate, 'MMM d')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-surface-900">{formatCurrency(payment.amountDue)}</p>
                      <Badge variant={payment.status === 'overdue' ? 'danger' : 'warning'} size="sm">
                        {payment.status === 'overdue' ? 'Overdue' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {payments.filter((p) => p.status !== 'paid').length === 0 && (
                  <div className="text-center py-8 text-surface-400">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                    <p className="text-xs font-medium">All caught up!</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Expenses */}
          <motion.div variants={item}>
            <Card>
              <CardHeader
                title="Recent Expenses"
                action={
                  <Link href="/app/expenses" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              />
              <div className="mt-4 space-y-2">
                {recentExpenses.map((expense) => {
                  const myShare = expense.splits.find((s) => s.userId === user.id);
                  return (
                    <Link
                      key={expense.id}
                      href={`/app/expenses/${expense.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-800 group-hover:text-brand-600 transition-colors">{expense.title}</p>
                        <p className="text-xs text-surface-500">{formatDate(expense.dueDate, 'MMM d')} · {expense.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-surface-900">
                          {myShare ? formatCurrency(myShare.amount) : '—'}
                        </p>
                        <Badge
                          variant={expense.status === 'settled' ? 'success' : expense.status === 'pending' ? 'warning' : 'info'}
                          size="sm"
                        >
                          {expense.status === 'settled' ? 'Settled' : expense.status === 'pending' ? 'Pending' : 'Partial'}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* Maintenance Status */}
          <motion.div variants={item}>
            <Card>
              <CardHeader
                title="Maintenance Requests"
                action={
                  <Link href="/app/maintenance" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              />
              <div className="mt-4 space-y-2">
                {maintenance.slice(0, 4).map((req) => (
                  <Link
                    key={req.id}
                    href={`/app/maintenance/${req.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-50 transition-colors group"
                  >
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        req.status === 'resolved' ? 'bg-emerald-400' :
                        req.status === 'in_progress' ? 'bg-amber-400' : 'bg-sky-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-800 group-hover:text-brand-600 transition-colors truncate">{req.title}</p>
                      <p className="text-xs text-surface-500">{formatRelativeDate(req.updatedAt)}</p>
                    </div>
                    <Badge
                      variant={req.status === 'resolved' ? 'success' : req.status === 'in_progress' ? 'warning' : 'info'}
                      size="sm"
                    >
                      {req.status === 'in_progress' ? 'In Progress' : req.status === 'resolved' ? 'Resolved' : 'Submitted'}
                    </Badge>
                  </Link>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
