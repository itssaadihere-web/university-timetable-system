'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTimetable } from '@/context/TimetableContext';
import { AuditLogViewer } from '@/components/audit/AuditLogViewer';
import { AnalyticsReports } from '@/components/reports/AnalyticsReports';
import { TimetableFilterBar } from '@/components/timetable/TimetableFilterBar';
import { TimetableGrid } from '@/components/timetable/TimetableGrid';
import { RoomAllocationModal } from '@/components/modals/RoomAllocationModal';
import { ClassSession } from '@/types';
import { 
  Users, 
  DoorOpen, 
  Layers, 
  Clock, 
  Calendar, 
  BarChart3, 
  ShieldCheck, 
  UserPlus, 
  Sparkles, 
  Copy, 
  Upload, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Building2,
  ArrowRight,
  TrendingUp
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
  const [isRoomAllocationOpen, setIsRoomAllocationOpen] = useState<boolean>(false);

  const publishedCount = sessions.filter((s) => s.status === 'published').length;
  const draftCount = sessions.filter((s) => s.status === 'draft').length;
  const unassignedSessions = sessions.filter((s) => {
    return !s.room_id || !rooms.some((rm) => rm.id === s.room_id);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-shu-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-shu-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white backdrop-blur border border-white/10">
                Fatima Business School
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-shu-700 text-white shadow-2xs">
                Administration Hub
              </span>
              <span className="text-xs font-medium text-slate-300">
                {activeSemester?.name} ({activeSemester?.academic_year})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {currentUser?.name || 'Administrator'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl leading-relaxed">
              Institutional executive administration console for Faculty of Management Sciences and Faculty of Computer Science.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenUserManagement}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold bg-shu-700 hover:bg-shu-800 active:bg-shu-900 text-white rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>User & Role Console</span>
            </button>

            {unassignedSessions.length > 0 && (
              <button
                onClick={() => setIsRoomAllocationOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <DoorOpen className="w-4 h-4" />
                <span>Assign Rooms ({unassignedSessions.length})</span>
              </button>
            )}

            <button
              onClick={onOpenRollover}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer border border-white/10"
            >
              <Copy className="w-3.5 h-3.5 text-slate-300" />
              <span>Rollover</span>
            </button>

            <button
              onClick={onOpenImport}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer border border-white/10"
            >
              <Upload className="w-3.5 h-3.5 text-slate-300" />
              <span>CSV Importer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unassigned Rooms Alert Notification for Admin */}
      {unassignedSessions.length > 0 && (
        <div 
          onClick={() => setIsRoomAllocationOpen(true)}
          className="bg-amber-50/90 hover:bg-amber-100/90 border border-amber-200 text-amber-900 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
          role="button"
          tabIndex={0}
          title="Click to open Classroom Allocator and assign venues"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-200 text-amber-900 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
            </div>
            <div className="text-xs">
              <p className="font-extrabold text-amber-950 text-xs sm:text-sm flex items-center gap-2">
                <span>Room Allocation Notice: {unassignedSessions.length} Scheduled Sessions Have Pending Room Allocation</span>
              </p>
              <p className="text-amber-800 mt-0.5">
                Department schedules have courses with pending rooms. Click here to open the Classroom & Venue Allocator and assign available rooms.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <span className="px-3.5 py-1.5 rounded-xl bg-amber-200 group-hover:bg-amber-300/90 text-amber-950 font-bold text-xs transition-colors flex items-center gap-1.5">
              <DoorOpen className="w-3.5 h-3.5" />
              <span>{unassignedSessions.length} Pending</span>
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-shu-700 group-hover:bg-shu-800 text-white font-bold text-xs shadow-2xs flex items-center gap-1 transition-all">
              <span>Assign Rooms</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Scheduled Classes</span>
            <div className="p-2 rounded-xl bg-red-50 text-shu-700">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{sessions.length}</span>
            <span className="text-xs text-emerald-600 font-semibold">{publishedCount} live</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">{draftCount} draft sessions staged</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Campus Venues</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <DoorOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{rooms.length}</span>
            <span className="text-xs text-slate-500 font-medium">Halls & Labs</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Multi-tag equipment tracked</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Faculty & Staff</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{faculty.length}</span>
            <span className="text-xs text-slate-500 font-medium">Instructors</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Max load enforcement active</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">System Accounts</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{userAccounts.length}</span>
            <span className="text-xs text-shu-700 font-semibold">Active</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Admin, Coord & Faculty</p>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setAdminTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            adminTab === 'overview'
              ? 'bg-shu-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Administration Hub</span>
        </button>

        <button
          onClick={() => setAdminTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            adminTab === 'matrix'
              ? 'bg-shu-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Full Timetable Matrix</span>
        </button>

        <button
          onClick={() => setAdminTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            adminTab === 'analytics'
              ? 'bg-shu-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Load & Capacity Analytics</span>
        </button>

        <button
          onClick={() => setAdminTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            adminTab === 'audit'
              ? 'bg-shu-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>System Audit Trail</span>
        </button>
      </div>

      {/* Tab 1: Overview Quick Cards */}
      {adminTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">User & Role Provisioning</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Create and manage institutional user accounts for Administrators, Program Coordinators, and Faculty members.
            </p>
            <button
              onClick={onOpenUserManagement}
              className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 pt-1 cursor-pointer"
            >
              <span>Open User Console &rarr;</span>
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Copy className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Semester Rollover Cloning</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Clone previous semester schedule templates into an editable draft for the next term with 1-click.
            </p>
            <button
              onClick={onOpenRollover}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 pt-1 cursor-pointer"
            >
              <span>Launch Rollover Wizard &rarr;</span>
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Master CSV Importer</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bulk import Rooms with capability tags, Faculty with load limits, Batches, and Course catalogs.
            </p>
            <button
              onClick={onOpenImport}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 pt-1 cursor-pointer"
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

      {/* Room Allocation Modal */}
      <RoomAllocationModal
        isOpen={isRoomAllocationOpen}
        onClose={() => setIsRoomAllocationOpen(false)}
        onOpenEditSession={onOpenEditSession}
      />
    </div>
  );
};
