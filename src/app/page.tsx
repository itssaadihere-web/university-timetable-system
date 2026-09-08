'use client';

import React, { useState } from 'react';
import { useTimetable } from '@/context/TimetableContext';
import { Navbar } from '@/components/layout/Navbar';
import { TimetableFilterBar } from '@/components/timetable/TimetableFilterBar';
import { TimetableGrid } from '@/components/timetable/TimetableGrid';
import { SessionEditModal } from '@/components/modals/SessionEditModal';
import { VersionDiffModal } from '@/components/modals/VersionDiffModal';
import { SemesterRolloverModal } from '@/components/modals/SemesterRolloverModal';
import { BulkCsvImportModal } from '@/components/modals/BulkCsvImportModal';
import { StudentAdvisingModule } from '@/components/advising/StudentAdvisingModule';
import { MakeupClassManager } from '@/components/makeup/MakeupClassManager';
import { AnalyticsReports } from '@/components/reports/AnalyticsReports';
import { AuditLogViewer } from '@/components/audit/AuditLogViewer';
import { ClassSession } from '@/types';
import { 
  Calendar, 
  GraduationCap, 
  Sparkles, 
  BarChart3, 
  History, 
  Upload, 
  Copy, 
  AlertCircle,
  Clock,
  Layers,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

type NavigationTab = 'timetable' | 'advising' | 'makeup' | 'analytics' | 'audit';

export default function TimetableDashboard() {
  const { currentRole, advisingSuggestions, makeupRequests, sessions } = useTimetable();
  const [activeTab, setActiveTab] = useState<NavigationTab>('timetable');

  // Modal States
  const [isNewSessionOpen, setIsNewSessionOpen] = useState<boolean>(false);
  const [sessionToEdit, setSessionToEdit] = useState<ClassSession | null>(null);
  const [slotPreset, setSlotPreset] = useState<{ dayOfWeek: number; startTime: string; endTime: string } | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isRolloverModalOpen, setIsRolloverModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  const isCoordinator = currentRole === 'coordinator' || currentRole === 'admin';
  const pendingAdvisingCount = advisingSuggestions.filter((a) => a.status === 'pending').length;
  const pendingMakeupCount = makeupRequests.filter((m) => m.status === 'pending').length;
  const draftCount = sessions.filter((s) => s.status === 'draft').length;

  const handleOpenNewSession = (preset?: { dayOfWeek: number; startTime: string; endTime: string }) => {
    setSessionToEdit(null);
    setSlotPreset(preset || null);
    setIsNewSessionOpen(true);
  };

  const handleOpenEditSession = (session: ClassSession) => {
    setSessionToEdit(session);
    setSlotPreset(null);
    setIsNewSessionOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navbar */}
      <Navbar
        onOpenNewSessionModal={() => handleOpenNewSession()}
        onOpenPublishModal={() => setIsPublishModalOpen(true)}
      />

      {/* Sub-Header Navigation & Action Ribbon */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2">
            {/* Primary Tab Bar */}
            <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1">
              <button
                onClick={() => setActiveTab('timetable')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'timetable'
                    ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Timetable Grid</span>
              </button>

              {isCoordinator && (
                <button
                  onClick={() => setActiveTab('advising')}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                    activeTab === 'advising'
                      ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Student Advising</span>
                  {pendingAdvisingCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                      {pendingAdvisingCount}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => setActiveTab('makeup')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'makeup'
                    ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Makeup & Room Matrix</span>
                {pendingMakeupCount > 0 && isCoordinator && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-teal-600 text-white font-bold">
                    {pendingMakeupCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Load & Utilization Reports</span>
              </button>

              {isCoordinator && (
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                    activeTab === 'audit'
                      ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>Audit Trail</span>
                </button>
              )}
            </nav>

            {/* Quick Admin Actions (Rollover, CSV Import) */}
            {isCoordinator && (
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => setIsRolloverModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
                  title="Clone previous semester schedule to draft"
                >
                  <Copy className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Rollover</span>
                </button>

                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
                  title="Bulk Import Rooms, Faculty, Courses via CSV"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Import CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'timetable' && (
          <div className="space-y-4">
            <TimetableFilterBar />
            <TimetableGrid
              onOpenNewSessionModal={handleOpenNewSession}
              onOpenEditSessionModal={handleOpenEditSession}
            />
          </div>
        )}

        {activeTab === 'advising' && isCoordinator && <StudentAdvisingModule />}

        {activeTab === 'makeup' && <MakeupClassManager />}

        {activeTab === 'analytics' && <AnalyticsReports />}

        {activeTab === 'audit' && isCoordinator && <AuditLogViewer />}
      </main>

      {/* Modals */}
      <SessionEditModal
        isOpen={isNewSessionOpen}
        onClose={() => setIsNewSessionOpen(false)}
        sessionToEdit={sessionToEdit}
        presetData={slotPreset}
      />

      <VersionDiffModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
      />

      <SemesterRolloverModal
        isOpen={isRolloverModalOpen}
        onClose={() => setIsRolloverModalOpen(false)}
      />

      <BulkCsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">University Timetable System</span>
            <span>•</span>
            <span>Zero-Cost Server-Side Postgres Architecture</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>Supabase Realtime</span>
            <span>•</span>
            <span>dnd-kit Drag Engine</span>
            <span>•</span>
            <span>n8n Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
