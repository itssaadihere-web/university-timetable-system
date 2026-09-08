'use client';

import React from 'react';
import { useTimetable } from '@/context/TimetableContext';
import { UserRole } from '@/types';
import { 
  Calendar, 
  Sparkles, 
  Radio, 
  Shield, 
  UserCheck, 
  GraduationCap, 
  Plus, 
  UploadCloud, 
  Layers,
  AlertCircle
} from 'lucide-react';

interface NavbarProps {
  onOpenNewSessionModal: () => void;
  onOpenPublishModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewSessionModal,
  onOpenPublishModal,
}) => {
  const {
    activeSemester,
    currentRole,
    setCurrentRole,
    currentUserName,
    setCurrentUserName,
    sessions,
    isOnline,
    lastSyncTime,
  } = useTimetable();

  const draftSessionsCount = sessions.filter((s) => s.status === 'draft').length;

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'coordinator' || role === 'admin') {
      setCurrentUserName('Coordinator Alice');
    } else if (role === 'faculty') {
      setCurrentUserName('Dr. Alan Turing');
    } else {
      setCurrentUserName('Hamza Tariq (Student)');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Active Semester */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                  UniSchedule
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  {activeSemester?.name || 'Fall 2026'}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Centralized Conflict-Free Timetable & Resource Engine
              </p>
            </div>
          </div>

          {/* Center: Live Sync & Status Indicator */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600 shadow-inner">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-slate-700">Centralized DB Sync</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500 font-mono text-[11px]">{lastSyncTime}</span>
            </div>

            {currentRole === 'coordinator' && draftSessionsCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-800 animate-pulse">
                <Layers className="w-3.5 h-3.5" />
                <span>{draftSessionsCount} Draft Edits Staged</span>
              </div>
            )}
          </div>

          {/* Right Controls: Role Switcher & Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Role Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => handleRoleChange('coordinator')}
                title="Coordinator / Admin (Full Edit & Advising Access)"
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  currentRole === 'coordinator' || currentRole === 'admin'
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Coordinator</span>
              </button>

              <button
                onClick={() => handleRoleChange('faculty')}
                title="Faculty (View Teaching Schedule & Free Rooms)"
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  currentRole === 'faculty'
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Faculty</span>
              </button>

              <button
                onClick={() => handleRoleChange('student')}
                title="Student (View Published Batch Timetable)"
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  currentRole === 'student'
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Student</span>
              </button>
            </div>

            {/* Coordinator Actions */}
            {(currentRole === 'coordinator' || currentRole === 'admin') && (
              <div className="flex items-center gap-2">
                {draftSessionsCount > 0 && (
                  <button
                    onClick={onOpenPublishModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg shadow-sm hover:shadow transition-all"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Review & Publish</span>
                    <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                      {draftSessionsCount}
                    </span>
                  </button>
                )}

                <button
                  onClick={onOpenNewSessionModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm hover:shadow transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Class</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
