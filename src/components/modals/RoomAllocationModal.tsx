'use client';

import React, { useState, useMemo } from 'react';
import { useTimetable } from '@/context/TimetableContext';
import { ClassSession, Room } from '@/types';
import { 
  X, 
  DoorOpen, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  BookOpen, 
  Users, 
  ArrowRight,
  Zap,
  Check,
  AlertTriangle
} from 'lucide-react';
import { 
  TIMETABLE_DAYS, 
  formatTimeRange, 
  timeToMinutes 
} from '@/lib/conflict-engine';

interface RoomAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEditSession?: (session: ClassSession) => void;
}

export const RoomAllocationModal: React.FC<RoomAllocationModalProps> = ({
  isOpen,
  onClose,
  onOpenEditSession,
}) => {
  const {
    sessions,
    rooms,
    courses,
    faculty,
    batches,
    updateSession,
  } = useTimetable();

  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('ALL');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pendingSelections, setPendingSelections] = useState<Record<string, string>>({});
  const [savingSessionId, setSavingSessionId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // All unassigned sessions (no room_id or room_id doesn't exist in rooms)
  const unassignedSessions = useMemo(() => {
    return sessions.filter((s) => !s.room_id || !rooms.some((r) => r.id === s.room_id));
  }, [sessions, rooms]);

  // Filtered list
  const filteredSessions = useMemo(() => {
    return unassignedSessions.filter((s) => {
      if (selectedBatchFilter !== 'ALL' && s.batch_id !== selectedBatchFilter) {
        return false;
      }
      if (selectedDayFilter !== 'ALL' && s.day_of_week.toString() !== selectedDayFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const crs = courses.find((c) => c.id === s.course_id);
        const fac = faculty.find((f) => f.id === s.faculty_id);
        const b = batches.find((b) => b.id === s.batch_id);

        const matchCourse = crs && (crs.name.toLowerCase().includes(q) || crs.code.toLowerCase().includes(q));
        const matchFaculty = fac && fac.name.toLowerCase().includes(q);
        const matchBatch = b && (b.name.toLowerCase().includes(q) || b.program.toLowerCase().includes(q));

        if (!matchCourse && !matchFaculty && !matchBatch) return false;
      }
      return true;
    });
  }, [unassignedSessions, selectedBatchFilter, selectedDayFilter, searchQuery, courses, faculty, batches]);

  // Helper to check room conflicts at a specific day/time slot
  const getRoomAvailability = (roomId: string, targetSession: ClassSession) => {
    const sStart = timeToMinutes(targetSession.start_time);
    const sEnd = timeToMinutes(targetSession.end_time);

    const clashingSession = sessions.find((other) => {
      if (other.id === targetSession.id) return false;
      if (other.room_id !== roomId) return false;
      if (other.day_of_week !== targetSession.day_of_week) return false;

      const oStart = timeToMinutes(other.start_time);
      const oEnd = timeToMinutes(other.end_time);

      return Math.max(sStart, oStart) < Math.min(sEnd, oEnd);
    });

    return {
      isAvailable: !clashingSession,
      clashingSession,
    };
  };

  const handleSelectRoom = (sessionId: string, roomId: string) => {
    setPendingSelections((prev) => ({
      ...prev,
      [sessionId]: roomId,
    }));
  };

  const handleAssignSingle = async (session: ClassSession) => {
    const chosenRoomId = pendingSelections[session.id];
    if (!chosenRoomId) {
      setFeedbackMsg({ type: 'error', text: 'Please select a classroom first.' });
      return;
    }

    setSavingSessionId(session.id);
    setFeedbackMsg(null);

    const updated: ClassSession = {
      ...session,
      room_id: chosenRoomId,
    };

    const res = await updateSession(updated);
    setSavingSessionId(null);

    if (res.success) {
      const roomObj = rooms.find((r) => r.id === chosenRoomId);
      const crsObj = courses.find((c) => c.id === session.course_id);
      setFeedbackMsg({
        type: 'success',
        text: `Assigned ${roomObj?.name || 'room'} to ${crsObj?.code || 'class'} successfully!`,
      });
      // Clear pending
      setPendingSelections((prev) => {
        const next = { ...prev };
        delete next[session.id];
        return next;
      });
    } else {
      setFeedbackMsg({
        type: 'error',
        text: res.errors?.join(', ') || 'Failed to assign room due to conflict.',
      });
    }
  };

  // Auto assign best non-conflicting rooms
  const handleAutoAssignAll = async () => {
    setFeedbackMsg(null);
    let assignedCount = 0;
    const errors: string[] = [];

    for (const session of filteredSessions) {
      const crs = courses.find((c) => c.id === session.course_id);
      const b = batches.find((b) => b.id === session.batch_id);
      const requiredTypes = crs?.required_room_types || ['standard'];
      const requiredCap = b?.student_count || 30;

      // Find first available room matching criteria
      const candidateRoom = rooms.find((room) => {
        // Room must have sufficient capacity
        if (room.capacity < requiredCap) return false;

        // Room must match required room type if specific (e.g. computer lab)
        if (requiredTypes.includes('computer_lab') && !room.room_types.includes('computer_lab')) {
          return false;
        }

        // Must be available
        const avail = getRoomAvailability(room.id, session);
        return avail.isAvailable;
      });

      if (candidateRoom) {
        const updated: ClassSession = {
          ...session,
          room_id: candidateRoom.id,
        };
        const res = await updateSession(updated);
        if (res.success) {
          assignedCount++;
        } else {
          errors.push(`${crs?.code || 'Course'}: ${res.errors?.join(', ')}`);
        }
      }
    }

    if (assignedCount > 0) {
      setFeedbackMsg({
        type: 'success',
        text: `Successfully allocated classrooms for ${assignedCount} class session(s)!`,
      });
    } else {
      setFeedbackMsg({
        type: 'error',
        text: errors.length > 0 ? errors.slice(0, 2).join(' | ') : 'No non-conflicting rooms were found for automatic allocation.',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-2xs">
              <DoorOpen className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Classroom & Venue Allocator
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
                  {unassignedSessions.length} Pending
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign available lecture halls and computer labs to scheduled class sessions without clashes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {filteredSessions.length > 0 && (
              <button
                onClick={handleAutoAssignAll}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-shu-700 hover:bg-shu-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                title="Automatically match and assign available rooms with matching capacity"
              >
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                <span>Auto-Assign Best Fit</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-12 gap-3 shrink-0">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by course code, faculty, or section..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-shu-700"
            />
          </div>

          {/* Batch Selector */}
          <div className="sm:col-span-4">
            <select
              value={selectedBatchFilter}
              onChange={(e) => setSelectedBatchFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-shu-700"
            >
              <option value="ALL">All Batches / Sections ({unassignedSessions.length})</option>
              {batches.map((b) => {
                const count = unassignedSessions.filter((s) => s.batch_id === b.id).length;
                return (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.program}) — {count} pending
                  </option>
                );
              })}
            </select>
          </div>

          {/* Day Selector */}
          <div className="sm:col-span-3">
            <select
              value={selectedDayFilter}
              onChange={(e) => setSelectedDayFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-shu-700"
            >
              <option value="ALL">All Days</option>
              {TIMETABLE_DAYS.map((d) => (
                <option key={d.id} value={d.id.toString()}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status / Feedback Banner */}
        {feedbackMsg && (
          <div
            className={`px-4 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-slate-50/50">
          {filteredSessions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-800">
                {unassignedSessions.length === 0
                  ? 'All Class Sessions Have Assigned Classrooms!'
                  : 'No Pending Sessions Match Your Filter'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                {unassignedSessions.length === 0
                  ? 'Every scheduled class in the active academic semester has a designated lecture hall or lab venue.'
                  : 'Try changing your search query, batch filter, or day selection above.'}
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const crs = courses.find((c) => c.id === session.course_id);
              const fac = faculty.find((f) => f.id === session.faculty_id);
              const b = batches.find((b) => b.id === session.batch_id);
              const dayName = TIMETABLE_DAYS.find((d) => d.id === session.day_of_week)?.name || `Day ${session.day_of_week}`;
              const timeDisplay = formatTimeRange(session.start_time, session.end_time);
              const isSaving = savingSessionId === session.id;
              const selectedRoomId = pendingSelections[session.id] || '';

              // Check availability of chosen room
              const chosenAvail = selectedRoomId ? getRoomAvailability(selectedRoomId, session) : null;

              return (
                <div
                  key={session.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all grid grid-cols-1 lg:grid-cols-12 gap-4 items-center"
                >
                  {/* Left Column: Course & Batch Details */}
                  <div className="lg:col-span-5 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md font-mono text-xs font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                        {crs?.code || 'COURSE'}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {crs?.name || 'Class Session'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{b?.name} ({b?.program})</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{fac?.name || 'Faculty TBA'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Middle Column: Day, Time & Required Type */}
                  <div className="lg:col-span-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-shu-800">
                      <Calendar className="w-3.5 h-3.5 text-shu-700 shrink-0" />
                      <span>{dayName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{timeDisplay}</span>
                    </div>
                    {crs?.required_room_types && crs.required_room_types.length > 0 && (
                      <div className="text-[10px] text-slate-400">
                        Required: <span className="font-semibold text-slate-600">{crs.required_room_types.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Room Dropdown & Assign Button */}
                  <div className="lg:col-span-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1">
                      <select
                        value={selectedRoomId}
                        onChange={(e) => handleSelectRoom(session.id, e.target.value)}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border transition-all focus:outline-none focus:ring-2 ${
                          chosenAvail && !chosenAvail.isAvailable
                            ? 'bg-rose-50 border-rose-300 text-rose-900 focus:ring-rose-500'
                            : selectedRoomId
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 focus:ring-emerald-500'
                            : 'bg-slate-50 border-slate-300 text-slate-800 focus:ring-shu-700'
                        }`}
                      >
                        <option value="">— Select Classroom Venue —</option>
                        {rooms.map((room) => {
                          const avail = getRoomAvailability(room.id, session);
                          const isMatchCap = room.capacity >= (b?.student_count || 30);
                          const isLabMatch = crs?.required_room_types?.includes('computer_lab')
                            ? room.room_types.includes('computer_lab')
                            : true;

                          return (
                            <option
                              key={room.id}
                              value={room.id}
                              disabled={!avail.isAvailable}
                            >
                              {avail.isAvailable ? '✓' : '⚠️ CLASH:'} {room.name} (Cap: {room.capacity}
                              {room.room_types.includes('computer_lab') ? ', Lab' : ''}
                              {avail.isAvailable ? '' : ' - Busy'})
                            </option>
                          );
                        })}
                      </select>

                      {chosenAvail && !chosenAvail.isAvailable && (
                        <p className="text-[10px] text-rose-600 font-semibold mt-1">
                          ⚠️ Room busy at this time slot!
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleAssignSingle(session)}
                      disabled={!selectedRoomId || isSaving || (chosenAvail !== null && !chosenAvail.isAvailable)}
                      className="px-4 py-2 bg-shu-700 hover:bg-shu-800 active:bg-shu-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-2xs cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <span>Saving...</span>
                      ) : (
                        <>
                          <span>Assign</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>

                    {onOpenEditSession && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenEditSession(session);
                        }}
                        className="px-2.5 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-medium transition-all"
                        title="Edit all session parameters in detail"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 text-xs text-slate-500">
          <span>
            Showing <strong>{filteredSessions.length}</strong> of <strong>{unassignedSessions.length}</strong> unassigned sessions
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
