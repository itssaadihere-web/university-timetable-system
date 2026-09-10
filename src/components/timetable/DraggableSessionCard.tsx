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

  const colorPalette = getCourseColor(course?.code, session.course_id || session.id);
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
  const isShortDuration = boxesCount <= 2; // 30m or 60m

  const cardStyle: React.CSSProperties = {
    ...(style || {}),
    backgroundColor: isDragging ? '#f1f5f9' : colorPalette.bgHex,
    borderColor: isDraft ? '#f59e0b' : isMakeup ? '#14b8a6' : colorPalette.borderHex,
    borderLeftColor: colorPalette.leftBarHex,
    borderLeftWidth: '5px',
  };

  return (
    <div
      ref={setNodeRef}
      style={cardStyle}
      {...(isCoordinator ? attributes : {})}
      {...(isCoordinator ? listeners : {})}
      className={`group relative rounded-xl p-2.5 text-xs transition-all duration-200 select-none h-full flex flex-col justify-between border shadow-xs ${
        isShortDuration
          ? 'overflow-hidden hover:overflow-visible hover:z-50 hover:h-auto hover:min-h-full hover:shadow-2xl hover:scale-[1.02]'
          : 'overflow-hidden hover:shadow-md'
      } ${
        isDragging
          ? 'opacity-20 grayscale border-2 border-dashed border-slate-400 scale-95 shadow-none pointer-events-none'
          : isDraft
          ? 'border-2 border-dashed'
          : ''
      } ${colorPalette.cardClass} ${isCoordinator ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
    >
      {/* Top Banner: Status & Badges */}
      <div>
        <div className="flex items-center justify-between gap-1 mb-1">
          <div className="flex items-center gap-1 flex-wrap">
            <span
              style={{
                backgroundColor: isDraft ? '#fef3c7' : isMakeup ? '#ccfbf1' : colorPalette.badgeBgHex,
                color: isDraft ? '#78350f' : isMakeup ? '#115e59' : colorPalette.badgeTextHex,
                borderColor: isDraft ? '#fde68a' : isMakeup ? '#99f6e4' : colorPalette.badgeBorderHex,
              }}
              className="font-extrabold px-2 py-0.5 rounded text-[10px] font-mono shadow-2xs border"
            >
              {course?.code || 'CRS-000'}
            </span>

            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/95 text-slate-800 font-mono border border-slate-300 shadow-2xs">
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
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-200 text-purple-900 border border-purple-300">
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

        {/* Course Title - Compact single line with ellipsis for short cards, full expand on hover */}
        <h4
          style={{ color: colorPalette.titleColorHex }}
          className={`font-extrabold text-xs leading-tight ${
            isShortDuration
              ? 'line-clamp-1 group-hover:line-clamp-none break-words'
              : 'break-words leading-snug'
          }`}
        >
          {course?.name || 'Class Session'}
        </h4>
      </div>

      {/* Details Footer */}
      <div 
        style={{ borderTopColor: colorPalette.borderHex }}
        className="pt-1 mt-1 border-t space-y-1 text-slate-800 text-[10px]"
      >
        {/* Time & Room Row */}
        <div className="flex flex-wrap items-center justify-between gap-1">
          <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="text-[10px]">{formatTimeRange(session.start_time, session.end_time)}</span>
          </div>

          {isUnassignedRoom ? (
            <span className="flex items-center gap-0.5 font-bold text-amber-950 bg-amber-200/95 px-1.5 py-0.5 rounded text-[9px] break-words border border-amber-400">
              <AlertTriangle className="w-2.5 h-2.5 text-amber-700 shrink-0" />
              <span>Pending</span>
            </span>
          ) : (
            <span
              className={`flex items-center gap-1 font-semibold text-slate-900 ${
                isShortDuration
                  ? 'truncate max-w-[120px] group-hover:max-w-none group-hover:whitespace-normal'
                  : 'break-words'
              }`}
            >
              <MapPin style={{ color: colorPalette.leftBarHex }} className="w-2.5 h-2.5 shrink-0" />
              <span>{room?.name}</span>
            </span>
          )}
        </div>

        {/* Teacher & Batch Row */}
        <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-800">
          <span
            className={`font-semibold text-slate-900 ${
              isShortDuration
                ? 'truncate max-w-[110px] group-hover:max-w-none group-hover:whitespace-normal'
                : 'break-words'
            }`}
          >
            {teacher?.name || 'Instructor'}
          </span>
          <span 
            style={{
              backgroundColor: colorPalette.pillBgHex,
              color: colorPalette.pillTextHex,
              borderColor: colorPalette.pillBorderHex,
            }}
            className="font-bold px-1.5 py-0.5 rounded text-[9px] border shadow-2xs"
          >
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
