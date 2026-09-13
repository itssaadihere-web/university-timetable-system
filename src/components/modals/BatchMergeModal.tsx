'use client';

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Users, 
  User, 
  BookOpen, 
  MapPin, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Layers
} from 'lucide-react';
import { BatchMergeCandidate, TIMETABLE_DAYS, formatTimeRange } from '@/lib/conflict-engine';

interface BatchMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: BatchMergeCandidate | null;
  onConfirmMerge: (candidate: BatchMergeCandidate, customGroupName?: string) => Promise<void> | void;
  onRejectMerge?: () => void;
}

export const BatchMergeModal: React.FC<BatchMergeModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onConfirmMerge,
  onRejectMerge,
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen || !candidate) return null;

  const {
    existingSession,
    existingBatch,
    newBatch,
    course,
    faculty,
    room,
    combinedStudentCount,
    roomCapacity,
    hasCapacityIssue,
  } = candidate;

  const dayName =
    TIMETABLE_DAYS.find((d) => d.id === existingSession.day_of_week)?.name ||
    `Day ${existingSession.day_of_week}`;
  const timeFormatted = formatTimeRange(existingSession.start_time, existingSession.end_time);
  const defaultGroupName = `Joint ${course.code} (${existingBatch.name} + ${newBatch.name})`;

  const handleMerge = async () => {
    setIsProcessing(true);
    try {
      await onConfirmMerge(candidate, defaultGroupName);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    if (onRejectMerge) {
      onRejectMerge();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-purple-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-purple-100 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Joint Class Batch Merge Opportunity
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-200 text-purple-900 border border-purple-300">
                  Detected
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Same instructor, room, and course scheduled at the exact same time slot.
              </p>
            </div>
          </div>

          <button
            onClick={handleReject}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-all cursor-pointer"
            title="Close / Treat as Clash"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          
          {/* Explanation Alert */}
          <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 text-purple-950 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-xs text-purple-900">
              <Layers className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Would you like to combine these batches into a single joint lecture?</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Instructor <strong className="text-slate-900">{faculty.name}</strong> is already scheduled to conduct <strong className="text-slate-900">{course.code} ({course.name})</strong> in <strong className="text-slate-900">{room ? room.name : 'this venue'}</strong> at this time.
            </p>
          </div>

          {/* Batches Merging Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Batch 1 (Existing) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                Scheduled Batch 1
              </div>
              <div className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-600 shrink-0" />
                <span>{existingBatch.name}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {existingBatch.program} • Sem {existingBatch.semester}
              </div>
              <div className="inline-block px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold">
                {existingBatch.student_count || 40} Students
              </div>
            </div>

            {/* Batch 2 (New) */}
            <div className="bg-purple-50/50 border border-purple-200 rounded-2xl p-3.5 space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase text-purple-600 tracking-wider">
                Incoming Batch 2
              </div>
              <div className="font-black text-purple-950 text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-700 shrink-0" />
                <span>{newBatch.name}</span>
              </div>
              <div className="text-[11px] text-purple-700 font-medium">
                {newBatch.program} • Sem {newBatch.semester}
              </div>
              <div className="inline-block px-2 py-0.5 rounded-md bg-purple-200 text-purple-900 text-[10px] font-bold">
                {newBatch.student_count || 40} Students
              </div>
            </div>
          </div>

          {/* Slot & Room Specs */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs flex-wrap gap-2">
              <span className="flex items-center gap-1.5 font-bold text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{dayName}</span>
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{timeFormatted}</span>
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{room ? room.name : 'Unassigned Room'}</span>
              </span>
            </div>

            {/* Capacity check */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">
                Combined Class Strength:
              </span>
              <span className={`font-bold flex items-center gap-1 ${
                hasCapacityIssue ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                {hasCapacityIssue ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )}
                <span>
                  {combinedStudentCount} students {room ? `/ ${roomCapacity} room capacity` : ''}
                </span>
              </span>
            </div>

            {hasCapacityIssue && (
              <p className="text-[10px] text-amber-700 font-medium bg-amber-50 rounded-lg p-2 border border-amber-200">
                ⚠️ Notice: Total students ({combinedStudentCount}) exceed the current venue capacity ({roomCapacity}). You can still merge and reallocate to a larger lecture hall if needed.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleReject}
            disabled={isProcessing}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            Don&apos;t Merge (Treat as Conflict)
          </button>

          <button
            type="button"
            onClick={handleMerge}
            disabled={isProcessing}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>{isProcessing ? 'Merging Batches...' : '✓ Merge Batches (Joint Class)'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
