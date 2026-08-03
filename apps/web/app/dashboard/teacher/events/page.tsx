'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@campus-connect/ui';
import { Calendar, MapPin, Sparkles, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../../../utils/api';

export default function TeacherEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'academic',
    venue: '',
    startDatetime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await api.getEvents();
      if (res.success) {
        setEvents(res.data || []);
      }
    } catch (err) {
      console.warn('Failed to load events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.venue) return;
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await api.createEvent(formData);
      if (res.success) {
        setMessage({ type: 'success', text: 'Event created and published successfully!' });
        setShowModal(false);
        setFormData({
          title: '',
          description: '',
          category: 'academic',
          venue: '',
          startDatetime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        });
        fetchEvents();
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to publish event.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error while publishing event.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Events Management" icon={<Calendar className="h-6 w-6 text-emerald-600" />}>
      <div className="space-y-6">
        
        {/* Banner */}
        <div className="p-6 bg-emerald-50/70 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Faculty & Class Events</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Schedule hackathons, guest lectures, and departmental workshops for your assigned students</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Schedule New Event
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
            {message.text}
          </div>
        )}

        {/* Events Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[250px] gap-3">
            <div className="h-8 w-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-semibold">Loading events schedule...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/20 dark:bg-slate-900/5">
            <Calendar className="h-10 w-10 mx-auto text-slate-400 mb-3" />
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Events Scheduled</h4>
            <p className="text-xs text-slate-450 mt-1">Click "Schedule New Event" above to create an event for your students.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((evt) => (
              <Card key={evt.id} className="flex flex-col border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center shrink-0">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold line-clamp-1">{evt.title}</CardTitle>
                      <p className="text-[10px] text-slate-400 mt-0.5">Venue: {evt.venue}</p>
                    </div>
                  </div>
                  <Badge variant="primary" className="capitalize text-[9px]">
                    {evt.category || 'Academic'}
                  </Badge>
                </CardHeader>

                <CardContent className="flex-1 p-5 pt-0 space-y-4 text-xs flex flex-col justify-between">
                  <p className="text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed mt-2">
                    {evt.description || evt.title}
                  </p>

                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-900 pt-3 text-[10px] text-slate-500 font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      <span>{new Date(evt.startDatetime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      <span>{evt.venue}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Schedule Class Event</h3>
              
              <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DBMS Guest Workshop"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Event objectives and guidelines..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 text-slate-800 dark:text-slate-200 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    >
                      <option value="academic">Academic</option>
                      <option value="technical">Technical</option>
                      <option value="workshop">Workshop</option>
                      <option value="seminar">Seminar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Venue / Room</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Auditorium / Lab 3"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDatetime}
                    onChange={(e) => setFormData({ ...formData, startDatetime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-50"
                  >
                    {submitting ? 'Publishing...' : 'Publish Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
