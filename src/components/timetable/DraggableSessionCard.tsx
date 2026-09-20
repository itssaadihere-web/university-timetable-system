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
  AlertTriangle,
} from 'lucide-react';
import { formatTimeRange, SessionClash } from '@/lib/conflict-engine';
import { getCourseColor } from '@/lib/course-colors';
import { getCleanBatchNumber } from '@/lib/batch-utils';
import { getCleanCourseDisplay } from '@/lib/course-utils';

interface DraggableSessionCardProps {
  session: ClassSession;
  clashes?: SessionClash[];
  onEdit: (session: ClassSession) => void;
  onDelete: (sessionId: string) => void;
}

export const DraggableSessionCard: React.FC<DraggableSessionCardProps> = ({
  session,
  clashes = [],
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

  const cleanCourse = getCleanCourseDisplay(course);
  const colorPalette = getCourseColor(cleanCourse.code, session.course_id || session.id);
  const isUnassignedRoom =
    !session.room_id ||
    !room ||
    session.room_id === 'a0000000-0000-0000-0000-000000000000' ||
    session.room_id === 'room-unassigned';

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

  // Clash indicators
  const hasClashes = Boolean(clashes && clashes.length > 0);
  const roomClashes = clashes.filter((c) => c.type === 'room');
  const teacherClashes = clashes.filter((c) => c.type === 'teacher');
  const batchClashes = clashes.filter((c) => c.type === 'batch');
  const hasRoomClash = roomClashes.length > 0;
  const hasTeacherClash = teacherClashes.length > 0;
  const hasBatchClash = batchClashes.length > 0;

  const startMins = session.start_time ? (parseInt(session.start_time.split(':')[0], 10) * 60 + parseInt(session.start_time.split(':')[1], 10)) : 0;
  const endMins = session.end_time ? (parseInt(session.end_time.split(':')[0], 10) * 60 + parseInt(session.end_time.split(':')[1], 10)) : 0;
  const durationMinutes = Math.max(30, endMins - startMins);
  const durationHours = (durationMinutes / 60).toFixed(durationMinutes % 60 === 0 ? 0 : 1);
  const boxesCount = Math.max(1, Math.round(durationMinutes / 30));
  const isShortDuration = boxesCount <= 2; // 30m or 60m

  const cardStyle: React.CSSProperties = {
    ...(style || {}),
    backgroundColor: isDragging ? '#f1f5f9' : hasClashes ? '#fff1f2' : colorPalette.bgHex,
    borderColor: hasClashes ? '#e11d48' : isUnassignedRoom ? '#f43f5e' : isDraft ? '#f59e0b' : isMakeup ? '#14b8a6' : colorPalette.borderHex,
    borderLeftColor: hasClashes ? '#be123c' : isUnassignedRoom ? '#e11d48' : colorPalette.leftBarHex,
    borderLeftWidth: hasClashes ? '6px' : '5px',
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
          : hasClashes
          ? 'border-2 ring-2 ring-rose-500/80 shadow-rose-200 shadow-sm'
          : isUnassignedRoom
          ? 'border-2 ring-1 ring-rose-300/80'
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
                backgroundColor: hasClashes ? '#ffe4e6' : isDraft ? '#fef3c7' : isMakeup ? '#ccfbf1' : colorPalette.badgeBgHex,
                color: hasClashes ? '#9f1239' : isDraft ? '#78350f' : isMakeup ? '#115e59' : colorPalette.badgeTextHex,
                borderColor: hasClashes ? '#f43f5e' : isDraft ? '#fde68a' : isMakeup ? '#99f6e4' : colorPalette.badgeBorderHex,
              }}
              className="font-extrabold px-2 py-0.5 rounded text-[10px] font-mono shadow-2xs border"
            >
              {cleanCourse.code}
            </span>

            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/95 text-slate-800 font-mono border border-slate-300 shadow-2xs">
              {boxesCount * 30}m
            </span>

            {/* Prominent Clash Badges with Pulse Animation & Explanatory Tooltips */}
            {hasRoomClash && (
              <span
                title={roomClashes.map((c) => `[Room Clash]: ${c.message}`).join('\n')}
                className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-600 text-white shadow-xs animate-pulse flex items-center gap-0.5 cursor-help"
              >
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>Room Clash</span>
              </span>
            )}

            {hasTeacherClash && (
              <span
                title={teacherClashes.map((c) => `[Teacher Clash]: ${c.message}`).join('\n')}
                className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-600 text-white shadow-xs animate-pulse flex items-center gap-0.5 cursor-help"
              >
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>Teacher Clash</span>
              </span>
            )}

            {hasBatchClash && (
              <span
                title={batchClashes.map((c) => `[Batch Clash]: ${c.message}`).join('\n')}
                className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-600 text-white shadow-xs animate-pulse flex items-center gap-0.5 cursor-help"
              >
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>Batch Clash</span>
              </span>
            )}

            {isUnassignedRoom && !hasRoomClash && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-rose-600 text-white shadow-2xs animate-pulse">
                Room Missing
              </span>
            )}

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
                title="Edit Class Details & Assign Venue"
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
          {cleanCourse.name || 'Class Session'}
        </h4>
      </div>

      {/* Details Footer */}
      <div 
        style={{ borderTopColor: hasClashes ? '#fecdd3' : colorPalette.borderHex }}
        className="pt-1 mt-1 border-t space-y-1 text-slate-800 text-[10px]"
      >
        {/* Time & Room Row */}
        <div className="flex flex-wrap items-center justify-between gap-1">
          <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
            <Clock className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="text-[10px]">{formatTimeRange(session.start_time, session.end_time)}</span>
          </div>

          {isUnassignedRoom ? (
            <span 
              onClick={(e) => {
                if (isCoordinator) {
                  e.stopPropagation();
                  onEdit(session);
                }
              }}
              title={isCoordinator ? "Click to assign classroom venue" : "Room pending assignment"}
              className={`flex items-center gap-0.5 font-bold text-rose-950 bg-rose-200/95 px-1.5 py-0.5 rounded text-[9px] break-words border border-rose-300 ${
                isCoordinator ? 'cursor-pointer hover:bg-rose-300 transition-colors' : ''
              }`}
            >
              <AlertTriangle className="w-2.5 h-2.5 text-rose-700 shrink-0" />
              <span>Room Missing</span>
            </span>
          ) : hasRoomClash ? (
            <span
              title={roomClashes.map((c) => c.message).join('\n')}
              className={`flex items-center gap-1 font-bold text-rose-900 bg-rose-100/90 px-1.5 py-0.5 rounded border border-rose-300 shadow-2xs cursor-help ${
                isShortDuration
                  ? 'truncate max-w-[130px] group-hover:max-w-none group-hover:whitespace-normal'
                  : 'break-words'
              }`}
            >
              <MapPin className="w-2.5 h-2.5 text-rose-600 shrink-0" />
              <span>{room?.name}</span>
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
            title={hasTeacherClash ? teacherClashes.map((c) => c.message).join('\n') : undefined}
            className={`font-semibold ${
              hasTeacherClash
                ? 'text-rose-900 bg-rose-100 px-1 rounded border border-rose-300 font-bold cursor-help'
                : 'text-slate-900'
            } ${
              isShortDuration
                ? 'truncate max-w-[110px] group-hover:max-w-none group-hover:whitespace-normal'
                : 'break-words'
            }`}
          >
            {teacher?.name || 'Instructor'}
          </span>
          <span 
            style={{
              backgroundColor: hasBatchClash ? '#ffe4e6' : colorPalette.pillBgHex,
              color: hasBatchClash ? '#9f1239' : colorPalette.pillTextHex,
              borderColor: hasBatchClash ? '#fda4af' : colorPalette.pillBorderHex,
            }}
            title={
              hasBatchClash
                ? batchClashes.map((c) => c.message).join('\n')
                : `${batch?.program || ''} (${batch?.student_count || 0} students)`
            }
            className={`font-bold px-1.5 py-0.5 rounded text-[9px] border shadow-2xs flex items-center gap-1 ${
              hasBatchClash ? 'border-rose-400 cursor-help ring-1 ring-rose-300' : ''
            }`}
          >
            {batch?.program_code && (
              <span className="opacity-75 font-mono text-[8px] bg-black/10 dark:bg-white/10 px-1 rounded">
                {batch.program_code}
              </span>
            )}
            <span>{batch ? getCleanBatchNumber(batch.name, batch.section) : 'Batch'}</span>
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
