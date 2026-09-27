'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useTimetable } from '@/context/TimetableContext';
import * as XLSX from 'xlsx';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Table,
  Trash2,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
  Check,
  AlertTriangle,
  ChevronRight,
  BookOpen,
  User,
  MapPin,
  Users,
  Calendar,
  Filter,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import {
  parseMasterTimetableData,
  MasterTimetableParseResult,
  AnalyzedMasterRow,
  TypoSuggestion
} from '@/lib/master-timetable-parser';
import { formatTo12Hour } from '@/lib/conflict-engine';

interface BulkExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkExcelImportModal: React.FC<BulkExcelImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    activeSemester,
    batches,
    courses,
    faculty,
    rooms,
    importMasterTimetable,
  } = useTimetable();

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [parseResult, setParseResult] = useState<MasterTimetableParseResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Review Navigation Tabs: 'summary' | 'batches' | 'issues' | 'all_rows'
  const [reviewTab, setReviewTab] = useState<'summary' | 'batches' | 'issues' | 'all_rows'>('summary');
  const [appliedSuggestions, setAppliedSuggestions] = useState<Record<string, boolean>>({});
  const [excludedRowIndices, setExcludedRowIndices] = useState<Set<number>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // --------------------------------------------------------------------------
  // DOWNLOAD OFFICIAL MASTER TIMETABLE EXCEL TEMPLATE (.XLSX)
  // --------------------------------------------------------------------------
  const handleDownloadTemplate = () => {
    try {
      const templateData = [
        {
          'Degree Program': 'BS (A&F)',
          'Semester': 'Semester 1',
          'Course Code': 'ACC 101',
          'Section': '1A',
          'Course Title': 'Introduction to Accounting',
          'Class No': '-',
          'Instructor Name': 'Ghulam Mustafa',
          'Room / Venue': 'Lecture Hall 302',
          'Days & Timings': 'Mon - 8:30AM - 11:00AM; Wed - 8:30AM - 11:00AM',
        },
        {
          'Degree Program': 'BS (A&F)',
          'Semester': 'Semester 1',
          'Course Code': 'CSC 110',
          'Section': '1A',
          'Course Title': 'Application of ICT',
          'Class No': '-',
          'Instructor Name': 'Yasar Rizwan',
          'Room / Venue': 'LH 302 / LAB 308',
          'Days & Timings': 'Mon - 11:30AM - 1:00PM (LH 302); Wed - 11:30AM - 1:00PM (LAB 308)',
        },
        {
          'Degree Program': 'BS (FinTech)',
          'Semester': 'BS (FT) - 2',
          'Course Code': 'ACC - 106',
          'Section': 'M2',
          'Course Title': 'Financial Accounting and Corporate Reporting',
          'Class No': '1036',
          'Instructor Name': 'Abid Khan',
          'Room / Venue': 'TF-301 / TF-311',
          'Days & Timings': 'Mon - 1:00PM - 3:00PM (TF-301); Wed - 1:00PM - 3:00PM (TF-311)',
        },
        {
          'Degree Program': 'BBA',
          'Semester': 'BBA - 2',
          'Course Code': 'MKT - 101',
          'Section': 'M2',
          'Course Title': 'Principles of Marketing',
          'Class No': '1047',
          'Instructor Name': 'Dr. Shamaila Burney',
          'Room / Venue': 'TF-301',
          'Days & Timings': 'Tues - 8:30AM - 11:30AM',
        },
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);

      ws['!cols'] = [
        { wch: 18 }, // Degree Program
        { wch: 16 }, // Semester
        { wch: 14 }, // Course Code
        { wch: 10 }, // Section
        { wch: 38 }, // Course Title
        { wch: 10 }, // Class No
        { wch: 24 }, // Instructor Name
        { wch: 22 }, // Room / Venue
        { wch: 48 }, // Days & Timings
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Master Course Schedule');
      XLSX.writeFile(wb, 'SHU_Master_Course_Schedule_Template.xlsx');
    } catch (err: any) {
      setErrorMsg(`Failed to generate template: ${err?.message}`);
    }
  };

  // --------------------------------------------------------------------------
  // PROCESS UPLOADED EXCEL FILE
  // --------------------------------------------------------------------------
  const processUploadedFile = async (uploadedFile: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessCount(null);
    setWarningMsg(null);

    try {
      setFile(uploadedFile);
      setFileName(uploadedFile.name);

      const arrayBuffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('The uploaded Excel file contains no worksheets.');
      }

      // Check for 'Master Course Schedule' sheet or first sheet
      const targetSheetName =
        workbook.SheetNames.find((s) => s.toLowerCase().includes('master') || s.toLowerCase().includes('schedule')) ||
        workbook.SheetNames[0];

      const worksheet = workbook.Sheets[targetSheetName];
      const rawJson: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (!rawJson || rawJson.length === 0) {
        throw new Error('The worksheet is empty. Please upload a file with schedule rows.');
      }

      // Parse with Master Timetable Intelligence Engine
      const result = parseMasterTimetableData(
        rawJson,
        batches,
        courses,
        faculty,
        rooms,
        activeSemester?.id || '11111111-1111-1111-1111-111111111111'
      );

      setParseResult(result);

      // Pre-exclude error rows
      const initExcluded = new Set<number>();
      result.rows.forEach((r, idx) => {
        if (r.status === 'error') initExcluded.add(idx);
      });
      setExcludedRowIndices(initExcluded);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to read Excel file. Please ensure it is a valid Master Schedule sheet.');
      setParseResult(null);
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle exclusion of a problematic row
  const toggleRowExclusion = (rowIndex: number) => {
    setExcludedRowIndices((prev) => {
      const updated = new Set(prev);
      if (updated.has(rowIndex)) {
        updated.delete(rowIndex);
      } else {
        updated.add(rowIndex);
      }
      return updated;
    });
  };

  // Toggle typo suggestion
  const toggleSuggestion = (key: string) => {
    setAppliedSuggestions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Accept all typo suggestions
  const acceptAllSuggestions = () => {
    if (!parseResult) return;
    const allSugg: Record<string, boolean> = {};
    parseResult.rows.forEach((r, rIdx) => {
      r.suggestions.forEach((_, sIdx) => {
        allSugg[`${rIdx}_${sIdx}`] = true;
      });
    });
    setAppliedSuggestions(allSugg);
  };

  // --------------------------------------------------------------------------
  // HANDLE COMMIT TO DATABASE
  // --------------------------------------------------------------------------
  const handleExecuteImport = async () => {
    if (!parseResult) {
      setErrorMsg('No parsed data to import. Please upload a valid Master Schedule file.');
      return;
    }

    setIsImporting(true);
    setErrorMsg(null);

    try {
      // Filter out excluded rows and regenerate final clean sessions
      const includedRowNumbers = new Set(
        parseResult.rows
          .map((r, idx) => ({ r, idx }))
          .filter(({ idx }) => !excludedRowIndices.has(idx))
          .map(({ r }) => r.rowNumber)
      );

      // Extract only batches, courses, faculty, rooms, sessions from included rows
      const finalSessions = parseResult.generatedSessions.filter((s) => {
        const rowIndex = (s as any).rowIndex;
        if (rowIndex !== undefined && excludedRowIndices.has(rowIndex)) {
          return false;
        }
        const matchingRow = parseResult.rows.find((r) => r.courseCode === (s as any).course_code && r.resolvedBatchName === (s as any).batch_name);
        if (matchingRow && excludedRowIndices.has(parseResult.rows.indexOf(matchingRow))) {
          return false;
        }
        return true;
      });

      const res = await importMasterTimetable({
        batches: parseResult.extractedBatches,
        courses: parseResult.extractedCourses,
        faculty: parseResult.extractedFaculty,
        rooms: parseResult.extractedRooms,
        sessions: finalSessions,
      });

      if (!res.success && res.error) {
        throw new Error(res.error);
      }

      setSuccessCount(finalSessions.length);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to complete timetable import into database.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleResetFile = () => {
    setFile(null);
    setFileName('');
    setParseResult(null);
    setErrorMsg(null);
    setWarningMsg(null);
    setSuccessCount(null);
    setAppliedSuggestions({});
    setExcludedRowIndices(new Set());
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleResetFile();
    onClose();
  };

  // Calculate dynamic issue counts
  const totalIssuesCount = useMemo(() => {
    if (!parseResult) return 0;
    return parseResult.rows.reduce((acc, r) => acc + r.issues.length + r.suggestions.length, 0);
  }, [parseResult]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-shu-50 text-shu-700 flex items-center justify-center border border-shu-200 shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight flex items-center gap-2">
                <span>Master Timetable Importer</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-shu-100 text-shu-800 font-extrabold">
                  Unified Single Import
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically extracts batches, courses, faculty, venues, and weekly slots into {activeSemester?.name || 'Active Semester'}.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Success Banner */}
          {successCount !== null && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 animate-fadeIn">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">Timetable Successfully Imported!</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Synchronized {successCount} sessions and populated all Supabase tables. Closing window...
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <div className="text-xs leading-relaxed flex-1">
                <span className="font-bold">Import Error: </span>
                {errorMsg}
              </div>
            </div>
          )}

          {/* Warning Banner */}
          {warningMsg && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 animate-fadeIn">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="text-xs leading-relaxed flex-1">{warningMsg}</div>
            </div>
          )}

          {/* VIEW A: NO FILE UPLOADED YET */}
          {!parseResult && !isLoading && (
            <div className="space-y-4">
              {/* Instructions Callout */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-shu-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">
                      Single File Architecture — No Separate Imports Required
                    </p>
                    <p className="leading-relaxed">
                      Upload your official 9-column course master spreadsheet (Degree Program, Semester, Course Code, Section, Course Title, Class No, Instructor Name, Room / Venue, Days & Timings). Batches, faculty, courses, and rooms are auto-populated.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-shu-700" />
                  <span>Download Master Template</span>
                </button>
              </div>

              {/* Upload Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    processUploadedFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-shu-600 bg-shu-50/50 scale-[0.99]'
                    : 'border-slate-300 hover:border-shu-500 hover:bg-slate-50/80 bg-slate-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processUploadedFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-shu-700">
                  <Upload className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Click to browse or drag and drop your master timetable file
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) files
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[11px] font-semibold text-slate-600 shadow-2xs mt-1">
                  <Sparkles className="w-3.5 h-3.5 text-shu-700" />
                  <span>Instant Validation & Typo Detection Prompt</span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW B: LOADING SPINNER */}
          {isLoading && (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-shu-700 animate-spin" />
              <p className="text-xs font-bold text-slate-700">
                Parsing and analyzing Master Timetable data...
              </p>
              <p className="text-[11px] text-slate-400">
                Detecting batches, courses, faculty, room venues, and multi-session timings
              </p>
            </div>
          )}

          {/* VIEW C: INTERACTIVE PRE-IMPORT VALIDATION & VERIFICATION PROMPT */}
          {parseResult && !isLoading && (
            <div className="space-y-4">
              {/* File Info Bar with Reset */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-shu-700" />
                  <span className="font-bold text-slate-800">{fileName}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-500">{parseResult.summary.totalRows} master schedule rows</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetFile}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Choose Another File</span>
                </button>
              </div>

              {/* Extracted Entities Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-center">
                  <div className="w-7 h-7 mx-auto rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-1">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-lg font-extrabold text-indigo-950">
                    {parseResult.summary.uniqueBatchesCount}
                  </div>
                  <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                    Batches
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl text-center">
                  <div className="w-7 h-7 mx-auto rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-lg font-extrabold text-emerald-950">
                    {parseResult.summary.uniqueCoursesCount}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                    Courses
                  </div>
                </div>

                <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-2xl text-center">
                  <div className="w-7 h-7 mx-auto rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-1">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-lg font-extrabold text-amber-950">
                    {parseResult.summary.uniqueFacultyCount}
                  </div>
                  <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                    Faculty
                  </div>
                </div>

                <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-2xl text-center">
                  <div className="w-7 h-7 mx-auto rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-lg font-extrabold text-purple-950">
                    {parseResult.summary.uniqueRoomsCount}
                  </div>
                  <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
                    Venues
                  </div>
                </div>

                <div className="p-3 bg-teal-50/60 border border-teal-100 rounded-2xl text-center col-span-2 sm:col-span-1">
                  <div className="w-7 h-7 mx-auto rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-lg font-extrabold text-teal-950">
                    {parseResult.summary.totalSlotsCount}
                  </div>
                  <div className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">
                    Class Slots
                  </div>
                </div>
              </div>

              {/* Validation Summary Bar */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-700">Validation Status:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    ✓ {parseResult.summary.validRows} Valid
                  </span>
                  {parseResult.summary.warningRows > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                      ⚠ {parseResult.summary.warningRows} Warnings / Typo Suggestions
                    </span>
                  )}
                  {parseResult.summary.errorRows > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                      ✕ {parseResult.summary.errorRows} Incomplete / Problematic
                    </span>
                  )}
                  {excludedRowIndices.size > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                      {excludedRowIndices.size} Excluded
                    </span>
                  )}
                </div>

                {parseResult.rows.some((r) => r.suggestions.length > 0) && (
                  <button
                    type="button"
                    onClick={acceptAllSuggestions}
                    className="flex items-center gap-1 text-xs font-bold text-shu-700 hover:text-shu-900 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept All Typo Suggestions</span>
                  </button>
                )}
              </div>

              {/* Navigation Tabs for Review Prompt */}
              <div className="flex border-b border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setReviewTab('summary')}
                  className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                    reviewTab === 'summary'
                      ? 'border-shu-700 text-shu-800'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Overview & Recommendations
                </button>
                <button
                  type="button"
                  onClick={() => setReviewTab('batches')}
                  className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                    reviewTab === 'batches'
                      ? 'border-shu-700 text-shu-800'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Batches Identified ({parseResult.extractedBatches.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewTab('issues')}
                  className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                    reviewTab === 'issues'
                      ? 'border-shu-700 text-shu-800'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Issues & Typo Fixes ({totalIssuesCount})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewTab('all_rows')}
                  className={`pb-2 px-3 border-b-2 transition-all cursor-pointer ${
                    reviewTab === 'all_rows'
                      ? 'border-shu-700 text-shu-800'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Schedule Slots ({parseResult.generatedSessions.length})
                </button>
              </div>

              {/* TAB 1: SUMMARY & RECOMMENDATIONS */}
              {reviewTab === 'summary' && (
                <div className="space-y-3">
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-950">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Ready for Instant Schedule Activation</span>
                    </div>
                    <p className="leading-relaxed">
                      All <strong>{parseResult.extractedBatches.length} student cohorts</strong> and{' '}
                      <strong>{parseResult.generatedSessions.length} weekly timetable slots</strong> have been matched and verified from the spreadsheet. All room venues have all special capabilities enabled by default.
                    </p>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="border border-slate-200 rounded-2xl p-3 bg-white space-y-1.5">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Batches Detected:</span>
                      </span>
                      <p className="text-slate-500 leading-relaxed text-[11px]">
                        {parseResult.extractedBatches.map((b) => b.name).slice(0, 12).join(', ')}
                        {parseResult.extractedBatches.length > 12 && ` +${parseResult.extractedBatches.length - 12} more`}
                      </p>
                    </div>

                    <div className="border border-slate-200 rounded-2xl p-3 bg-white space-y-1.5">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-purple-600" />
                        <span>Venues Configured:</span>
                      </span>
                      <p className="text-slate-500 leading-relaxed text-[11px]">
                        {parseResult.extractedRooms.map((r) => r.name).slice(0, 8).join(', ')}
                        {parseResult.extractedRooms.length > 8 && ` +${parseResult.extractedRooms.length - 8} more`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BATCHES IDENTIFIED */}
              {reviewTab === 'batches' && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs max-h-72 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Batch Cohort</th>
                        <th className="px-3 py-2">Degree Program</th>
                        <th className="px-3 py-2">Semester</th>
                        <th className="px-3 py-2">Section</th>
                        <th className="px-3 py-2 text-right">Courses Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parseResult.extractedBatches.map((b) => {
                        const batchRows = parseResult.rows.filter((r) => r.resolvedBatchName === b.name);
                        return (
                          <tr key={b.name} className="hover:bg-slate-50/60">
                            <td className="px-3 py-2 font-bold text-slate-800">{b.name}</td>
                            <td className="px-3 py-2 text-slate-600">{b.program}</td>
                            <td className="px-3 py-2 text-slate-600">Semester {b.semester}</td>
                            <td className="px-3 py-2 text-slate-600">{b.section || '-'}</td>
                            <td className="px-3 py-2 text-right font-bold text-indigo-600">{batchRows.length}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: ISSUES & TYPO FIXES */}
              {reviewTab === 'issues' && (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {totalIssuesCount === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 text-xs">
                      ✓ No typos, warnings, or incomplete rows found. The file is pristine!
                    </div>
                  ) : (
                    parseResult.rows
                      .map((r, rIdx) => ({ r, rIdx }))
                      .filter(({ r }) => r.issues.length > 0 || r.suggestions.length > 0)
                      .map(({ r, rIdx }) => {
                        const isExcluded = excludedRowIndices.has(rIdx);
                        return (
                          <div
                            key={rIdx}
                            className={`p-3 rounded-2xl border transition-all text-xs ${
                              isExcluded
                                ? 'bg-slate-50 border-slate-200 opacity-60'
                                : r.status === 'error'
                                ? 'bg-rose-50/60 border-rose-200'
                                : 'bg-amber-50/60 border-amber-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-800">
                                    Row {r.rowNumber}:
                                  </span>
                                  <span className="font-bold text-slate-700">
                                    {r.courseCode} - {r.courseTitle}
                                  </span>
                                  <span className="text-slate-400">({r.resolvedBatchName})</span>
                                </div>

                                {/* Issues */}
                                {r.issues.map((iss, iIdx) => (
                                  <div key={iIdx} className="text-rose-700 flex items-center gap-1 font-medium">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{iss}</span>
                                  </div>
                                ))}

                                {/* Typo suggestions */}
                                {r.suggestions.map((sug, sIdx) => {
                                  const key = `${rIdx}_${sIdx}`;
                                  const isApplied = appliedSuggestions[key] !== false;
                                  return (
                                    <div key={sIdx} className="text-amber-800 flex items-center gap-2 pt-0.5">
                                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                      <span>
                                        Typo in {sug.field}: <s>{sug.original}</s> &rarr;{' '}
                                        <strong>{sug.suggested}</strong> ({sug.reason})
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Action: Exclude Row Checkbox */}
                              <label className="flex items-center gap-1.5 cursor-pointer shrink-0 select-none bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                                <input
                                  type="checkbox"
                                  checked={isExcluded}
                                  onChange={() => toggleRowExclusion(rIdx)}
                                  className="rounded text-rose-600 focus:ring-rose-500"
                                />
                                <span className={`text-[11px] font-bold ${isExcluded ? 'text-rose-700' : 'text-slate-600'}`}>
                                  {isExcluded ? 'Excluded' : 'Exclude'}
                                </span>
                              </label>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              )}

              {/* TAB 4: SCHEDULE SLOTS */}
              {reviewTab === 'all_rows' && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs max-h-72 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Batch</th>
                        <th className="px-3 py-2">Course</th>
                        <th className="px-3 py-2">Faculty</th>
                        <th className="px-3 py-2">Venue</th>
                        <th className="px-3 py-2">Day & Timing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parseResult.generatedSessions.slice(0, 50).map((s, idx) => {
                        const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                        return (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="px-3 py-1.5 font-bold text-slate-800">{(s as any).batch_name}</td>
                            <td className="px-3 py-1.5 text-slate-700">
                              {(s as any).course_code} - {(s as any).course_name}
                            </td>
                            <td className="px-3 py-1.5 text-slate-600">{(s as any).faculty_name}</td>
                            <td className="px-3 py-1.5 font-semibold text-purple-700">{(s as any).room_name || 'TBD'}</td>
                            <td className="px-3 py-1.5 font-mono text-slate-700">
                              {dayNames[s.day_of_week]} {formatTo12Hour(s.start_time)} - {formatTo12Hour(s.end_time)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {parseResult.generatedSessions.length > 50 && (
                    <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-50 border-t border-slate-200">
                      Showing first 50 of {parseResult.generatedSessions.length} total generated timetable slots
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={isImporting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {parseResult && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting || parseResult.summary.totalSlotsCount === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-shu-700 hover:bg-shu-800 active:bg-shu-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synchronizing with Database...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      Import Validated Schedule (
                      {parseResult.generatedSessions.length - excludedRowIndices.size} Slots)
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
