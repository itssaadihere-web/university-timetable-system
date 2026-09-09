'use client';

import React, { useState } from 'react';
import { useTimetable } from '@/context/TimetableContext';
import { RoomType, ClassSession } from '@/types';
import { timeToMinutes, formatTo12Hour, formatTimeRange } from '@/lib/conflict-engine';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Filter, 
  Plus, 
  User, 
  DoorOpen, 
  AlertCircle 
} from 'lucide-react';

const MAKEUP_TIME_SLOTS = [
  { start: '08:30', end: '10:00', label: '08:30 AM – 10:00 AM' },
  { start: '10:15', end: '11:45', label: '10:15 AM – 11:45 AM' },
  { start: '12:00', end: '13:30', label: '12:00 PM – 01:30 PM' },
  { start: '13:30', end: '15:00', label: '01:30 PM – 03:00 PM' },
  { start: '15:15', end: '16:45', label: '03:15 PM – 04:45 PM' },
  { start: '17:00', end: '18:30', label: '05:00 PM – 06:30 PM' },
];

export const MakeupClassManager: React.FC = () => {
  const {
    makeupRequests,
    rooms,
    faculty,
    batches,
    courses,
    sessions,
    approveMakeup,
    rejectMakeup,
    currentRole,
    addSession,
    activeSemester,
  } = useTimetable();

  // New Request Form State
  const [targetDate, setTargetDate] = useState<string>('2026-09-25');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(faculty[0]?.id || '');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '');
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || '');
  const [selectedTimeSlotIdx, setSelectedTimeSlotIdx] = useState<number>(0);
  const [reason, setReason] = useState<string>('Adjustment class for missed session');
  const [requiredTag, setRequiredTag] = useState<string>('ALL');

  // Interactive Room Availability Finder state
  const [finderDate, setFinderDate] = useState<string>('2026-09-25');
  const [finderTag, setFinderTag] = useState<string>('ALL');
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  const isCoordinator = currentRole === 'coordinator' || currentRole === 'admin';

  // Compute Room Availability Matrix for finderDate
  const availableRoomsMatrix = rooms.filter((r) => {
    if (finderTag !== 'ALL' && !r.room_types.includes(finderTag as RoomType)) {
      return false;
    }
    return true;
  });

  const handleApprove = async (requestId: string) => {
    const res = await approveMakeup(requestId);
    if (res.success) {
      setActionAlert('Makeup request approved and scheduled successfully!');
      setTimeout(() => setActionAlert(null), 4000);
    } else if (res.errors) {
      alert(`Conflict Detected:\n${res.errors.join('\n')}`);
    }
  };

  const handleDirectSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const slot = MAKEUP_TIME_SLOTS[selectedTimeSlotIdx] || MAKEUP_TIME_SLOTS[0];
    const targetDay = new Date(targetDate).getDay() === 0 ? 7 : new Date(targetDate).getDay();

    const res = await addSession({
      semester_id: activeSemester?.id || 'sem-fall-2026',
      course_id: selectedCourseId,
      faculty_id: selectedFacultyId,
      room_id: selectedRoomId,
      batch_id: selectedBatchId,
      day_of_week: targetDay,
      start_time: slot.start,
      end_time: slot.end,
      session_type: 'makeup',
      status: 'published',
      specific_date: targetDate,
    });

    if (res.success) {
      setActionAlert('Floating makeup session scheduled and broadcast live!');
      setTimeout(() => setActionAlert(null), 4000);
    } else if (res.errors) {
      alert(`Conflict Detected:\n${res.errors.join('\n')}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-400 text-teal-950 uppercase tracking-wider">
                Floating Class Hub
              </span>
              <span className="text-xs text-teal-200">Date-Specific Adjustment Scheduling</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Makeup Class & Room Availability Matrix
            </h2>
            <p className="text-xs text-teal-200/80 mt-1 max-w-2xl">
              Schedule floating makeup classes tied to specific dates, query live room availability by equipment capabilities, and process faculty adjustment requests.
            </p>
          </div>
        </div>
      </div>

      {actionAlert && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex items-center gap-3 text-emerald-900 text-xs font-bold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionAlert}</span>
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Direct Makeup Scheduler & Pending Requests */}
        <div className="space-y-6">
          {/* Direct Scheduler */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-teal-600" />
              <span>Schedule Floating Makeup</span>
            </h3>

            <form onSubmit={handleDirectSchedule} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Time Slot</label>
                <select
                  value={selectedTimeSlotIdx}
                  onChange={(e) => setSelectedTimeSlotIdx(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {MAKEUP_TIME_SLOTS.map((t, idx) => (
                    <option key={idx} value={idx}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Faculty</label>
                <select
                  value={selectedFacultyId}
                  onChange={(e) => setSelectedFacultyId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Room / Venue</label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.building}, Cap: {r.capacity}) [{r.room_types.join(', ')}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Batch</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm hover:shadow transition-all"
              >
                Schedule Floating Class
              </button>
            </form>
          </div>

          {/* Pending Makeup Requests */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>Faculty Adjustment Requests</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                {makeupRequests.length}
              </span>
            </h3>

            <div className="space-y-3">
              {makeupRequests.map((req) => {
                const crs = courses.find((c) => c.id === req.course_id);
                const rm = rooms.find((r) => r.id === req.room_id);
                const tch = faculty.find((f) => f.id === req.faculty_id);
                const bth = batches.find((b) => b.id === req.batch_id);

                return (
                  <div
                    key={req.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 font-mono text-xs">
                        {crs?.code} ({req.requested_date})
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : req.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {req.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px]">{req.reason}</p>
                    <div className="text-[10px] text-slate-500">
                      Instructor: <span className="font-medium text-slate-700">{tch?.name}</span> •{' '}
                      Slot: {formatTimeRange(req.start_time, req.end_time)} • Room: {rm?.name}
                    </div>

                    {req.status === 'pending' && isCoordinator && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-center"
                        >
                          Approve & Schedule
                        </button>
                        <button
                          onClick={() => rejectMakeup(req.id)}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 2-Columns: Live Room Availability Finder Matrix */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-teal-600" />
                <span>Room & Resource Availability Matrix</span>
              </h3>
              <p className="text-xs text-slate-500">
                Instantly check free rooms and equipment availability on any given date
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={finderDate}
                onChange={(e) => setFinderDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />

              <select
                value={finderTag}
                onChange={(e) => setFinderTag(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="ALL">All Equipment</option>
                <option value="multimedia">Multimedia Only</option>
                <option value="interactive_lcd">Interactive LCD</option>
                <option value="horseshoe">Horseshoe Hall</option>
                <option value="computer_lab">Computer Lab</option>
              </select>
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[650px]">
              {/* Table Header */}
              <div className="grid grid-cols-[160px_repeat(6,1fr)] bg-slate-50 border-b border-slate-200 text-center text-xs font-bold text-slate-700 py-2.5 px-2">
                <div className="text-left font-semibold text-slate-500">Room / Tags</div>
                {MAKEUP_TIME_SLOTS.map((slot) => (
                  <div key={slot.start} className="font-mono text-[10px] tracking-tight">
                    {formatTo12Hour(slot.start)}
                  </div>
                ))}
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-100">
                {availableRoomsMatrix.map((room) => {
                  return (
                    <div
                      key={room.id}
                      className="grid grid-cols-[160px_repeat(6,1fr)] hover:bg-slate-50/50 transition-colors py-2 px-2 items-center"
                    >
                      {/* Room Details */}
                      <div className="text-xs">
                        <span className="font-bold text-slate-800 block truncate">
                          {room.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          Cap: {room.capacity} • {room.room_types.join(', ')}
                        </span>
                      </div>

                      {/* Time Slots */}
                      {MAKEUP_TIME_SLOTS.map((slot) => {
                        const targetDay =
                          new Date(finderDate).getDay() === 0
                            ? 7
                            : new Date(finderDate).getDay();

                        // Check if room is booked on finderDate
                        const isBooked = sessions.some((s) => {
                          if (s.room_id !== room.id || s.status === 'cancelled') return false;
                          const isSameContext =
                            (s.specific_date && s.specific_date === finderDate) ||
                            (!s.specific_date && s.day_of_week === targetDay);
                          return isSameContext && s.start_time.startsWith(slot.start);
                        });

                        return (
                          <div key={slot.start} className="px-1 text-center">
                            {isBooked ? (
                              <span className="inline-block w-full py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                                Booked
                              </span>
                            ) : (
                              <span className="inline-block w-full py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                                Free
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
