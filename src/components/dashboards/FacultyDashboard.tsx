'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTimetable } from '@/context/TimetableContext';
import { exportTimetableToExcel, exportTimetableToPDF } from '@/lib/export-utils';
import { timeToMinutes } from '@/lib/conflict-engine';
import { 
  UserCheck, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  FileSpreadsheet, 
  FileText, 
  DoorOpen, 
  PlusCircle, 
  Sparkles,
  Layers,
  AlertTriangle
} from 'lucide-react';

const DAYS = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
];

const TIME_SLOTS = [
  '08:30 - 10:00',
  '10:15 - 11:45',
  '12:00 - 13:30',
  '13:30 - 15:00',
  '15:15 - 16:45',
  '17:00 - 18:30',
];

export const FacultyDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { faculty, sessions, courses, rooms, batches, activeSemester } = useTimetable();

  // Find linked faculty profile
  const teacherProfile =
    faculty.find((f) => f.email.toLowerCase() === currentUser?.email.toLowerCase()) ||
    faculty.find((f) => f.id === currentUser?.faculty_id) ||
    faculty[0];

  const teacherSessions = sessions.filter(
    (s) => s.faculty_id === teacherProfile?.id && s.status !== 'cancelled'
  );

  // Weekly hours math
  const totalWeeklyMinutes = teacherSessions.reduce((acc, s) => {
    return acc + (timeToMinutes(s.end_time) - timeToMinutes(s.start_time));
  }, 0);
  const totalWeeklyHours = totalWeeklyMinutes / 60;
  const maxLoad = (teacherProfile?.max_load_per_day || 4) * 4;

  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'room_lookup'>('schedule');
  const [lookupDate, setLookupDate] = useState<string>('2026-09-25');

  const handleExport = (type: 'excel' | 'pdf') => {
    const title = `Faculty_${teacherProfile?.name || 'Instructor'}`;
    if (type === 'excel') {
      exportTimetableToExcel({
        sessions: teacherSessions,
        rooms,
        faculty,
        batches,
        courses,
        filterTitle: title,
      });
    } else {
      exportTimetableToPDF({
        sessions: teacherSessions,
        rooms,
        faculty,
        batches,
        courses,
        filterTitle: title,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Faculty Welcome Header */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-red-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white">
                Fatima Business School
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600/60 text-white">
                Salim Habib University
              </span>
              <span className="text-xs text-red-200">
                {teacherProfile?.department} • Max {teacherProfile?.max_load_per_day}h/day
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {teacherProfile?.name || currentUser?.name}
            </h1>
            <p className="text-xs sm:text-sm text-red-100/90 mt-1 max-w-xl">
              Welcome back to Fatima Business School faculty portal. You have <span className="font-bold text-white">{teacherSessions.length} lecture sections</span> ({totalWeeklyHours.toFixed(1)} hours/week) allocated this term.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white text-slate-800 hover:bg-red-50 rounded-xl shadow-xs transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Schedule</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white text-slate-800 hover:bg-red-50 rounded-xl shadow-xs transition-all"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>PDF Copy</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('schedule')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeSubTab === 'schedule'
              ? 'border-shu-700 text-shu-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>My Teaching Schedule Matrix</span>
        </button>

        <button
          onClick={() => setActiveSubTab('room_lookup')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeSubTab === 'room_lookup'
              ? 'border-shu-700 text-shu-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          <span>Room & Resource Availability Finder</span>
        </button>
      </div>

      {/* Tab 1: Weekly Matrix */}
      {activeSubTab === 'schedule' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-[120px_repeat(6,1fr)] bg-slate-50 border-b border-slate-200 text-center text-xs font-bold text-slate-700 py-3">
                <div className="text-slate-500">Time Slot</div>
                {DAYS.map((d) => (
                  <div key={d.id}>{d.name}</div>
                ))}
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-100 text-xs">
                {TIME_SLOTS.map((slot) => {
                  const [slotStart] = slot.split(' - ').map((s) => s.trim());

                  return (
                    <div key={slot} className="grid grid-cols-[120px_repeat(6,1fr)] min-h-[90px] items-stretch">
                      <div className="p-3 bg-slate-50/60 border-r border-slate-200 font-mono font-bold text-slate-700 flex items-center justify-center text-center">
                        {slot}
                      </div>

                      {DAYS.map((day) => {
                        const matched = teacherSessions.filter(
                          (s) => s.day_of_week === day.id && s.start_time.startsWith(slotStart)
                        );

                        return (
                          <div key={day.id} className="p-1.5 border-r border-slate-100 last:border-r-0">
                            {matched.map((s) => {
                              const crs = courses.find((c) => c.id === s.course_id);
                              const rm = rooms.find((r) => r.id === s.room_id);
                              const bth = batches.find((b) => b.id === s.batch_id);
                              const isUnassigned =
                                !rm ||
                                s.room_id === 'room-unassigned' ||
                                s.room_id === 'a0000000-0000-0000-0000-000000000000' ||
                                rm.name.includes('Pending') ||
                                rm.name.includes('Not Assigned');

                              return (
                                <div
                                  key={s.id}
                                  className={`p-2.5 rounded-xl border space-y-1 shadow-2xs ${
                                    isUnassigned
                                      ? 'bg-amber-50 border-amber-300'
                                      : 'bg-teal-50 border-teal-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-teal-900 font-mono text-[11px]">
                                      {crs?.code}
                                    </span>
                                    {isUnassigned ? (
                                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded">
                                        <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
                                        <span>Pending Room</span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-semibold text-teal-700">
                                        {rm?.name}
                                      </span>
                                    )}
                                  </div>
                                  <h5 className="font-bold text-slate-900 line-clamp-1 text-[11px]">
                                    {crs?.name}
                                  </h5>
                                  <div className="text-[10px] text-slate-500 font-medium">
                                    Batch: {bth?.name}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Free Room Finder */}
      {activeSubTab === 'room_lookup' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Campus Venue Availability Finder</h3>
              <p className="text-xs text-slate-500">Query available lecture halls and labs for ad-hoc sessions</p>
            </div>
            <input
              type="date"
              value={lookupDate}
              onChange={(e) => setLookupDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {rooms.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">{r.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    Available
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {r.building} • Cap: {r.capacity}
                </p>
                <div className="flex items-center gap-1 flex-wrap pt-1">
                  {r.room_types.map((t) => (
                    <span key={t} className="px-1.5 py-0.2 rounded bg-white text-slate-700 text-[10px] border border-slate-200">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
