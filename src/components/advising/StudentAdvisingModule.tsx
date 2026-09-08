'use client';

import React, { useState } from 'react';
import { useTimetable } from '@/context/TimetableContext';
import { 
  ShieldAlert, 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  User, 
  BookOpen, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight,
  Filter,
  Check
} from 'lucide-react';

export const StudentAdvisingModule: React.FC = () => {
  const {
    students,
    completedCourses,
    courses,
    faculty,
    batches,
    advisingSuggestions,
    resolveAdvising,
    currentRole,
  } = useTimetable();

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students.find((s) => s.is_irregular)?.id || students[0]?.id || ''
  );
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  const isCoordinator = currentRole === 'coordinator' || currentRole === 'admin';

  if (!isCoordinator) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto mt-10">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-base">Restricted Access</h3>
        <p className="text-slate-500 text-xs mt-1">
          The Special-Case Student Advising & Soft Conflict Module is strictly restricted to University Coordinators and Administrators.
        </p>
      </div>
    );
  }

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const studentCompletedList = completedCourses.filter(
    (c) => c.student_id === selectedStudentId
  );

  const studentAdvisingQueue = advisingSuggestions.filter(
    (a) => a.student_id === selectedStudentId
  );

  const handleResolve = (suggestionId: string) => {
    resolveAdvising(suggestionId, resolutionNotes[suggestionId] || 'Resolved by Coordinator');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-indigo-950 uppercase tracking-wider">
                Coordinator Console
              </span>
              <span className="text-xs text-indigo-200">Advising & Prerequisite Engine</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Special-Case Student Advising & Soft Conflict Resolver
            </h2>
            <p className="text-xs text-indigo-200/80 mt-1 max-w-2xl">
              Cross-reference irregular and transfer students against completed records, validate prerequisite chains, and resolve cross-batch elective clashes.
            </p>
          </div>

          {/* Student Selector */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
            <label className="block text-[11px] font-bold text-indigo-200 uppercase tracking-wider mb-1">
              Select Student Profile:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-1.5 bg-white text-slate-900 text-xs font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {students.map((std) => (
                <option key={std.id} value={std.id}>
                  {std.name} ({std.roll_number}) {std.is_irregular ? '[Irregular/Transfer]' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Student Academic Record & Prerequisite Checklist */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span>Academic Record</span>
              </h3>
              {selectedStudent?.is_irregular && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  Irregular Batch
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Roll No: <span className="font-semibold text-slate-700">{selectedStudent?.roll_number}</span>
            </p>
          </div>

          {/* Completed Courses */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Completed Courses ({studentCompletedList.length})
            </h4>
            <div className="space-y-1.5">
              {studentCompletedList.map((sc) => {
                const course = courses.find((c) => c.id === sc.course_id);
                return (
                  <div
                    key={sc.id}
                    className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 font-mono">
                        {course?.code || 'CRS'}
                      </span>{' '}
                      <span className="text-slate-600 font-medium">{course?.name}</span>
                      <p className="text-[10px] text-slate-400">
                        Term: {sc.semester_completed}
                      </p>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono text-[11px]">
                      {sc.grade}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prerequisite Chain Status */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Prerequisite Eligibility Matrix
            </h4>
            <div className="space-y-2 text-xs">
              {courses.map((crs) => {
                const completedIds = studentCompletedList.map((sc) => sc.course_id);
                const isCompleted = completedIds.includes(crs.id);
                const prereqs = crs.prerequisites || [];
                const missingPrereqs = prereqs.filter((pid) => !completedIds.includes(pid));
                const isEligible = missingPrereqs.length === 0;

                return (
                  <div
                    key={crs.id}
                    className={`p-2 rounded-lg border flex items-center justify-between ${
                      isCompleted
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                        : isEligible
                        ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900'
                        : 'bg-rose-50/50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div>
                      <span className="font-bold font-mono">{crs.code}</span> - {crs.name}
                      {!isEligible && (
                        <p className="text-[10px] text-rose-700 font-semibold">
                          Missing: {missingPrereqs.map((pid) => courses.find((c) => c.id === pid)?.code).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase">
                      {isCompleted ? 'Passed' : isEligible ? 'Eligible' : 'Blocked'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 2-Columns: Advising Suggestions & Soft-Conflict Resolution Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Flagged Soft Conflicts & Recommendation Queue</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Coordinator-only advising decisions for {selectedStudent?.name}
                </p>
              </div>
            </div>

            {studentAdvisingQueue.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">No Advising Flags</h4>
                <p className="text-xs text-slate-500 mt-1">
                  This student currently has zero unfulfilled prerequisites or cross-batch elective clashes.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {studentAdvisingQueue.map((item) => {
                  const flaggedCourse = courses.find((c) => c.id === item.flagged_course_id);
                  const clashingCourse = item.clashing_course_id
                    ? courses.find((c) => c.id === item.clashing_course_id)
                    : null;
                  const isResolved = item.status === 'resolved';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isResolved
                          ? 'bg-slate-50 border-slate-200 opacity-75'
                          : 'bg-white border-amber-300 shadow-sm hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded font-bold text-xs bg-amber-100 text-amber-900 font-mono">
                            {flaggedCourse?.code}
                          </span>
                          {clashingCourse && (
                            <>
                              <span className="text-slate-400 font-bold">vs</span>
                              <span className="px-2 py-0.5 rounded font-bold text-xs bg-rose-100 text-rose-900 font-mono">
                                {clashingCourse.code}
                              </span>
                            </>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isResolved
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-500 text-white'
                            }`}
                          >
                            {isResolved ? 'Resolved' : 'Pending Action'}
                          </span>
                        </div>
                      </div>

                      {/* Issue Description */}
                      <p className="text-xs font-semibold text-slate-800 mb-2">{item.reason}</p>

                      {/* Suggested Fix by Conflict Engine */}
                      {item.suggested_alternative && (
                        <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-950 space-y-1 mb-3">
                          <div className="flex items-center gap-1.5 font-bold text-indigo-800 text-[11px]">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            <span>System Recommended Fix:</span>
                          </div>
                          {item.suggested_alternative.recommended_course && (
                            <p>
                              • Prioritize Prerequisite:{' '}
                              <span className="font-bold">
                                {courses.find((c) => c.id === item.suggested_alternative?.recommended_course)?.name}
                              </span>
                            </p>
                          )}
                          {item.suggested_alternative.available_faculty_slots?.map((slot, i) => (
                            <p key={i}>
                              • Shift to faculty open window: Day {slot.day} ({slot.start} - {slot.end}) with{' '}
                              <span className="font-semibold">{slot.faculty}</span>
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Coordinator Resolution Controls */}
                      {!isResolved ? (
                        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <input
                            type="text"
                            placeholder="Add coordinator resolution note..."
                            value={resolutionNotes[item.id] || ''}
                            onChange={(e) =>
                              setResolutionNotes((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            onClick={() => handleResolve(item.id)}
                            className="flex items-center justify-center gap-1 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Resolved</span>
                          </button>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic mt-1">
                          Note: {item.notes || 'Resolved by Coordinator'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
