'use client';

import React, { useState } from 'react';
import { useTimetable } from '@/context/TimetableContext';
import { Faculty, Room, RoomType } from '@/types';
import { timeToMinutes } from '@/lib/conflict-engine';
import { exportTimetableToExcel, exportTimetableToPDF } from '@/lib/export-utils';
import { 
  BarChart3, 
  Users, 
  DoorOpen, 
  FileSpreadsheet, 
  FileText, 
  Sparkles, 
  AlertTriangle, 
  Clock, 
  Activity, 
  Sliders, 
  Edit3, 
  Check, 
  X, 
  Search, 
  Filter, 
  CheckCircle2, 
  Cpu, 
  Monitor, 
  Tv, 
  GraduationCap
} from 'lucide-react';

const ALL_ROOM_TYPES: { id: RoomType; label: string; icon: any }[] = [
  { id: 'standard', label: 'Standard Room', icon: GraduationCap },
  { id: 'multimedia', label: 'Multimedia', icon: Monitor },
  { id: 'interactive_lcd', label: 'Interactive LCD', icon: Tv },
  { id: 'horseshoe', label: 'Horseshoe Hall', icon: Sparkles },
  { id: 'computer_lab', label: 'Computer Lab', icon: Cpu },
];

export const AnalyticsReports: React.FC = () => {
  const { 
    faculty, 
    rooms, 
    courses, 
    batches, 
    sessions, 
    currentRole, 
    updateFaculty, 
    updateRoom 
  } = useTimetable();

  const [activeTab, setActiveTab] = useState<'faculty' | 'rooms'>('faculty');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roomTagFilter, setRoomTagFilter] = useState<string>('ALL');
  const [bottleneckThreshold, setBottleneckThreshold] = useState<number>(45);

  // Edit Modals State
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const canEdit = currentRole === 'coordinator' || currentRole === 'admin';

  // Sort faculty alphabetically
  const sortedFaculty = [...faculty].sort((a, b) => a.name.localeCompare(b.name));

  // Sort rooms alphabetically
  const sortedRooms = [...rooms].sort((a, b) => 
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );

  // Compute Faculty Load Analytics
  const facultyLoadData = sortedFaculty.map((teacher) => {
    const teacherSessions = sessions.filter(
      (s) => s.faculty_id === teacher.id && s.status !== 'cancelled'
    );

    const totalMinutes = teacherSessions.reduce((acc, s) => {
      return acc + (timeToMinutes(s.end_time) - timeToMinutes(s.start_time));
    }, 0);

    const totalHours = totalMinutes / 60;

    // Daily distribution (Days 1 to 7)
    const dayLoads: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    teacherSessions.forEach((s) => {
      dayLoads[s.day_of_week] = (dayLoads[s.day_of_week] || 0) + 1;
    });

    // Check back-to-back classes
    let hasBackToBack = false;
    for (let day = 1; day <= 7; day++) {
      const daySessions = teacherSessions
        .filter((s) => s.day_of_week === day)
        .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
      
      for (let i = 0; i < daySessions.length - 1; i++) {
        const gap = timeToMinutes(daySessions[i + 1].start_time) - timeToMinutes(daySessions[i].end_time);
        if (gap <= 20) {
          hasBackToBack = true;
          break;
        }
      }
    }

    const weeklyMaxHours = (teacher.max_load_per_day || 4) * 5;
    const isOverload = totalHours > weeklyMaxHours;
    const isNearLimit = totalHours >= weeklyMaxHours * 0.85;

    return {
      teacher,
      totalHours,
      sessionCount: teacherSessions.length,
      dayLoads,
      hasBackToBack,
      weeklyMaxHours,
      isOverload,
      isNearLimit,
    };
  });

  // Compute Room Utilization Analytics (Rate based on 32.5 teachable hours per week)
  const roomUtilizationData = sortedRooms.map((room) => {
    const roomSessions = sessions.filter(
      (s) => s.room_id === room.id && s.status !== 'cancelled'
    );

    const totalMinutes = roomSessions.reduce((acc, s) => {
      return acc + (timeToMinutes(s.end_time) - timeToMinutes(s.start_time));
    }, 0);

    const utilizationRate = Math.min(100, Math.round((totalMinutes / (32.5 * 60)) * 100));
    const isBottleneck = utilizationRate >= bottleneckThreshold;

    return {
      room,
      sessionCount: roomSessions.length,
      totalHours: (totalMinutes / 60).toFixed(1),
      utilizationRate,
      isBottleneck,
    };
  });

  // Filtered Datasets for Search & Tags
  const filteredFaculty = facultyLoadData.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.teacher.name.toLowerCase().includes(q) ||
      item.teacher.department.toLowerCase().includes(q)
    );
  });

  const filteredRooms = roomUtilizationData.filter((item) => {
    if (roomTagFilter !== 'ALL' && !item.room.room_types.includes(roomTagFilter as RoomType)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.room.name.toLowerCase().includes(q) ||
        item.room.building.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPI calculations
  const highLoadTeachersCount = facultyLoadData.filter((f) => f.isNearLimit || f.isOverload).length;
  const bottleneckRoomsCount = roomUtilizationData.filter((r) => r.isBottleneck).length;
  const avgUtilization = Math.round(
    roomUtilizationData.reduce((acc, r) => acc + r.utilizationRate, 0) / (rooms.length || 1)
  );

  const handleSaveFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty) return;
    setIsSaving(true);
    try {
      await updateFaculty(editingFaculty);
      setFeedbackMessage(`Updated workload limit for ${editingFaculty.name}`);
      setEditingFaculty(null);
      setTimeout(() => setFeedbackMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    setIsSaving(true);
    try {
      await updateRoom(editingRoom);
      setFeedbackMessage(`Updated room capabilities & capacity for ${editingRoom.name}`);
      setEditingRoom(null);
      setTimeout(() => setFeedbackMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRoomCapability = (tag: RoomType) => {
    if (!editingRoom) return;
    const exists = editingRoom.room_types.includes(tag);
    const updatedTags = exists
      ? editingRoom.room_types.filter((t) => t !== tag)
      : [...editingRoom.room_types, tag];
    
    setEditingRoom({
      ...editingRoom,
      room_types: updatedTags.length > 0 ? updatedTags : ['standard'],
    });
  };

  const handleExportAll = (format: 'excel' | 'pdf') => {
    const params = {
      sessions,
      rooms: sortedRooms,
      faculty: sortedFaculty,
      batches,
      courses,
      filterTitle: 'Comprehensive_Campus_Timetable',
    };
    if (format === 'excel') {
      exportTimetableToExcel(params);
    } else {
      exportTimetableToPDF(params);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 text-white rounded-3xl p-6 sm:p-7 shadow-sm border border-red-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider">
                Capacity & Resource Management
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600/70 text-white">
                Program Coordinator Console
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Teacher Load, Room Utilization & Specialty Bottlenecks
            </h2>
            <p className="text-xs sm:text-sm text-red-100/90 mt-1 max-w-2xl">
              Real-time governance of instructor daily hours, capacity bottlenecks, and specialized classroom equipment tags.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportAll('excel')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 rounded-xl shadow-xs transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={() => handleExportAll('pdf')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 rounded-xl shadow-xs transition-all"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Faculty Members</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{faculty.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Alphabetically organized</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">High Workload Alerts</span>
            <AlertTriangle className={`w-4 h-4 ${highLoadTeachersCount > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{highLoadTeachersCount}</p>
          <p className="text-[11px] text-amber-600 mt-0.5 font-medium">Near or exceeding daily limits</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Physical Rooms</span>
            <DoorOpen className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{rooms.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Avg Utilization: {avgUtilization}%</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Specialty Bottlenecks</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{bottleneckRoomsCount}</p>
          <p className="text-[11px] text-rose-600 mt-0.5 font-medium">Exceeding {bottleneckThreshold}% threshold</p>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Controls & Tab Ribbon */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('faculty')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'faculty'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Faculty Load Governer ({filteredFaculty.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('rooms')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'rooms'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DoorOpen className="w-3.5 h-3.5 text-teal-600" />
              <span>Room Utilization & Specialty ({filteredRooms.length})</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeTab === 'faculty' ? 'Search faculty name or dept...' : 'Search room name or building...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-shu-700 focus:outline-none"
            />
          </div>
        </div>

        {/* Room Specific Filter Ribbon */}
        {activeTab === 'rooms' && (
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Specialty Tag Filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filter Tag:
              </span>
              <button
                onClick={() => setRoomTagFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  roomTagFilter === 'ALL'
                    ? 'bg-shu-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Rooms
              </button>
              {ALL_ROOM_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = roomTagFilter === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setRoomTagFilter(t.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      isSelected
                        ? 'bg-teal-700 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottleneck Threshold Slider */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Sliders className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="text-[11px] font-bold text-slate-700">Bottleneck Trigger:</span>
              <input
                type="range"
                min="25"
                max="80"
                step="5"
                value={bottleneckThreshold}
                onChange={(e) => setBottleneckThreshold(parseInt(e.target.value, 10))}
                className="w-24 accent-purple-600 cursor-pointer"
              />
              <span className="font-mono font-bold text-purple-700 text-xs w-8 text-right">
                {bottleneckThreshold}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: Faculty Load Table */}
      {activeTab === 'faculty' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Faculty Member (A-Z)</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Daily Cap</th>
                  <th className="py-3 px-4 text-center">Weekly Hours</th>
                  <th className="py-3 px-4 text-center">Classes</th>
                  <th className="py-3 px-4 text-center">Mon</th>
                  <th className="py-3 px-4 text-center">Tue</th>
                  <th className="py-3 px-4 text-center">Wed</th>
                  <th className="py-3 px-4 text-center">Thu</th>
                  <th className="py-3 px-4 text-center">Fri</th>
                  <th className="py-3 px-4">Workload Status</th>
                  {canEdit && <th className="py-3 px-4 text-right">Coordinator Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredFaculty.map((item) => (
                  <tr key={item.teacher.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {item.teacher.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{item.teacher.department}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {item.teacher.max_load_per_day}h / day
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-indigo-700 font-mono">
                      {item.totalHours.toFixed(1)}h
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                      {item.sessionCount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                      {item.dayLoads[1] || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                      {item.dayLoads[2] || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                      {item.dayLoads[3] || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                      {item.dayLoads[4] || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                      {item.dayLoads[5] || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.isOverload ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> Overloaded
                        </span>
                      ) : item.isNearLimit ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> Near Cap ({item.totalHours.toFixed(0)}/{item.weeklyMaxHours}h)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Optimal
                        </span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setEditingFaculty(item.teacher)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Load</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Room Utilization & Specialty Bottlenecks Table */}
      {activeTab === 'rooms' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Room / Venue (Alphabetical A-Z)</th>
                  <th className="py-3 px-4">Building & Floor</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Specialty Equipment Tags</th>
                  <th className="py-3 px-4 text-center">Weekly Sessions</th>
                  <th className="py-3 px-4">Utilization Gauge</th>
                  <th className="py-3 px-4">Bottleneck Status</th>
                  {canEdit && <th className="py-3 px-4 text-right">Coordinator Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRooms.map((item) => (
                  <tr key={item.room.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{item.room.name}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {item.room.building} (Floor {item.room.floor})
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{item.room.capacity} seats</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        {item.room.room_types.map((tag) => (
                          <span
                            key={tag}
                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${
                              tag === 'interactive_lcd'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : tag === 'computer_lab'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : tag === 'horseshoe'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : tag === 'multimedia'
                                ? 'bg-teal-50 text-teal-700 border-teal-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-indigo-700 font-mono">
                      {item.sessionCount} classes ({item.totalHours}h)
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-32">
                        <div className="flex items-center justify-between text-[10px] mb-1 font-mono font-bold">
                          <span>{item.utilizationRate}%</span>
                          <span className="text-slate-400">/{bottleneckThreshold}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.isBottleneck
                                ? 'bg-rose-500'
                                : item.utilizationRate > 30
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(5, item.utilizationRate)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.isBottleneck ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> Specialty Bottleneck
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Available
                        </span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setEditingRoom(item.room)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Specialty</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Edit Faculty Workload Limit */}
      {editingFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit Faculty Workload Limit</h3>
                <p className="text-xs text-slate-500">{editingFaculty.name}</p>
              </div>
              <button
                onClick={() => setEditingFaculty(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFaculty} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={editingFaculty.department}
                  onChange={(e) =>
                    setEditingFaculty({ ...editingFaculty, department: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Max Daily Load Limit (Hours/Day)
                  </label>
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {editingFaculty.max_load_per_day} hours/day
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={editingFaculty.max_load_per_day}
                  onChange={(e) =>
                    setEditingFaculty({
                      ...editingFaculty,
                      max_load_per_day: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Weekly cap calculates as ~{editingFaculty.max_load_per_day * 5} hours across standard weekdays.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingFaculty(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Workload Limit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Room Capabilities & Capacity */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit Room & Specialty Capabilities</h3>
                <p className="text-xs text-slate-500">{editingRoom.name}</p>
              </div>
              <button
                onClick={() => setEditingRoom(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Building</label>
                  <input
                    type="text"
                    value={editingRoom.building}
                    onChange={(e) =>
                      setEditingRoom({ ...editingRoom, building: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Capacity (Seats)</label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={editingRoom.capacity}
                    onChange={(e) =>
                      setEditingRoom({
                        ...editingRoom,
                        capacity: parseInt(e.target.value, 10) || 30,
                      })
                    }
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-2">
                  Specialty Equipment & Capability Tags
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_ROOM_TYPES.map((tagObj) => {
                    const isChecked = editingRoom.room_types.includes(tagObj.id);
                    const Icon = tagObj.icon;
                    return (
                      <button
                        type="button"
                        key={tagObj.id}
                        onClick={() => toggleRoomCapability(tagObj.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          isChecked
                            ? 'bg-teal-50 border-teal-300 text-teal-900'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isChecked ? 'text-teal-600' : 'text-slate-400'}`} />
                          <span>{tagObj.label}</span>
                        </div>
                        {isChecked && <Check className="w-3.5 h-3.5 text-teal-600" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Course prerequisites and conflict engines automatically enforce room capability matching against these tags.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Room Capabilities'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
