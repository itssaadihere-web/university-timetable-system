'use client';

import React, { useState, useEffect } from 'react';
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
import { TIMETABLE_DAYS } from '@/lib/conflict-engine';

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
    activeSemester,
    validateSession,
    addSession,
    updateSession,
  } = useTimetable();

  // Form State
  const [courseId, setCourseId] = useState<string>('');
  const [facultyId, setFacultyId] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [batchId, setBatchId] = useState<string>('');
  const [batchGroupId, setBatchGroupId] = useState<string>('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>('08:30');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [sessionType, setSessionType] = useState<SessionType>('regular');
  const [status, setStatus] = useState<SessionStatus>('draft');
  const [specificDate, setSpecificDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
      setStartTime(presetData?.startTime || '08:30');
      setEndTime(presetData?.endTime || '10:00');
      setSessionType('regular');
      setStatus('draft');
      setSpecificDate('');
    }
    setSubmitError(null);
  }, [sessionToEdit, presetData, isOpen, courses, faculty, rooms, batches]);

  if (!isOpen) return null;

  // Real-time Conflict Engine Evaluation
  const proposedPayload: Partial<ClassSession> = {
    id: sessionToEdit?.id,
    semester_id: activeSemester?.id || 'sem-fall-2026',
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

  const selectedCourse = courses.find((c) => c.id === courseId);
  const selectedRoom = rooms.find((r) => r.id === roomId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validationResult.valid) {
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
          semester_id: activeSemester?.id || 'sem-fall-2026',
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
          {/* Conflict Engine Feedback Alert */}
          {validationResult.errors.length > 0 && (
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
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Course</span>
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} ({c.credit_hours} Cr)
                  </option>
                ))}
              </select>
              {selectedCourse?.required_room_types?.length ? (
                <span className="block mt-1 text-[11px] text-amber-700 font-medium">
                  Requires: {selectedCourse.required_room_types.join(', ')}
                </span>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Faculty / Instructor</span>
              </label>
              <select
                value={facultyId}
                onChange={(e) => setFacultyId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {faculty.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.department}) - Max {f.max_load_per_day}h/day
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Room & Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>Room / Venue</span>
              </label>
              <select
                value={roomId || ''}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- No Room Assigned (Pending) --</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.building}, Cap: {r.capacity}) [{r.room_types.join(', ')}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Student Batch</span>
              </label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.program} - Sem {b.semester}) {b.is_irregular ? '[Irregular/Special]' : ''}
                  </option>
                ))}
              </select>
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
            <select
              value={batchGroupId}
              onChange={(e) => setBatchGroupId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="">-- No Batch Merging (Single Batch Only) --</option>
              {mergeGroups.map((mg) => (
                <option key={mg.id} value={mg.id}>
                  {mg.name}
                </option>
              ))}
            </select>
          </div>

          {/* Row 4: Day & Time Range */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Day of Week</label>
              <select
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
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
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
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
    </div>
  );
};
