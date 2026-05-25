import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  trend?: { value: number; label: string };
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, iconBg = 'bg-brand-100', trend, className }: StatCardProps) {
  const trendPositive = trend && trend.value >= 0;

  return (
    <div className={cn('bg-white border border-surface-200 rounded-xl p-5 shadow-card', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-surface-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-surface-500 mt-1">{subtitle}</p>}
          {trend && (
            <p className={cn('text-xs font-medium mt-1', trendPositive ? 'text-emerald-600' : 'text-red-500')}>
              {trendPositive ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ml-3', iconBg)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
