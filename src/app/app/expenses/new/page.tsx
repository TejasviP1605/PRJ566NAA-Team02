'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { expenseService } from '@/lib/api/expense.service';
import { householdService } from '@/lib/api/household.service';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/Toast';
import { expenseSchema, type ExpenseFormData } from '@/lib/validations';
import { formatCurrency } from '@/lib/utils';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';

const CATEGORY_OPTIONS = [
  { value: 'rent', label: 'Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'internet', label: 'Internet' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'repairs', label: 'Repairs' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' },
];

const SPLIT_RULE_OPTIONS = [
  { value: 'equal', label: 'Equal split' },
  { value: 'percentage', label: 'By percentage' },
  { value: 'custom', label: 'Custom amounts' },
];

export default function NewExpensePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const { data: membersData } = useQuery({
    queryKey: ['members', user?.householdId],
    queryFn: () => householdService.getMembers(user?.householdId ?? ''),
    enabled: !!user?.householdId,
  });

  const members = (membersData?.data ?? []).filter((m) => m.status === 'active');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      splitRule: 'equal',
      category: 'utilities',
      splits: [],
    },
  });

  const { fields } = useFieldArray({ control, name: 'splits' });
  const watchAmount = watch('amount');
  const watchSplitRule = watch('splitRule');
  const watchSplits = watch('splits');

  // Initialize splits when members load
  useEffect(() => {
    if (members.length === 0) return;
    const perPerson = Number(watchAmount) > 0 ? Number(watchAmount) / members.length : 0;
    setValue(
      'splits',
      members.map((m) => ({
        memberId: m.id,
        userId: m.userId,
        userName: `${m.user.firstName} ${m.user.lastName}`,
        amount: parseFloat(perPerson.toFixed(2)),
        percentage: parseFloat((100 / members.length).toFixed(2)),
        isPaid: false,
      }))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members.length, setValue]);

  // Recalculate splits when amount or rule changes
  useEffect(() => {
    const amount = Number(watchAmount);
    if (!amount || members.length === 0) return;
    if (watchSplitRule === 'equal') {
      const perPerson = amount / members.length;
      members.forEach((_, i) => {
        setValue(`splits.${i}.amount`, parseFloat(perPerson.toFixed(2)));
        setValue(`splits.${i}.percentage`, parseFloat((100 / members.length).toFixed(2)));
      });
    } else if (watchSplitRule === 'percentage') {
      members.forEach((_, i) => {
        const pct = watchSplits[i]?.percentage ?? 100 / members.length;
        setValue(`splits.${i}.amount`, parseFloat(((amount * pct) / 100).toFixed(2)));
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchAmount, watchSplitRule, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: ExpenseFormData) =>
      expenseService.createExpense({
        ...data,
        householdId: user?.householdId ?? '',
        status: 'pending',
        createdBy: user?.id ?? '',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      success('Expense created', 'Your expense has been added.');
      router.push('/app/expenses');
    },
    onError: () => error('Failed to create expense'),
  });

  const splitTotal = watchSplits?.reduce((s, sp) => s + (Number(sp?.amount) || 0), 0) ?? 0;
  const splitDiff = Math.abs(Number(watchAmount) - splitTotal);

  return (
    <div className="page-container max-w-2xl mx-auto">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/app/expenses" className="text-surface-400 hover:text-surface-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">New Expense</h1>
            <p className="page-subtitle">Add a shared expense for your household</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-5">
        <Card>
          <CardHeader title="Expense Details" />
          <div className="mt-4 space-y-4">
            <Input
              label="Title"
              placeholder="e.g., June Rent, Electricity Bill"
              error={errors.title?.message}
              {...register('title')}
            />
            <Textarea
              label="Description (optional)"
              placeholder="Add more details..."
              rows={2}
              {...register('description')}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Amount ($)"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                error={errors.amount?.message}
                {...register('amount')}
              />
              <Input
                label="Due date"
                type="date"
                error={errors.dueDate?.message}
                {...register('dueDate')}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Select
                label="Category"
                options={CATEGORY_OPTIONS}
                error={errors.category?.message}
                {...register('category')}
              />
              <Select
                label="Split rule"
                options={SPLIT_RULE_OPTIONS}
                error={errors.splitRule?.message}
                {...register('splitRule')}
              />
            </div>
          </div>
        </Card>

        {/* Split Preview */}
        {fields.length > 0 && (
          <Card>
            <CardHeader
              title="Split Preview"
              subtitle={
                splitDiff > 0.01
                  ? `⚠ Splits don't add up to total (${formatCurrency(splitTotal)} of ${formatCurrency(Number(watchAmount))})`
                  : `Total: ${formatCurrency(Number(watchAmount))}`
              }
            />
            <div className="mt-4 space-y-3">
              {fields.map((field, i) => (
                <div key={field.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl border border-surface-100">
                  <Avatar
                    firstName={field.userName.split(' ')[0]}
                    lastName={field.userName.split(' ')[1] ?? ''}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-800">{field.userName}</p>
                    {watchSplitRule === 'percentage' && (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          className="w-16 h-7 text-xs border border-surface-200 rounded-lg px-2 focus:ring-1 focus:ring-brand-500 outline-none"
                          {...register(`splits.${i}.percentage`, { valueAsNumber: true })}
                        />
                        <span className="text-xs text-surface-500">%</span>
                      </div>
                    )}
                    {watchSplitRule === 'custom' && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-surface-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-20 h-7 text-xs border border-surface-200 rounded-lg px-2 focus:ring-1 focus:ring-brand-500 outline-none"
                          {...register(`splits.${i}.amount`, { valueAsNumber: true })}
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-surface-900">
                      {formatCurrency(watchSplits[i]?.amount ?? 0)}
                    </p>
                    {watchSplitRule === 'equal' && (
                      <p className="text-xs text-surface-500">
                        {(100 / fields.length).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" href="/app/expenses">
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            isLoading={createMutation.isPending || isSubmitting}
            disabled={splitDiff > 0.01 && fields.length > 0}
          >
            Create Expense
          </Button>
        </div>
      </form>
    </div>
  );
}
