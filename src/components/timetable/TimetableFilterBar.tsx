'use client';

import React, { useMemo } from 'react';
import { useTimetable } from '@/context/TimetableContext';
import { RoomType, TimetableViewMode } from '@/types';
import { exportTimetableToExcel, exportTimetableToPDF } from '@/lib/export-utils';
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
  Tv,
  Cpu,
  X
} from 'lucide-react';

const ROOM_TYPE_OPTIONS: { id: RoomType; label: string; icon: any }[] = [
  { id: 'multimedia', label: 'Multimedia', icon: Monitor },
  { id: 'interactive_lcd', label: 'Interactive LCD', icon: Tv },
  { id: 'horseshoe', label: 'Horseshoe Hall', icon: Sparkles },
  { id: 'computer_lab', label: 'Computer Lab', icon: Cpu },
];

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
  } = useTimetable();

  // Batch Options (Alphabetically sorted + search keywords)
  const batchOptions = useMemo(() => {
    return batches.map((b) => ({
      id: b.id,
      title: b.name,
      subtitle: `${b.program} • Sem ${b.semester}`,
      badge: b.is_irregular ? 'Irregular' : undefined,
      badgeColor: 'amber' as const,
      searchTerms: `${b.name} ${b.program} ${b.semester} sem-${b.semester}`,
    }));
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

  const toggleRoomType = (type: RoomType) => {
    setFilterState((prev) => {
      const current = prev.selectedRoomTypes || [];
      const exists = current.includes(type);
      return {
        ...prev,
        selectedRoomTypes: exists
          ? current.filter((t) => t !== type)
          : [...current, type],
      };
    });
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
        <div className="flex-1 max-w-md min-w-[240px]">
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

      {/* Bottom Filter Row: Capability Tags, Department, Draft toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
        {/* Room Capability Tag Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Equipment:
          </span>
          {ROOM_TYPE_OPTIONS.map((opt) => {
            const isSelected = filterState.selectedRoomTypes.includes(opt.id);
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => toggleRoomType(opt.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 border border-slate-200/60'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right filters: Drafts toggle & search */}
        <div className="flex items-center gap-3">
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
