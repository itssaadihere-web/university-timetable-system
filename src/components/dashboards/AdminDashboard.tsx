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
  ArrowRight
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500 text-white">
                Executive Administration
              </span>
              <span className="text-xs text-purple-200">
                Active Term: {activeSemester?.name} ({activeSemester?.academic_year})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {currentUser?.name || 'Administrator'}
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/90 mt-1 max-w-xl">
              System governance, institutional user provisioning, semester rollover templates, and audit trail monitoring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenUserManagement}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-xs transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>User & Role Console</span>
            </button>

            <button
              onClick={onOpenRollover}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
            >
              <Copy className="w-4 h-4 text-purple-300" />
              <span>Semester Rollover</span>
            </button>

            <button
              onClick={onOpenImport}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
            >
              <Upload className="w-4 h-4 text-purple-300" />
              <span>CSV Importer</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Scheduled Classes</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
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
            <Users className="w-4 h-4 text-purple-600" />
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
            <span className="text-xs text-indigo-600 font-semibold">Active</span>
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
              ? 'bg-purple-600 text-white shadow-xs'
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
              ? 'bg-purple-600 text-white shadow-xs'
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
              ? 'bg-purple-600 text-white shadow-xs'
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
              ? 'bg-purple-600 text-white shadow-xs'
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
