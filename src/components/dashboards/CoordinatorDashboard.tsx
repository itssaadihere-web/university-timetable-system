'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTimetable } from '@/context/TimetableContext';
import { TimetableFilterBar } from '@/components/timetable/TimetableFilterBar';
import { TimetableGrid } from '@/components/timetable/TimetableGrid';
import { StudentAdvisingModule } from '@/components/advising/StudentAdvisingModule';
import { MakeupClassManager } from '@/components/makeup/MakeupClassManager';
import { AnalyticsReports } from '@/components/reports/AnalyticsReports';
import { ClassSession } from '@/types';
import { 
  Sparkles, 
  Calendar, 
  GraduationCap, 
  Clock, 
  BarChart3, 
  Plus, 
  UploadCloud, 
  UserPlus, 
  Layers, 
  Copy, 
  Upload,
  AlertTriangle 
} from 'lucide-react';

interface CoordinatorDashboardProps {
  onOpenNewSession: (preset?: { dayOfWeek: number; startTime: string; endTime: string }) => void;
  onOpenEditSession: (session: ClassSession) => void;
  onOpenPublishModal: () => void;
  onOpenUserManagement: () => void;
  onOpenRollover: () => void;
  onOpenImport: () => void;
}

export const CoordinatorDashboard: React.FC<CoordinatorDashboardProps> = ({
  onOpenNewSession,
  onOpenEditSession,
  onOpenPublishModal,
  onOpenUserManagement,
  onOpenRollover,
  onOpenImport,
}) => {
  const { currentUser } = useAuth();
  const { sessions, rooms, advisingSuggestions, makeupRequests, activeSemester } = useTimetable();

  const [activeTab, setActiveTab] = useState<'matrix' | 'advising' | 'makeup' | 'analytics'>('matrix');

  const draftSessionsCount = sessions.filter((s) => s.status === 'draft').length;
  const pendingAdvisingCount = advisingSuggestions.filter((a) => a.status === 'pending').length;
  const pendingMakeupCount = makeupRequests.filter((m) => m.status === 'pending').length;

  const unassignedSessions = sessions.filter((s) => {
    const r = rooms.find((rm) => rm.id === s.room_id);
    return !r || s.room_id === 'room-unassigned' || s.room_id === 'a0000000-0000-0000-0000-000000000000' || r.name.includes('Pending') || r.name.includes('Not Assigned');
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500 text-white">
                Program Coordinator Console
              </span>
              <span className="text-xs text-indigo-200">
                {activeSemester?.name || 'Fall 2026'} Schedule Control
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {currentUser?.name || 'Program Coordinator'}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/90 mt-1 max-w-xl">
              Drag-and-drop scheduling, multi-coordinator real-time synchronization, and automated 3D conflict prevention across faculty, rooms, and batches.
            </p>
          </div>

          {/* Quick Action Ribbon */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onOpenNewSession()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Class</span>
            </button>

            {draftSessionsCount > 0 && (
              <button
                onClick={onOpenPublishModal}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs transition-all animate-pulse"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Review & Publish ({draftSessionsCount})</span>
              </button>
            )}

            <button
              onClick={onOpenUserManagement}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
            >
              <UserPlus className="w-4 h-4 text-teal-400" />
              <span>Faculty Accounts</span>
            </button>

            <button
              onClick={onOpenRollover}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
            >
              <Copy className="w-3.5 h-3.5 text-indigo-300" />
              <span>Rollover</span>
            </button>

            <button
              onClick={onOpenImport}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-300" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unassigned Rooms Alert Notification for Coordinator */}
      {unassignedSessions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-amber-950">
                ⚠️ Room Allocation Alert: {unassignedSessions.length} Scheduled Class Sessions Have No Room Assigned
              </p>
              <p className="text-amber-800/90 mt-0.5">
                From the uploaded department schedules, some courses (e.g. BAN-202 Fri, PST-101, ARM-5/6 RM courses, BS(AF)-3 HUS-202, BBA-6 electives) currently have pending room numbers.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-lg bg-amber-200 text-amber-900 font-bold text-xs shrink-0 self-start sm:self-auto">
            {unassignedSessions.length} Venues Pending
          </span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'matrix'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Timetable Matrix (D&D)</span>
        </button>

        <button
          onClick={() => setActiveTab('advising')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'advising'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student Advising & Prereqs</span>
          {pendingAdvisingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-900 font-bold">
              {pendingAdvisingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('makeup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'makeup'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Makeup Approvals & Venues</span>
          {pendingMakeupCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-500 text-white font-bold">
              {pendingMakeupCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Load & Room Reports</span>
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <TimetableFilterBar />
          <TimetableGrid
            onOpenNewSessionModal={onOpenNewSession}
            onOpenEditSessionModal={onOpenEditSession}
          />
        </div>
      )}

      {activeTab === 'advising' && <StudentAdvisingModule />}

      {activeTab === 'makeup' && <MakeupClassManager />}

      {activeTab === 'analytics' && <AnalyticsReports />}
    </div>
  );
};
