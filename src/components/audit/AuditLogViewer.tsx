'use client';

import React from 'react';
import { useTimetable } from '@/context/TimetableContext';
import { History, ShieldCheck, User, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const { auditLogs } = useTimetable();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <span>Audit Trail & Centralized Edit Logs</span>
          </h3>
          <p className="text-xs text-slate-500">
            Immutable log of all concurrent timetable modifications, drag-and-drops, and publish events
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
          {auditLogs.length} Events Logged
        </span>
      </div>

      <div className="space-y-3">
        {auditLogs.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-400">
            No audit events logged yet.
          </p>
        ) : (
          auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3">
                <span
                  className={`px-2 py-0.5 rounded font-bold font-mono text-[10px] uppercase mt-0.5 ${
                    log.change_type === 'INSERT'
                      ? 'bg-emerald-100 text-emerald-800'
                      : log.change_type === 'UPDATE'
                      ? 'bg-indigo-100 text-indigo-800'
                      : log.change_type === 'DELETE'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {log.change_type}
                </span>

                <div>
                  <h5 className="font-bold text-slate-900">{log.description}</h5>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <User className="w-3 h-3 text-slate-400" />
                    <span className="font-medium text-slate-700">{log.changed_by}</span>
                  </p>
                </div>
              </div>

              <div className="text-right text-[11px] text-slate-400 font-mono flex items-center sm:justify-end gap-1">
                <Clock className="w-3 h-3" />
                <span>{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
