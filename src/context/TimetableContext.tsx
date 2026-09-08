'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ClassSession,
  Room,
  Faculty,
  Batch,
  BatchMergeGroup,
  Course,
  Semester,
  SemesterCalendarEvent,
  Student,
  StudentCourseCompleted,
  AdvisingSuggestion,
  AuditLogEntry,
  TimetableVersion,
  MakeupRequest,
  UserRole,
  TimetableFilterState,
  ConflictValidationResult,
} from '@/types';
import {
  INITIAL_SEMESTERS,
  INITIAL_CALENDAR,
  INITIAL_ROOMS,
  INITIAL_FACULTY,
  INITIAL_BATCHES,
  INITIAL_MERGE_GROUPS,
  INITIAL_COURSES,
  INITIAL_STUDENTS,
  INITIAL_COMPLETED_COURSES,
  INITIAL_SESSIONS,
  INITIAL_ADVISING_SUGGESTIONS,
  INITIAL_AUDIT_LOG,
  INITIAL_MAKEUP_REQUESTS,
} from '@/lib/mock-data';
import { validateSessionConflicts } from '@/lib/conflict-engine';
import { saveTimetableToCache, loadTimetableFromCache } from '@/lib/offline-cache';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface SoftLockInfo {
  userId: string;
  userName: string;
  sessionId: string;
  timestamp: number;
}

interface TimetableContextType {
  // Master Entities
  semesters: Semester[];
  activeSemester: Semester | null;
  calendarEvents: SemesterCalendarEvent[];
  rooms: Room[];
  faculty: Faculty[];
  batches: Batch[];
  mergeGroups: BatchMergeGroup[];
  courses: Course[];
  students: Student[];
  completedCourses: StudentCourseCompleted[];
  sessions: ClassSession[];
  advisingSuggestions: AdvisingSuggestion[];
  auditLogs: AuditLogEntry[];
  versions: TimetableVersion[];
  makeupRequests: MakeupRequest[];

  // Role & Session
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUserName: string;
  setCurrentUserName: (name: string) => void;

  // Filters
  filterState: TimetableFilterState;
  setFilterState: React.Dispatch<React.SetStateAction<TimetableFilterState>>;

  // Sync & Locks
  isOnline: boolean;
  lastSyncTime: string;
  activeLocks: Record<string, SoftLockInfo>;
  setSessionLock: (sessionId: string, isLocked: boolean) => void;

  // Operations
  validateSession: (session: Partial<ClassSession>) => ConflictValidationResult;
  addSession: (session: Omit<ClassSession, 'id'>) => Promise<{ success: boolean; errors?: string[] }>;
  updateSession: (session: ClassSession) => Promise<{ success: boolean; errors?: string[] }>;
  deleteSession: (sessionId: string) => Promise<{ success: boolean }>;
  moveSession: (
    sessionId: string,
    targetDay: number,
    targetStartTime: string,
    targetEndTime: string,
    targetRoomId?: string
  ) => Promise<{ success: boolean; errors?: string[] }>;
  publishCurrentDraft: (summary?: string) => Promise<{ success: boolean; versionNumber: number }>;
  revertToVersion: (version: TimetableVersion) => Promise<{ success: boolean }>;
  resolveAdvising: (id: string, notes?: string) => void;
  approveMakeup: (requestId: string) => Promise<{ success: boolean; errors?: string[] }>;
  rejectMakeup: (requestId: string, reason?: string) => void;
  cloneSemesterRollover: (targetSemesterName: string, targetAcademicYear: string) => void;
  bulkImportEntities: (type: 'rooms' | 'faculty' | 'batches' | 'courses', items: any[]) => void;
}

const TimetableContext = createContext<TimetableContextType | null>(null);

