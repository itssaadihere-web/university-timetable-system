'use client';

import React, { useState } from 'react';
import { useTimetable } from '@/context/TimetableContext';
import { X, Copy, CheckCircle2, Sparkles } from 'lucide-react';

interface SemesterRolloverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SemesterRolloverModal: React.FC<SemesterRolloverModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { activeSemester, cloneSemesterRollover } = useTimetable();
  const [targetSemesterName, setTargetSemesterName] = useState<string>('Spring 2027');
  const [targetAcademicYear, setTargetAcademicYear] = useState<string>('2026-2027');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRollover = (e: React.FormEvent) => {
    e.preventDefault();
    cloneSemesterRollover(targetSemesterName, targetAcademicYear);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Copy className="w-5 h-5 text-indigo-600" />
            <span>Semester Rollover & Cloning</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-6 text-center text-xs space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-slate-900 text-sm">
              Semester Successfully Cloned!
            </h4>
            <p className="text-slate-500">
              New draft timetable created for &quot;{targetSemesterName}&quot;. You can now adjust slots safely in draft mode.
            </p>
          </div>
        ) : (
          <form onSubmit={handleRollover} className="space-y-4 text-xs">
            <p className="text-slate-600">
              Clone the current active semester structure ({activeSemester?.name}) including room allocations and course structures as an editable draft for the next term.
            </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                New Semester Name
              </label>
              <input
                type="text"
                value={targetSemesterName}
                onChange={(e) => setTargetSemesterName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Academic Year
              </label>
              <input
                type="text"
                value={targetAcademicYear}
                onChange={(e) => setTargetAcademicYear(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                Clone as Draft
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
