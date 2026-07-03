import React from 'react';
import Link from 'next/link';
import { Button, Card } from '@campus-connect/ui';
import { Shield, BookOpen, Calendar, GraduationCap, BarChart3, Users } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: <GraduationCap className="h-6 w-6 text-blue-600" />,
      title: 'Student Dashboard',
      description: 'Access academic performance, personalized timetables, and courses.',
    },
    {
      icon: <BookOpen className="h-6 w-6 text-indigo-600" />,
      title: 'Teacher Control Panel',
      description: 'Manage class schedules, update performance, and connect with students.',
    },
    {
      icon: <Shield className="h-6 w-6 text-purple-600" />,
      title: 'Admin Control Center',
      description: 'Centralized administration for events, user management, and policies.',
    },
    {
      icon: <Calendar className="h-6 w-6 text-emerald-600" />,
      title: 'Integrated Timetable',
      description: 'Real-time sync of schedules, lecture halls, and exams across the campus.',
    },
    {
      icon: <Users className="h-6 w-6 text-pink-600" />,
      title: 'Cross-College Events',
      description: 'Discover events, sports, and cultural festivals hosted by all colleges.',
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-amber-600" />,
      title: 'Performance Analytics',
      description: 'Understand grade metrics, attendance, and outcomes with clear charts.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* Decorative gradient headers */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-blue-50/60 to-transparent -z-10 pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-400/10 blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-400/10 blur-[100px] -z-10 pointer-events-none" />

      {/* Navigation */}
      <header className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
            C
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-slate-900">
            Campus<span className="text-blue-600">Connect</span>
          </span>
        </div>
        <Link href="/login">
          <Button variant="primary" size="sm" className="rounded-full shadow-lg shadow-blue-600/10">
            Sign In
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 flex flex-col items-center justify-center text-center">
        <div className="max-w-3xl flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
            Introducing Campus Connect 1.0
          </div>
          <h1 className="font-display font-extrabold text-5xl md:text-6xl text-slate-900 leading-[1.1] mb-6 tracking-tight">
            One Platform. <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Three Colleges.
            </span>{' '}
            <br />
            Connected Together.
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mb-10 leading-relaxed font-sans">
            The next generation unified educational portal connecting students, instructors, and administrators from all three colleges into a single high-performance system.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button size="lg" className="rounded-full px-8 py-3.5 shadow-xl shadow-blue-600/20 hover:shadow-2xl">
                Get Started
              </Button>
            </Link>
            <a href="#features">
              <Button variant="ghost" size="lg" className="rounded-full text-slate-600 hover:text-slate-900">
                Learn More
              </Button>
            </a>
          </div>
        </div>

        {/* Feature Grid */}
        <section id="features" className="w-full mt-28 py-16">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl text-slate-900">
              Powerful Features designed for Campus Life
            </h2>
            <p className="text-slate-500 mt-2">
              Everything you need to succeed, all consolidated in one smart interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="glass-card shadow-hover group relative overflow-hidden border-slate-100 p-6 flex flex-col items-start text-left cursor-default">
                <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  {f.icon}
                </div>
                <h3 className="font-display font-semibold text-lg text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                  {f.title}
                </h3>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                  {f.description}
                </p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-900 text-slate-400 py-12 mt-auto border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              C
            </div>
            <span className="font-display font-bold text-lg text-white">
              CampusConnect
            </span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} Campus Connect. All rights reserved. Connecting Apex, Beacon, and Crown.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