export function TimetableProvider({ children }: { children: React.ReactNode }) {
  // State
  const [semesters, setSemesters] = useState<Semester[]>(INITIAL_SEMESTERS);
  const [activeSemester, setActiveSemester] = useState<Semester | null>(INITIAL_SEMESTERS[0]);
  const [calendarEvents, setCalendarEvents] = useState<SemesterCalendarEvent[]>(INITIAL_CALENDAR);
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [faculty, setFaculty] = useState<Faculty[]>(INITIAL_FACULTY);
  const [batches, setBatches] = useState<Batch[]>(INITIAL_BATCHES);
  const [mergeGroups, setMergeGroups] = useState<BatchMergeGroup[]>(INITIAL_MERGE_GROUPS);
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [completedCourses, setCompletedCourses] = useState<StudentCourseCompleted[]>(INITIAL_COMPLETED_COURSES);
  const [sessions, setSessions] = useState<ClassSession[]>(INITIAL_SESSIONS);
  const [advisingSuggestions, setAdvisingSuggestions] = useState<AdvisingSuggestion[]>(INITIAL_ADVISING_SUGGESTIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOG);
  const [versions, setVersions] = useState<TimetableVersion[]>([]);
  const [makeupRequests, setMakeupRequests] = useState<MakeupRequest[]>(INITIAL_MAKEUP_REQUESTS);

  // User & Roles
  const [currentRole, setCurrentRole] = useState<UserRole>('coordinator');
  const [currentUserName, setCurrentUserName] = useState<string>('Coordinator Alice');

  // Sync & Presence Locks
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());
  const [activeLocks, setActiveLocks] = useState<Record<string, SoftLockInfo>>({});

  // Filters
  const [filterState, setFilterState] = useState<TimetableFilterState>({
    viewMode: 'batch',
    selectedBatchId: INITIAL_BATCHES[0]?.id,
    selectedFacultyId: INITIAL_FACULTY[0]?.id,
    selectedRoomId: INITIAL_ROOMS[0]?.id,
    selectedRoomTypes: [],
    departmentFilter: 'ALL',
    showDrafts: true,
    searchQuery: '',
  });

  // Offline caching on load / changes
  useEffect(() => {
    const cached = loadTimetableFromCache();
    if (cached && !isSupabaseConfigured) {
      // Load cached items if available
      if (cached.sessions?.length) setSessions(cached.sessions);
    }
  }, []);

  // Save to cache whenever published sessions change
  useEffect(() => {
    saveTimetableToCache({ sessions, rooms, faculty, batches, courses });
    setLastSyncTime(new Date().toLocaleTimeString());
  }, [sessions, rooms, faculty, batches, courses]);

  // Supabase Realtime Subscription setup (if configured)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('timetable_live_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_sessions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newSession = payload.new as ClassSession;
            setSessions((prev) => [...prev.filter((s) => s.id !== newSession.id), newSession]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as ClassSession;
            setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setSessions((prev) => prev.filter((s) => s.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, []);

  // Soft Lock helper
  const setSessionLock = useCallback((sessionId: string, isLocked: boolean) => {
    setActiveLocks((prev) => {
      const updated = { ...prev };
      if (isLocked) {
        updated[sessionId] = {
          userId: currentUserName,
          userName: currentUserName,
          sessionId,
          timestamp: Date.now(),
        };
      } else {
        delete updated[sessionId];
      }
      return updated;
    });
  }, [currentUserName]);

  // Validation helper
  const validateSession = useCallback(
    (session: Partial<ClassSession>): ConflictValidationResult => {
      return validateSessionConflicts({
        sessionToValidate: session,
        existingSessions: sessions,
        rooms,
        faculty,
        batches,
        courses,
        calendarEvents,
      });
    },
    [sessions, rooms, faculty, batches, courses, calendarEvents]
  );

  // Add Session
  const addSession = async (
    sessionData: Omit<ClassSession, 'id'>
  ): Promise<{ success: boolean; errors?: string[] }> => {
    const newId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullSession: ClassSession = {
      ...sessionData,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const validation = validateSession(fullSession);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Optimistic state update
    setSessions((prev) => [...prev, fullSession]);

    // Add Audit Log
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      class_session_id: newId,
      changed_by: currentUserName,
      change_type: 'INSERT',
      new_value: fullSession,
      description: `Scheduled ${courses.find((c) => c.id === fullSession.course_id)?.code} for ${batches.find((b) => b.id === fullSession.batch_id)?.name}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    return { success: true };
  };

  // Update Session
  const updateSession = async (
    updatedSession: ClassSession
  ): Promise<{ success: boolean; errors?: string[] }> => {
    const validation = validateSession(updatedSession);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const oldSession = sessions.find((s) => s.id === updatedSession.id);
    setSessions((prev) => prev.map((s) => (s.id === updatedSession.id ? updatedSession : s)));

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      class_session_id: updatedSession.id,
      changed_by: currentUserName,
      change_type: 'UPDATE',
      old_value: oldSession,
      new_value: updatedSession,
      description: `Updated session ${courses.find((c) => c.id === updatedSession.course_id)?.code}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    return { success: true };
  };

  // Delete Session
  const deleteSession = async (sessionId: string): Promise<{ success: boolean }> => {
    const oldSession = sessions.find((s) => s.id === sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));

    if (oldSession) {
      const newLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        class_session_id: sessionId,
        changed_by: currentUserName,
        change_type: 'DELETE',
        old_value: oldSession,
        description: `Cancelled session ${courses.find((c) => c.id === oldSession.course_id)?.code}`,
        timestamp: new Date().toISOString(),
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    }

    return { success: true };
  };

  // Move session (Drag-and-drop handler)
  const moveSession = async (
    sessionId: string,
    targetDay: number,
    targetStartTime: string,
    targetEndTime: string,
    targetRoomId?: string
  ): Promise<{ success: boolean; errors?: string[] }> => {
    const existing = sessions.find((s) => s.id === sessionId);
    if (!existing) return { success: false, errors: ['Session not found'] };

    const proposed: ClassSession = {
      ...existing,
      day_of_week: targetDay,
      start_time: targetStartTime,
      end_time: targetEndTime,
      room_id: targetRoomId || existing.room_id,
      updated_at: new Date().toISOString(),
    };

    const validation = validateSession(proposed);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    setSessions((prev) => prev.map((s) => (s.id === sessionId ? proposed : s)));

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      class_session_id: sessionId,
      changed_by: currentUserName,
      change_type: 'UPDATE',
      old_value: existing,
      new_value: proposed,
      description: `Moved ${courses.find((c) => c.id === existing.course_id)?.code} to Day ${targetDay} (${targetStartTime}-${targetEndTime})`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    return { success: true };
  };

  // Publish Current Draft
  const publishCurrentDraft = async (
    summary: string = 'Published updated semester timetable'
  ): Promise<{ success: boolean; versionNumber: number }> => {
    const nextVer = versions.length + 1;
    const publishedSessions = sessions.map((s) => ({ ...s, status: 'published' as const }));

    const newVersion: TimetableVersion = {
      id: `ver-${nextVer}-${Date.now()}`,
      semester_id: activeSemester?.id || 'sem-fall-2026',
      version_number: nextVer,
      snapshot: publishedSessions,
      changes_summary: summary,
      published_by: currentUserName,
      published_at: new Date().toISOString(),
    };

    setSessions(publishedSessions);
    setVersions((prev) => [newVersion, ...prev]);

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      changed_by: currentUserName,
      change_type: 'PUBLISH',
      description: `Published Timetable Version v${nextVer}: ${summary}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    return { success: true, versionNumber: nextVer };
  };

  // Rollback to specific version snapshot
  const revertToVersion = async (version: TimetableVersion): Promise<{ success: boolean }> => {
    setSessions(version.snapshot);

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      changed_by: currentUserName,
      change_type: 'ROLLOVER',
      description: `Reverted timetable to Snapshot Version v${version.version_number}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    return { success: true };
  };

  // Resolve Advising Queue Item
  const resolveAdvising = (id: string, notes?: string) => {
    setAdvisingSuggestions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'resolved' as const, notes: notes || a.notes } : a))
    );
  };

  // Makeup Class Approval Workflow
  const approveMakeup = async (requestId: string): Promise<{ success: boolean; errors?: string[] }> => {
    const req = makeupRequests.find((r) => r.id === requestId);
    if (!req) return { success: false, errors: ['Makeup request not found'] };

    // Convert date string to day of week
    const reqDate = new Date(req.requested_date);
    const dayOfWeek = reqDate.getDay() === 0 ? 7 : reqDate.getDay(); // 1=Mon, 7=Sun

    const newSession: ClassSession = {
      id: `mup-sess-${Date.now()}`,
      semester_id: req.semester_id,
      course_id: req.course_id,
      faculty_id: req.faculty_id,
      room_id: req.room_id,
      batch_id: req.batch_id,
      day_of_week: dayOfWeek,
      start_time: req.start_time,
      end_time: req.end_time,
      session_type: 'makeup',
      status: 'published',
      specific_date: req.requested_date,
      created_by: currentUserName,
      created_at: new Date().toISOString(),
    };

    const validation = validateSession(newSession);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    setSessions((prev) => [...prev, newSession]);
    setMakeupRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'approved' as const,
              reviewed_by: currentUserName,
              reviewed_at: new Date().toISOString(),
            }
          : r
      )
    );

    return { success: true };
  };

  const rejectMakeup = (requestId: string, reason?: string) => {
    setMakeupRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected' as const,
              reviewed_by: currentUserName,
              reviewed_at: new Date().toISOString(),
              reason: reason ? `${r.reason} (Rejected: ${reason})` : r.reason,
            }
          : r
      )
    );
  };

  // Semester Rollover / Template Cloning
  const cloneSemesterRollover = (targetSemesterName: string, targetAcademicYear: string) => {
    const newSemId = `sem-${Date.now()}`;
    const newSemester: Semester = {
      id: newSemId,
      name: targetSemesterName,
      academic_year: targetAcademicYear,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0],
      is_active: true,
    };

    // Clone all recurring sessions as editable draft
    const clonedDraftSessions: ClassSession[] = sessions
      .filter((s) => s.session_type === 'regular')
      .map((s) => ({
        ...s,
        id: `sess-cloned-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        semester_id: newSemId,
        status: 'draft',
        specific_date: null,
      }));

    setSemesters((prev) => [newSemester, ...prev.map((s) => ({ ...s, is_active: false }))]);
    setActiveSemester(newSemester);
    setSessions(clonedDraftSessions);

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      changed_by: currentUserName,
      change_type: 'ROLLOVER',
      description: `Cloned semester template for "${targetSemesterName}" (${clonedDraftSessions.length} draft sessions created)`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Bulk Import Helper
  const bulkImportEntities = (type: 'rooms' | 'faculty' | 'batches' | 'courses', items: any[]) => {
    if (type === 'rooms') setRooms((prev) => [...prev, ...items]);
    if (type === 'faculty') setFaculty((prev) => [...prev, ...items]);
    if (type === 'batches') setBatches((prev) => [...prev, ...items]);
    if (type === 'courses') setCourses((prev) => [...prev, ...items]);
  };

  return (
    <TimetableContext.Provider
      value={{
        semesters,
        activeSemester,
        calendarEvents,
        rooms,
        faculty,
        batches,
        mergeGroups,
        courses,
        students,
        completedCourses,
        sessions,
        advisingSuggestions,
        auditLogs,
        versions,
        makeupRequests,
        currentRole,
        setCurrentRole,
        currentUserName,
        setCurrentUserName,
        filterState,
        setFilterState,
        isOnline,
        lastSyncTime,
        activeLocks,
        setSessionLock,
        validateSession,
        addSession,
        updateSession,
        deleteSession,
        moveSession,
        publishCurrentDraft,
        revertToVersion,
        resolveAdvising,
        approveMakeup,
        rejectMakeup,
        cloneSemesterRollover,
        bulkImportEntities,
      }}
    >
      {children}
    </TimetableContext.Provider>
  );
}

export function useTimetable() {
  const context = useContext(TimetableContext);
  if (!context) {
    throw new Error('useTimetable must be used within a TimetableProvider');
  }
  return context;
}
