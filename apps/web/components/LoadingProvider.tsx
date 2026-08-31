'use client';

import React, { createContext, useContext, useState } from 'react';

interface LoadingContextType {
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = () => {
    setIsLoading(true);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  return (
    <LoadingContext.Provider value={{ startLoading, stopLoading, isLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md transition-all duration-300 pointer-events-auto select-none">
          {/* Pure Minimalist Loading Motion (Zero Words / Zero Clutter) */}
          <div className="relative flex items-center justify-center">
            {/* Outer subtle glowing halo */}
            <div className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500/20 via-indigo-500/20 to-purple-500/20 blur-xl animate-pulse" />

            {/* Outer rotating ring */}
            <div className="w-16 h-16 rounded-full border-2 border-transparent border-t-blue-500 border-r-indigo-500 animate-spin" style={{ animationDuration: '1.2s' }} />

            {/* Inner counter-rotating ring */}
            <div className="absolute w-10 h-10 rounded-full border-2 border-transparent border-b-purple-500 border-l-emerald-400 animate-spin" style={{ animationDuration: '0.8s', animationDirection: 'reverse' }} />

            {/* Center glowing dot */}
            <div className="absolute w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] animate-ping" style={{ animationDuration: '1.5s' }} />
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
