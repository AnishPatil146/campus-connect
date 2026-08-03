'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '../../components/ThemeProvider';
import { Download, Smartphone, ShieldCheck, Info, Sun, Moon, Sparkles, ChevronLeft } from 'lucide-react';

export default function DownloadAppPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 glass-effect border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-semibold mr-2">
            <ChevronLeft size={18} /> Back
          </Link>
          <div className="h-8 w-8 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center font-display font-bold text-white text-lg">
            C
          </div>
          <span className="font-display font-bold text-lg tracking-tight">Campus Connect</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
          </button>

          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all duration-200"
          >
            Dashboard Login
          </Link>
        </div>
      </header>

      {/* Main Download Section */}
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-16 flex flex-col gap-12">
        {/* Header Hero */}
        <section className="text-center flex flex-col items-center gap-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Sparkles size={14} /> Official Android App Release
          </div>

          <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight leading-tight">
            Download Campus Connect for Android
          </h1>

          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
            Access real-time student timetables, attendance work centers, teacher notifications, and study materials on your Android device.
          </p>
        </section>

        {/* APK Download Card */}
        <section className="glass-card rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900/60 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shrink-0">
              <Smartphone size={40} />
            </div>

            <div className="space-y-1 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">CampusConnect.apk</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Release v1.0.1 (Build 2)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Package: <code className="font-mono text-slate-700 dark:text-slate-300">com.campusconnect.app</code>
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 dark:text-slate-500 pt-1 font-semibold">
                <span>Size: ~56.8 MB</span>
                <span>•</span>
                <span>Updated: 3 August 2026</span>
                <span>•</span>
                <span>Target: Android 7.0+ (API 24+)</span>
              </div>
            </div>
          </div>

          <a
            href="/downloads/CampusConnect.apk"
            download="CampusConnect.apk"
            className="w-full md:w-auto min-h-[44px] px-8 py-4 text-base font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 shrink-0 touch-manipulation"
          >
            <Download size={20} />
            <span>Download APK (v1.0.1)</span>
          </a>
        </section>

        {/* Sideloading Instructions */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Info className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">How to Install (.apk Sideloading Instructions)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-3">
              <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Download the APK</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Click the "Download APK" button above to download the <code className="font-mono">CampusConnect.apk</code> installer directly to your Android device.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-3">
              <div className="h-8 w-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-sm flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Allow Unknown Sources</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                When prompted by Android, go to <strong>Settings &gt; Security</strong> (or Chrome settings) and enable <strong>"Install Unknown Apps"</strong> for your browser.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 space-y-3">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Install & Open</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Open the downloaded file from your notifications or Files app, tap <strong>Install</strong>, and launch Campus Connect to log in with your institutional credentials.
              </p>
            </div>
          </div>
        </section>

        {/* Security & Verification Banner */}
        <section className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-500 shrink-0" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Verified Production Signing</p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                This APK is signed with production release keys and connects directly to the official Campus Connect backend API (`https://api.campusconnect.com`).
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 dark:border-slate-800 py-8 px-6 text-center text-xs text-slate-400 font-mono">
        &copy; 2026 Campus Connect. Built with Next.js, NestJS, and Expo React Native. All rights reserved.
      </footer>
    </div>
  );
}
