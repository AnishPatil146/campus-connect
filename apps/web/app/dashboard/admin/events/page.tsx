'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Button, Badge } from '@campus-connect/ui';
import { Plus, Users, MapPin, Sparkles, Download } from 'lucide-react';

interface CampusEvent {
  id: string;
  title: string;
  category: string;
  venue: string;
  date: string;
  capacity: string;
  registered: number;
}

export default function EventManagement() {
  const [events] = useState<CampusEvent[]>([
    { id: '1', title: 'Tech Connect Hackathon 2026', category: 'Technical', venue: 'Main Seminar Hall', date: '15 Jul 2026', capacity: '150', registered: 98 },
    { id: '2', title: 'Annual Cultural Fest: Tarang', category: 'Cultural', venue: 'College Quadrangle', date: '28 Jul 2026', capacity: '500', registered: 310 },
    { id: '3', title: 'Monsoon Sports Shield', category: 'Sports', venue: 'Football Ground', date: '05 Aug 2026', capacity: '200', registered: 45 },
  ]);

  return (
    <DashboardLayout title="Event Management" icon={<Sparkles className="h-6 w-6" />}>
      <div className="space-y-6">
        
        {/* Top actions panel */}
        <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-slate-100 dark:border-slate-850">
          <div>
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Campus Events Portal</h4>
            <p className="text-xs text-slate-400 mt-0.5">Manage event schedules, banners, attendee lists and capacities.</p>
          </div>
          
          <Button className="h-10 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Event</span>
          </Button>
        </Card>

        {/* Events listing */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Details</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Registration Capacity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{ev.title}</p>
                      <p className="text-xs text-slate-400">ID: EV-2026-00{ev.id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                      {ev.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 dark:text-slate-350">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{ev.venue}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-semibold">{ev.date}</TableCell>
                  <TableCell className="text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span>{ev.registered} / {ev.capacity}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-1.5">
                    <Button variant="secondary" size="sm" className="h-8 text-xs rounded-lg inline-flex items-center gap-1" title="Export Attendees list">
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">List</span>
                    </Button>
                    <Button variant="secondary" size="sm" className="h-8 text-xs rounded-lg">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

      </div>
    </DashboardLayout>
  );
}
