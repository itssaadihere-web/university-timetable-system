'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTimetable } from '@/context/TimetableContext';
import { TimetableFilterBar } from '@/components/timetable/TimetableFilterBar';
import { TimetableGrid } from '@/components/timetable/TimetableGrid';
import { StudentAdvisingModule } from '@/components/advising/StudentAdvisingModule';
import { MakeupClassManager } from '@/components/makeup/MakeupClassManager';
import { AnalyticsReports } from '@/components/reports/AnalyticsReports';
import { RoomAllocationModal } from '@/components/modals/RoomAllocationModal';
import { WhatsAppAgentManager } from '@/components/whatsapp/WhatsAppAgentManager';
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
  AlertTriangle,
  DoorOpen,
  ArrowRight,
  MessageSquare
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

  const [activeTab, setActiveTab] = useState<'matrix' | 'advising' | 'makeup' | 'analytics' | 'whatsapp'>('matrix');
  const [isRoomAllocationOpen, setIsRoomAllocationOpen] = useState<boolean>(false);

  const draftSessionsCount = sessions.filter((s) => s.status === 'draft').length;
  const pendingAdvisingCount = advisingSuggestions.filter((a) => a.status === 'pending').length;
  const pendingMakeupCount = makeupRequests.filter((m) => m.status === 'pending').length;

  const unassignedSessions = sessions.filter((s) => {
    return !s.room_id || !rooms.some((rm) => rm.id === s.room_id);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-shu-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-shu-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white backdrop-blur border border-white/10">
                Fatima Business School
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-shu-700 text-white shadow-2xs">
                Coordinator Console
              </span>
              <span className="text-xs font-medium text-slate-300">
                {activeSemester?.name || 'Fall 2026'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {currentUser?.name || 'Program Coordinator'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl leading-relaxed">
              Centralized timetable management with automated 3D conflict prevention for Faculty of Management Sciences.
            </p>
          </div>

          {/* Quick Action Ribbon */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onOpenNewSession()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-shu-700 hover:bg-shu-800 active:bg-shu-900 text-white rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Class</span>
            </button>

            {draftSessionsCount > 0 && (
              <button
                onClick={onOpenPublishModal}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Publish ({draftSessionsCount})</span>
              </button>
            )}

            {unassignedSessions.length > 0 && (
              <button
                onClick={() => setIsRoomAllocationOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <DoorOpen className="w-4 h-4" />
                <span>Assign Rooms ({unassignedSessions.length})</span>
              </button>
            )}

            <button
              onClick={onOpenUserManagement}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer border border-white/10"
            >
              <UserPlus className="w-4 h-4 text-slate-300" />
              <span>Faculty</span>
            </button>

            <button
              onClick={onOpenRollover}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer border border-white/10"
            >
              <Copy className="w-3.5 h-3.5 text-slate-300" />
              <span>Rollover</span>
            </button>

            <button
              onClick={onOpenImport}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer border border-white/10"
            >
              <Upload className="w-3.5 h-3.5 text-slate-300" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unassigned Rooms Clickable Alert Notification */}
      {unassignedSessions.length > 0 && (
        <div 
          onClick={() => setIsRoomAllocationOpen(true)}
          className="bg-amber-50/90 hover:bg-amber-100/90 border border-amber-200 text-amber-900 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:shadow-md transition-all cursor-pointer group"
          role="button"
          tabIndex={0}
          title="Click to view all unassigned classes and allocate classrooms"
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
                Click here to launch the Classroom & Venue Allocator and assign lecture halls.
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

      {/* Navigation Sub-Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'matrix'
              ? 'bg-shu-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Timetable Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('advising')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'advising'
              ? 'bg-shu-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student Advising</span>
          {pendingAdvisingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-900 font-bold">
              {pendingAdvisingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('makeup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'makeup'
              ? 'bg-shu-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Makeup Approvals</span>
          {pendingMakeupCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-500 text-white font-bold">
              {pendingMakeupCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-shu-700 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Load & Room Reports</span>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'whatsapp'
              ? 'bg-emerald-700 text-white shadow-2xs'
              : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span>WhatsApp AI Agent</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
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

      {activeTab === 'whatsapp' && <WhatsAppAgentManager />}

      {/* Room Allocation Modal */}
      <RoomAllocationModal
        isOpen={isRoomAllocationOpen}
        onClose={() => setIsRoomAllocationOpen(false)}
        onOpenEditSession={onOpenEditSession}
      />
    </div>
  );
};
