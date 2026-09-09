'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTimetable } from '@/context/TimetableContext';
import { exportTimetableToExcel, exportTimetableToPDF } from '@/lib/export-utils';
import { 
  timeToMinutes,
  TIME_SLOTS_30MIN,
  TIMETABLE_DAYS,
  calculateSlotSpan
} from '@/lib/conflict-engine';
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
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-shu-700" />
              <span className="font-bold text-slate-900 text-sm">
                Faculty Weekly Lecture Schedule (08:30 AM – 03:00 PM)
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              13 × 30-min Units • {teacherSessions.length} Total Lecture Sections
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[950px]">
              {/* Header: Horizontal Axis with Days of the Week */}
              <div 
                className="grid bg-slate-100/90 border-b border-slate-200 text-center text-xs font-bold text-slate-800 select-none py-2.5"
                style={{
                  gridTemplateColumns: `110px repeat(7, minmax(130px, 1fr))`,
                }}
              >
                {/* Top-Left Corner: Time Label */}
                <div className="py-1 px-3 border-r border-slate-200 flex items-center justify-center gap-1.5 text-slate-600 font-bold">
                  <Clock className="w-3.5 h-3.5 text-shu-700" />
                  <span>Time \ Day</span>
                </div>

                {/* Day Columns */}
                {TIMETABLE_DAYS.map((day) => {
                  const count = teacherSessions.filter((s) => s.day_of_week === day.id).length;
                  return (
                    <div
                      key={day.id}
                      className="py-1 px-2 border-r border-slate-200/80 last:border-r-0 flex items-center justify-center gap-1.5"
                    >
                      <span className="font-extrabold text-slate-900 text-xs">
                        {day.name}
                      </span>
                      {day.isWeekend && (
                        <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          Exc
                        </span>
                      )}
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Grid Body: Time Slots as Vertical Axis Rows */}
              <div 
                className="grid"
                style={{
                  gridTemplateColumns: `110px repeat(7, minmax(130px, 1fr))`,
                }}
              >
                {/* Column 1: Vertical Time Slot Labels (13 × 30-min Rows) */}
                <div className="border-r border-slate-200 bg-slate-50/70 divide-y divide-slate-200/80">
                  {TIME_SLOTS_30MIN.map((slot) => (
                    <div
                      key={slot.id}
                      className="h-[62px] px-2 flex flex-col items-center justify-center text-center select-none"
                    >
                      <span className="font-mono text-[11px] text-slate-900 font-bold">
                        {slot.start}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 font-medium">
                        {slot.end}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Day Columns (Each containing 13 equal 30-min vertical row slots) */}
                {TIMETABLE_DAYS.map((day) => {
                  const daySessions = teacherSessions.filter((s) => s.day_of_week === day.id);

                  return (
                    <div
                      key={day.id}
                      className={`border-r border-slate-200/80 last:border-r-0 relative p-1.5 ${
                        day.isWeekend ? 'bg-amber-50/20' : 'bg-white'
                      }`}
                    >
                      {/* Vertical Grid of 13 Rows */}
                      <div 
                        className="relative grid gap-1 w-full"
                        style={{
                          gridTemplateRows: `repeat(13, 58px)`,
                        }}
                      >
                        {/* Background 13 Empty 30-min Slots */}
                        {TIME_SLOTS_30MIN.map((slot) => (
                          <div
                            key={slot.id}
                            style={{ gridRow: `${slot.id + 1} / span 1` }}
                            className="w-full h-full rounded-xl border border-dashed border-slate-200/60 bg-slate-50/40 flex items-center justify-center"
                          >
                            <span className="text-[9px] font-mono text-slate-300 font-medium select-none">
                              {slot.start}
                            </span>
                          </div>
                        ))}

                        {/* Faculty Sessions Positioned Vertically across Exact Span */}
                        {daySessions.map((s) => {
                          const crs = courses.find((c) => c.id === s.course_id);
                          const rm = rooms.find((r) => r.id === s.room_id);
                          const bth = batches.find((b) => b.id === s.batch_id);
                          const isUnassigned = !s.room_id || !rm;

                          const { rowStart, rowSpan, boxesCount } = calculateSlotSpan(
                            s.start_time,
                            s.end_time
                          );

                          return (
                            <div
                              key={s.id}
                              style={{
                                gridRow: `${rowStart} / span ${rowSpan}`,
                              }}
                              className="absolute inset-x-1 inset-y-0.5 z-10"
                            >
                              <div
                                className={`h-full p-2.5 rounded-xl border shadow-2xs flex flex-col justify-between transition-all ${
                                  isUnassigned
                                    ? 'bg-amber-50/95 border-amber-300'
                                    : 'bg-teal-50/95 border-teal-200 hover:border-teal-400 hover:shadow-md'
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <span className="font-extrabold text-teal-950 font-mono text-[11px] bg-teal-100/90 px-1.5 py-0.5 rounded">
                                        {crs?.code}
                                      </span>
                                      <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-white text-slate-600 border border-slate-200">
                                        {boxesCount} {boxesCount === 1 ? 'box' : 'boxes'}
                                      </span>
                                    </div>

                                    <span className="text-[10px] font-mono font-bold text-teal-900">
                                      {s.start_time} - {s.end_time}
                                    </span>
                                  </div>

                                  <h5 className="font-bold text-slate-900 line-clamp-1 text-xs">
                                    {crs?.name}
                                  </h5>
                                </div>

                                <div className="pt-1.5 mt-1 border-t border-teal-100/80 flex items-center justify-between gap-1 text-[10px]">
                                  <span className="font-semibold text-slate-700 truncate">
                                    Batch: {bth?.name}
                                  </span>

                                  {isUnassigned ? (
                                    <span className="flex items-center gap-0.5 font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded text-[9px]">
                                      <AlertTriangle className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                                      <span>Pending Room</span>
                                    </span>
                                  ) : (
                                    <span className="font-bold text-teal-800 truncate">
                                      {rm?.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
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
