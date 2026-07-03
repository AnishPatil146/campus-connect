'use client';

import React, { createContext, useContext, useState } from 'react';
import { cn } from '@campus-connect/utils';

interface TabsContextProps {
  value: string;
  onValueChange?: (value: string) => void;
}

const TabsContext = createContext<TabsContextProps | undefined>(undefined);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
  children,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(defaultValue);
  const activeValue = controlledValue !== undefined ? controlledValue : localValue;

  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setLocalValue(newValue);
    }
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: handleValueChange }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-start border-b border-slate-100 dark:border-slate-800 w-full gap-6 px-1 mb-4',
          className
        )}
        {...props}
      />
    );
  }
);
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = useContext(TabsContext);
    if (!context) throw new Error('TabsTrigger must be used inside Tabs');

    const isActive = context.value === value;

    return (
      <button
        type="button"
        ref={ref}
        onClick={() => context.onValueChange?.(value)}
        className={cn(
          'relative pb-3 text-sm font-medium transition-colors hover:text-slate-900 dark:hover:text-white select-none border-b-2 border-transparent focus-visible:outline-none',
          isActive
            ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 font-semibold'
            : 'text-slate-500 dark:text-slate-400',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = useContext(TabsContext);
    if (!context) throw new Error('TabsContent must be used inside Tabs');

    const isActive = context.value === value;

    if (!isActive) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'animate-in fade-in-50 duration-200 focus-visible:outline-none',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = 'TabsContent';
