'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Button, Input } from '@campus-connect/ui';
import { Calendar, Plus, Clock, Users, Building, ShieldAlert, Trash2 } from 'lucide-react';
import { api, TimetableEntry } from '../../../../utils/api';

export default function TimetableManagement() {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [lectures, setLectures] = useState<TimetableEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // Form states for new lecture
  const [subject, setSubject] = useState('');
  const [course, setCourse] = useState('BSc IT');
  const [division, setDivision] = useState('Division A');
  const [teacher, setTeacher] = useState('');
  const [classroom, setClassroom] = useState('');
  const [timeSlot, setTimeSlot] = useState('09:00 AM - 10:30 AM');
  const [subjectCode, setSubjectCode] = useState('');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const loadTimetable = async () => {
    const list = await api.getTimetable();
    setLectures(list);
  };

  useEffect(() => {
    loadTimetable();
  }, []);

  const handleAddLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !teacher || !classroom) return;

    const newEntry: TimetableEntry = {
      id: `std-time-${Date.now()}`,
      subject,
      course,
      division,
      teacher,
      classroom,
      day: selectedDay,
      timeSlot,
      subjectCode: subjectCode || 'GEN-101',
    };

    const updated = [...lectures, newEntry];
    await api.saveTimetable(updated);
    setLectures(updated);
    
    // Reset form
    setSubject('');
    setTeacher('');
    setClassroom('');
    setSubjectCode('');
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    const updated = lectures.filter(l => l.id !== id);
    await api.saveTimetable(updated);
    setLectures(updated);
  };

  const handleClearAll = async () => {
    if (confirm('Are you sure you want to clear the entire timetable?')) {
      await api.saveTimetable([]);
      setLectures([]);
    }
  };

  return (
    <DashboardLayout title="Timetable Management" icon={<Calendar className="h-6 w-6" />}>
      <div className="space-y-6">
        
        {/* Conflict Detection Alert */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-350">Conflict Detection Engine Active</h4>
              <p className="text-xs text-emerald-600 mt-0.5">
                Checks teacher and classroom schedules automatically during spreadsheet imports to block double-bookings.
              </p>
            </div>
          </div>
          {lectures.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs font-bold text-red-600 hover:text-red-750 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-xl transition-all self-end sm:self-auto"
            >
              Clear Timetable
            </button>
          )}
        </div>

        {/* Days Selector */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {daysOfWeek.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-150 uppercase tracking-wide shrink-0 ${
                selectedDay === day
                  ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/20 dark:border-blue-500 dark:text-blue-400 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Add Lecture Card Form */}
        {isAdding && (
          <Card className="border border-blue-100 dark:border-slate-800 bg-blue-50/10 dark:bg-slate-900/10">
            <CardContent className="p-6">
              <form onSubmit={handleAddLecture} className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                    Add Lecture on {selectedDay}
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => setIsAdding(false)} 
                    className="text-xs text-slate-400 hover:text-slate-655"
                  >
                    Cancel
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input 
                    label="Subject Code" 
                    placeholder="e.g. CS-401" 
                    value={subjectCode} 
                    onChange={e => setSubjectCode(e.target.value)} 
                  />
                  <Input 
                    label="Subject Name" 
                    placeholder="Database Management Systems" 
                    value={subject} 
                    onChange={e => setSubject(e.target.value)} 
                    required 
                  />
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Course Program</label>
                    <select
                      className="h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
                      value={course}
                      onChange={e => setCourse(e.target.value)}
                    >
                      <option value="BSc IT">BSc IT</option>
                      <option value="BCom">BCom</option>
                      <option value="BA">BA</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1 text-left">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Division</label>
                    <select
                      className="h-10 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
                      value={division}
                      onChange={e => setDivision(e.target.value)}
                    >
                      <option value="Division A">Division A</option>
                      <option value="Division B">Division B</option>
                    </select>
                  </div>
                  <Input 
                    label="Teacher / Faculty" 
                    placeholder="Dr. Sarah Jenkins" 
                    value={teacher} 
                    onChange={e => setTeacher(e.target.value)} 
                    required 
                  />
                  <Input 
                    label="Classroom Room" 
                    placeholder="LHC-302" 
                    value={classroom} 
                    onChange={e => setClassroom(e.target.value)} 
                    required 
                  />
                  <Input 
                    label="Time Slot" 
                    placeholder="09:00 AM - 10:30 AM" 
                    value={timeSlot} 
                    onChange={e => setTimeSlot(e.target.value)} 
                    required 
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" size="sm" className="h-9 px-4 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-semibold">
                    Save Lecture Slot
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Header and Add Button */}
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">
            Lectures on {selectedDay}
          </h3>
          {!isAdding && (
            <Button 
              size="sm" 
              onClick={() => setIsAdding(true)} 
              className="rounded-lg h-9 bg-slate-900 text-white dark:bg-white dark:text-slate-950"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Lecture
            </Button>
          )}
        </div>

        {/* Timetable Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time Slot</TableHead>
                <TableHead>Subject Name</TableHead>
                <TableHead>Class / Division</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Classroom</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lectures.filter(l => l.day === selectedDay).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                    No lectures scheduled for {selectedDay}. Import a timetable from Excel or click 'Add Lecture' above.
                  </TableCell>
                </TableRow>
              ) : (
                lectures.filter(l => l.day === selectedDay).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{l.timeSlot}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{l.subject}</p>
                        {l.subjectCode && <p className="text-[10px] font-semibold text-slate-400 tracking-wider mt-0.5">{l.subjectCode}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-350">{l.course} • {l.division}</TableCell>
                    <TableCell className="text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>{l.teacher}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        <span>{l.classroom}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleDelete(l.id)} 
                        className="h-8 text-xs text-red-650 hover:text-red-700 rounded-lg inline-flex items-center"
                        title="Delete slot"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

      </div>
    </DashboardLayout>
  );
}
