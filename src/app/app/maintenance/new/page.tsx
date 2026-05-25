'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { maintenanceService } from '@/lib/api/maintenance.service';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/Toast';
import { maintenanceSchema, type MaintenanceFormData } from '@/lib/validations';
import { Card, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';

const CATEGORY_OPTIONS = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'HVAC / Heating & Cooling' },
  { value: 'appliance', label: 'Appliance' },
  { value: 'structural', label: 'Structural' },
  { value: 'pest_control', label: 'Pest Control' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'other', label: 'Other' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low — Minor inconvenience, no urgency' },
  { value: 'medium', label: 'Medium — Needs attention soon' },
  { value: 'high', label: 'High — Significant impact on living' },
  { value: 'urgent', label: 'Urgent — Safety or health risk' },
];

export default function NewMaintenancePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: { priority: 'medium', category: 'plumbing' },
  });

  const createMutation = useMutation({
    mutationFn: (data: MaintenanceFormData) =>
      maintenanceService.createRequest({
        ...data,
        householdId: user?.householdId ?? '',
        submittedBy: user?.id ?? '',
        submittedByName: `${user?.firstName} ${user?.lastName}`,
        status: 'submitted',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      success('Request submitted', 'Your maintenance request has been filed.');
      router.push('/app/maintenance');
    },
    onError: () => error('Failed to submit request'),
  });

  return (
    <div className="page-container max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/app/maintenance" className="text-surface-400 hover:text-surface-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="page-title">New Maintenance Request</h1>
          <p className="page-subtitle">Describe the issue and we'll get it addressed</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-5">
        <Card>
          <CardHeader title="Issue Details" />
          <div className="mt-4 space-y-4">
            <Input
              label="Issue title"
              placeholder="e.g., Kitchen faucet is leaking"
              error={errors.title?.message}
              {...register('title')}
            />
            <Textarea
              label="Description"
              placeholder="Describe the problem in detail. Include location, when it started, and any relevant observations..."
              rows={5}
              error={errors.description?.message}
              {...register('description')}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Select
                label="Category"
                options={CATEGORY_OPTIONS}
                error={errors.category?.message}
                {...register('category')}
              />
              <Select
                label="Priority"
                options={PRIORITY_OPTIONS}
                error={errors.priority?.message}
                {...register('priority')}
              />
            </div>
          </div>
        </Card>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs font-medium text-amber-800">Priority Guide</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Use <strong>Urgent</strong> only for safety hazards (gas leaks, flooding, electrical sparks). For everything else, choose the level that reflects how quickly it needs attention.
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" href="/app/maintenance">
            Cancel
          </Button>
          <Button type="submit" className="flex-1" isLoading={createMutation.isPending || isSubmitting}>
            Submit Request
          </Button>
        </div>
      </form>
    </div>
  );
}
