'use client';

import React, { createContext, useContext, useState } from 'react';
import Script from 'next/script';
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
      <Script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js" strategy="lazyOnload" />
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-2xl transition-all duration-300 pointer-events-auto select-none p-4">
          {/* Glassmorphic overlay card */}
          <div className="relative flex flex-col items-center justify-center p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-[0_0_60px_rgba(0,0,0,0.6)] max-w-sm w-full text-center overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Background glow effects */}
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15),transparent_60%)] pointer-events-none -z-10 animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-20%] w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none -z-10" />

            {/* Custom Lottie Loading Animation from /loading.json */}
            <div className="relative flex items-center justify-center h-28 w-28 my-1">
              {React.createElement('lottie-player', {
                src: '/loading.json',
                background: 'transparent',
                speed: '1',
                style: { width: '100%', height: '100%' },
                loop: true,
                autoplay: true,
              })}
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

