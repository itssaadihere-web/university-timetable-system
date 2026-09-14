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
  INITIAL_AUDIT_LOG,
  INITIAL_MAKEUP_REQUESTS,
} from '@/lib/mock-data';
import { validateSessionConflicts } from '@/lib/conflict-engine';
import { saveTimetableToCache, loadTimetableFromCache, clearAllTimetableCache } from '@/lib/offline-cache';
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
  mergeSessionBatches: (
    session1Id: string,
    session2Id: string,
    customGroupName?: string
  ) => Promise<{ success: boolean; mergeGroupId?: string; errors?: string[] }>;
  publishCurrentDraft: (summary?: string) => Promise<{ success: boolean; versionNumber: number }>;
  revertToVersion: (version: TimetableVersion) => Promise<{ success: boolean }>;
  approveMakeup: (requestId: string) => Promise<{ success: boolean; errors?: string[] }>;
  rejectMakeup: (requestId: string, reason?: string) => void;
  cloneSemesterRollover: (targetSemesterName: string, targetAcademicYear: string) => void;
  bulkImportEntities: (type: 'rooms' | 'faculty' | 'batches' | 'courses' | 'sessions', items: any[]) => Promise<{ success: boolean; count: number; error?: string }>;
  updateFaculty: (updated: Faculty) => Promise<{ success: boolean; errors?: string[] }>;
  updateRoom: (updated: Room) => Promise<{ success: boolean; errors?: string[] }>;
  syncAllToSupabase: () => Promise<{ success: boolean; message: string }>;
  dispatchScheduleEmailAlert: (payload: {
    eventType: 'RESCHEDULE_CLASS' | 'ROOM_ASSIGNMENT' | 'MAKEUP_CLASS' | 'SESSION_CANCELLED';
    previousSession?: Partial<ClassSession> | null;
    updatedSession: ClassSession;
    sendEmailNotification: boolean;
    reason?: string;
  }) => Promise<{ success: boolean; message?: string }>;
}

const TimetableContext = createContext<TimetableContextType | null>(null);

const sortBatchesAlphabetically = (list: Batch[]) => {
  return [...list].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );
};

const sanitizeRooms = (roomList: Room[]): Room[] => {
  return roomList.filter(
    (r) =>
      r.id !== 'a0000000-0000-0000-0000-000000000000' &&
      r.id !== 'room-unassigned' &&
      !r.name.toLowerCase().includes('room not assigned') &&
      !r.name.toLowerCase().includes('flexible') &&
      !r.name.toLowerCase().includes('hall 101') &&
      r.building !== 'TBD'
  );
};

const sanitizeSessions = (sessionList: ClassSession[]): ClassSession[] => {
  return sessionList.map((s) => {
    if (
      s.room_id === 'a0000000-0000-0000-0000-000000000000' ||
      s.room_id === 'room-unassigned' ||
      !s.room_id ||
      s.room_id === ''
    ) {
      return { ...s, room_id: null };
    }
    return s;
  });
};

