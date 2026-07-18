import React from 'react';
import { cn } from '@campus-connect/utils';
import { FolderOpen } from 'lucide-react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, title, description, icon, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/30 dark:bg-slate-900/10 min-h-[300px]',
          className
        )}
        {...props}
      >
        {/* Icon container */}
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-role-surface/40 text-role-primary mb-4 border border-role-border/50">
          {icon || <FolderOpen className="h-6 w-6" />}
        </div>

        {/* Text */}
        <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h3>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
          {description}
        </p>

        {/* Action Button */}
        {action && (
          <button
            onClick={action.onClick}
            type="button"
            className="mt-5 inline-flex items-center justify-center h-10 px-4 text-sm font-semibold text-white bg-role-primary hover:bg-role-secondary active:scale-[0.98] rounded-xl shadow-md shadow-role-primary/15 transition-all duration-200"
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';
