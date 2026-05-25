import { cn } from '@/lib/utils';
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const textareaId = id ?? `textarea-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-surface-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={4}
          className={cn(
            'w-full rounded-lg border bg-white text-sm text-surface-900 placeholder:text-surface-400',
            'transition-all duration-150 outline-none px-3 py-2 resize-y',
            'focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            error
              ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
              : 'border-surface-200 hover:border-surface-300',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-surface-400">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
