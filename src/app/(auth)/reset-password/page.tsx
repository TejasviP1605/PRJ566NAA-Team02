'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations';
import { authService } from '@/lib/api/auth.service';
import { useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      const token = new URLSearchParams(window.location.search).get('token') ?? '';
      await authService.resetPassword(token, data.password);
      success('Password reset!', 'You can now sign in with your new password.');
      router.push('/login');
    } catch {
      error('Reset failed', 'This link may have expired. Please request a new one.');
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
          <h1 className="text-2xl font-bold text-surface-900">Set new password</h1>
          <p className="text-surface-500 text-sm mt-1">Choose a strong password for your account.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="New password"
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
            label="Confirm new password"
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
            Reset password
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
