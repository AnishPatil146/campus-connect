'use client';

import React, { useEffect } from 'react';
import { cn } from '@campus-connect/utils';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastProps {
  isOpen: boolean;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  isOpen,
  message,
  type = 'info',
  onClose,
  duration = 4000,
  className,
}) => {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isOpen && duration > 0) {
      timer = setTimeout(() => {
        onClose();
      }, duration);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-role-primary shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
  };

  const bgStyles = {
    success: 'border-emerald-100 dark:border-emerald-950 bg-emerald-50/90 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300',
    error: 'border-red-100 dark:border-red-950 bg-red-50/90 dark:bg-red-950/20 text-red-900 dark:text-red-300',
    info: 'border-role-border/50 bg-role-surface/90 dark:bg-role-surface/20 text-role-primary',
    warning: 'border-amber-100 dark:border-amber-950 bg-amber-50/90 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md max-w-sm',
          bgStyles[type],
          className
        )}
      >
        {icons[type]}
        <p className="text-sm font-medium pr-2">{message}</p>
        <button
          onClick={onClose}
          className="ml-auto p-0.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200"
          aria-label="Close notification"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

Toast.displayName = 'Toast';
