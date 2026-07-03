import React from 'react';
import { cn } from '@campus-connect/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge = ({ className, variant = 'primary', ...props }: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        {
          'bg-blue-50 text-blue-700 border border-blue-200': variant === 'primary',
          'bg-slate-100 text-slate-800 border border-slate-200': variant === 'secondary',
          'bg-emerald-50 text-emerald-700 border border-emerald-200': variant === 'success',
          'bg-amber-50 text-amber-700 border border-amber-200': variant === 'warning',
          'bg-red-50 text-red-700 border border-red-200': variant === 'danger',
          'bg-sky-50 text-sky-700 border border-sky-200': variant === 'info',
        },
        className
      )}
      {...props}
    />
  );
};

Badge.displayName = 'Badge';
