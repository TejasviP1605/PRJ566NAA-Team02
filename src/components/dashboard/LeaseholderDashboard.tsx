'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  DollarSign,
  Wrench,
  Receipt,
  ArrowRight,
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import type { User } from '@/types';
import { householdService } from '@/lib/api/household.service';
import { paymentService } from '@/lib/api/payment.service';
import { expenseService } from '@/lib/api/expense.service';
import { maintenanceService } from '@/lib/api/maintenance.service';
import { formatCurrency, formatDate, formatRole } from '@/lib/utils';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { PageLoader } from '@/components/ui/Spinner';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

const monthlyData = [
  { month: 'Jan', collected: 4200 },
  { month: 'Feb', collected: 4200 },
  { month: 'Mar', collected: 4200 },
  { month: 'Apr', collected: 4200 },
  { month: 'May', collected: 4200 },
  { month: 'Jun', collected: 2520 },
];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export function LeaseholderDashboard({ user }: { user: User }) {
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['members', user.householdId],
    queryFn: () => householdService.getMembers(user.householdId ?? ''),
  });
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', user.householdId],
    queryFn: () => paymentService.getPayments(user.householdId ?? ''),
  });
  const { data: expensesData, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', user.householdId],
    queryFn: () => expenseService.getExpenses(user.householdId ?? ''),
  });
  const { data: maintenanceData, isLoading: maintLoading } = useQuery({
    queryKey: ['maintenance', user.householdId],
    queryFn: () => maintenanceService.getRequests(user.householdId ?? ''),
  });

  const isLoading = membersLoading || paymentsLoading || expensesLoading || maintLoading;

  const members = membersData?.data ?? [];
  const payments = paymentsData?.data.data ?? [];
  const expenses = expensesData?.data.data ?? [];
  const maintenance = maintenanceData?.data.data ?? [];

  const totalExpected = payments.reduce((s, p) => s + p.amountDue, 0);
  const totalCollected = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const overdueCount = payments.filter((p) => p.status === 'overdue').length;
  const openMaint = maintenance.filter((m) => m.status !== 'resolved' && m.status !== 'closed').length;

  const paymentStatusData = [
    { name: 'Paid', value: payments.filter((p) => p.status === 'paid').length },
    { name: 'Pending', value: payments.filter((p) => p.status === 'pending').length },
    { name: 'Overdue', value: overdueCount },
  ].filter((d) => d.value > 0);

  const activeMembers = members.filter((m) => m.status === 'active');
  const recentExpenses = expenses.slice(0, 5);

  if (isLoading) return <PageLoader />;

  return (
    <div className="page-container">
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item} className="page-header">
          <div>
            <h1 className="page-title">Household Overview</h1>
            <p className="page-subtitle">Manage your household, expenses, and members</p>
          </div>
          <div className="flex gap-2">
            <Button leftIcon={<Plus className="w-4 h-4" />} variant="outline" size="sm" href="/app/expenses/new">
              Add Expense
            </Button>
            <Button leftIcon={<Users className="w-4 h-4" />} size="sm" href="/app/household/members">
              Manage Members
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Members"
            value={activeMembers.length}
            subtitle={`${members.filter((m) => m.status === 'invited').length} pending invites`}
            icon={<Users className="w-5 h-5 text-brand-600" />}
            iconBg="bg-brand-100"
          />
          <StatCard
            title="Total Collected"
            value={formatCurrency(totalCollected)}
            subtitle="This billing cycle"
            icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
            iconBg="bg-emerald-100"
            trend={{ value: 5.2, label: 'vs last month' }}
          />
          <StatCard
            title="Overdue Payments"
            value={overdueCount}
            subtitle={overdueCount === 0 ? 'All collected' : `${formatCurrency(payments.filter((p) => p.status === 'overdue').reduce((s, p) => s + p.amountDue, 0))} owed`}
            icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
            iconBg="bg-red-100"
          />
          <StatCard
            title="Open Maintenance"
            value={openMaint}
            subtitle={`${maintenance.filter((m) => m.priority === 'urgent').length} urgent`}
            icon={<Wrench className="w-5 h-5 text-amber-600" />}
            iconBg="bg-amber-100"
          />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Collection Chart */}
          <motion.div variants={item} className="lg:col-span-2">
            <Card>
              <CardHeader
                title="Rent Collection — 2024"
                subtitle="Monthly rent collected vs expected"
              />
              <div className="mt-4 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={40} />
                    <Tooltip formatter={(v) => [formatCurrency(v as number), 'Collected']} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Bar dataKey="collected" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>

          {/* Payment Status Pie */}
          <motion.div variants={item}>
            <Card className="h-full flex flex-col">
              <CardHeader title="Payment Status" subtitle="Current cycle" />
              <div className="flex-1 flex items-center justify-center mt-2">
                <PieChart width={180} height={180}>
                  <Pie data={paymentStatusData} cx={85} cy={85} innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {paymentStatusData.map((entry, i) => (
                      <Cell key={entry.name} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                </PieChart>
              </div>
              <div className="flex flex-col gap-1.5 mt-2">
                {paymentStatusData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                      <span className="text-xs text-surface-600">{d.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-surface-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Members */}
          <motion.div variants={item}>
            <Card>
              <CardHeader
                title="Household Members"
                action={
                  <Link href="/app/household/members" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                    Manage <ArrowRight className="w-3 h-3" />
                  </Link>
                }
              />
              <div className="mt-4 space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar firstName={member.user.firstName} lastName={member.user.lastName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-800 truncate">
                        {member.user.firstName} {member.user.lastName}
                      </p>
                      <p className="text-xs text-surface-500">{formatRole(member.role)}</p>
                    </div>
                    <div className="text-right">
                      {member.status === 'active' ? (
                        <Badge variant="success" size="sm">Active</Badge>
                      ) : (
                        <Badge variant="warning" size="sm">Invited</Badge>
                      )}
                      {member.rentShare > 0 && (
                        <p className="text-xs text-surface-500 mt-0.5">{member.rentShare}% rent</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

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
                {recentExpenses.map((expense) => (
                  <Link
                    key={expense.id}
                    href={`/app/expenses/${expense.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-800 group-hover:text-brand-600 transition-colors truncate">{expense.title}</p>
                      <p className="text-xs text-surface-500">Due {formatDate(expense.dueDate, 'MMM d')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-surface-900">{formatCurrency(expense.amount)}</p>
                      <Badge
                        variant={expense.status === 'settled' ? 'success' : expense.status === 'pending' ? 'warning' : 'info'}
                        size="sm"
                      >
                        {expense.status === 'settled' ? 'Settled' : expense.status === 'pending' ? 'Pending' : 'Partial'}
                      </Badge>
                    </div>
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
