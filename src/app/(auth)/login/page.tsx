'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { loginSchema, type LoginFormData } from '@/lib/validations';
import { authService } from '@/lib/api/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const DEMO_ACCOUNTS = [
  { email: 'alex.tenant@example.com', label: 'Tenant', color: 'bg-sky-100 text-sky-700' },
  { email: 'sarah.leaseholder@example.com', label: 'Leaseholder', color: 'bg-emerald-100 text-emerald-700' },
  { email: 'mark.pm@example.com', label: 'Property Manager', color: 'bg-amber-100 text-amber-700' },
  { email: 'admin@rentright.com', label: 'Admin', color: 'bg-purple-100 text-purple-700' },
];

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { success, error } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await authService.login(data);
      setAuth(res.data.user, res.data.token);
      success('Welcome back!', `Signed in as ${res.data.user.firstName}`);
      router.push('/app/dashboard');
    } catch (err: unknown) {
      const apiErr = err as { message: string };
      error('Sign in failed', apiErr.message ?? 'Please check your credentials and try again.');
    }
  };

  const fillDemo = (email: string) => {
    setValue('email', email);
    setValue('password', 'Password1');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-dropdown p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-surface-900">Welcome back</h1>
          <p className="text-surface-500 text-sm mt-1">Sign in to your RentRight account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="p-1 text-surface-400 hover:text-surface-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            {...register('password')}
          />

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
            Sign in
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-surface-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-brand-600 hover:text-brand-700 font-medium">
              Create account
            </Link>
          </p>
        </div>

        {/* Demo accounts */}
        <div className="mt-8 pt-6 border-t border-surface-100">
          <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-3">
            Quick demo access
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemo(account.email)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${account.color}`}
              >
                {account.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-surface-400 mt-2 text-center">
            Password for all demo accounts: <code className="font-mono text-surface-600">Password1</code>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
