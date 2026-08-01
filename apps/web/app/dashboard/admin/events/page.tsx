'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Button, Badge } from '@campus-connect/ui';
import { Plus, Users, MapPin, Sparkles, Download, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../../../utils/api';
import { useAuth } from '../../../../components/AuthProvider';

export default function EventManagement() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create Event Form
  const [title, setTitle] = useState('');
  const [type, setType] = useState('HACKATHON');
  const [category, setCategory] = useState('TECHNICAL');
  const [venue, setVenue] = useState('Auditorium Hall 1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [capacity, setCapacity] = useState('200');
  const [attachmentName, setAttachmentName] = useState('');

  // Alerts
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await api.getEvents({ collegeId: user?.collegeId });
      if (res.success && res.data) {
        setEvents(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch events:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) return;

    try {
      const payload = {
        title,
        type,
        category,
        venue,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        capacity: Number(capacity) || 100,
        attachmentUrl: attachmentName ? `/files/${attachmentName}` : undefined,
        collegeId: user?.collegeId,
      };

      const res = await api.createEvent(payload);
      if (res.success) {
        setSuccessMsg(`Event "${title}" created successfully!`);
        setTitle('');
        setStartDate('');
        setEndDate('');
        setShowCreateModal(false);
        fetchEvents();
      } else {
        setErrorMsg(res.message || 'Failed to create event.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating event.');
    } finally {
      setTimeout(() => { setSuccessMsg(null); setErrorMsg(null); }, 4000);
    }
  };

  return (
    <DashboardLayout title="Event Management & Campus Activities" icon={<Sparkles className="h-6 w-6 text-emerald-500" />}>
      <div className="space-y-6">
        
        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold rounded-2xl flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-semibold rounded-2xl flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Top actions panel */}
        <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-slate-100 dark:border-slate-850">
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Campus Events Portal</h4>
            <p className="text-xs text-slate-400 mt-0.5">Manage event schedules, categories, attendee lists and attachments.</p>
          </div>
          
          <Button
            onClick={() => setShowCreateModal(true)}
            className="h-10 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center gap-2 font-bold text-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Create Event</span>
          </Button>
        </Card>

        {/* Events listing */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading campus events...</div>
          ) : events.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No events scheduled. Click "Create Event" to announce an activity.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Details</TableHead>
                  <TableHead>Type & Category</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Start / End Dates</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead className="text-right">Actions / Attachment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((ev: any) => (
                  <TableRow key={ev.id}>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{ev.title}</p>
                        <p className="text-[10px] text-slate-400">ID: {ev.id.slice(-8)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="primary" className="text-[9px] uppercase font-bold">
                          {ev.type || 'FUNCTION'}
                        </Badge>
                        <Badge variant="secondary" className="text-[9px] uppercase">
                          {ev.category || 'TECHNICAL'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-350">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{ev.venue || 'Campus Venue'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-semibold">
                      {new Date(ev.startDate).toLocaleDateString()} — {new Date(ev.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>{ev.registered || 0} / {ev.capacity || 100}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {ev.attachmentUrl ? (
                        <a
                          href={ev.attachmentUrl}
                          download
                          className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 text-xs font-bold rounded-lg inline-flex items-center gap-1 hover:bg-emerald-100"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>PDF / Doc</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400">No File Attached</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Create Event Modal */}
        {showCreateModal && (
          <>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-45" onClick={() => setShowCreateModal(false)} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Create Campus Event</h3>
                <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tech Connect Hackathon 2026"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Event Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold"
                    >
                      <option value="FUNCTION">College Function</option>
                      <option value="HACKATHON">Hackathon / Coding</option>
                      <option value="WORKSHOP">Workshop / Seminar</option>
                      <option value="SPORTS">Sports Tournament</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950 font-semibold"
                    >
                      <option value="TECHNICAL">Technical</option>
                      <option value="CULTURAL">Cultural</option>
                      <option value="SPORTS">Sports</option>
                      <option value="ACADEMIC">Academic</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Venue / Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Main Auditorium"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Max Capacity</label>
                    <input
                      type="number"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Attachment File Name (PDF/Doc)</label>
                  <input
                    type="text"
                    placeholder="e.g. hackathon_rules_brochure.pdf"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    className="w-full h-10 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-950"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    Publish Event
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}
