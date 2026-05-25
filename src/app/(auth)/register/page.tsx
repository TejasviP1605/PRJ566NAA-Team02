'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { registerSchema, type RegisterFormData } from '@/lib/validations';
import { authService } from '@/lib/api/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

const ROLE_OPTIONS = [
  { value: 'tenant', label: 'Tenant / Roommate' },
  { value: 'leaseholder', label: 'Leaseholder / Household Admin' },
  { value: 'property_manager', label: 'Property Manager / Landlord' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { success, error } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'tenant' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const res = await authService.register(data);
      setAuth(res.data.user, res.data.token);
      success('Account created!', 'Welcome to RentRight.');
      router.push('/app/dashboard');
    } catch (err: unknown) {
      const apiErr = err as { message: string };
      error('Registration failed', apiErr.message ?? 'Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <div className="bg-white rounded-2xl shadow-dropdown p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-surface-900">Create account</h1>
          <p className="text-surface-500 text-sm mt-1">Join RentRight to manage your rental</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              placeholder="Alex"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Last name"
              placeholder="Johnson"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Phone number (optional)"
            type="tel"
            placeholder="+1 (555) 000-0000"
            leftIcon={<Phone className="w-4 h-4" />}
            error={errors.phone?.message}
            {...register('phone')}
          />

          <Select
            label="Account type"
            options={ROLE_OPTIONS}
            error={errors.role?.message}
            {...register('role')}
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            leftIcon={<Lock className="w-4 h-4" />}
            hint="At least 8 characters, one uppercase, one number"
            error={errors.password?.message}
            rightElement={
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="p-1 text-surface-400 hover:text-surface-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            {...register('password')}
          />

          <Input
            label="Confirm password"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Repeat your password"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.confirmPassword?.message}
            rightElement={
              <button type="button" onClick={() => setShowConfirm((v) => !v)} className="p-1 text-surface-400 hover:text-surface-600">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            {...register('confirmPassword')}
          />

          <Button type="submit" className="w-full mt-2" size="lg" isLoading={isSubmitting}>
            Create account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-surface-500">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
