'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@campus-connect/ui';
import { useAuth } from '../../../components/AuthProvider';
import { Users, FileText, CheckCircle2, Megaphone, Trash2 } from 'lucide-react';

interface EventRecord {
  id: string;
  title: string;
  category: string;
  location: string;
  date: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();

  const [events, setEvents] = useState<EventRecord[]>([
    { id: 'evt-1', title: 'Summer Startup Incubator Pitch', category: 'academic', location: 'Auditorium C', date: '2026-07-10' },
    { id: 'evt-2', title: 'Campus Sports Meet 2026', category: 'sports', location: 'Main Sports Ground', date: '2026-07-20' },
    { id: 'evt-3', title: 'Web Development Workshop', category: 'technical', location: 'Computer Lab 3', date: '2026-07-28' },
  ]);

  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('academic');
  const [location, setLocation] = useState<string>('');
  const [date, setDate] = useState<string>('');
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const stats = [
    { label: 'Total Enrolled Students', count: '1,420', icon: <Users className="h-5 w-5 text-blue-600" /> },
    { label: 'Active Faculty Members', count: '85', icon: <Users className="h-5 w-5 text-purple-600" /> },
    { label: 'Courses Run this Term', count: '112', icon: <FileText className="h-5 w-5 text-emerald-600" /> },
  ];

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);

    if (!title || !location || !date) {
      alert('Please fill out all event details.');
      return;
    }

    const newEvent: EventRecord = {
      id: `evt-${Date.now()}`,
      title,
      category,
      location,
      date,
    };

    setEvents(prev => [newEvent, ...prev]);
    setSuccessMsg(`Successfully created event "${title}"!`);

    setTitle('');
    setLocation('');
    setDate('');

    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  return (
    <DashboardLayout title="Admin Control Center">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Stats and Event Management List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-emerald-500/10">
            <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-2xl font-bold">Welcome Back, {user?.name}!</h2>
            <p className="text-emerald-100 text-sm mt-1">
              Administrator Portal • Campus Overview & Event Manager
            </p>
          </div>
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, idx) => (
              <Card key={idx} className="p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    {stat.label}
                  </span>
                  <span className="text-2xl font-bold text-slate-900 mt-1 block">
                    {stat.count}
                  </span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  {stat.icon}
                </div>
              </Card>
            ))}
          </div>

          {/* Managed Events Directory */}
          <Card>
            <CardHeader>
              <CardTitle>Active College Events</CardTitle>
              <p className="text-xs text-slate-500">Upcoming festivals, academic conferences, and workshops</p>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {events.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No upcoming events listed. Use the dashboard panel to post.
                </div>
              ) : (
                events.map((evt) => (
                  <div key={evt.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 hover:bg-white hover:shadow-sm transition-all duration-200 flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Megaphone className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-950 text-sm">{evt.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {evt.date} • {evt.location}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {evt.category}
                      </span>
                      <button
                        onClick={() => handleDeleteEvent(evt.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Create Event Panel */}
        <div className="space-y-6">
          <Card className="border-emerald-100/70 shadow-lg shadow-emerald-500/5">
            <CardHeader>
              <CardTitle>Post Campus Event</CardTitle>
              <p className="text-xs text-slate-500">Publish to the central event calendar</p>
            </CardHeader>
            <CardContent>
              {successMsg && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateEvent} className="space-y-4">
                
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Event Title
                  </label>
                  <Input
                    placeholder="e.g. Annual Tech Symposium"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    <option value="academic">Academic</option>
                    <option value="technical">Technical</option>
                    <option value="sports">Sports</option>
                    <option value="cultural">Cultural</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Location / Venue
                  </label>
                  <Input
                    placeholder="e.g. Main Auditorium"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 text-sm shadow-md shadow-emerald-500/10"
                >
                  Publish Event
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
}
