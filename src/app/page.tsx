'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTimetable } from '@/context/TimetableContext';
import { Navbar } from '@/components/layout/Navbar';
import { UserManagementModal } from '@/components/auth/UserManagementModal';
import { StudentPublicDashboard } from '@/components/dashboards/StudentPublicDashboard';
import { FacultyDashboard } from '@/components/dashboards/FacultyDashboard';
import { CoordinatorDashboard } from '@/components/dashboards/CoordinatorDashboard';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { SessionEditModal } from '@/components/modals/SessionEditModal';
import { VersionDiffModal } from '@/components/modals/VersionDiffModal';
import { SemesterRolloverModal } from '@/components/modals/SemesterRolloverModal';
import { BulkCsvImportModal } from '@/components/modals/BulkCsvImportModal';
import { ClassSession } from '@/types';

export default function AppMainPage() {
  const { currentRole, currentUser } = useAuth();
  const { setCurrentRole, setCurrentUserName } = useTimetable();

  // Sync auth state with timetable context
  React.useEffect(() => {
    setCurrentRole(currentRole);
    if (currentUser) {
      setCurrentUserName(currentUser.name);
    } else {
      setCurrentUserName('Public Student Viewer');
    }
  }, [currentRole, currentUser, setCurrentRole, setCurrentUserName]);

  // Modal States
  const [isUserManagementOpen, setIsUserManagementOpen] = useState<boolean>(false);
  const [isNewSessionOpen, setIsNewSessionOpen] = useState<boolean>(false);
  const [sessionToEdit, setSessionToEdit] = useState<ClassSession | null>(null);
  const [slotPreset, setSlotPreset] = useState<{ dayOfWeek: number; startTime: string; endTime: string } | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [isRolloverModalOpen, setIsRolloverModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

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
      {/* Clean Navbar */}
      <Navbar
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
      />

      {/* Role-Specific Clean Dashboard View */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {currentRole === 'student' && <StudentPublicDashboard />}

        {currentRole === 'faculty' && <FacultyDashboard />}

        {currentRole === 'coordinator' && (
          <CoordinatorDashboard
            onOpenNewSession={handleOpenNewSession}
            onOpenEditSession={handleOpenEditSession}
            onOpenPublishModal={() => setIsPublishModalOpen(true)}
            onOpenUserManagement={() => setIsUserManagementOpen(true)}
            onOpenRollover={() => setIsRolloverModalOpen(true)}
            onOpenImport={() => setIsImportModalOpen(true)}
          />
        )}

        {currentRole === 'admin' && (
          <AdminDashboard
            onOpenUserManagement={() => setIsUserManagementOpen(true)}
            onOpenRollover={() => setIsRolloverModalOpen(true)}
            onOpenImport={() => setIsImportModalOpen(true)}
            onOpenNewSession={handleOpenNewSession}
            onOpenEditSession={handleOpenEditSession}
          />
        )}
      </main>

      {/* Modals */}
      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
      />

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
            <span>Role-Based Access Control</span>
            <span>•</span>
            <span>Public Student View</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
