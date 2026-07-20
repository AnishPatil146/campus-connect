'use client';

import React, { createContext, useContext, useState } from 'react';

interface LoadingContextType {
  startLoading: (message: string) => void;
  stopLoading: () => void;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Loading...');

  const startLoading = (msg: string) => {
    setMessage(msg);
    setIsLoading(true);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  return (
    <LoadingContext.Provider value={{ startLoading, stopLoading, isLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/85 dark:bg-slate-950/85 backdrop-blur-md transition-all duration-300 animate-fade-in pointer-events-auto select-none">
          <div className="relative flex flex-col items-center justify-center p-8 text-center">
            {/* Outer spinning gradient ring */}
            <div className="absolute h-24 w-24 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-emerald-500 dark:border-t-emerald-450 animate-spin" />
            
            {/* Centered upright Campus Connect Logo */}
            <div className="h-16 w-16 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center font-display font-black text-white dark:text-slate-950 text-3xl shadow-xl shadow-slate-900/10 dark:shadow-none select-none relative z-10">
              C
            </div>
            
            {/* Dynamic loading label */}
            <p className="mt-6 text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 animate-pulse relative z-10">
              {message}
            </p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
