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
  AlertCircle, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

const DAYS = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
];

const TIME_SLOTS = [
  '08:30 - 10:00',
  '10:15 - 11:45',
  '12:00 - 13:30',
  '13:30 - 15:00',
  '15:15 - 16:45',
  '17:00 - 18:30',
];

interface TimetableGridProps {
  onOpenNewSessionModal: (preset?: { dayOfWeek: number; startTime: string; endTime: string }) => void;
  onOpenEditSessionModal: (session: ClassSession) => void;
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
      startTime: string;
      endTime: string;
    } | undefined;

    if (!overData) return;

    // Check if slot changed
    if (
      session.day_of_week === overData.dayOfWeek &&
      session.start_time === overData.startTime
    ) {
      return;
    }

    // Attempt move
    const result = await moveSession(
      session.id,
      overData.dayOfWeek,
      overData.startTime,
      overData.endTime
    );

    if (!result.success && result.errors) {
      setConflictAlert(result.errors);
      // Auto-clear conflict notification after 8 seconds
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
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 shadow-sm animate-shake">
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
          {DAYS.map((d) => (
            <button
              key={d.id}
              onClick={() => setMobileActiveDay(d.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mobileActiveDay === d.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {d.short}
            </button>
          ))}
        </div>

        <button
          onClick={() => setMobileActiveDay((d) => Math.min(6, d + 1))}
          disabled={mobileActiveDay === 6}
          className="p-2 text-slate-600 disabled:opacity-30 rounded-lg hover:bg-slate-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Full Weekly Matrix / Grid */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Grid Container */}
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Header: Days of the Week */}
              <div className="grid grid-cols-[110px_repeat(6,1fr)] bg-slate-50 border-b border-slate-200 text-center text-xs font-bold text-slate-700 select-none">
                <div className="py-3 px-2 border-r border-slate-200 flex items-center justify-center gap-1.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Time</span>
                </div>

                {DAYS.map((day) => (
                  <div
                    key={day.id}
                    className={`py-3 px-2 border-r border-slate-200/80 last:border-r-0 ${
                      mobileActiveDay === day.id ? 'bg-indigo-50/50 lg:bg-transparent' : ''
                    }`}
                  >
                    <span className="block text-slate-900 font-semibold">{day.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">Active Schedule</span>
                  </div>
                ))}
              </div>

              {/* Body: Time Slot Rows */}
              <div className="divide-y divide-slate-100">
                {TIME_SLOTS.map((timeSlot) => {
                  const [slotStart, slotEnd] = timeSlot.split(' - ').map((s) => s.trim());

                  return (
                    <div
                      key={timeSlot}
                      className="grid grid-cols-[110px_repeat(6,1fr)] hover:bg-slate-50/30 transition-colors"
                    >
                      {/* Left: Time Slot Label */}
                      <div className="py-3 px-2 border-r border-slate-200 bg-slate-50/70 flex flex-col items-center justify-center text-center">
                        <span className="text-xs font-bold text-slate-800 font-mono">
                          {slotStart}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {slotEnd}
                        </span>
                      </div>

                      {/* Day Columns */}
                      {DAYS.map((day) => {
                        // Match sessions in this day and time slot
                        const slotSessions = filteredSessions.filter(
                          (s) =>
                            s.day_of_week === day.id &&
                            s.start_time.startsWith(slotStart)
                        );

                        return (
                          <div
                            key={day.id}
                            className={`p-1.5 border-r border-slate-100 last:border-r-0 ${
                              mobileActiveDay === day.id ? 'bg-indigo-50/20 lg:bg-transparent' : ''
                            }`}
                          >
                            <DroppableTimeSlot
                              dayOfWeek={day.id}
                              timeSlot={timeSlot}
                              sessions={slotSessions}
                              onAddSession={(d, start, end) =>
                                onOpenNewSessionModal({ dayOfWeek: d, startTime: start, endTime: end })
                              }
                              onEditSession={onOpenEditSessionModal}
                              onDeleteSession={handleDeleteSession}
                            />
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

        {/* Drag Overlay for smooth preview */}
        <DragOverlay>
          {activeSession ? (
            <div className="w-56 pointer-events-none opacity-90 shadow-2xl scale-105">
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
