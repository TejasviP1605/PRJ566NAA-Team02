import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string, formatStr = 'MMM d, yyyy'): string {
  if (!dateString) return '—';
  try {
    return format(parseISO(dateString), formatStr);
  } catch {
    return dateString;
  }
}

export function formatRelativeDate(dateString: string): string {
  if (!dateString) return '—';
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch {
    return dateString;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isOverdue(dateString: string): boolean {
  try {
    return isBefore(parseISO(dateString), new Date());
  } catch {
    return false;
  }
}

export function isDueSoon(dateString: string, daysThreshold = 3): boolean {
  try {
    const date = parseISO(dateString);
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + daysThreshold);
    return isAfter(date, new Date()) && isBefore(date, threshold);
  } catch {
    return false;
  }
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

export function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    tenant: 'Tenant',
    leaseholder: 'Leaseholder',
    co_tenant: 'Co-Tenant',
    property_manager: 'Property Manager',
    admin: 'System Admin',
  };
  return roleMap[role] ?? capitalize(role);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}…`;
}
