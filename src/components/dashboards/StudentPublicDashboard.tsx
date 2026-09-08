'use client';

import React, { useState } from 'react';
import { useTimetable } from '@/context/TimetableContext';
import { exportTimetableToExcel, exportTimetableToPDF } from '@/lib/export-utils';
import { 
  GraduationCap, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Search, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Info,
  AlertTriangle
} from 'lucide-react';

const DAYS = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
];

export const StudentPublicDashboard: React.FC = () => {
  const { batches, sessions, courses, faculty, rooms, activeSemester, calendarEvents } = useTimetable();

  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || '');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewLayout, setViewLayout] = useState<'day_list' | 'weekly_grid'>('day_list');

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  // Filter only PUBLISHED sessions for student batch
  const batchSessions = sessions.filter((s) => {
    if (s.status !== 'published') return false;
    if (selectedBatchId && s.batch_id !== selectedBatchId) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const course = courses.find((c) => c.id === s.course_id);
      const teacher = faculty.find((f) => f.id === s.faculty_id);
      const room = rooms.find((r) => r.id === s.room_id);
      return (
        course?.code.toLowerCase().includes(q) ||
        course?.name.toLowerCase().includes(q) ||
        teacher?.name.toLowerCase().includes(q) ||
        room?.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const daySessions = batchSessions
    .filter((s) => s.day_of_week === selectedDay)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Count unassigned rooms for the selected batch
  const unassignedInBatchCount = batchSessions.filter((s) => {
    const r = rooms.find((room) => room.id === s.room_id);
    return !r || s.room_id === 'room-unassigned' || s.room_id === 'a0000000-0000-0000-0000-000000000000' || r.name.includes('Pending') || r.name.includes('Not Assigned');
  }).length;

  const handleExport = (type: 'excel' | 'pdf') => {
    const title = selectedBatch ? `Batch_${selectedBatch.name}` : 'Student_Timetable';
    if (type === 'excel') {
      exportTimetableToExcel({
        sessions: batchSessions,
        rooms,
        faculty,
        batches,
        courses,
        filterTitle: title,
      });
    } else {
      exportTimetableToPDF({
        sessions: batchSessions,
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
      {/* Clean Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur">
                Public Student Portal
              </span>
              <span className="text-xs text-indigo-200">
                {activeSemester?.name || 'Fall 2026'} Academic Timetable
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Class Schedule & Lecture Rooms
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/90 mt-1 max-w-xl">
              Select your academic batch below to view live lecture venues, timings, and faculty schedules. No login required.
            </p>
          </div>

          {/* Export Quick Buttons */}
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white text-slate-800 hover:bg-indigo-50 rounded-xl shadow-xs transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white text-slate-800 hover:bg-indigo-50 rounded-xl shadow-xs transition-all"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unassigned Rooms Alert Notice (If Any) */}
      {unassignedInBatchCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">
              Venue Notice: {unassignedInBatchCount} class session{unassignedInBatchCount === 1 ? '' : 's'} in this batch {unassignedInBatchCount === 1 ? 'has' : 'have'} pending room assignment.
            </p>
            <p className="text-amber-800/90 mt-0.5">
              These sessions are marked with <span className="font-bold text-amber-900">⚠️ Room Not Assigned</span> below. The department coordinator will allocate rooms prior to class commencement.
            </p>
          </div>
        </div>
      )}

      {/* Selector & Filter Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Batch Selector */}
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>Select Your Degree Program & Student Batch:</span>
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} — {b.program} (Semester {b.semester})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-72">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Search Course, Room or Faculty:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. CS-301, Hall 101..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Days Ribbon */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {DAYS.map((day) => {
              const count = batchSessions.filter((s) => s.day_of_week === day.id).length;
              const isSelected = selectedDay === day.id;

              return (
                <button
                  key={day.id}
                  onClick={() => setSelectedDay(day.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{day.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day Schedule Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>
              Schedule for {DAYS.find((d) => d.id === selectedDay)?.name} ({selectedBatch?.name})
            </span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {daySessions.length} Scheduled Class{daySessions.length === 1 ? '' : 'es'}
          </span>
        </div>

        {daySessions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
            <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
            <h4 className="font-bold text-slate-800 text-sm">No Classes Scheduled for this Day</h4>
            <p className="text-xs text-slate-500 mt-1">
              Enjoy your study break or consult the academic calendar for upcoming labs and events.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {daySessions.map((session) => {
              const course = courses.find((c) => c.id === session.course_id);
              const teacher = faculty.find((f) => f.id === session.faculty_id);
              const room = rooms.find((r) => r.id === session.room_id);
              const isUnassigned =
                !room ||
                session.room_id === 'room-unassigned' ||
                session.room_id === 'a0000000-0000-0000-0000-000000000000' ||
                room.name.includes('Pending') ||
                room.name.includes('Not Assigned');

              return (
                <div
                  key={session.id}
                  className={`bg-white rounded-2xl border transition-all p-5 space-y-3 ${
                    isUnassigned
                      ? 'border-amber-300 bg-amber-50/30 hover:border-amber-400 hover:shadow-md'
                      : 'border-slate-200/90 hover:border-indigo-400 hover:shadow-md'
                  }`}
                >
                  {/* Top: Course Code & Time */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold font-mono text-xs border border-indigo-100">
                      {course?.code || 'CRS-000'}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{session.start_time} - {session.end_time}</span>
                    </div>
                  </div>

                  {/* Course Title */}
                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1">
                    {course?.name || 'Class Session'}
                  </h4>

                  {/* Room & Instructor */}
                  <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      {isUnassigned ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-200 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                          <span>⚠️ Room Not Assigned (Pending)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{room?.name}</span>
                        </div>
                      )}
                      {!isUnassigned && room && (
                        <span className="text-[11px] text-slate-400">
                          {room.building} (Fl {room.floor})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{teacher?.name || 'Instructor'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

