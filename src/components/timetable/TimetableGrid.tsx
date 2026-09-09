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
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 shadow-sm animate-shake">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-rose-900">
              <h5 className="font-bold mb-1">Conflict Prevented (Rescheduling Reverted)</h5>
              <ul className="list-disc list-inside space-y-1 text-rose-800 text-xs font-medium">
                {conflictAlert.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setConflictAlert(null)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Grid Sub-Header & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-50 text-shu-700 font-bold text-xs border border-red-200">
            <Clock className="w-3.5 h-3.5 text-shu-700" />
            <span>Teachable Hours: 08:30 AM – 03:00 PM</span>
          </div>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-xs text-slate-500 font-medium">
            13 × 30-min Equal Sizing Units • Total {filteredSessions.length} Active Sessions
          </span>
        </div>

        {/* Day Scope Filter: Priority Mon-Fri vs Weekend Exceptions */}
        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setShowWeekendExceptions(false)}
              className={`px-3 py-1 rounded-lg transition-all ${
                !showWeekendExceptions && !hasWeekendSessions
                  ? 'bg-white text-shu-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mon – Fri (Primary)
            </button>
            <button
              onClick={() => setShowWeekendExceptions(true)}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                showWeekendExceptions || hasWeekendSessions
                  ? 'bg-white text-shu-700 shadow-xs'
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
      <div className="lg:hidden flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setMobileActiveDay((d) => Math.max(1, d - 1))}
          disabled={mobileActiveDay === 1}
          className="p-2 text-slate-600 disabled:opacity-30 rounded-lg hover:bg-slate-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {displayDays.map((d) => (
            <button
              key={d.id}
              onClick={() => setMobileActiveDay(d.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                mobileActiveDay === d.id
                  ? 'bg-shu-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{d.short}</span>
              {d.isWeekend && <span className="text-[9px] font-bold opacity-80">(Exc)</span>}
            </button>
          ))}
        </div>

        <button
          onClick={() => setMobileActiveDay((d) => Math.min(displayDays.length, d + 1))}
          disabled={mobileActiveDay === displayDays.length}
          className="p-2 text-slate-600 disabled:opacity-30 rounded-lg hover:bg-slate-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Proportional 30-Minute Timeline Matrix Grid */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[1150px]">
              {/* Header: 13 Equal 30-Minute Interval Columns */}
              <div className="grid grid-cols-[140px_repeat(13,1fr)] bg-slate-100/90 border-b border-slate-200 text-center text-xs font-bold text-slate-800 select-none py-2.5">
                <div className="py-1 px-3 border-r border-slate-200 flex items-center justify-center gap-1.5 text-slate-600 font-bold">
                  <CalendarIcon className="w-3.5 h-3.5 text-shu-700" />
                  <span>Day / Slot</span>
                </div>

                {TIME_SLOTS_30MIN.map((slot) => (
                  <div
                    key={slot.id}
                    className="py-1 px-1 border-r border-slate-200/80 last:border-r-0 flex flex-col items-center justify-center"
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

              {/* Day Rows */}
              <div className="divide-y divide-slate-100">
                {displayDays.map((day) => {
                  const daySessions = filteredSessions.filter((s) => s.day_of_week === day.id);
                  const tracks = organizeDaySessionsIntoTracks(daySessions);

                  return (
                    <div
                      key={day.id}
                      className={`grid grid-cols-[140px_repeat(13,1fr)] border-b border-slate-100 last:border-b-0 transition-colors ${
                        day.isWeekend ? 'bg-amber-50/20' : 'hover:bg-slate-50/30'
                      }`}
                    >
                      {/* Left: Day Label & Exception Tag */}
                      <div className="p-3 border-r border-slate-200 bg-slate-50/70 flex flex-col justify-center items-start space-y-1">
                        <div className="flex items-center gap-1.5 w-full">
                          <span className="font-extrabold text-slate-900 text-xs">
                            {day.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-slate-200 text-slate-700 ml-auto">
                            {daySessions.length}
                          </span>
                        </div>

                        {day.isWeekend ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            <span>Weekend Exc.</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">
                            Standard Weekday
                          </span>
                        )}
                      </div>

                      {/* Right: 13-Slot Track Container */}
                      <div className="col-span-13 p-2 flex flex-col gap-2.5 relative">
                        {tracks.map((track, trackIdx) => (
                          <div
                            key={trackIdx}
                            className="relative grid grid-cols-13 gap-2 min-h-[105px] w-full"
                          >
                            {/* Background 13 Equal 30-min Droppable Target Cells */}
                            {TIME_SLOTS_30MIN.map((slot) => (
                              <div key={slot.id} className="col-span-1 h-full">
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

                            {/* Scheduled Class Session Cards Placed across their Exact Span */}
                            {track.map((session) => {
                              const { colStart, colSpan } = calculateSlotSpan(
                                session.start_time,
                                session.end_time
                              );

                              return (
                                <div
                                  key={session.id}
                                  style={{
                                    gridColumn: `${colStart} / span ${colSpan}`,
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
                            })}
                          </div>
                        ))}
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
            <div className="w-72 pointer-events-none opacity-90 shadow-2xl scale-105">
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

