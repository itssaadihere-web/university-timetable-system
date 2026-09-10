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
import { formatTimeRange } from '@/lib/conflict-engine';
import { getCourseColor } from '@/lib/course-colors';

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

  const isUnassignedRoom = !session.room_id || !room;

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

  const startMins = session.start_time ? (parseInt(session.start_time.split(':')[0], 10) * 60 + parseInt(session.start_time.split(':')[1], 10)) : 0;
  const endMins = session.end_time ? (parseInt(session.end_time.split(':')[0], 10) * 60 + parseInt(session.end_time.split(':')[1], 10)) : 0;
  const durationMinutes = Math.max(30, endMins - startMins);
  const durationHours = (durationMinutes / 60).toFixed(durationMinutes % 60 === 0 ? 0 : 1);
  const boxesCount = Math.max(1, Math.round(durationMinutes / 30));

  const colorPalette = getCourseColor(course?.code, session.course_id || session.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isCoordinator ? attributes : {})}
      {...(isCoordinator ? listeners : {})}
      className={`group relative rounded-xl p-2.5 text-xs transition-all duration-150 select-none h-full flex flex-col justify-between border-l-4 ${colorPalette.leftBorder} shadow-xs ${
        isDragging
          ? 'opacity-20 grayscale border-2 border-dashed border-slate-400 bg-slate-100 scale-95 shadow-none pointer-events-none'
          : isDraft
          ? `${colorPalette.cardBg} border-2 border-dashed border-amber-400 hover:border-amber-500 hover:shadow-md`
          : isMakeup
          ? `${colorPalette.cardBg} border border-teal-300 hover:border-teal-500 hover:shadow-md`
          : `${colorPalette.cardBg} border ${colorPalette.cardBorder} hover:shadow-md ${colorPalette.shadowHover}`
      } ${isCoordinator ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
    >
      {/* Top Banner: Status & Badges */}
      <div>
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-1 flex-wrap">
            <span
              className={`font-bold px-1.5 py-0.5 rounded text-[10px] font-mono shadow-2xs ${
                isDraft
                  ? 'bg-amber-200/90 text-amber-950 border border-amber-300'
                  : isMakeup
                  ? 'bg-teal-200/90 text-teal-950 border border-teal-300'
                  : colorPalette.badgeBg
              }`}
            >
              {course?.code || 'CRS-000'}
            </span>

            <span className="px-1 py-0.2 rounded text-[9px] font-medium bg-white/80 text-slate-700 font-mono border border-slate-200/60 shadow-2xs">
              {boxesCount * 30}m
            </span>

            {isDraft && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-white shadow-2xs">
                Draft
              </span>
            )}

            {isMakeup && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-600 text-white shadow-2xs">
                Makeup
              </span>
            )}

            {isMerged && (
              <span className="px-1 py-0.2 rounded text-[9px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                Joint
              </span>
            )}
          </div>

          {/* Action icons for coordinator */}
          {isCoordinator && !isDragging && (
            <div className="hidden group-hover:flex items-center gap-0.5 bg-white/95 backdrop-blur rounded-lg px-1 py-0.5 shadow-2xs border border-slate-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(session);
                }}
                title="Edit Class Details"
                className="p-1 text-slate-500 hover:text-shu-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(session.id);
                }}
                title="Cancel / Delete Session"
                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Course Title - Wraps to next line when long */}
        <h4 className={`font-bold text-xs break-words leading-tight ${colorPalette.titleText}`}>
          {course?.name || 'Class Session'}
        </h4>
      </div>

      {/* Details Footer */}
      <div className={`pt-1.5 mt-1 border-t ${colorPalette.subtleBorder} space-y-1 text-slate-600 text-[10px]`}>
        {/* Time & Room Row */}
        <div className="flex flex-wrap items-center justify-between gap-1">
          <div className="flex items-center gap-1 font-mono font-medium text-slate-700">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-[10px] break-words">{formatTimeRange(session.start_time, session.end_time)}</span>
          </div>

          {isUnassignedRoom ? (
            <span className="flex items-center gap-0.5 font-bold text-amber-900 bg-amber-200/90 px-1.5 py-0.5 rounded text-[9px] break-words border border-amber-300">
              <AlertTriangle className="w-2.5 h-2.5 text-amber-700 shrink-0" />
              <span>Pending</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 font-semibold text-slate-700 break-words">
              <MapPin className={`w-2.5 h-2.5 ${colorPalette.accentText} shrink-0`} />
              <span className="break-words">{room?.name}</span>
            </span>
          )}
        </div>

        {/* Teacher & Batch Row */}
        <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-600">
          <span className="break-words font-medium text-slate-700">
            {teacher?.name || 'Instructor'}
          </span>
          <span className={`font-semibold px-1.5 py-0.5 rounded break-words text-[9px] ${colorPalette.pillBg}`}>
            {batch?.name || 'Batch'}
          </span>
        </div>
      </div>

      {/* Soft Lock Indicator (If another coordinator is editing) */}
      {softLock && (
        <div className="mt-1 pt-0.5 border-t border-amber-200/80 flex items-center gap-1 text-[9px] text-amber-800 font-medium animate-pulse">
          <Lock className="w-2.5 h-2.5" />
          <span>{softLock.userName} moving...</span>
        </div>
      )}
    </div>
  );
};
