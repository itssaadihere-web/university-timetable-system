'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTimetable } from '@/context/TimetableContext';
import { exportTimetableToExcel, exportTimetableToPDF } from '@/lib/export-utils';
import { 
  timeToMinutes,
  TIME_SLOTS_30MIN,
  TIMETABLE_DAYS,
  calculateSlotSpan,
  formatTo12Hour,
  formatTimeRange
} from '@/lib/conflict-engine';
import { getCourseColor } from '@/lib/course-colors';
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
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-shu-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-shu-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white backdrop-blur border border-white/10">
                Fatima Business School
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-600 text-white shadow-2xs">
                Faculty Portal
              </span>
              <span className="text-xs font-medium text-slate-300">
                {teacherProfile?.department} • Max {teacherProfile?.max_load_per_day}h/day
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {teacherProfile?.name || currentUser?.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl leading-relaxed">
              Welcome back. You have <span className="font-semibold text-white">{teacherSessions.length} lecture sections</span> ({totalWeeklyHours.toFixed(1)} hours/week) scheduled for the active academic term.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-white text-slate-800 hover:bg-slate-50 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Schedule</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-white text-slate-800 hover:bg-slate-50 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('schedule')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'schedule'
              ? 'bg-shu-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>My Teaching Schedule Matrix</span>
        </button>

        <button
          onClick={() => setActiveSubTab('room_lookup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'room_lookup'
              ? 'bg-shu-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          <span>Campus Room Availability Finder</span>
        </button>
      </div>

      {/* Tab 1: Weekly Matrix */}
      {activeSubTab === 'schedule' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-shu-700" />
              <span className="font-bold text-slate-900 text-sm">
                Teaching Schedule: {teacherProfile?.name} (08:30 AM – 03:00 PM)
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500 font-mono">
              13 × 30-min Units • {teacherSessions.length} Total Sections ({totalWeeklyHours.toFixed(1)}h/wk)
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[950px]">
              {/* Header: Horizontal Axis with Days of the Week */}
              <div 
                className="grid bg-slate-100/75 border-b border-slate-200 text-center text-xs font-bold text-slate-800 select-none py-2.5"
                style={{
                  gridTemplateColumns: `110px repeat(7, minmax(130px, 1fr))`,
                }}
              >
                {/* Top-Left Corner: Time Label */}
                <div className="py-1 px-3 border-r border-slate-200 flex items-center justify-center gap-1.5 text-slate-500 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Time \ Day</span>
                </div>

                {/* Day Columns */}
                {TIMETABLE_DAYS.map((day) => {
                  const count = teacherSessions.filter((s) => s.day_of_week === day.id).length;
                  return (
                    <div
                      key={day.id}
                      className="py-1 px-2 border-r border-slate-200/70 last:border-r-0 flex items-center justify-center gap-1.5"
                    >
                      <span className="font-bold text-slate-900 text-xs">
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
                <div className="border-r border-slate-200 bg-slate-50/50 divide-y divide-slate-200/60">
                  {TIME_SLOTS_30MIN.map((slot) => (
                    <div
                      key={slot.id}
                      className="h-[62px] px-1 flex flex-col items-center justify-center text-center select-none"
                    >
                      <span className="font-mono text-[10px] text-slate-800 font-semibold tracking-tight">
                        {slot.start12}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 font-normal tracking-tight">
                        {slot.end12}
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
                      className={`border-r border-slate-200/60 last:border-r-0 relative p-1.5 ${
                        day.isWeekend ? 'bg-amber-50/15' : 'bg-white'
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
                            className="w-full h-full rounded-xl border border-dashed border-slate-200/50 bg-slate-50/30 flex items-center justify-center"
                          >
                            <span className="text-[9px] font-mono text-slate-300 font-medium select-none">
                              {slot.start12}
                            </span>
                          </div>
                        ))}

                        {/* Faculty Sessions Positioned Vertically across Exact Span */}
                        {daySessions.map((s) => {
                          const crs = courses.find((c) => c.id === s.course_id);
                          const rm = rooms.find((r) => r.id === s.room_id);
                          const bth = batches.find((b) => b.id === s.batch_id);
                          const isUnassigned = !s.room_id || !rm;
                          const colorPalette = getCourseColor(crs?.code, s.course_id || s.id);

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
                                className={`h-full p-2.5 rounded-xl border shadow-2xs flex flex-col justify-between transition-all duration-150 border-l-4 ${colorPalette.leftBorder} ${
                                  isUnassigned
                                    ? `${colorPalette.cardBg} border-amber-300 hover:border-amber-400 hover:shadow-md`
                                    : `${colorPalette.cardBg} ${colorPalette.cardBorder} hover:shadow-md ${colorPalette.shadowHover}`
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <span className={`font-bold font-mono text-[11px] px-1.5 py-0.5 rounded shadow-2xs ${colorPalette.badgeBg}`}>
                                        {crs?.code}
                                      </span>
                                      <span className="px-1 py-0.2 rounded text-[9px] font-medium bg-white/80 text-slate-700 border border-slate-200/60">
                                        {boxesCount * 30}m
                                      </span>
                                    </div>

                                    <span className="text-[10px] font-mono font-semibold text-slate-700">
                                      {formatTimeRange(s.start_time, s.end_time)}
                                    </span>
                                  </div>

                                  <h5 className={`font-bold text-xs break-words leading-tight ${colorPalette.titleText}`}>
                                    {crs?.name}
                                  </h5>
                                </div>

                                <div className={`pt-1.5 mt-1 border-t ${colorPalette.subtleBorder} flex flex-wrap items-center justify-between gap-1 text-[10px]`}>
                                  <span className={`font-semibold px-1.5 py-0.5 rounded break-words text-[9px] ${colorPalette.pillBg}`}>
                                    Batch: {bth?.name}
                                  </span>

                                  {isUnassigned ? (
                                    <span className="flex items-center gap-0.5 font-bold text-amber-900 bg-amber-200/90 px-1.5 py-0.5 rounded text-[9px] break-words border border-amber-300">
                                      <AlertTriangle className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                                      <span>Pending Room</span>
                                    </span>
                                  ) : (
                                    <span className="font-semibold text-slate-800 break-words flex items-center gap-1">
                                      <MapPin className={`w-2.5 h-2.5 ${colorPalette.accentText} shrink-0`} />
                                      <span>{rm?.name}</span>
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
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Campus Venue & Lab Availability</h3>
              <p className="text-xs text-slate-500">Query available lecture halls and computer labs for classes or makeup sessions</p>
            </div>
            <input
              type="date"
              value={lookupDate}
              onChange={(e) => setLookupDate(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-shu-700/20 focus:border-shu-700 transition-all cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            {rooms.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">{r.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold">
                    Available
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {r.building} • Floor {r.floor} • Capacity {r.capacity}
                </p>
                <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-slate-200/60">
                  {r.room_types.map((t) => (
                    <span key={t} className="px-1.5 py-0.2 rounded-md bg-white text-slate-600 text-[10px] font-medium border border-slate-200">
                      {t.replace('_', ' ')}
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
