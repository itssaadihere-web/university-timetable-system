'use client';

import React, { useState } from 'react';
import { useTimetable } from '@/context/TimetableContext';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';

interface BulkCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkCsvImportModal: React.FC<BulkCsvImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { bulkImportEntities } = useTimetable();
  const [importType, setImportType] = useState<'rooms' | 'faculty' | 'batches' | 'courses'>('rooms');
  const [csvText, setCsvText] = useState<string>('');
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const sampleTemplates: Record<string, string> = {
    rooms: 'name,building,floor,capacity,room_types\nLab 402,Computing Center,4,45,computer_lab;multimedia\nHall 305,Academic Block B,3,60,standard',
    faculty: 'name,email,department,max_load_per_day\nDr. Geoffrey Hinton,hinton@univ.edu,Computer Science,3\nProf. Donald Knuth,knuth@univ.edu,Computer Science,4',
    batches: 'name,program,semester,student_count,is_irregular\nBSDS-2025-A,Data Science,3,40,false\nIRREG-2026-Eng,Electrical Engg,5,15,true',
    courses: 'code,name,department,credit_hours,required_room_types\nCS-410,Deep Learning,Computer Science,3,computer_lab;multimedia\nHUM-301,Sociology & Tech,Humanities,2,standard',
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessCount(null);

    try {
      const lines = csvText.trim().split('\n');
      if (lines.length <= 1) {
        setErrorMsg('CSV text must contain at least 1 header line and 1 data row.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const parsedItems: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(',').map((v) => v.trim());
        const obj: any = { id: `${importType}-${Date.now()}-${i}` };

        headers.forEach((header, idx) => {
          const val = values[idx];
          if (header === 'room_types' || header === 'required_room_types') {
            obj[header] = val ? val.split(';').map((t) => t.trim()) : ['standard'];
          } else if (header === 'capacity' || header === 'floor' || header === 'semester' || header === 'student_count' || header === 'credit_hours' || header === 'max_load_per_day') {
            obj[header] = parseInt(val, 10) || 0;
          } else if (header === 'is_irregular') {
            obj[header] = val.toLowerCase() === 'true';
          } else {
            obj[header] = val || '';
          }
        });

        parsedItems.push(obj);
      }

      bulkImportEntities(importType, parsedItems);
      setSuccessCount(parsedItems.length);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to parse CSV');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-600" />
            <span>Bulk Master Data CSV Import</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successCount !== null ? (
          <div className="py-6 text-center text-xs space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-slate-900 text-sm">
              Import Successful!
            </h4>
            <p className="text-slate-500">
              Successfully parsed and added {successCount} {importType} records.
            </p>
          </div>
        ) : (
          <form onSubmit={handleImport} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Select Entity Type to Import
              </label>
              <select
                value={importType}
                onChange={(e) => {
                  const t = e.target.value as any;
                  setImportType(t);
                  setCsvText(sampleTemplates[t] || '');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="rooms">Rooms & Venues (with Capability Tags)</option>
                <option value="faculty">Faculty Members (with Daily Load Limits)</option>
                <option value="batches">Student Batches (Regular & Irregular)</option>
                <option value="courses">Courses & Prerequisites</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Paste CSV Data</label>
                <button
                  type="button"
                  onClick={() => setCsvText(sampleTemplates[importType])}
                  className="text-indigo-600 hover:underline font-semibold"
                >
                  Load Sample Template
                </button>
              </div>
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Paste CSV rows here with commas..."
                required
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {errorMsg && (
              <p className="text-rose-600 font-semibold">{errorMsg}</p>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                Parse & Import
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
