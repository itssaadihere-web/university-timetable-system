'use client';

import React, { useState } from 'react';
import { useTimetable } from '@/context/TimetableContext';
import { ClassSession } from '@/types';
import { 
  X, 
  AlertTriangle, 
  Mail, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  MapPin, 
  User, 
  BookOpen, 
  Users, 
  ShieldAlert,
  Send,
  Building2
} from 'lucide-react';
import { TIMETABLE_DAYS, formatTimeRange } from '@/lib/conflict-engine';
import { getRoomNavigationDetails } from '@/lib/campus-navigation';

export interface PendingScheduleChange {
  session: ClassSession;
  targetDay: number;
  targetStartTime: string;
  targetEndTime: string;
  targetRoomId?: string | null;
  changeType: 'DRAG_MOVE' | 'ROOM_ASSIGNMENT' | 'MODAL_EDIT';
}

interface ScheduleChangeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingChange: PendingScheduleChange | null;
  onConfirm: (sendEmail: boolean) => Promise<void>;
}

export const ScheduleChangeConfirmModal: React.FC<ScheduleChangeConfirmModalProps> = ({
  isOpen,
  onClose,
  pendingChange,
  onConfirm,
}) => {
  const {
    courses,
    faculty,
    rooms,
    batches,
    currentUserName,
  } = useTimetable();

  // Checked by default as requested!
  const [sendEmailNotification, setSendEmailNotification] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen || !pendingChange) return null;

  const { session, targetDay, targetStartTime, targetEndTime, targetRoomId } = pendingChange;

  const course = courses.find((c) => c.id === session.course_id);
  const instructor = faculty.find((f) => f.id === session.faculty_id);
  const batch = batches.find((b) => b.id === session.batch_id);
  
  const currentRoom = rooms.find((r) => r.id === session.room_id);
  const newRoomId = targetRoomId !== undefined ? targetRoomId : session.room_id;
  const newRoom = rooms.find((r) => r.id === newRoomId);

  const prevDayName = TIMETABLE_DAYS.find((d) => d.id === session.day_of_week)?.name || `Day ${session.day_of_week}`;
  const newDayName = TIMETABLE_DAYS.find((d) => d.id === targetDay)?.name || `Day ${targetDay}`;

  const prevTimeRange = formatTimeRange(session.start_time, session.end_time);
  const newTimeRange = formatTimeRange(targetStartTime, targetEndTime);

  const isTimingChanged = session.day_of_week !== targetDay || session.start_time !== targetStartTime || session.end_time !== targetEndTime;
  const isRoomChanged = session.room_id !== newRoomId;

  const navInfo = newRoom ? getRoomNavigationDetails(newRoom.id, newRoom.name, newRoom.building) : null;

  const handleConfirmClick = async () => {
    setIsProcessing(true);
    try {
      await onConfirm(sendEmailNotification);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isTimingChanged ? 'Confirm Schedule Reshuffle' : 'Confirm Classroom Assignment'}
              </h3>
              <p className="text-xs text-slate-500">
                Multi-Stakeholder Email Dispatch & Timetable Update
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
          {/* Class Summary */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-extrabold px-2.5 py-0.5 rounded-md bg-white border border-slate-300 text-slate-800 text-xs">
                {course?.code || 'CRS-CODE'}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Coordinator: {currentUserName}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {course?.name || 'Class Course'}
            </h4>
            <div className="flex items-center gap-4 text-slate-600 flex-wrap pt-1">
              <span className="flex items-center gap-1 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{instructor?.name || 'Faculty'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>{batch?.name || 'Batch'}</span>
              </span>
            </div>
          </div>

          {/* Before vs After Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Previous Slot */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 opacity-80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Previous Schedule
              </span>
              <p className="font-bold text-slate-700">
                {prevDayName}
              </p>
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{prevTimeRange}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentRoom?.name || 'No Room Assigned'}</span>
              </div>
            </div>

            {/* Proposed New Slot */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1.5">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                Proposed Schedule
              </span>
              <p className="font-bold text-indigo-950">
                {newDayName}
              </p>
              <div className="flex items-center gap-1.5 text-indigo-900 font-semibold">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>{newTimeRange}</span>
              </div>
              <div className="flex items-center gap-1.5 text-indigo-900 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>{newRoom?.name || 'Venue TBA'}</span>
              </div>
            </div>
          </div>

          {/* Navigation Preview if Room Assigned */}
          {navInfo && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 space-y-1 text-slate-700">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
                <Building2 className="w-4 h-4 text-amber-700" />
                <span>Venue Guidance: {navInfo.buildingType}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Floor: <strong>{navInfo.floorLabel}</strong> • Type: <strong>{navInfo.specialtyDescription}</strong>
              </p>
            </div>
          )}

          {/* Stakeholder Recipient List */}
          <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50 space-y-2">
            <h5 className="font-bold text-slate-800 text-xs flex items-center justify-between">
              <span>Stakeholders to be Notified:</span>
              <span className="text-[11px] font-mono text-indigo-600">4 Stakeholder Groups</span>
            </h5>
            <ul className="text-[11px] text-slate-600 space-y-1 pl-1">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span><strong>Course Instructor:</strong> {instructor?.name} ({instructor?.email})</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span><strong>Department Head:</strong> Notification of shifted class</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                <span><strong>Admin Office:</strong> Official system record</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span><strong>Enrolled Students:</strong> {batch?.name} class alert</span>
              </li>
            </ul>
          </div>

          {/* The Default-Checked Email Checkbox */}
          <div className="p-3.5 bg-indigo-50 border-2 border-indigo-200 rounded-2xl">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmailNotification}
                onChange={(e) => setSendEmailNotification(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <div>
                <span className="font-bold text-slate-900 text-xs block">
                  Send Email Notifications to All Stakeholders (Default: Checked)
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Uncheck this box if you want to apply the schedule change silently without sending emails.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isProcessing}
            className="px-5 py-2 text-xs font-bold text-white bg-shu-700 hover:bg-shu-800 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <span>Saving & Dispatching...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Apply Changes</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
