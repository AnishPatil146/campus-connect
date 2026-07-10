'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from '../components/ThemeProvider';
import { 
  Download, 
  Smartphone, 
  Globe, 
  Database, 
  Layers, 
  Server, 
  HardDrive, 
  CheckCircle,
  Sun,
  Moon,
  ChevronRight
} from 'lucide-react';

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 glass-effect border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center font-display font-bold text-white text-lg">
            C
          </div>
          <span className="font-display font-bold text-lg tracking-tight">Campus Connect</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
          </button>
          
          <Link 
            href="/login"
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all duration-200 flex items-center gap-1"
          >
            Dashboard Login <ChevronRight size={14} />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-12 md:py-20 flex flex-col gap-20">
        
        {/* Hero Section */}
        <section className="text-center flex flex-col items-center gap-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse"></span>
            Version 1.0.0 Release Ready
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight leading-tight">
            One Platform. <br/>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">Three Colleges.</span> <br/>
            Connected Together.
          </h1>
          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-xl">
            A minimalist, high-speed unified ERP platform connecting students, teachers, and administrators across multiple science and arts institutions.
          </p>
        </section>

        {/* Release Formats Section */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl md:text-3xl font-display font-bold">Release Deliverables</h2>
            <p className="text-slate-500 dark:text-slate-400">Supporting three release targets optimized for verification, testing, and production deploy.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Format 1: Web App */}
            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between shadow-hover border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Globe size={22} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg mb-1">Web Platform</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Production dashboard accessible directly via browser. Deployed continuously on Vercel infrastructure.
                  </p>
                </div>
              </div>
              <div className="mt-8 flex flex-col gap-3">
                <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">Target: Vercel Cloud Hosting</div>
                <Link 
                  href="/login"
                  className="w-full text-center py-2.5 text-sm font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 transition-colors"
                >
                  Access Web Portal
                </Link>
              </div>
            </div>

            {/* Format 2: Direct APK */}
            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between shadow-hover border border-slate-200 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 text-[10px] font-mono font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-bl-xl border-l border-b border-emerald-200 dark:border-emerald-900">
                Recommended
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Smartphone size={22} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg mb-1">Android APK (Direct)</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Standalone installer package for quick testing, side-loading, and private distribution.
                  </p>
                </div>
              </div>
              <div className="mt-8 flex flex-col gap-3">
                <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">Target: Standalone release binary</div>
                <a 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Downloading CampusConnect.apk release file (simulated).");
                  }}
                  className="w-full text-center py-2.5 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm flex items-center justify-center gap-2 transition-all duration-200"
                >
                  <Download size={16} /> Download APK (Direct)
                </a>
              </div>
            </div>

            {/* Format 3: Google Play Bundle */}
            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between shadow-hover border border-slate-200 dark:border-slate-800">
              <div className="flex flex-col gap-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Layers size={22} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg mb-1">Google Play Bundle (AAB)</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Signed production app bundle configured with key signing for Google Play Store upload.
                  </p>
                </div>
              </div>
              <div className="mt-8 flex flex-col gap-3">
                <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">Target: Play Console Distribution</div>
                <a 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Play Store beta track listing is currently undergoing Google verification.");
                  }}
                  className="w-full text-center py-2.5 text-sm font-semibold rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                >
                  View Play Store
                </a>
              </div>
            </div>

          </div>
        </section>

        {/* Architecture Topology Section */}
        <section className="flex flex-col gap-10">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl md:text-3xl font-display font-bold">Production System Architecture</h2>
            <p className="text-slate-500 dark:text-slate-400">Detailed schematic mapping integration layers, containerized APIs, and persistence nodes.</p>
          </div>

          <div className="glass-card rounded-3xl p-8 border border-slate-200 dark:border-slate-800 flex flex-col gap-8">
            
            {/* Diagram Row 1: Clients */}
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Client Platform Targets</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center"><Globe size={16} /></div>
                  <div>
                    <h4 className="font-semibold text-sm">Next.js Web</h4>
                    <p className="text-xs text-slate-400">Hosted on Vercel CDN</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><Smartphone size={16} /></div>
                  <div>
                    <h4 className="font-semibold text-sm">Flutter Android Client</h4>
                    <p className="text-xs text-slate-400">APK & Google Play Bundle</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center"><Smartphone size={16} /></div>
                  <div>
                    <h4 className="font-semibold text-sm">Flutter iOS Client</h4>
                    <p className="text-xs text-slate-400">App Store IPA (Future)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Arrow */}
            <div className="flex justify-center my-1">
              <div className="h-8 w-[2px] bg-gradient-to-b from-blue-500 to-indigo-500"></div>
            </div>

            {/* Diagram Row 2: API Gateway */}
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">API Gateway & Logic Controller</span>
              <div className="p-5 rounded-2xl border border-blue-500/30 bg-blue-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center"><Server size={22} /></div>
                  <div>
                    <h4 className="font-display font-bold text-base">NestJS Backend API Service</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Running Node.js engine, deployed on Render Cloud Container instances.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 text-xs rounded-full bg-slate-200 dark:bg-slate-800">CORS Filtered</span>
                  <span className="px-3 py-1 text-xs rounded-full bg-slate-200 dark:bg-slate-800">Role Guards</span>
                </div>
              </div>
            </div>

            {/* Connection Arrow */}
            <div className="flex justify-center my-1">
              <div className="h-8 w-[2px] bg-gradient-to-b from-indigo-500 to-pink-500"></div>
            </div>

            {/* Diagram Row 3: Datastores */}
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Persistence & Storage Nodes</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center"><Database size={16} /></div>
                  <div>
                    <h4 className="font-semibold text-sm">PostgreSQL DB</h4>
                    <p className="text-xs text-slate-400">Relational DB managed by Prisma</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center"><HardDrive size={16} /></div>
                  <div>
                    <h4 className="font-semibold text-sm">Redis Memory Cache</h4>
                    <p className="text-xs text-slate-400">Fast memory lookup & sessions</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center"><Layers size={16} /></div>
                  <div>
                    <h4 className="font-semibold text-sm">Cloudinary Storage</h4>
                    <p className="text-xs text-slate-400">Media and document uploads</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl md:text-3xl font-display font-bold">Integrated ERP Features</h2>
            <p className="text-slate-500 dark:text-slate-400">All features validated across web and mobile platforms to ensure feature-parity.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-semibold text-sm">
            {['Student Login', 'Teacher Login', 'Admin Login', 'Attendance', 'Notes & Syllabus', 'Assignments', 'Events Calendar', 'Firebase Notifications', 'Offline Caching Mode', 'Document Upload', 'Report Export'].map((feature) => (
              <div key={feature} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
                <CheckCircle size={16} className="text-blue-500 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 py-8 px-6 text-center text-xs text-slate-400 font-mono">
        &copy; 2026 Campus Connect. Built with Next.js, NestJS, and Flutter. All rights reserved.
      </footer>
    </div>
  );
}
