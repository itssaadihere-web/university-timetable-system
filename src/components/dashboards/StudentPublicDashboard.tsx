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

import { 
  TIME_SLOTS_30MIN, 
  TIMETABLE_DAYS, 
  calculateSlotSpan,
  formatTo12Hour,
  formatTimeRange,
  timeToMinutes
} from '@/lib/conflict-engine';
import { getCourseColor } from '@/lib/course-colors';

export const StudentPublicDashboard: React.FC = () => {
  const { batches, sessions, courses, faculty, rooms, activeSemester } = useTimetable();

  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || '');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewLayout, setViewLayout] = useState<'weekly_grid' | 'day_list'>('weekly_grid');

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
    return !s.room_id || !rooms.some((room) => room.id === s.room_id);
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
      {/* Clean Modern Welcome Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-shu-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-shu-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white backdrop-blur border border-white/10">
                Fatima Business School
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-shu-700 text-white shadow-2xs">
                Salim Habib University
              </span>
              <span className="text-xs font-medium text-slate-300">
                {activeSemester?.name || 'Fall 2026'} Academic Term
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Weekly Timetable & Lecture Schedules
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl leading-relaxed">
              Official course schedules for <span className="font-semibold text-white">Faculty of Management Sciences</span>.
            </p>
          </div>

          {/* Export Quick Buttons */}
          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-white text-slate-800 hover:bg-slate-50 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
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

      {/* Unassigned Rooms Alert Notice (If Any) */}
      {unassignedInBatchCount > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 text-amber-900 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-amber-950">
              Notice: {unassignedInBatchCount} class session{unassignedInBatchCount === 1 ? '' : 's'} in this batch {unassignedInBatchCount === 1 ? 'has' : 'have'} pending room allocation.
            </p>
            <p className="text-amber-800 mt-0.5">
              These sessions are tagged with <span className="font-bold text-amber-950">Pending Room</span>. Classroom venues are assigned prior to lecture commencement.
            </p>
          </div>
        </div>
      )}

      {/* Selector & View Toggle Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Batch Selector */}
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-shu-700" />
              <span>Degree Program & Batch Section:</span>
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-shu-700/20 focus:border-shu-700 transition-all cursor-pointer"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} — {b.program} (Semester {b.semester})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="w-full lg:w-72">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Search Course, Room or Faculty:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. ACC-106, TF-301, Abid..."
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-shu-700/20 focus:border-shu-700 transition-all"
              />
            </div>
          </div>

          {/* View Mode Layout Switcher */}
          <div className="self-start lg:self-end">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Display Format:
            </label>
            <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setViewLayout('weekly_grid')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewLayout === 'weekly_grid'
                    ? 'bg-white text-shu-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Weekly Matrix</span>
              </button>
              <button
                onClick={() => setViewLayout('day_list')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewLayout === 'day_list'
                    ? 'bg-white text-shu-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Daily Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Days Ribbon (Shown only in day_list mode) */}
        {viewLayout === 'day_list' && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5">
              {TIMETABLE_DAYS.map((day) => {
                const count = batchSessions.filter((s) => s.day_of_week === day.id).length;
                const isSelected = selectedDay === day.id;

                return (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDay(day.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-shu-700 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                    }`}
                  >
                    <span>{day.name}</span>
                    {day.isWeekend && <span className="text-[9px] opacity-75">(Exc)</span>}
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
        )}
      </div>

      {/* VIEW 1: Weekly Timetable Matrix (DEFAULT) */}
      {viewLayout === 'weekly_grid' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-shu-700" />
              <span className="font-bold text-slate-900 text-sm">
                Weekly Matrix: {selectedBatch?.name} — {selectedBatch?.program}
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500 font-mono">
              08:30 AM – 03:00 PM • {batchSessions.length} Active Class Sections
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
                  const count = batchSessions.filter((s) => s.day_of_week === day.id).length;
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
                  const daySessions = batchSessions.filter((s) => s.day_of_week === day.id);

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
                        {/* Background 13 Empty 30-min Slots (Only display time in unoccupied slots) */}
                        {TIME_SLOTS_30MIN.map((slot) => {
                          const slotStartMins = timeToMinutes(slot.start);
                          const slotEndMins = timeToMinutes(slot.end);
                          const isOccupied = daySessions.some((s) => {
                            const sStart = timeToMinutes(s.start_time);
                            const sEnd = timeToMinutes(s.end_time);
                            return slotStartMins < sEnd && slotEndMins > sStart;
                          });

                          return (
                            <div
                              key={slot.id}
                              style={{ gridRow: `${slot.id + 1} / span 1` }}
                              className={`w-full h-full rounded-xl flex items-center justify-center ${
                                isOccupied
                                  ? 'border-transparent bg-transparent'
                                  : 'border border-dashed border-slate-200/50 bg-slate-50/30'
                              }`}
                            >
                              {!isOccupied && (
                                <span className="text-[9px] font-mono text-slate-300 font-medium select-none">
                                  {slot.start12}
                                </span>
                              )}
                            </div>
                          );
                        })}

                        {/* Batch Sessions Positioned Vertically across Exact Span */}
                        {daySessions.map((s) => {
                          const crs = courses.find((c) => c.id === s.course_id);
                          const rm = rooms.find((r) => r.id === s.room_id);
                          const tch = faculty.find((f) => f.id === s.faculty_id);
                          const isUnassigned = !s.room_id || !rm;
                          const colorPalette = getCourseColor(crs?.code, s.course_id || s.id);

                          const { rowStart, rowSpan, boxesCount } = calculateSlotSpan(
                            s.start_time,
                            s.end_time
                          );
                          const isShortDuration = boxesCount <= 2; // 30m or 60m

                          return (
                            <div
                              key={s.id}
                              style={{
                                gridRow: `${rowStart} / span ${rowSpan}`,
                              }}
                              className="absolute inset-x-1 inset-y-0.5 z-10"
                            >
                              <div
                                style={{
                                  backgroundColor: colorPalette.bgHex,
                                  borderColor: isUnassigned ? '#f59e0b' : colorPalette.borderHex,
                                  borderLeftColor: colorPalette.leftBarHex,
                                  borderLeftWidth: '5px',
                                }}
                                className={`group h-full p-2.5 rounded-xl border shadow-xs flex flex-col justify-between transition-all duration-200 ${
                                  isShortDuration
                                    ? 'overflow-hidden hover:overflow-visible hover:z-50 hover:h-auto hover:min-h-full hover:shadow-2xl hover:scale-[1.02]'
                                    : 'overflow-hidden hover:shadow-md'
                                } ${colorPalette.cardClass}`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <span
                                        style={{
                                          backgroundColor: colorPalette.badgeBgHex,
                                          color: colorPalette.badgeTextHex,
                                          borderColor: colorPalette.badgeBorderHex,
                                        }}
                                        className="font-extrabold font-mono text-[10px] px-2 py-0.5 rounded shadow-2xs border"
                                      >
                                        {crs?.code}
                                      </span>
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/95 text-slate-800 border border-slate-300 shadow-2xs">
                                        {boxesCount * 30}m
                                      </span>
                                    </div>

                                    <span className="text-[10px] font-mono font-bold text-slate-900">
                                      {formatTimeRange(s.start_time, s.end_time)}
                                    </span>
                                  </div>

                                  <h5
                                    style={{ color: colorPalette.titleColorHex }}
                                    className={`font-extrabold text-xs leading-tight ${
                                      isShortDuration
                                        ? 'line-clamp-1 group-hover:line-clamp-none break-words'
                                        : 'break-words leading-snug'
                                    }`}
                                  >
                                    {crs?.name}
                                  </h5>
                                </div>

                                <div 
                                  style={{ borderTopColor: colorPalette.borderHex }}
                                  className="pt-1 mt-1 border-t flex flex-wrap items-center justify-between gap-1 text-[10px]"
                                >
                                  <span
                                    className={`font-semibold text-slate-900 ${
                                      isShortDuration
                                        ? 'truncate max-w-[110px] group-hover:max-w-none group-hover:whitespace-normal'
                                        : 'break-words'
                                    }`}
                                  >
                                    {tch?.name}
                                  </span>

                                  {isUnassigned ? (
                                    <span className="flex items-center gap-0.5 font-bold text-amber-950 bg-amber-200/95 px-1.5 py-0.5 rounded text-[9px] break-words border border-amber-400">
                                      <AlertTriangle className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                                      <span>Pending</span>
                                    </span>
                                  ) : (
                                    <span
                                      className={`font-semibold text-slate-900 flex items-center gap-1 ${
                                        isShortDuration
                                          ? 'truncate max-w-[120px] group-hover:max-w-none group-hover:whitespace-normal'
                                          : 'break-words'
                                      }`}
                                    >
                                      <MapPin style={{ color: colorPalette.leftBarHex }} className="w-2.5 h-2.5 shrink-0" />
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

      {/* VIEW 2: Daily Cards (Alternative View) */}
      {viewLayout === 'day_list' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-shu-700" />
              <span>
                Schedule for {TIMETABLE_DAYS.find((d) => d.id === selectedDay)?.name} ({selectedBatch?.name})
              </span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {daySessions.length} Scheduled Class{daySessions.length === 1 ? '' : 'es'}
            </span>
          </div>

          {daySessions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
              <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="font-bold text-slate-800 text-sm">No Classes Scheduled for this Day</h4>
              <p className="text-xs text-slate-500 mt-1">
                Enjoy your study break or consult the academic calendar for upcoming events.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {daySessions.map((session) => {
                const course = courses.find((c) => c.id === session.course_id);
                const teacher = faculty.find((f) => f.id === session.faculty_id);
                const room = rooms.find((r) => r.id === session.room_id);
                const isUnassigned = !session.room_id || !room;
                const colorPalette = getCourseColor(course?.code, session.course_id || session.id);

                return (
                  <div
                    key={session.id}
                    style={{
                      backgroundColor: colorPalette.bgHex,
                      borderColor: isUnassigned ? '#f59e0b' : colorPalette.borderHex,
                      borderLeftColor: colorPalette.leftBarHex,
                      borderLeftWidth: '5px',
                    }}
                    className={`rounded-2xl border transition-all p-5 space-y-3 shadow-xs ${colorPalette.cardClass}`}
                  >
                    {/* Top: Course Code & Time */}
                    <div className="flex items-start justify-between gap-2">
                      <span
                        style={{
                          backgroundColor: colorPalette.badgeBgHex,
                          color: colorPalette.badgeTextHex,
                          borderColor: colorPalette.badgeBorderHex,
                        }}
                        className="px-2.5 py-1 rounded-lg font-extrabold font-mono text-xs shadow-2xs border"
                      >
                        {course?.code || 'CRS-000'}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 bg-white/90 border border-slate-300 px-2.5 py-1 rounded-lg shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-mono">{formatTimeRange(session.start_time, session.end_time)}</span>
                      </div>
                    </div>

                    {/* Course Title - Wraps to next line */}
                    <h4 
                      style={{ color: colorPalette.titleColorHex }}
                      className="font-extrabold text-sm break-words leading-snug"
                    >
                      {course?.name || 'Class Session'}
                    </h4>

                    {/* Room & Instructor */}
                    <div 
                      style={{ borderTopColor: colorPalette.borderHex }}
                      className="pt-2 border-t space-y-2 text-xs text-slate-800"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        {isUnassigned ? (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-200/95 text-amber-950 font-bold text-[11px] border border-amber-400 break-words">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span className="break-words">Room Not Assigned (Pending)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 break-words">
                            <MapPin style={{ color: colorPalette.leftBarHex }} className="w-3.5 h-3.5 shrink-0" />
                            <span className="break-words">{room?.name}</span>
                          </div>
                        )}
                        {!isUnassigned && room && (
                          <span className="text-[11px] text-slate-600 font-medium break-words">
                            {room.building} (Fl {room.floor})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="text-slate-900 font-semibold break-words">{teacher?.name || 'Instructor'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

