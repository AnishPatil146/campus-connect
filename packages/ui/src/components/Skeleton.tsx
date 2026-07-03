import React from 'react';
import { cn } from '@campus-connect/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/20 dark:border-slate-800/20',
          className
        )}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';
