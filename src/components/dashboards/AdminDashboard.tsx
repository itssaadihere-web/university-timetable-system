'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTimetable } from '@/context/TimetableContext';
import { AuditLogViewer } from '@/components/audit/AuditLogViewer';
import { AnalyticsReports } from '@/components/reports/AnalyticsReports';
import { TimetableFilterBar } from '@/components/timetable/TimetableFilterBar';
import { TimetableGrid } from '@/components/timetable/TimetableGrid';
import { ClassSession } from '@/types';
import { 
  ShieldCheck, 
  UserPlus, 
  Copy, 
  Upload, 
  History, 
  BarChart3, 
  Calendar, 
  DoorOpen, 
  Users, 
  BookOpen, 
  Sparkles,
  Layers,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';

interface AdminDashboardProps {
  onOpenUserManagement: () => void;
  onOpenRollover: () => void;
  onOpenImport: () => void;
  onOpenNewSession: (preset?: { dayOfWeek: number; startTime: string; endTime: string }) => void;
  onOpenEditSession: (session: ClassSession) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenUserManagement,
  onOpenRollover,
  onOpenImport,
  onOpenNewSession,
  onOpenEditSession,
}) => {
  const { currentUser, userAccounts } = useAuth();
  const { sessions, rooms, faculty, courses, batches, activeSemester } = useTimetable();

  const [adminTab, setAdminTab] = useState<'overview' | 'matrix' | 'analytics' | 'audit'>('overview');

  const publishedCount = sessions.filter((s) => s.status === 'published').length;
  const draftCount = sessions.filter((s) => s.status === 'draft').length;
  const unassignedSessions = sessions.filter((s) => {
    const r = rooms.find((rm) => rm.id === s.room_id);
    return !r || s.room_id === 'room-unassigned' || s.room_id === 'a0000000-0000-0000-0000-000000000000' || r.name.includes('Pending') || r.name.includes('Not Assigned');
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-red-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white">
                Fatima Business School
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600/60 text-white">
                Salim Habib University
              </span>
              <span className="text-xs text-red-200">
                Active Term: {activeSemester?.name} ({activeSemester?.academic_year})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {currentUser?.name || 'Administrator'}
            </h1>
            <p className="text-xs sm:text-sm text-red-100/90 mt-1 max-w-xl">
              Executive Administration Console for Faculty of Management Sciences and Faculty of Computer Science.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenUserManagement}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-shu-700 hover:bg-shu-800 text-white rounded-xl shadow-xs transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>User & Role Console</span>
            </button>

            <button
              onClick={onOpenRollover}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
            >
              <Copy className="w-3.5 h-3.5 text-red-300" />
              <span>Semester Rollover</span>
            </button>

            <button
              onClick={onOpenImport}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-red-300" />
              <span>CSV Importer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unassigned Rooms Alert Notification for Admin */}
      {unassignedSessions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-amber-950">
                Institutional Alert: {unassignedSessions.length} Class Sessions Across Department Timetables Have No Room Assigned
              </p>
              <p className="text-amber-800/90 mt-0.5">
                Department schedules have courses with pending rooms. Switch to the Timetable Matrix tab or notify program coordinators to assign available lecture halls.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAdminTab('matrix')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-xs shrink-0 self-start sm:self-auto transition-all"
          >
            View Matrix ({unassignedSessions.length})
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Scheduled Classes</span>
            <Calendar className="w-4 h-4 text-shu-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{sessions.length}</span>
            <span className="text-xs text-emerald-600 font-semibold">{publishedCount} live</span>
          </div>
          <p className="text-[11px] text-slate-400">{draftCount} draft sessions staged</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Campus Venues</span>
            <DoorOpen className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{rooms.length}</span>
            <span className="text-xs text-slate-500 font-medium">Halls & Labs</span>
          </div>
          <p className="text-[11px] text-slate-400">Multi-tag equipment tracked</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Faculty & Staff</span>
            <Users className="w-4 h-4 text-shu-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{faculty.length}</span>
            <span className="text-xs text-slate-500 font-medium">Instructors</span>
          </div>
          <p className="text-[11px] text-slate-400">Max load enforcement active</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">System Users</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{userAccounts.length}</span>
            <span className="text-xs text-shu-700 font-semibold">Active</span>
          </div>
          <p className="text-[11px] text-slate-400">Admin, Coord & Faculty</p>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setAdminTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            adminTab === 'overview'
              ? 'bg-shu-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Administration Hub</span>
        </button>

        <button
          onClick={() => setAdminTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            adminTab === 'matrix'
              ? 'bg-shu-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Full Timetable Matrix</span>
        </button>

        <button
          onClick={() => setAdminTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            adminTab === 'analytics'
              ? 'bg-shu-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Load & Capacity Analytics</span>
        </button>

        <button
          onClick={() => setAdminTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            adminTab === 'audit'
              ? 'bg-shu-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>System Audit Trail</span>
        </button>
      </div>

      {/* Tab 1: Overview Quick Cards */}
      {adminTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">User & Role Provisioning</h3>
            <p className="text-xs text-slate-500">
              Create and manage institutional user accounts for Administrators, Program Coordinators, and Faculty members.
            </p>
            <button
              onClick={onOpenUserManagement}
              className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1 pt-1"
            >
              <span>Open User Console &rarr;</span>
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Copy className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Semester Rollover Cloning</h3>
            <p className="text-xs text-slate-500">
              Clone previous semester schedule templates into an editable draft for the next term with 1-click.
            </p>
            <button
              onClick={onOpenRollover}
              className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1 pt-1"
            >
              <span>Launch Rollover Wizard &rarr;</span>
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Master CSV Importer</h3>
            <p className="text-xs text-slate-500">
              Bulk import Rooms with capability tags, Faculty with load limits, Batches, and Course catalogs.
            </p>
            <button
              onClick={onOpenImport}
              className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1 pt-1"
            >
              <span>Import Master Data &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {adminTab === 'matrix' && (
        <div className="space-y-4">
          <TimetableFilterBar />
          <TimetableGrid
            onOpenNewSessionModal={onOpenNewSession}
            onOpenEditSessionModal={onOpenEditSession}
          />
        </div>
      )}

      {adminTab === 'analytics' && <AnalyticsReports />}

      {adminTab === 'audit' && <AuditLogViewer />}
    </div>
  );
};
