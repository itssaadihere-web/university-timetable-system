'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ClassSession } from '@/types';
import { DraggableSessionCard } from './DraggableSessionCard';
import { Plus, AlertTriangle } from 'lucide-react';
import { useTimetable } from '@/context/TimetableContext';

interface DroppableTimeSlotProps {
  dayOfWeek: number;
  timeSlot: string; // e.g. "08:30 - 10:00"
  sessions: ClassSession[];
  onAddSession: (dayOfWeek: number, startTime: string, endTime: string) => void;
  onEditSession: (session: ClassSession) => void;
  onDeleteSession: (sessionId: string) => void;
}

export const DroppableTimeSlot: React.FC<DroppableTimeSlotProps> = ({
  dayOfWeek,
  timeSlot,
  sessions,
  onAddSession,
  onEditSession,
  onDeleteSession,
}) => {
  const [startTime, endTime] = timeSlot.split(' - ').map((s) => s.trim());
  const droppableId = `slot-${dayOfWeek}-${startTime}`;

  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    data: {
      dayOfWeek,
      startTime,
      endTime,
    },
  });

  const { currentRole } = useTimetable();
  const isCoordinator = currentRole === 'coordinator' || currentRole === 'admin';

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[130px] p-2 rounded-xl transition-all border ${
        isOver
          ? 'bg-indigo-50/80 border-2 border-dashed border-indigo-500 shadow-inner'
          : sessions.length > 0
          ? 'bg-slate-50/40 border-slate-200/60'
          : 'bg-white border-slate-100 hover:border-slate-300'
      } flex flex-col justify-between group/slot relative`}
    >
      {/* List of Sessions in this slot */}
      <div className="space-y-2 w-full">
        {sessions.map((session) => (
          <DraggableSessionCard
            key={session.id}
            session={session}
            onEdit={onEditSession}
            onDelete={onDeleteSession}
          />
        ))}
      </div>

      {/* Empty Slot State & Quick Add Button */}
      {sessions.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center py-4 text-center">
          {isCoordinator ? (
            <button
              onClick={() => onAddSession(dayOfWeek, startTime, endTime)}
              className="opacity-0 group-hover/slot:opacity-100 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all shadow-xs"
            >
              <Plus className="w-3 h-3" />
              <span>Add Class</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-300 font-light select-none">
              Free Slot
            </span>
          )}
        </div>
      )}
    </div>
  );
};
