import React from 'react';
import { cn } from '@campus-connect/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
          {
            // Variants
            'bg-role-primary text-white hover:bg-role-secondary shadow-md shadow-role-primary/15 focus:ring-role-primary dark:bg-role-primary dark:hover:bg-role-secondary dark:shadow-none dark:focus:ring-offset-slate-950': variant === 'primary',
            'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-950': variant === 'secondary',
            'border border-slate-200 bg-transparent hover:bg-slate-50 text-slate-700 focus:ring-slate-400 dark:border-slate-800 dark:hover:bg-slate-900 dark:text-slate-300 dark:focus:ring-offset-slate-950': variant === 'outline',
            'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/10 focus:ring-red-500 dark:bg-red-500 dark:hover:bg-red-600 dark:shadow-none dark:focus:ring-offset-slate-950': variant === 'danger',
            'bg-transparent hover:bg-slate-50 text-slate-600 dark:hover:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-200': variant === 'ghost',
            
            // Sizes
            'h-9 px-3 text-sm rounded-lg': size === 'sm',
            'h-11 px-5 text-base rounded-xl': size === 'md',
            'h-13 px-7 text-lg rounded-2xl': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
