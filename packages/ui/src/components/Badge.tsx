import React from 'react';
import { cn } from '@campus-connect/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
}

export const Badge = ({ className, variant = 'primary', ...props }: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        {
          'bg-role-surface text-role-primary border border-role-border dark:bg-role-surface/40 dark:text-role-primary dark:border-role-border/50': variant === 'primary',
          'bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700': variant === 'secondary',
          'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50': variant === 'success',
          'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50': variant === 'warning',
          'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50': variant === 'danger',
          'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/50': variant === 'info',
          'bg-transparent text-slate-700 border border-slate-300 dark:text-slate-300 dark:border-slate-700': variant === 'outline',
        },
        className
      )}
      {...props}
    />
  );
};

Badge.displayName = 'Badge';
