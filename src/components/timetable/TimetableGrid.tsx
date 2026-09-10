'use client';

import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { useTimetable } from '@/context/TimetableContext';
import { ClassSession } from '@/types';
import { DroppableTimeSlot } from './DroppableTimeSlot';
import { DraggableSessionCard } from './DraggableSessionCard';
import { 
  TIME_SLOTS_30MIN, 
  TIMETABLE_DAYS, 
  calculateSlotSpan, 
  timeToMinutes, 
  minutesToTime,
  TOTAL_30MIN_SLOTS
} from '@/lib/conflict-engine';
import { 
  AlertCircle, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Info,
  Layers,
  SlidersHorizontal
} from 'lucide-react';

interface TimetableGridProps {
  onOpenNewSessionModal: (preset?: { dayOfWeek: number; startTime: string; endTime: string }) => void;
  onOpenEditSessionModal: (session: ClassSession) => void;
}

/**
 * Organizes multiple sessions on a given day into non-overlapping tracks/lanes
 */
function organizeDaySessionsIntoTracks(daySessions: ClassSession[]): ClassSession[][] {
  const sorted = [...daySessions].sort(
    (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
  );

  const tracks: ClassSession[][] = [];

  for (const session of sorted) {
    const sStart = timeToMinutes(session.start_time);

    let placed = false;
    for (const track of tracks) {
      const lastSession = track[track.length - 1];
      const lastEnd = timeToMinutes(lastSession.end_time);
      if (sStart >= lastEnd) {
        track.push(session);
        placed = true;
        break;
      }
    }

    if (!placed) {
      tracks.push([session]);
    }
  }

  return tracks.length > 0 ? tracks : [[]];
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  onOpenNewSessionModal,
  onOpenEditSessionModal,
}) => {
  const {
    sessions,
    filterState,
    currentRole,
    moveSession,
    deleteSession,
    setSessionLock,
    courses,
    batches,
    faculty,
    rooms,
  } = useTimetable();

  const [activeSession, setActiveSession] = useState<ClassSession | null>(null);
  const [conflictAlert, setConflictAlert] = useState<string[] | null>(null);
  const [mobileActiveDay, setMobileActiveDay] = useState<number>(1);
  const [showWeekendExceptions, setShowWeekendExceptions] = useState<boolean>(false);

  // Setup DnD sensors (Mouse, Pointer & Touch)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6, // 6px drag threshold to prevent accidental clicks
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  // Filter visible sessions according to current view mode, filters, and role
  const filteredSessions = sessions.filter((s) => {
    // Student view: only published sessions
    if (currentRole === 'student' && s.status !== 'published') return false;

    // Draft toggle
    if (!filterState.showDrafts && s.status === 'draft') return false;

    // View Mode matching
    if (filterState.viewMode === 'batch' && filterState.selectedBatchId) {
      if (s.batch_id !== filterState.selectedBatchId) return false;
    } else if (filterState.viewMode === 'faculty' && filterState.selectedFacultyId) {
      if (s.faculty_id !== filterState.selectedFacultyId) return false;
    } else if (filterState.viewMode === 'room' && filterState.selectedRoomId) {
      if (s.room_id !== filterState.selectedRoomId) return false;
    }

    // Room Capability Filter
    if (filterState.selectedRoomTypes.length > 0) {
      const room = rooms.find((r) => r.id === s.room_id);
      if (!room) return false;
      const hasAllTags = filterState.selectedRoomTypes.every((tag) =>
        room.room_types.includes(tag)
      );
      if (!hasAllTags) return false;
    }

    // Search query matching
    if (filterState.searchQuery.trim()) {
      const q = filterState.searchQuery.toLowerCase();
      const course = courses.find((c) => c.id === s.course_id);
      const teacher = faculty.find((f) => f.id === s.faculty_id);
      const room = rooms.find((r) => r.id === s.room_id);
      const batch = batches.find((b) => b.id === s.batch_id);

      const matches =
        course?.code.toLowerCase().includes(q) ||
        course?.name.toLowerCase().includes(q) ||
        teacher?.name.toLowerCase().includes(q) ||
        room?.name.toLowerCase().includes(q) ||
        batch?.name.toLowerCase().includes(q);

      if (!matches) return false;
    }

    return true;
  });

  // Check if there are any weekend sessions scheduled
  const hasWeekendSessions = filteredSessions.some(
    (s) => s.day_of_week === 6 || s.day_of_week === 7
  );

  // Determine active displayed days (Mon-Fri priority, Sat/Sun for exceptions)
  const displayDays = TIMETABLE_DAYS.filter((d) => {
    if (!d.isWeekend) return true;
    return showWeekendExceptions || hasWeekendSessions;
  });

  const handleDragStart = (event: DragStartEvent) => {
    const session = event.active.data.current?.session as ClassSession;
    if (session) {
      setActiveSession(session);
      setSessionLock(session.id, true);
      setConflictAlert(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const session = active.data.current?.session as ClassSession;

    if (session) {
      setSessionLock(session.id, false);
      setActiveSession(null);
    }

    if (!over || !session) return;

    const overData = over.data.current as {
      dayOfWeek: number;
      slotIndex: number;
      startTime: string;
      endTime: string;
    } | undefined;

    if (!overData) return;

    // Preserve original class duration when moved to the new 30-min slot
    const originalDurationMins = Math.max(
      30,
      timeToMinutes(session.end_time) - timeToMinutes(session.start_time)
    );
    const newStartMins = timeToMinutes(overData.startTime);
    const newEndMins = newStartMins + originalDurationMins;
    const newEndTime = minutesToTime(newEndMins);

    // Check if slot or day actually changed
    if (
      session.day_of_week === overData.dayOfWeek &&
      session.start_time === overData.startTime
    ) {
      return;
    }

    // Attempt move via context conflict engine
    const result = await moveSession(
      session.id,
      overData.dayOfWeek,
      overData.startTime,
      newEndTime
    );

    if (!result.success && result.errors) {
      setConflictAlert(result.errors);
      setTimeout(() => setConflictAlert(null), 8000);
    } else {
      setConflictAlert(null);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (confirm('Are you sure you want to cancel / remove this class session?')) {
      await deleteSession(sessionId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Conflict Alert Banner */}
      {conflictAlert && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-sm animate-shake">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-rose-900">
              <h5 className="font-bold mb-1">Scheduling Conflict Prevented</h5>
              <ul className="list-disc list-inside space-y-1 text-rose-800 text-xs font-medium">
                {conflictAlert.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setConflictAlert(null)}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 px-2 py-1 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Grid Sub-Header & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-50 text-shu-700 font-bold text-xs border border-red-200/70">
            <Clock className="w-3.5 h-3.5 text-shu-700" />
            <span>08:30 AM – 03:00 PM</span>
          </div>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-xs text-slate-500 font-medium font-mono">
            13 × 30-min Equal Slots • {filteredSessions.length} Active Sessions
          </span>
        </div>

        {/* Day Scope Filter: Priority Mon-Fri vs Weekend Exceptions */}
        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 text-xs font-bold">
            <button
              onClick={() => setShowWeekendExceptions(false)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                !showWeekendExceptions && !hasWeekendSessions
                  ? 'bg-white text-shu-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mon – Fri
            </button>
            <button
              onClick={() => setShowWeekendExceptions(true)}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                showWeekendExceptions || hasWeekendSessions
                  ? 'bg-white text-shu-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Mon – Sun</span>
              {(showWeekendExceptions || hasWeekendSessions) && (
                <span className="w-1.5 h-1.5 rounded-full bg-shu-700"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Day Selector Tabs */}
      <div className="lg:hidden flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs">
        <button
          onClick={() => setMobileActiveDay((d) => Math.max(1, d - 1))}
          disabled={mobileActiveDay === 1}
          className="p-2 text-slate-600 disabled:opacity-30 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {displayDays.map((d) => (
            <button
              key={d.id}
              onClick={() => setMobileActiveDay(d.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                mobileActiveDay === d.id
                  ? 'bg-shu-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{d.short}</span>
              {d.isWeekend && <span className="text-[9px] opacity-80">(Exc)</span>}
            </button>
          ))}
        </div>

        <button
          onClick={() => setMobileActiveDay((d) => Math.min(displayDays.length, d + 1))}
          disabled={mobileActiveDay === displayDays.length}
          className="p-2 text-slate-600 disabled:opacity-30 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Proportional 30-Minute Timeline Matrix Grid: Days on Horizontal, Time Slots on Vertical */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              {/* Header: Horizontal Axis with Days of the Week */}
              <div 
                className="grid bg-slate-100/75 border-b border-slate-200 text-center text-xs font-bold text-slate-800 select-none py-2.5"
                style={{
                  gridTemplateColumns: `110px repeat(${displayDays.length}, minmax(150px, 1fr))`,
                }}
              >
                {/* Top-Left Corner: Time Label */}
                <div className="py-1 px-3 border-r border-slate-200 flex items-center justify-center gap-1.5 text-slate-500 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Time \ Day</span>
                </div>

                {/* Day Columns */}
                {displayDays.map((day) => {
                  const count = filteredSessions.filter((s) => s.day_of_week === day.id).length;
                  return (
                    <div
                      key={day.id}
                      className="py-1 px-2 border-r border-slate-200/70 last:border-r-0 flex items-center justify-center gap-2"
                    >
                      <span className="font-bold text-slate-900 text-xs">
                        {day.name}
                      </span>
                      {day.isWeekend && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
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
                  gridTemplateColumns: `110px repeat(${displayDays.length}, minmax(150px, 1fr))`,
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
                {displayDays.map((day) => {
                  const daySessions = filteredSessions.filter((s) => s.day_of_week === day.id);
                  const tracks = organizeDaySessionsIntoTracks(daySessions);
                  const totalTracks = Math.max(1, tracks.length);

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
                        {/* Background 13 Droppable Target Cells */}
                        {TIME_SLOTS_30MIN.map((slot) => (
                          <div
                            key={slot.id}
                            style={{ gridRow: `${slot.id + 1} / span 1` }}
                            className="w-full h-full"
                          >
                            <DroppableTimeSlot
                              dayOfWeek={day.id}
                              slotIndex={slot.id}
                              startTime={slot.start}
                              endTime={slot.end}
                              onAddSession={(d, start, end) =>
                                onOpenNewSessionModal({
                                  dayOfWeek: d,
                                  startTime: start,
                                  endTime: end,
                                })
                              }
                            />
                          </div>
                        ))}

                        {/* Scheduled Sessions Spanning Proportional Vertical Boxes */}
                        {tracks.map((track, trackIdx) =>
                          track.map((session) => {
                            const { rowStart, rowSpan } = calculateSlotSpan(
                              session.start_time,
                              session.end_time
                            );

                            const leftPercent = (trackIdx / totalTracks) * 100;
                            const widthPercent = 100 / totalTracks;

                            return (
                              <div
                                key={session.id}
                                style={{
                                  gridRow: `${rowStart} / span ${rowSpan}`,
                                  left: totalTracks > 1 ? `${leftPercent}%` : '4px',
                                  width: totalTracks > 1 ? `calc(${widthPercent}% - 4px)` : 'calc(100% - 8px)',
                                }}
                                className="absolute inset-y-0.5 z-10"
                              >
                                <DraggableSessionCard
                                  session={session}
                                  onEdit={onOpenEditSessionModal}
                                  onDelete={handleDeleteSession}
                                />
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Drag Overlay for smooth dragging preview */}
        <DragOverlay>
          {activeSession ? (
            <div className="w-64 pointer-events-none opacity-90 shadow-2xl scale-105">
              <DraggableSessionCard
                session={activeSession}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