export function TimetableProvider({ children }: { children: React.ReactNode }) {
  // State
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<SemesterCalendarEvent[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [mergeGroups, setMergeGroups] = useState<BatchMergeGroup[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [completedCourses, setCompletedCourses] = useState<StudentCourseCompleted[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [versions, setVersions] = useState<TimetableVersion[]>([]);
  const [makeupRequests, setMakeupRequests] = useState<MakeupRequest[]>([]);

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
    selectedBatchId: undefined,
    selectedFacultyId: undefined,
    selectedRoomId: undefined,
    selectedRoomTypes: [],
    departmentFilter: 'ALL',
    showDrafts: true,
    searchQuery: '',
  });

  // Fetch Live Data from Supabase if configured
  useEffect(() => {
    async function loadLiveSupabaseData() {
      if (!isSupabaseConfigured || !supabase) {
        const cached = loadTimetableFromCache();
        if (cached?.sessions?.length) setSessions(sanitizeSessions(cached.sessions));
        if (cached?.rooms?.length) setRooms(sanitizeRooms(cached.rooms));
        return;
      }

      try {
        const [
          { data: semData },
          { data: roomData },
          { data: facData },
          { data: batchData },
          { data: grpData },
          { data: crsData },
          { data: stdData },
          { data: sessData },
          { data: mupData }
        ] = await Promise.all([
          supabase.from('semesters').select('*'),
          supabase.from('rooms').select('*'),
          supabase.from('faculty').select('*'),
          supabase.from('batches').select('*'),
          supabase.from('batch_merge_groups').select('*'),
          supabase.from('courses').select('*'),
          supabase.from('students').select('*'),
          supabase.from('class_sessions').select('*'),
          supabase.from('makeup_requests').select('*'),
        ]);

        if (semData) {
          setSemesters(semData as Semester[]);
          const active = semData.find((s) => s.is_active) || semData[0] || null;
          setActiveSemester(active as Semester);
        }

        if (roomData) {
          setRooms(sanitizeRooms(roomData as Room[]));
        }

        if (facData) {
          const cleanFaculty = (facData as Faculty[]).filter(
            (f) => !f.name.toLowerCase().includes('turing') && !f.name.toLowerCase().includes('hopper')
          );
          setFaculty(cleanFaculty);
        }

        if (batchData) {
          setBatches(sortBatchesAlphabetically(batchData as Batch[]));
        }

        if (grpData) {
          setMergeGroups(grpData as BatchMergeGroup[]);
        }

        if (crsData) {
          const cleanCourses = (crsData as Course[]).filter(
            (c) => !c.code.toLowerCase().includes('cs-301') && !c.name.toLowerCase().includes('compiler')
          );
          setCourses(cleanCourses);
        }

        if (stdData) {
          setStudents(stdData as Student[]);
        }

        if (sessData) setSessions(sanitizeSessions(sessData as ClassSession[]));
        if (mupData) setMakeupRequests(mupData as MakeupRequest[]);

        // If the database has 0 sessions and 0 rooms (i.e. DB cleared), also clear local cache
        if (sessData && sessData.length === 0 && roomData && roomData.length === 0) {
          clearAllTimetableCache();
        }
      } catch (err) {
        console.warn('Supabase fetch notice (using cached/fallback state):', err);
      }
    }

    loadLiveSupabaseData();
  }, []);

  // Save to cache whenever published sessions change
  useEffect(() => {
    if (sessions.length > 0 || rooms.length > 0) {
      saveTimetableToCache({ sessions, rooms, faculty, batches, courses });
    } else {
      clearAllTimetableCache();
    }
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
            const rawSession = payload.new as ClassSession;
            const newSession = sanitizeSessions([rawSession])[0];
            setSessions((prev) => [...prev.filter((s) => s.id !== newSession.id), newSession]);
          } else if (payload.eventType === 'UPDATE') {
            const rawUpdated = payload.new as ClassSession;
            const updated = sanitizeSessions([rawUpdated])[0];
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
    // Generate valid UUID for Postgres
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sess-${Date.now()}`;
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

    // Persist to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('class_sessions').insert([fullSession]);
      if (error) {
        console.warn('Supabase DB Insert notice:', error.message);
      }
    }

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

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('class_sessions')
        .update(updatedSession)
        .eq('id', updatedSession.id);
      if (error) {
        console.warn('Supabase DB Update notice:', error.message);
      }
    }

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

    if (isSupabaseConfigured && supabase) {
      await supabase.from('class_sessions').delete().eq('id', sessionId);
    }

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

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('class_sessions')
        .update({
          day_of_week: targetDay,
          start_time: targetStartTime,
          end_time: targetEndTime,
          room_id: proposed.room_id,
          updated_at: proposed.updated_at,
        })
        .eq('id', sessionId);
    }

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

  // Merge Sessions for Joint Batches
  const mergeSessionBatches = async (
    session1Id: string,
    session2Id: string,
    customGroupName?: string
  ): Promise<{ success: boolean; mergeGroupId?: string; errors?: string[] }> => {
    const s1 = sessions.find((s) => s.id === session1Id);
    const s2 = sessions.find((s) => s.id === session2Id);
    if (!s1 || !s2) {
      return { success: false, errors: ['Could not find both sessions to merge.'] };
    }

    const b1 = batches.find((b) => b.id === s1.batch_id);
    const b2 = batches.find((b) => b.id === s2.batch_id);
    const crs = courses.find((c) => c.id === s1.course_id);
    const fac = faculty.find((f) => f.id === s1.faculty_id);

    // Reuse existing merge_group_id if one already has it, or generate a unique ID
    const groupId =
      s1.batch_group_id ||
      s2.batch_group_id ||
      (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mg-${Date.now()}`);
    const groupName =
      customGroupName ||
      `Joint ${crs?.code || 'Class'} (${b1?.name || 'Batch 1'} & ${b2?.name || 'Batch 2'})`;

    // Ensure group exists in local mergeGroups list
    setMergeGroups((prev) => {
      if (prev.some((g) => g.id === groupId)) return prev;
      return [...prev, { id: groupId, name: groupName }];
    });

    const updatedS1: ClassSession = { ...s1, batch_group_id: groupId, updated_at: new Date().toISOString() };
    const updatedS2: ClassSession = {
      ...s2,
      batch_group_id: groupId,
      room_id: s1.room_id,
      day_of_week: s1.day_of_week,
      start_time: s1.start_time,
      end_time: s1.end_time,
      updated_at: new Date().toISOString(),
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === s1.id ? updatedS1 : s.id === s2.id ? updatedS2 : s))
    );

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('batch_merge_groups').upsert([{ id: groupId, name: groupName }]);
      } catch (e) {
        console.warn('batch_merge_groups upsert notice:', e);
      }
      await supabase.from('class_sessions').update({ batch_group_id: groupId }).eq('id', s1.id);
      await supabase
        .from('class_sessions')
        .update({
          batch_group_id: groupId,
          room_id: s1.room_id,
          day_of_week: s1.day_of_week,
          start_time: s1.start_time,
          end_time: s1.end_time,
        })
        .eq('id', s2.id);
    }

    // Add Audit Log
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      class_session_id: s1.id,
      changed_by: currentUserName,
      change_type: 'UPDATE',
      description: `Merged joint batches ${b1?.name} & ${b2?.name} for ${crs?.code} (${fac?.name})`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    return { success: true, mergeGroupId: groupId };
  };

  // Publish Current Draft
  const publishCurrentDraft = async (
    summary: string = 'Published updated semester timetable'
  ): Promise<{ success: boolean; versionNumber: number }> => {
    const nextVer = versions.length + 1;
    const publishedSessions = sessions.map((s) => ({ ...s, status: 'published' as const }));

    const newVersion: TimetableVersion = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ver-${nextVer}-${Date.now()}`,
      semester_id: activeSemester?.id || '11111111-1111-1111-1111-111111111111',
      version_number: nextVer,
      snapshot: publishedSessions,
      changes_summary: summary,
      published_by: currentUserName,
      published_at: new Date().toISOString(),
    };

    setSessions(publishedSessions);
    setVersions((prev) => [newVersion, ...prev]);

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('class_sessions')
        .update({ status: 'published' })
        .eq('semester_id', activeSemester?.id || '11111111-1111-1111-1111-111111111111');
      await supabase.from('timetable_versions').insert([newVersion]);
    }

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

  // Makeup Class Approval Workflow
  const approveMakeup = async (requestId: string): Promise<{ success: boolean; errors?: string[] }> => {
    const req = makeupRequests.find((r) => r.id === requestId);
    if (!req) return { success: false, errors: ['Makeup request not found'] };

    // Convert date string to day of week
    const reqDate = new Date(req.requested_date);
    const dayOfWeek = reqDate.getDay() === 0 ? 7 : reqDate.getDay(); // 1=Mon, 7=Sun

    const newSession: ClassSession = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mup-sess-${Date.now()}`,
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

    if (isSupabaseConfigured && supabase) {
      await supabase.from('makeup_requests').update({
        status: 'approved',
        reviewed_by: currentUserName,
        reviewed_at: new Date().toISOString(),
      }).eq('id', requestId);
      await supabase.from('class_sessions').upsert([newSession]);
    }

    return { success: true };
  };

  const rejectMakeup = async (requestId: string, reason?: string) => {
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

    if (isSupabaseConfigured && supabase) {
      await supabase.from('makeup_requests').update({
        status: 'rejected',
        reviewed_by: currentUserName,
        reviewed_at: new Date().toISOString(),
      }).eq('id', requestId);
    }
  };

  // Semester Rollover / Template Cloning
  const cloneSemesterRollover = async (targetSemesterName: string, targetAcademicYear: string) => {
    const newSemId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `11111111-1111-1111-1111-${Date.now()}`;
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
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sess-cloned-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        semester_id: newSemId,
        status: 'draft',
        specific_date: null,
      }));

    setSemesters((prev) => [newSemester, ...prev.map((s) => ({ ...s, is_active: false }))]);
    setActiveSemester(newSemester);
    setSessions(clonedDraftSessions);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('semesters').upsert([newSemester]);
        await supabase.from('class_sessions').upsert(clonedDraftSessions);
      } catch (err) {
        console.warn('Supabase rollover error:', err);
      }
    }

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      changed_by: currentUserName,
      change_type: 'ROLLOVER',
      description: `Cloned semester template for "${targetSemesterName}" (${clonedDraftSessions.length} draft sessions created)`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Bulk Import Helper (Rooms, Faculty, Batches, Courses, Sessions)
  const bulkImportEntities = async (
    type: 'rooms' | 'faculty' | 'batches' | 'courses' | 'sessions',
    items: any[]
  ): Promise<{ success: boolean; count: number; error?: string }> => {
    try {
      if (!items || items.length === 0) return { success: true, count: 0 };

      if (type === 'rooms') {
        setRooms((prev) => {
          const incomingIds = new Set(items.map((i) => i.id));
          const merged = [...prev.filter((r) => !incomingIds.has(r.id)), ...items];
          return sanitizeRooms(merged).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
        });
      } else if (type === 'faculty') {
        setFaculty((prev) => {
          const incomingIds = new Set(items.map((i) => i.id));
          return [...prev.filter((f) => !incomingIds.has(f.id)), ...items];
        });
      } else if (type === 'batches') {
        setBatches((prev) => {
          const incomingIds = new Set(items.map((i) => i.id));
          const merged = [...prev.filter((b) => !incomingIds.has(b.id)), ...items];
          return sortBatchesAlphabetically(merged);
        });
      } else if (type === 'courses') {
        setCourses((prev) => {
          const incomingIds = new Set(items.map((i) => i.id));
          return [...prev.filter((c) => !incomingIds.has(c.id)), ...items];
        });
      } else if (type === 'sessions') {
        setSessions((prev) => {
          const incomingIds = new Set(items.map((i) => i.id));
          const merged = [...prev.filter((s) => !incomingIds.has(s.id)), ...items];
          return sanitizeSessions(merged);
        });
      }

      if (isSupabaseConfigured && supabase) {
        const tableName = type === 'sessions' ? 'class_sessions' : type;
        const { error } = await supabase.from(tableName).upsert(items);
        if (error) {
          console.warn(`Supabase upsert error for ${type}:`, error);
          return { success: false, count: items.length, error: error.message };
        }
      }

      const newLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        changed_by: currentUserName,
        change_type: 'INSERT',
        description: `Bulk imported ${items.length} ${type} records via Excel`,
        timestamp: new Date().toISOString(),
      };
      setAuditLogs((prev) => [newLog, ...prev]);

      return { success: true, count: items.length };
    } catch (err: any) {
      console.error(`Bulk import failed for ${type}:`, err);
      return { success: false, count: 0, error: err?.message || 'Import failed' };
    }
  };

  // Push / Seed All Current Local & Institutional Data to Supabase
  const syncAllToSupabase = async (): Promise<{ success: boolean; message: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, message: 'Supabase is not configured in .env.local' };
    }

    try {
      // 1. Semesters
      if (semesters.length > 0) {
        const { error } = await supabase.from('semesters').upsert(semesters);
        if (error) throw new Error(`Semesters sync error: ${error.message}`);
      }

      // 2. Rooms
      if (rooms.length > 0) {
        const { error } = await supabase.from('rooms').upsert(rooms);
        if (error) throw new Error(`Rooms sync error: ${error.message}`);
      }

      // 3. Faculty
      if (faculty.length > 0) {
        const { error } = await supabase.from('faculty').upsert(faculty);
        if (error) throw new Error(`Faculty sync error: ${error.message}`);
      }

      // 4. Batches
      if (batches.length > 0) {
        const { error } = await supabase.from('batches').upsert(batches);
        if (error) throw new Error(`Batches sync error: ${error.message}`);
      }

      // 5. Courses
      if (courses.length > 0) {
        const { error } = await supabase.from('courses').upsert(courses);
        if (error) throw new Error(`Courses sync error: ${error.message}`);
      }

      // 6. Class Sessions
      if (sessions.length > 0) {
        const { error } = await supabase.from('class_sessions').upsert(sessions);
        if (error) throw new Error(`Sessions sync error: ${error.message}`);
      }

      setLastSyncTime(new Date().toLocaleTimeString());
      return { success: true, message: `Successfully synchronized all ${sessions.length} class sessions, ${rooms.length} rooms, ${faculty.length} faculty, ${batches.length} batches, and ${courses.length} courses with Supabase!` };
    } catch (err: any) {
      console.error('Supabase Sync All failed:', err);
      return { success: false, message: err?.message || 'Failed to sync with Supabase' };
    }
  };

  // Update Faculty Load Limit & Department
  const updateFaculty = async (updated: Faculty): Promise<{ success: boolean; errors?: string[] }> => {
    setFaculty((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    if (isSupabaseConfigured && supabase) {
      await supabase.from('faculty').update(updated).eq('id', updated.id);
    }
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      changed_by: currentUserName,
      change_type: 'UPDATE',
      description: `Adjusted faculty load limit for ${updated.name} to Max ${updated.max_load_per_day}h/day`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    return { success: true };
  };

  // Update Room Capacity, Specialty Tags & Details
  const updateRoom = async (updated: Room): Promise<{ success: boolean; errors?: string[] }> => {
    setRooms((prev) =>
      prev
        .map((r) => (r.id === updated.id ? updated : r))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
    );
    if (isSupabaseConfigured && supabase) {
      await supabase.from('rooms').update(updated).eq('id', updated.id);
    }
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      changed_by: currentUserName,
      change_type: 'UPDATE',
      description: `Updated room & capabilities for ${updated.name} (Cap: ${updated.capacity}, Tags: [${updated.room_types.join(', ')}])`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    return { success: true };
  };

  // Dispatch Email Alerts via Email Agent API
  const dispatchScheduleEmailAlert = async (payload: {
    eventType: 'RESCHEDULE_CLASS' | 'ROOM_ASSIGNMENT' | 'MAKEUP_CLASS' | 'SESSION_CANCELLED';
    previousSession?: Partial<ClassSession> | null;
    updatedSession: ClassSession;
    sendEmailNotification: boolean;
    reason?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    try {
      const crs = courses.find((c) => c.id === payload.updatedSession.course_id);
      const fac = faculty.find((f) => f.id === payload.updatedSession.faculty_id);
      const b = batches.find((b) => b.id === payload.updatedSession.batch_id);
      const rm = rooms.find((r) => r.id === payload.updatedSession.room_id);
      const prevRm = payload.previousSession ? rooms.find((r) => r.id === payload.previousSession?.room_id) : undefined;

      const res = await fetch('/api/email/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: payload.eventType,
          previousSession: payload.previousSession,
          updatedSession: payload.updatedSession,
          coordinatorName: currentUserName,
          coordinatorEmail: 'coordinator@shu.edu.pk',
          sendEmailNotification: payload.sendEmailNotification,
          reason: payload.reason,
          metadata: {
            course: crs,
            faculty: fac,
            batch: b,
            room: rm,
            previousRoom: prevRm,
          },
        }),
      });

      const data = await res.json();
      return { success: data.success, message: data.message };
    } catch (e: any) {
      console.warn('Email dispatch failed:', e);
      return { success: false, message: e?.message };
    }
  };

  const sortedRooms = [...rooms].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );

  return (
    <TimetableContext.Provider
      value={{
        semesters,
        activeSemester,
        calendarEvents,
        rooms: sortedRooms,
        faculty,
        batches,
        mergeGroups,
        courses,
        students,
        completedCourses,
        sessions,
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
        mergeSessionBatches,
        publishCurrentDraft,
        revertToVersion,
        approveMakeup,
        rejectMakeup,
        cloneSemesterRollover,
        bulkImportEntities,
        updateFaculty,
        updateRoom,
        syncAllToSupabase,
        dispatchScheduleEmailAlert,
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
