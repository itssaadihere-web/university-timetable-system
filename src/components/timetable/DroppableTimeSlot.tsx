'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { useTimetable } from '@/context/TimetableContext';

interface DroppableTimeSlotProps {
  dayOfWeek: number;
  slotIndex: number;
  startTime: string; // e.g. "08:30"
  endTime: string;   // e.g. "09:00"
  isOccupied?: boolean;
  onAddSession?: (dayOfWeek: number, startTime: string, endTime: string) => void;
}

export const DroppableTimeSlot: React.FC<DroppableTimeSlotProps> = ({
  dayOfWeek,
  slotIndex,
  startTime,
  endTime,
  isOccupied = false,
  onAddSession,
}) => {
  const droppableId = `slot-${dayOfWeek}-${startTime}`;

  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    data: {
      dayOfWeek,
      slotIndex,
      startTime,
      endTime,
    },
  });

  const { currentRole } = useTimetable();
  const isCoordinator = currentRole === 'coordinator' || currentRole === 'admin';

  return (
    <div
      ref={setNodeRef}
      className={`h-full min-h-[58px] rounded-xl transition-all duration-150 flex flex-col items-center justify-center relative group/cell ${
        isOver
          ? 'bg-emerald-100/95 border-2 border-emerald-600 ring-4 ring-emerald-500/30 shadow-xl scale-[1.03] z-30'
          : isOccupied
          ? 'border-transparent bg-transparent'
          : 'border border-dashed border-slate-200/70 bg-slate-50/40 hover:bg-slate-100/70 hover:border-slate-300'
      }`}
    >
      {isOver ? (
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-bold text-[10px] shadow-md animate-pulse z-40">
          <span>Drop: {startTime}</span>
        </div>
      ) : !isOccupied ? (
        <span className="text-[10px] font-mono text-slate-300 font-medium select-none group-hover/cell:opacity-0 transition-opacity">
          {startTime}
        </span>
      ) : null}

      {isCoordinator && onAddSession && !isOccupied && !isOver && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddSession(dayOfWeek, startTime, endTime);
          }}
          title={`Schedule new class at ${startTime}`}
          className="absolute inset-1.5 hidden group-hover/cell:flex items-center justify-center gap-1 rounded-lg bg-white/95 text-shu-700 font-bold text-[10px] shadow-xs border border-red-200/80 hover:bg-red-50 transition-all z-10 cursor-pointer"
        >
          <Plus className="w-3 h-3 text-shu-700 shrink-0" />
          <span>Add</span>
        </button>
      )}
    </div>
  );
};

