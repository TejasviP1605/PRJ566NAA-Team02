import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required.').max(50),
    lastName: z.string().min(1, 'Last name is required.').max(50),
    email: z.string().email('Please enter a valid email address.'),
    phone: z.string().optional(),
    role: z.enum(['tenant', 'leaseholder', 'property_manager', 'admin']),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
      .regex(/[0-9]/, 'Password must contain at least one number.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
      .regex(/[0-9]/, 'Password must contain at least one number.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const expenseSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(100),
  description: z.string().max(500).optional(),
  amount: z.coerce
    .number({ invalid_type_error: 'Amount must be a number.' })
    .positive('Amount must be greater than 0.'),
  category: z.enum(['rent', 'utilities', 'groceries', 'internet', 'cleaning', 'repairs', 'insurance', 'other']),
  splitRule: z.enum(['equal', 'percentage', 'custom']),
  dueDate: z.string().min(1, 'Due date is required.'),
  splits: z.array(
    z.object({
      memberId: z.string(),
      userId: z.string(),
      userName: z.string(),
      amount: z.number().min(0),
      percentage: z.number().min(0).max(100),
      isPaid: z.boolean(),
    })
  ),
});

export const maintenanceSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(100),
  description: z.string().min(10, 'Please provide a detailed description (at least 10 characters).').max(1000),
  category: z.enum(['plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'pest_control', 'cleaning', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

export const householdSchema = z.object({
  name: z.string().min(1, 'Household name is required.').max(100),
  address: z.string().min(1, 'Address is required.'),
  city: z.string().min(1, 'City is required.'),
  state: z.string().min(1, 'State is required.'),
  zipCode: z.string().min(5, 'Zip code must be at least 5 characters.'),
  country: z.string().default('US'),
  monthlyRent: z.coerce.number().positive('Monthly rent must be greater than 0.'),
  leaseStartDate: z.string().min(1, 'Lease start date is required.'),
  leaseEndDate: z.string().min(1, 'Lease end date is required.'),
  maxOccupants: z.coerce.number().int().min(1).max(20),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  role: z.enum(['tenant', 'co_tenant', 'leaseholder']),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type MaintenanceFormData = z.infer<typeof maintenanceSchema>;
export type HouseholdFormData = z.infer<typeof householdSchema>;
export type InviteMemberFormData = z.infer<typeof inviteMemberSchema>;
