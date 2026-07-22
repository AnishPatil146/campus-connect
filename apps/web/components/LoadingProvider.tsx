'use client';

import React, { createContext, useContext, useState } from 'react';
import { Sparkles } from 'lucide-react';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-2xl transition-all duration-300 pointer-events-auto select-none p-4">
          {/* Glassmorphic overlay card */}
          <div className="relative flex flex-col items-center justify-center p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-[0_0_60px_rgba(0,0,0,0.6)] max-w-sm w-full text-center overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Background glow effects */}
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_60%)] pointer-events-none -z-10 animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-20%] w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none -z-10" />

            {/* Glowing dual orbital spinner & centered logo */}
            <div className="relative flex items-center justify-center h-28 w-28 my-2">
              {/* Outer glowing orbital gradient ring */}
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-indigo-500 animate-[spin_1.4s_cubic-bezier(0.5,0.1,0.5,0.9)_infinite] shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
              
              {/* Inner counter-rotating ring */}
              <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-emerald-400 border-l-teal-400 animate-[spin_1s_linear_infinite_reverse] opacity-80" />
              
              {/* Centered vibrant logo badge */}
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center font-display font-black text-white text-3xl shadow-[0_0_25px_rgba(59,130,246,0.5)] border border-white/20 relative z-10 transition-transform duration-300 hover:scale-105">
                C
              </div>
            </div>

            {/* Dynamic Message & Pulsing Status Badge */}
            <div className="mt-6 flex flex-col items-center gap-2 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-semibold text-slate-300 shadow-inner">
                <Sparkles className="h-3.5 w-3.5 text-blue-400 animate-spin" />
                <span className="tracking-wide">{message}</span>
              </div>
            </div>

            {/* Linear Shimmer Progress Strip */}
            <div className="mt-7 w-48 h-1 rounded-full bg-slate-800/90 overflow-hidden relative border border-slate-700/30">
              <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-blue-400 to-emerald-400 animate-[shimmer_1.6s_infinite_linear]" />
            </div>
            
            <p className="mt-3 text-[10px] uppercase font-bold tracking-widest text-slate-500">
              Campus Connect • Secure Portal
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

