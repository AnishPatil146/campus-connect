'use client';

import React from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@campus-connect/ui';
import { useStudentData } from '../../../../components/StudentDataProvider';
import { Calendar, MapPin, Users, Award, Sparkles, Check } from 'lucide-react';

export default function EventsPage() {
  const { events, toggleEventParticipation } = useStudentData();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return <Sparkles className="h-5 w-5 text-blue-600" />;
      case 'sports': return <Award className="h-5 w-5 text-amber-600" />;
      default: return <Users className="h-5 w-5 text-purple-600" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'technical': return 'primary';
      case 'sports': return 'warning';
      case 'cultural': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <DashboardLayout title="🎉 Campus Events">
      <div className="space-y-6">
        
        {/* Banner */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Register for Events</h3>
            <p className="text-xs text-slate-500 mt-1">Explore hackathons, sports championships, and cultural celebrations across all colleges</p>
          </div>
          <Badge variant="primary" className="text-xs">
            Admin Controlled Registration
          </Badge>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => {
            const isRegistrationClosed = new Date().getTime() > new Date(evt.registrationEnd).getTime();
            const noSeatsLeft = evt.seatsLeft <= 0;

            return (
              <Card key={evt.id} className="flex flex-col border-slate-100 overflow-hidden bg-white dark:bg-slate-950">
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shrink-0">
                      {getCategoryIcon(evt.category)}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold line-clamp-1">{evt.title}</CardTitle>
                      <p className="text-[10px] text-slate-400 mt-0.5">By {evt.organizer}</p>
                    </div>
                  </div>
                  <Badge variant={getCategoryBadge(evt.category)} className="capitalize text-[9px]">
                    {evt.category}
                  </Badge>
                </CardHeader>

                <CardContent className="flex-1 p-5 pt-0 space-y-4 text-xs flex flex-col justify-between">
                  <p className="text-slate-600 dark:text-slate-450 line-clamp-3 leading-relaxed mt-2">
                    {evt.description}
                  </p>

                  <div className="space-y-2 border-t border-b border-slate-50 dark:border-slate-900/50 py-3 text-[10px] text-slate-500 font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>{evt.date} • {evt.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span>{evt.venue}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider text-slate-400">Seats Left:</span>
                      <span className={`font-bold text-xs ${evt.seatsLeft < 15 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                        {evt.seatsLeft} / {evt.seatsTotal}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <div className="flex justify-between items-center text-[10px] text-slate-450">
                      <span>Registration Ends:</span>
                      <span className="font-semibold">{evt.registrationEnd}</span>
                    </div>

                    <button
                      disabled={isRegistrationClosed || (noSeatsLeft && !evt.isParticipating)}
                      onClick={() => toggleEventParticipation(evt.id)}
                      className={`w-full h-10 font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all active:scale-[0.98] ${
                        evt.isParticipating
                          ? 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-700'
                          : isRegistrationClosed
                          ? 'bg-slate-100 text-slate-450 border border-slate-200 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10'
                      }`}
                    >
                      {evt.isParticipating ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Participating
                        </>
                      ) : isRegistrationClosed ? (
                        'Registration Closed'
                      ) : noSeatsLeft ? (
                        'No Seats Left'
                      ) : (
                        'Participate'
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

      </div>
    </DashboardLayout>
  );
}
