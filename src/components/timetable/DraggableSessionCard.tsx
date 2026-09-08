'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { ClassSession } from '@/types';
import { useTimetable } from '@/context/TimetableContext';
import { 
  Clock, 
  MapPin, 
  User, 
  Users, 
  Sparkles, 
  Edit3, 
  Trash2, 
  Lock, 
  CheckCircle2, 
  Layers,
  Monitor,
  Tv,
  Cpu,
  AlertTriangle
} from 'lucide-react';

interface DraggableSessionCardProps {
  session: ClassSession;
  onEdit: (session: ClassSession) => void;
  onDelete: (sessionId: string) => void;
}

export const DraggableSessionCard: React.FC<DraggableSessionCardProps> = ({
  session,
  onEdit,
  onDelete,
}) => {
  const {
    courses,
    faculty,
    rooms,
    batches,
    currentRole,
    activeLocks,
  } = useTimetable();

  const isCoordinator = currentRole === 'coordinator' || currentRole === 'admin';

  // @dnd-kit hook
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: session.id,
    disabled: !isCoordinator, // Students and Faculty cannot drag
    data: {
      session,
    },
  });

  const course = courses.find((c) => c.id === session.course_id);
  const teacher = faculty.find((f) => f.id === session.faculty_id);
  const room = rooms.find((r) => r.id === session.room_id);
  const batch = batches.find((b) => b.id === session.batch_id);

  const isUnassignedRoom =
    !room ||
    session.room_id === 'room-unassigned' ||
    session.room_id === 'a0000000-0000-0000-0000-000000000000' ||
    room.name.includes('Not Assigned') ||
    room.name.includes('Pending');

  // Check if another coordinator has a soft lock on this session
  const softLock = activeLocks[session.id];

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  const isDraft = session.status === 'draft';
  const isMakeup = session.session_type === 'makeup';
  const isMerged = Boolean(session.batch_group_id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isCoordinator ? attributes : {})}
      {...(isCoordinator ? listeners : {})}
      className={`group relative rounded-xl p-3 text-xs transition-all shadow-xs select-none ${
        isDragging
          ? 'opacity-80 scale-105 shadow-xl ring-2 ring-indigo-500 bg-indigo-50 cursor-grabbing z-50'
          : isDraft
          ? 'bg-amber-50/80 border-2 border-dashed border-amber-300 hover:border-amber-400 hover:shadow-md'
          : isMakeup
          ? 'bg-teal-50/90 border border-teal-200 hover:border-teal-300 hover:shadow-md'
          : 'bg-white border border-slate-200/90 hover:border-indigo-300 hover:shadow-md'
      } ${isCoordinator ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
    >
      {/* Top Banner: Status & Badges */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1 flex-wrap">
          <span
            className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
              isDraft
                ? 'bg-amber-200/80 text-amber-900'
                : isMakeup
                ? 'bg-teal-200/80 text-teal-900'
                : 'bg-indigo-100 text-indigo-800'
            }`}
          >
            {course?.code || 'CRS-000'}
          </span>

          {isDraft && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-500 text-white">
              Draft
            </span>
          )}

          {isMakeup && (
            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-teal-600 text-white">
              Floating Makeup
            </span>
          )}

          {isMerged && (
            <span className="px-1 py-0.2 rounded text-[9px] font-medium bg-purple-100 text-purple-700 border border-purple-200">
              Joint / Merged
            </span>
          )}
        </div>

        {/* Action icons for coordinator */}
        {isCoordinator && !isDragging && (
          <div className="hidden group-hover:flex items-center gap-1 bg-white/90 backdrop-blur rounded px-1 shadow-xs">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(session);
              }}
              title="Edit Class Details"
              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded"
            >
              <Edit3 className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(session.id);
              }}
              title="Cancel / Delete Session"
              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Course Title */}
      <h4 className="font-semibold text-slate-800 line-clamp-1 mb-1.5 text-xs">
        {course?.name || 'Class Session'}
      </h4>

      {/* Details List */}
      <div className="space-y-1 text-slate-600 text-[11px]">
        {/* Time */}
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-700">
            {session.start_time} - {session.end_time}
          </span>
          {session.specific_date && (
            <span className="text-[10px] text-teal-700 font-mono">({session.specific_date})</span>
          )}
        </div>

        {/* Room with tags */}
        <div className={`flex items-center justify-between gap-1 p-1 rounded-md ${isUnassignedRoom ? 'bg-amber-50 border border-amber-200 text-amber-800' : ''}`}>
          <div className="flex items-center gap-1.5 truncate">
            {isUnassignedRoom ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-pulse" />
            ) : (
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            )}
            <span className={`font-semibold truncate ${isUnassignedRoom ? 'text-amber-800 text-[10px]' : 'text-slate-800'}`}>
              {isUnassignedRoom ? '⚠️ Room Not Assigned' : (room?.name || 'Unassigned')}
            </span>
          </div>

          {/* Room capability icons */}
          {!isUnassignedRoom && (
            <div className="flex items-center gap-0.5 shrink-0">
              {room?.room_types.includes('multimedia') && (
                <span title="Multimedia projector enabled">
                  <Monitor className="w-2.5 h-2.5 text-indigo-500" />
                </span>
              )}
              {room?.room_types.includes('interactive_lcd') && (
                <span title="Interactive LCD touch display">
                  <Tv className="w-2.5 h-2.5 text-emerald-500" />
                </span>
              )}
              {room?.room_types.includes('horseshoe') && (
                <span title="Horseshoe Amphitheater layout">
                  <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                </span>
              )}
              {room?.room_types.includes('computer_lab') && (
                <span title="Computer Lab workstation layout">
                  <Cpu className="w-2.5 h-2.5 text-blue-500" />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Faculty */}
        <div className="flex items-center gap-1.5 truncate">
          <User className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">{teacher?.name || 'Instructor'}</span>
        </div>

        {/* Batch */}
        <div className="flex items-center gap-1.5 truncate">
          <Users className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate font-medium text-indigo-700">{batch?.name || 'Batch'}</span>
        </div>
      </div>

      {/* Soft Lock Indicator (If another coordinator is editing) */}
      {softLock && (
        <div className="mt-2 pt-1 border-t border-amber-200/80 flex items-center gap-1 text-[10px] text-amber-800 font-medium animate-pulse">
          <Lock className="w-3 h-3" />
          <span>{softLock.userName} is moving this...</span>
        </div>
      )}
    </div>
  );
};
