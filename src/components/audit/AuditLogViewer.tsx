'use client';

import React, { useState, useMemo } from 'react';
import { useTimetable } from '@/context/TimetableContext';
import { History, ShieldCheck, User, Clock, CheckCircle2, ArrowRight, Search, X, Filter } from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const { auditLogs } = useTimetable();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (selectedType !== 'ALL' && log.change_type !== selectedType) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        log.description.toLowerCase().includes(q) ||
        log.changed_by.toLowerCase().includes(q) ||
        log.change_type.toLowerCase().includes(q) ||
        new Date(log.timestamp).toLocaleString().toLowerCase().includes(q)
      );
    });
  }, [auditLogs, searchQuery, selectedType]);

  const changeTypes = ['ALL', 'INSERT', 'UPDATE', 'DELETE', 'SNAPSHOT'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <span>Audit Trail & Centralized Edit Logs</span>
          </h3>
          <p className="text-xs text-slate-500">
            Immutable log of all concurrent timetable modifications, drag-and-drops, and publish events
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Live Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail upon typing..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52 sm:w-64 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {filteredLogs.length} / {auditLogs.length} Events
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {changeTypes.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedType === type
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {type === 'ALL' ? 'All Events' : type}
          </button>
        ))}
      </div>

      {/* Audit List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-400">
            {auditLogs.length === 0 ? 'No audit events logged yet.' : 'No audit events matching your search.'}
          </p>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-100/60 transition-colors"
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

              <div className="text-right text-[11px] text-slate-400 font-mono flex items-center sm:justify-end gap-1 shrink-0">
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
