'use client';

import React, { useState } from 'react';
import { useTimetable } from '@/context/TimetableContext';
import { ClassSession, TimetableVersion } from '@/types';
import { 
  X, 
  UploadCloud, 
  Layers, 
  Clock, 
  RotateCcw, 
  CheckCircle2, 
  PlusCircle, 
  ArrowRight, 
  History 
} from 'lucide-react';

interface VersionDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const VersionDiffModal: React.FC<VersionDiffModalProps> = ({ isOpen, onClose }) => {
  const {
    sessions,
    versions,
    courses,
    faculty,
    rooms,
    batches,
    publishCurrentDraft,
    revertToVersion,
  } = useTimetable();

  const [summary, setSummary] = useState<string>('Weekly timetable adjustment and lab allocation');
  const [activeTab, setActiveTab] = useState<'diff' | 'history'>('diff');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const draftSessions = sessions.filter((s) => s.status === 'draft');
  const publishedSessions = sessions.filter((s) => s.status === 'published');
  const latestVersion = versions[0];

  const handlePublish = async () => {
    setIsPublishing(true);
    setSuccessMsg(null);
    try {
      const res = await publishCurrentDraft(summary);
      if (res.success) {
        setSuccessMsg(`Timetable Version v${res.versionNumber} successfully published! Live sync updated.`);
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRollback = async (version: TimetableVersion) => {
    if (confirm(`Roll back the current timetable to Snapshot v${version.version_number}?`)) {
      await revertToVersion(version);
      alert(`Timetable rolled back to Version v${version.version_number}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Draft & Publish Version Control</span>
            </h3>
            <p className="text-xs text-slate-500">
              Review draft changes side-by-side against the live published schedule before broadcast
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 flex items-center gap-4 border-b border-slate-100 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('diff')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'diff'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Staged Draft Changes ({draftSessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Version History & Snapshots ({versions.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 text-xs space-y-5">
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-emerald-900 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'diff' && (
            <>
              {draftSessions.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 text-sm">No Pending Draft Changes</h4>
                  <p className="text-slate-500 text-xs mt-1">
                    All sessions are currently live and published. Any new edits or dragged sessions in draft mode will appear here for review.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-amber-900 text-xs">
                        {draftSessions.length} Session(s) Staged for Live Broadcast
                      </h4>
                      <p className="text-amber-700 text-[11px] mt-0.5">
                        Students and faculty currently see the live timetable. Publishing will update their screens instantly.
                      </p>
                    </div>
                  </div>

                  {/* List of draft changes */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      Staged Draft Items
                    </h5>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                      {draftSessions.map((draft) => {
                        const course = courses.find((c) => c.id === draft.course_id);
                        const teacher = faculty.find((f) => f.id === draft.faculty_id);
                        const room = rooms.find((r) => r.id === draft.room_id);
                        const batch = batches.find((b) => b.id === draft.batch_id);

                        return (
                          <div
                            key={draft.id}
                            className="p-3 bg-white flex items-center justify-between gap-4 hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-3">
                              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800 font-bold font-mono text-[11px]">
                                {course?.code || 'CRS'}
                              </span>
                              <div>
                                <h6 className="font-bold text-slate-800 text-xs">
                                  {course?.name}
                                </h6>
                                <p className="text-[11px] text-slate-500">
                                  {batch?.name} • {teacher?.name} • Room: {room?.name}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="font-bold text-slate-800 font-mono text-xs">
                                {DAYS[draft.day_of_week - 1]} {draft.start_time} - {draft.end_time}
                              </span>
                              <span className="block text-[10px] text-amber-600 font-semibold">
                                Draft Staged
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Publish summary text */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Changelog Summary (Version Note)
                    </label>
                    <input
                      type="text"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="e.g. Adjusted CS-301 timing for lab availability"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Action */}
                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePublish}
                      disabled={isPublishing}
                      className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-lg shadow-md shadow-emerald-100 transition-all"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{isPublishing ? 'Publishing...' : 'Publish Live Now'}</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {versions.length === 0 ? (
                <p className="text-center py-8 text-slate-400">
                  No snapshot versions recorded yet. Publishing draft changes will create version checkpoints.
                </p>
              ) : (
                <div className="space-y-3">
                  {versions.map((ver) => (
                    <div
                      key={ver.id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded font-bold text-xs bg-indigo-100 text-indigo-800 font-mono">
                            v{ver.version_number}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">
                            {ver.changes_summary || 'Snapshot'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Published by <span className="font-medium">{ver.published_by}</span> on{' '}
                          {new Date(ver.published_at).toLocaleString()} ({ver.snapshot.length} sessions)
                        </p>
                      </div>

                      <button
                        onClick={() => handleRollback(ver)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        <span>Rollback to v{ver.version_number}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
