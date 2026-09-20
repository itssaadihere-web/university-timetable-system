'use client';

import React, { useMemo } from 'react';
import { useTimetable } from '@/context/TimetableContext';
import { RoomType, TimetableViewMode } from '@/types';
import { exportTimetableToExcel, exportTimetableToPDF } from '@/lib/export-utils';
import { createBatchSearchableOption } from '@/lib/batch-utils';
import { SearchableSelect } from './SearchableSelect';
import { 
  Users, 
  UserCheck, 
  DoorOpen, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Search, 
  Layers,
  Sparkles,
  Monitor,
  X
} from 'lucide-react';

export const TimetableFilterBar: React.FC = () => {
  const {
    filterState,
    setFilterState,
    batches,
    faculty,
    rooms,
    courses,
    sessions,
    currentRole,
    addBatch,
    addFaculty,
    addRoom,
  } = useTimetable();

  // Batch Options (Alphabetically sorted, clean Semester / Batch Number & Program display)
  const batchOptions = useMemo(() => {
    return batches.map((b) => createBatchSearchableOption(b));
  }, [batches]);

  // Faculty Options (Alphabetically sorted + search keywords)
  const facultyOptions = useMemo(() => {
    return faculty.map((f) => ({
      id: f.id,
      title: f.name,
      subtitle: `${f.department} • Max ${f.max_load_per_day}h/day`,
      searchTerms: `${f.name} ${f.department} ${f.email}`,
    }));
  }, [faculty]);

  const realRooms = useMemo(() => {
    return rooms.filter(
      (r) =>
        r.id !== 'a0000000-0000-0000-0000-000000000000' &&
        r.id !== 'room-unassigned' &&
        !r.name.toLowerCase().includes('room not assigned') &&
        !r.name.toLowerCase().includes('pending') &&
        r.building !== 'TBD'
    );
  }, [rooms]);

  // Room Options (Alphabetically sorted + search keywords)
  const roomOptions = useMemo(() => {
    return realRooms.map((r) => ({
      id: r.id,
      title: r.name,
      subtitle: `${r.building} • Cap: ${r.capacity}`,
      badge: r.room_types.join(', '),
      badgeColor: 'indigo' as const,
      searchTerms: `${r.name} ${r.building} ${r.room_types.join(' ')}`,
    }));
  }, [realRooms]);

  const handleViewModeChange = (mode: TimetableViewMode) => {
    setFilterState((prev) => ({
      ...prev,
      viewMode: mode,
      selectedBatchId: mode === 'batch' ? prev.selectedBatchId || batches[0]?.id : undefined,
      selectedFacultyId: mode === 'faculty' ? prev.selectedFacultyId || faculty[0]?.id : undefined,
      selectedRoomId: mode === 'room' ? prev.selectedRoomId || rooms[0]?.id : undefined,
    }));
  };

  // Get active entity title for export
  const getFilterTitle = () => {
    if (filterState.viewMode === 'batch') {
      const b = batches.find((b) => b.id === filterState.selectedBatchId);
      return b ? `Batch_${b.name}` : 'All_Batches';
    }
    if (filterState.viewMode === 'faculty') {
      const f = faculty.find((f) => f.id === filterState.selectedFacultyId);
      return f ? `Faculty_${f.name}` : 'All_Faculty';
    }
    const r = rooms.find((r) => r.id === filterState.selectedRoomId);
    return r ? `Room_${r.name}` : 'All_Rooms';
  };

  const handleExportExcel = () => {
    // Filter sessions according to current role and view mode
    const visibleSessions = sessions.filter((s) => {
      if (currentRole === 'student' && s.status !== 'published') return false;
      if (filterState.viewMode === 'batch' && filterState.selectedBatchId) {
        return s.batch_id === filterState.selectedBatchId;
      }
      if (filterState.viewMode === 'faculty' && filterState.selectedFacultyId) {
        return s.faculty_id === filterState.selectedFacultyId;
      }
      if (filterState.viewMode === 'room' && filterState.selectedRoomId) {
        return s.room_id === filterState.selectedRoomId;
      }
      return true;
    });

    exportTimetableToExcel({
      sessions: visibleSessions,
      rooms,
      faculty,
      batches,
      courses,
      filterTitle: getFilterTitle(),
    });
  };

  const handleExportPDF = () => {
    const visibleSessions = sessions.filter((s) => {
      if (currentRole === 'student' && s.status !== 'published') return false;
      if (filterState.viewMode === 'batch' && filterState.selectedBatchId) {
        return s.batch_id === filterState.selectedBatchId;
      }
      if (filterState.viewMode === 'faculty' && filterState.selectedFacultyId) {
        return s.faculty_id === filterState.selectedFacultyId;
      }
      if (filterState.viewMode === 'room' && filterState.selectedRoomId) {
        return s.room_id === filterState.selectedRoomId;
      }
      return true;
    });

    exportTimetableToPDF({
      sessions: visibleSessions,
      rooms,
      faculty,
      batches,
      courses,
      filterTitle: getFilterTitle(),
    });
  };

  // Get distinct departments from courses/faculty
  const departments = Array.from(
    new Set([...courses.map((c) => c.department), ...faculty.map((f) => f.department)])
  ).filter(Boolean);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-3.5 sm:p-4 space-y-3.5">
      {/* Top Filter Row: View Mode Switcher + Entity Dropdown + Export */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* View Mode Switcher Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline mr-1">
            View:
          </span>
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shrink-0">
            <button
              onClick={() => handleViewModeChange('batch')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterState.viewMode === 'batch'
                  ? 'bg-white text-shu-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Student Batch</span>
            </button>

            <button
              onClick={() => handleViewModeChange('faculty')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterState.viewMode === 'faculty'
                  ? 'bg-white text-shu-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Faculty</span>
            </button>

            <button
              onClick={() => handleViewModeChange('room')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterState.viewMode === 'room'
                  ? 'bg-white text-shu-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Room / Venue</span>
            </button>
          </div>
        </div>

        {/* Primary Entity Selector Dropdown (Searchable, Alphabetically Sorted, Live Shrink List) */}
        <div className="flex-1 max-w-lg min-w-[240px] sm:min-w-[280px]">
          {filterState.viewMode === 'batch' && (
            <SearchableSelect
              options={batchOptions}
              value={filterState.selectedBatchId || ''}
              onChange={(batchId) =>
                setFilterState((prev) => ({ ...prev, selectedBatchId: batchId }))
              }
              allOptionLabel="-- All Student Batches --"
              placeholder="Search or select batch..."
              icon={<Users className="w-4 h-4 text-shu-700" />}
              autoSortAlphabetical={true}
              allowCreate={currentRole !== 'student'}
              createLabel="Batch"
              onCreateOption={async (query) => {
                const newBatch = await addBatch(query);
                return newBatch.id;
              }}
            />
          )}

          {filterState.viewMode === 'faculty' && (
            <SearchableSelect
              options={facultyOptions}
              value={filterState.selectedFacultyId || ''}
              onChange={(facultyId) =>
                setFilterState((prev) => ({ ...prev, selectedFacultyId: facultyId }))
              }
              allOptionLabel="-- All Faculty Members --"
              placeholder="Search or select faculty..."
              icon={<UserCheck className="w-4 h-4 text-shu-700" />}
              autoSortAlphabetical={true}
              allowCreate={currentRole !== 'student'}
              createLabel="Faculty Member"
              onCreateOption={async (query) => {
                const newFac = await addFaculty(query);
                return newFac.id;
              }}
            />
          )}

          {filterState.viewMode === 'room' && (
            <SearchableSelect
              options={roomOptions}
              value={filterState.selectedRoomId || ''}
              onChange={(roomId) =>
                setFilterState((prev) => ({ ...prev, selectedRoomId: roomId }))
              }
              allOptionLabel="-- All Rooms & Venues --"
              placeholder="Search or select room..."
              icon={<DoorOpen className="w-4 h-4 text-shu-700" />}
              autoSortAlphabetical={true}
              allowCreate={currentRole !== 'student'}
              createLabel="Room / Venue"
              onCreateOption={async (query) => {
                const newRm = await addRoom(query);
                return newRm.id;
              }}
            />
          )}
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer"
            title="Download formatted Excel workbook"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer"
            title="Download printable PDF schedule"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* Bottom Filter Row: Draft toggle & search */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100 text-xs">
        {/* Right filters: Drafts toggle & search */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {currentRole === 'coordinator' && (
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 select-none font-semibold">
              <input
                type="checkbox"
                checked={filterState.showDrafts}
                onChange={(e) =>
                  setFilterState((prev) => ({ ...prev, showDrafts: e.target.checked }))
                }
                className="w-3.5 h-3.5 text-shu-700 rounded border-slate-300 focus:ring-shu-700/20"
              />
              <span>Show Drafts</span>
            </label>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search course, code..."
              value={filterState.searchQuery}
              onChange={(e) =>
                setFilterState((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              className="pl-9 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-shu-700/20 focus:border-shu-700 w-44 sm:w-56 transition-all"
            />
            {filterState.searchQuery && (
              <button
                type="button"
                onClick={() => setFilterState((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
