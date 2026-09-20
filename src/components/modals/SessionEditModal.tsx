'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTimetable } from '@/context/TimetableContext';
import { ClassSession, SessionType, SessionStatus } from '@/types';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Layers, 
  Sparkles, 
  Clock, 
  MapPin, 
  User, 
  BookOpen, 
  Users 
} from 'lucide-react';
import { TIMETABLE_DAYS, formatTo12Hour, findBatchMergeCandidate, BatchMergeCandidate } from '@/lib/conflict-engine';
import { BatchMergeModal } from '@/components/modals/BatchMergeModal';
import { SearchableSelect } from '@/components/timetable/SearchableSelect';
import { createBatchSearchableOption } from '@/lib/batch-utils';

interface SessionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionToEdit?: ClassSession | null;
  presetData?: { dayOfWeek: number; startTime: string; endTime: string } | null;
}

const DAYS = TIMETABLE_DAYS.map((d) => ({
  id: d.id,
  name: d.isWeekend ? `${d.name} (Exception)` : d.name,
}));

export const SessionEditModal: React.FC<SessionEditModalProps> = ({
  isOpen,
  onClose,
  sessionToEdit,
  presetData,
}) => {
  const {
    courses,
    faculty,
    rooms,
    batches,
    mergeGroups,
    sessions,
    activeSemester,
    validateSession,
    addSession,
    updateSession,
    mergeSessionBatches,
    addCourse,
    updateCourse,
    addFaculty,
    addBatch,
    addRoom,
  } = useTimetable();

  // Helper to add hours to 24h time string (defaults to 3 hours)
  const addHoursToTime = (timeStr: string, hours: number = 3): string => {
    if (!timeStr || !timeStr.includes(':')) return '11:30';
    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10) || 0;
    let newH = h + hours;
    if (newH >= 24) newH = newH % 24;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(newH)}:${pad(m)}`;
  };

  // Form State
  const [courseId, setCourseId] = useState<string>('');
  const [facultyId, setFacultyId] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [batchId, setBatchId] = useState<string>('');
  const [batchGroupId, setBatchGroupId] = useState<string>('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>('08:30');
  const [endTime, setEndTime] = useState<string>('11:30');
  const [sessionType, setSessionType] = useState<SessionType>('regular');
  const [status, setStatus] = useState<SessionStatus>('draft');
  const [specificDate, setSpecificDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState<boolean>(false);

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    if (newStart) {
      setEndTime(addHoursToTime(newStart, 3));
    }
  };

  const handleEndTimeChange = (newEnd: string) => {
    setEndTime(newEnd);
  };

  // Initialize or reset form values
  useEffect(() => {
    if (sessionToEdit) {
      setCourseId(sessionToEdit.course_id);
      setFacultyId(sessionToEdit.faculty_id);
      setRoomId(sessionToEdit.room_id || '');
      setBatchId(sessionToEdit.batch_id);
      setBatchGroupId(sessionToEdit.batch_group_id || '');
      setDayOfWeek(sessionToEdit.day_of_week);
      setStartTime(sessionToEdit.start_time);
      setEndTime(sessionToEdit.end_time);
      setSessionType(sessionToEdit.session_type);
      setStatus(sessionToEdit.status);
      setSpecificDate(sessionToEdit.specific_date || '');
    } else {
      setCourseId(courses[0]?.id || '');
      setFacultyId(faculty[0]?.id || '');
      setRoomId(rooms[0]?.id || '');
      setBatchId(batches[0]?.id || '');
      setBatchGroupId('');
      setDayOfWeek(presetData?.dayOfWeek || 1);
      const initStart = presetData?.startTime || '08:30';
      const initEnd = presetData?.endTime && presetData.endTime !== '10:00'
        ? presetData.endTime
        : addHoursToTime(initStart, 3);
      setStartTime(initStart);
      setEndTime(initEnd);
      setSessionType('regular');
      setStatus('draft');
      setSpecificDate('');
    }
    setSubmitError(null);
  }, [sessionToEdit, presetData, isOpen, courses, faculty, rooms, batches]);

  // Real-time Conflict Engine Evaluation
  const proposedPayload: Partial<ClassSession> = {
    id: sessionToEdit?.id,
    semester_id: activeSemester?.id || '11111111-1111-1111-1111-111111111111',
    course_id: courseId,
    faculty_id: facultyId,
    room_id: roomId || null,
    batch_id: batchId,
    batch_group_id: batchGroupId || null,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
    session_type: sessionType,
    status: status,
    specific_date: sessionType === 'makeup' ? specificDate : null,
  };

  const validationResult = validateSession(proposedPayload);

  // Detect potential joint batch merge opportunity
  const mergeCandidate = useMemo(() => {
    return findBatchMergeCandidate({
      sessionToValidate: proposedPayload,
      existingSessions: sessions,
      batches,
      courses,
      faculty,
      rooms,
    });
  }, [proposedPayload, sessions, batches, courses, faculty, rooms]);

  const selectedCourse = courses.find((c) => c.id === courseId);
  const selectedRoom = rooms.find((r) => r.id === roomId);

  const handleConfirmMergeModal = async (candidate: BatchMergeCandidate) => {
    const groupId =
      candidate.existingSession.batch_group_id ||
      (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mg-${Date.now()}`);

    // Set batchGroupId locally for current session
    setBatchGroupId(groupId);

    // If editing existing session, merge both
    if (sessionToEdit) {
      await mergeSessionBatches(candidate.existingSession.id, sessionToEdit.id);
      onClose();
    } else {
      // For a new session, update existing session to have the group ID, and create the new session
      const res = await addSession({
        semester_id: activeSemester?.id || '11111111-1111-1111-1111-111111111111',
        course_id: courseId,
        faculty_id: facultyId,
        room_id: roomId || null,
        batch_id: batchId,
        batch_group_id: groupId,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        session_type: sessionType,
        status: status,
        specific_date: sessionType === 'makeup' ? specificDate : null,
      });

      if (res.success) {
        // Also ensure existing session has the group ID
        await updateSession({
          ...candidate.existingSession,
          batch_group_id: groupId,
        });
        onClose();
      } else if (res.errors) {
        setSubmitError(res.errors.join(' | '));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validationResult.valid) {
      // If there's an eligible batch merge opportunity, prompt the user with the Merge Modal!
      if (mergeCandidate) {
        setIsMergeModalOpen(true);
        return;
      }
      setSubmitError('Please resolve all scheduling conflicts before saving.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (sessionToEdit) {
        const res = await updateSession({
          ...sessionToEdit,
          course_id: courseId,
          faculty_id: facultyId,
          room_id: roomId || null,
          batch_id: batchId,
          batch_group_id: batchGroupId || null,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          session_type: sessionType,
          status: status,
          specific_date: sessionType === 'makeup' ? specificDate : null,
        });
        if (!res.success && res.errors) {
          setSubmitError(res.errors.join(' | '));
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await addSession({
          semester_id: activeSemester?.id || '11111111-1111-1111-1111-111111111111',
          course_id: courseId,
          faculty_id: facultyId,
          room_id: roomId || null,
          batch_id: batchId,
          batch_group_id: batchGroupId || null,
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          session_type: sessionType,
          status: status,
          specific_date: sessionType === 'makeup' ? specificDate : null,
        });
        if (!res.success && res.errors) {
          setSubmitError(res.errors.join(' | '));
          setIsSubmitting(false);
          return;
        }
      }

      onClose();
    } catch (err: any) {
      setSubmitError(err?.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {sessionToEdit ? 'Edit Class Session' : 'Schedule New Class Session'}
            </h3>
            <p className="text-xs text-slate-500">
              Centralized Postgres Conflict Engine with Real-Time Validation
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Joint Batch Merge Opportunity Detected Banner */}
          {mergeCandidate && (
            <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-2 border-purple-300 rounded-2xl p-4 text-purple-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-600 text-white shrink-0 mt-0.5 shadow-xs">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </div>
                <div className="text-xs space-y-0.5">
                  <p className="font-extrabold text-purple-950 text-xs sm:text-sm flex items-center gap-1.5">
                    <span>Joint Class Batch Merge Available</span>
                    <span className="px-2 py-0.2 bg-purple-200 text-purple-900 text-[10px] rounded-full font-black uppercase">
                      Merge Eligible
                    </span>
                  </p>
                  <p className="text-purple-800 text-[11px] leading-relaxed">
                    Instructor <strong>{mergeCandidate.faculty.name}</strong> is teaching <strong>{mergeCandidate.course.code}</strong> at this exact time in <strong>{mergeCandidate.room?.name || 'this room'}</strong> for <strong>{mergeCandidate.existingBatch.name}</strong>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMergeModalOpen(true)}
                className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Merge Batches</span>
              </button>
            </div>
          )}

          {/* Conflict Engine Feedback Alert */}
          {validationResult.errors.length > 0 && !mergeCandidate && (
            <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center gap-2 text-rose-900 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Scheduling Conflict Detected</span>
              </div>
              <ul className="list-disc list-inside text-rose-800 text-xs space-y-1 font-medium pl-1">
                {validationResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResult.valid && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Conflict-Free: Slot, room capability, teacher load, and 15-min buffer verified.</span>
            </div>
          )}

          {/* Row 1: Course & Faculty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Course</span>
              </label>
              <SearchableSelect
                tabIndex={1}
                options={courses.map((c) => ({
                  id: c.id,
                  title: `${c.code} - ${c.name}`,
                  subtitle: `${c.department} • ${c.credit_hours} Cr`,
                  badge: c.required_room_types?.length ? c.required_room_types.join(', ') : undefined,
                  badgeColor: 'indigo',
                  searchTerms: `${c.code} ${c.name} ${c.department}`,
                }))}
                value={courseId}
                onChange={(val) => setCourseId(val)}
                placeholder="Search or select course..."
                icon={<BookOpen className="w-4 h-4 text-indigo-600" />}
                autoSortAlphabetical={true}
                allowCreate={true}
                createLabel="Course"
                onCreateOption={async (query) => {
                  const newCourse = await addCourse(query);
                  return newCourse.id;
                }}
              />
              {selectedCourse && (
                <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">Course Code & Name</span>
                    <span className="text-[10px] text-indigo-700 font-medium bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">Customizable</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Course Code</label>
                      <input
                        tabIndex={13}
                        type="text"
                        value={selectedCourse.code}
                        onChange={(e) => {
                          const newCode = e.target.value.toUpperCase();
                          updateCourse({ ...selectedCourse, code: newCode });
                        }}
                        placeholder="e.g. ACC-101"
                        className="w-full px-2 py-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Course Name</label>
                      <input
                        tabIndex={14}
                        type="text"
                        value={selectedCourse.name}
                        onChange={(e) => {
                          const newName = e.target.value;
                          updateCourse({ ...selectedCourse, name: newName });
                        }}
                        placeholder="e.g. Introduction to Accounting"
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
              {selectedCourse?.required_room_types?.length ? (
                <span className="block mt-1 text-[11px] text-amber-700 font-medium">
                  Requires: {selectedCourse.required_room_types.join(', ')}
                </span>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Faculty / Instructor</span>
              </label>
              <SearchableSelect
                tabIndex={2}
                options={faculty.map((f) => ({
                  id: f.id,
                  title: f.name,
                  subtitle: `${f.department} • Max ${f.max_load_per_day}h/day`,
                  searchTerms: `${f.name} ${f.department} ${f.email}`,
                }))}
                value={facultyId}
                onChange={(val) => setFacultyId(val)}
                placeholder="Search or select faculty..."
                icon={<User className="w-4 h-4 text-indigo-600" />}
                autoSortAlphabetical={true}
                allowCreate={true}
                createLabel="Faculty Member"
                onCreateOption={async (query) => {
                  const newFaculty = await addFaculty(query);
                  return newFaculty.id;
                }}
              />
            </div>
          </div>

          {/* Row 2: Room & Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>Room / Venue</span>
              </label>
              <SearchableSelect
                tabIndex={3}
                options={rooms.map((r) => ({
                  id: r.id,
                  title: r.name,
                  subtitle: `${r.building} • Cap: ${r.capacity}`,
                  badge: r.room_types.join(', '),
                  badgeColor: 'primary',
                  searchTerms: `${r.name} ${r.building} ${r.room_types.join(' ')}`,
                }))}
                value={roomId || ''}
                onChange={(val) => setRoomId(val)}
                allOptionLabel="-- No Room Assigned (Pending) --"
                placeholder="Search or select room..."
                icon={<MapPin className="w-4 h-4 text-indigo-600" />}
                autoSortAlphabetical={true}
                allowCreate={true}
                createLabel="Room / Venue"
                onCreateOption={async (query) => {
                  const newRoom = await addRoom(query);
                  return newRoom.id;
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Student Batch</span>
              </label>
              <SearchableSelect
                tabIndex={4}
                options={batches.map((b) => createBatchSearchableOption(b))}
                value={batchId}
                onChange={(val) => setBatchId(val)}
                placeholder="Search or select batch..."
                icon={<Users className="w-4 h-4 text-indigo-600" />}
                autoSortAlphabetical={true}
                allowCreate={true}
                createLabel="Batch"
                onCreateOption={async (query) => {
                  const newBatch = await addBatch(query);
                  return newBatch.id;
                }}
              />
            </div>
          </div>

          {/* Row 3: Merged Batch Group (Optional) */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Joint Batch Merging (Optional)</span>
              </label>
              <span className="text-[11px] text-slate-500">Share class with another batch</span>
            </div>
            <SearchableSelect
              tabIndex={5}
              options={mergeGroups.map((mg) => ({
                id: mg.id,
                title: mg.name,
                searchTerms: mg.name,
              }))}
              value={batchGroupId || ''}
              onChange={(val) => setBatchGroupId(val)}
              allOptionLabel="-- No Batch Merging (Single Batch Only) --"
              placeholder="Search or select merged group..."
              icon={<Sparkles className="w-4 h-4 text-purple-600" />}
              autoSortAlphabetical={true}
            />
          </div>

          {/* Row 4: Day & Time Range */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Day of Week</label>
              <select
                tabIndex={6}
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {DAYS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Start Time</span>
                <span className="text-[11px] font-mono font-bold text-shu-700 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">{formatTo12Hour(startTime)}</span>
              </label>
              <input
                tabIndex={7}
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>End Time</span>
                <span className="text-[11px] font-mono font-bold text-shu-700 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">{formatTo12Hour(endTime)}</span>
              </label>
              <input
                tabIndex={8}
                type="time"
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 5: Session Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Session Type</label>
              <div className="flex items-center gap-3 mt-1">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    tabIndex={9}
                    type="radio"
                    name="session_type"
                    value="regular"
                    checked={sessionType === 'regular'}
                    onChange={() => setSessionType('regular')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Regular Recurring</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    tabIndex={9}
                    type="radio"
                    name="session_type"
                    value="makeup"
                    checked={sessionType === 'makeup'}
                    onChange={() => setSessionType('makeup')}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  <span>Floating Makeup</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Workflow Status</label>
              <div className="flex items-center gap-3 mt-1">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    tabIndex={10}
                    type="radio"
                    name="status"
                    value="draft"
                    checked={status === 'draft'}
                    onChange={() => setStatus('draft')}
                    className="text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-amber-700 font-semibold">Draft (Editable)</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    tabIndex={10}
                    type="radio"
                    name="status"
                    value="published"
                    checked={status === 'published'}
                    onChange={() => setStatus('published')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-800 font-semibold">Published Live</span>
                </label>
              </div>
            </div>
          </div>

          {/* Makeup Specific Date Picker */}
          {sessionType === 'makeup' && (
            <div className="bg-teal-50 p-3 rounded-xl border border-teal-200">
              <label className="block text-xs font-bold text-teal-900 mb-1">
                Specific Makeup Date
              </label>
              <input
                tabIndex={10}
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                required={sessionType === 'makeup'}
                className="w-full px-3 py-2 text-xs bg-white border border-teal-300 rounded-lg text-teal-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          )}

          {submitError && (
            <p className="text-xs text-rose-600 font-semibold">{submitError}</p>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              tabIndex={11}
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              tabIndex={12}
              type="submit"
              disabled={isSubmitting || !validationResult.valid}
              className={`px-5 py-2 text-xs font-bold text-white rounded-lg shadow-sm transition-all ${
                validationResult.valid
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Validating...' : sessionToEdit ? 'Save Changes' : 'Schedule Class'}
            </button>
          </div>
        </form>
      </div>

      {/* Batch Merge Opportunity Modal */}
      <BatchMergeModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        candidate={mergeCandidate}
        onConfirmMerge={handleConfirmMergeModal}
        onRejectMerge={() => {
          setIsMergeModalOpen(false);
          setSubmitError('Batches not merged. Cannot schedule conflicting class at the same time and venue.');
        }}
      />
    </div>
  );
};
