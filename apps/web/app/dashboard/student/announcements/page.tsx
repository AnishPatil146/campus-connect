'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '../../../../components/DashboardLayout';
import { Card, CardContent, Badge } from '@campus-connect/ui';
import { useStudentData } from '../../../../components/StudentDataProvider';
import { Megaphone, Search, Eye, EyeOff, Calendar } from 'lucide-react';

export default function AnnouncementsPage() {
  const { announcements, toggleAnnouncementRead } = useStudentData();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { value: 'all', label: 'All' },
    { value: 'results', label: 'Results' },
    { value: 'notices', label: 'Notices' },
    { value: 'warnings', label: 'Warnings' },
    { value: 'holidays', label: 'Holidays' },
    { value: 'exams', label: 'Exam Schedule' }
  ];

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'results': return 'primary';
      case 'warnings': return 'danger';
      case 'holidays': return 'success';
      case 'exams': return 'info';
      default: return 'secondary';
    }
  };

  const filteredAnnouncements = announcements.filter(ann => {
    const matchesSearch = ann.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ann.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || ann.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout title="Announcements" icon={<Megaphone className="h-6 w-6" />}>
      <div className="space-y-6">
        
        {/* Filter controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-900">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeCategory === cat.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-650 dark:text-slate-450 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/20 dark:bg-slate-900/5">
              <Megaphone className="h-10 w-10 mx-auto text-slate-400 mb-3" />
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No announcements found</h4>
              <p className="text-xs text-slate-450 mt-1">Check back later for fresh updates</p>
            </div>
          ) : (
            filteredAnnouncements.map((ann) => (
              <Card 
                key={ann.id} 
                className={`border-slate-100 overflow-hidden transition-all duration-200 bg-white dark:bg-slate-950 ${
                  !ann.isRead ? 'border-l-4 border-l-blue-600' : ''
                }`}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-500 shrink-0 relative">
                        <Megaphone className="h-5 w-5" />
                        {!ann.isRead && (
                          <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-blue-650 rounded-full border-2 border-white dark:border-slate-955" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                          {ann.title}
                          {!ann.isRead && (
                            <Badge variant="primary" className="text-[8px] py-0 px-1">Unread</Badge>
                          )}
                        </h4>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 font-semibold">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Published: {ann.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={getCategoryBadge(ann.category)} className="capitalize text-[10px] px-2.5 py-0.5 shrink-0">
                        {ann.category === 'exams' ? 'Exam Schedule' : ann.category}
                      </Badge>

                      <button
                        onClick={() => toggleAnnouncementRead(ann.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shrink-0"
                        title={ann.isRead ? "Mark as unread" : "Mark as read"}
                      >
                        {ann.isRead ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-medium pl-13">
                    {ann.content}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
