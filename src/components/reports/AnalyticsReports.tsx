'use client';

import React, { useState } from 'react';
import { useTimetable } from '@/context/TimetableContext';
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
  Layers,
  ChevronRight
} from 'lucide-react';

export const AnalyticsReports: React.FC = () => {
  const { faculty, rooms, courses, batches, sessions } = useTimetable();
  const [activeTab, setActiveTab] = useState<'faculty' | 'rooms'>('faculty');

  // Compute Faculty Load Analytics
  const facultyLoadData = faculty.map((teacher) => {
    const teacherSessions = sessions.filter(
      (s) => s.faculty_id === teacher.id && s.status !== 'cancelled'
    );

    const totalMinutes = teacherSessions.reduce((acc, s) => {
      return acc + (timeToMinutes(s.end_time) - timeToMinutes(s.start_time));
    }, 0);

    const totalHours = totalMinutes / 60;

    // Daily distribution
    const dayLoads: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    teacherSessions.forEach((s) => {
      dayLoads[s.day_of_week] = (dayLoads[s.day_of_week] || 0) + 1;
    });

    // Check back-to-back classes
    let hasBackToBack = false;
    for (let day = 1; day <= 6; day++) {
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

    return {
      teacher,
      totalHours,
      sessionCount: teacherSessions.length,
      dayLoads,
      hasBackToBack,
      isNearLimit: totalHours >= teacher.max_load_per_day * 4,
    };
  });

  // Compute Room Utilization Analytics
  // Total available slots in a week = 6 days * 6 slots = 36 slots
  const TOTAL_WEEKLY_SLOTS = 36;
  const roomUtilizationData = rooms.map((room) => {
    const roomSessions = sessions.filter(
      (s) => s.room_id === room.id && s.status !== 'cancelled'
    );

    const utilizationRate = Math.min(100, Math.round((roomSessions.length / TOTAL_WEEKLY_SLOTS) * 100));

    return {
      room,
      sessionCount: roomSessions.length,
      utilizationRate,
      isBottleneck: utilizationRate >= 45,
    };
  });

  const handleExportAll = (format: 'excel' | 'pdf') => {
    if (format === 'excel') {
      exportTimetableToExcel({
        sessions,
        rooms,
        faculty,
        batches,
        courses,
        filterTitle: 'Comprehensive_Campus_Timetable',
      });
    } else {
      exportTimetableToPDF({
        sessions,
        rooms,
        faculty,
        batches,
        courses,
        filterTitle: 'Comprehensive_Campus_Timetable',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500 text-white uppercase tracking-wider">
                Analytics & Utilization
              </span>
              <span className="text-xs text-slate-300">Campus Resource Optimization</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Faculty Workload & Room Utilization Heatmap
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Monitor weekly instructor teaching loads, identify back-to-back strain, and spot capacity bottlenecks on specialty rooms (Multimedia, Horseshoe, LCD).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportAll('excel')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 rounded-lg shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={() => handleExportAll('pdf')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 rounded-lg shadow-sm transition-all"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('faculty')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'faculty'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Faculty Load Report ({faculty.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'rooms'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          <span>Room Utilization & Specialty Bottlenecks ({rooms.length})</span>
        </button>
      </div>

      {/* Tab 1: Faculty Load */}
      {activeTab === 'faculty' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Weekly Hours</th>
                  <th className="py-3 px-4 text-center">Classes</th>
                  <th className="py-3 px-4 text-center">Mon</th>
                  <th className="py-3 px-4 text-center">Tue</th>
                  <th className="py-3 px-4 text-center">Wed</th>
                  <th className="py-3 px-4 text-center">Thu</th>
                  <th className="py-3 px-4 text-center">Fri</th>
                  <th className="py-3 px-4">Load Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {facultyLoadData.map((item) => (
                  <tr key={item.teacher.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {item.teacher.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{item.teacher.department}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-indigo-700 font-mono">
                      {item.totalHours.toFixed(1)} hrs
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold">
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
                      {item.isNearLimit ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> High Load
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Optimal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Room Utilization */}
      {activeTab === 'rooms' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Room / Venue</th>
                  <th className="py-3 px-4">Building & Floor</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Equipment Tags</th>
                  <th className="py-3 px-4">Weekly Sessions</th>
                  <th className="py-3 px-4">Utilization Rate</th>
                  <th className="py-3 px-4">Bottleneck Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {roomUtilizationData.map((item) => (
                  <tr key={item.room.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{item.room.name}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {item.room.building} (Floor {item.room.floor})
                    </td>
                    <td className="py-3.5 px-4 font-semibold">{item.room.capacity} seats</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        {item.room.room_types.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[10px] border border-slate-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-indigo-700 font-mono">
                      {item.sessionCount} classes
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-32">
                        <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                          <span>{item.utilizationRate}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.utilizationRate > 40
                                ? 'bg-amber-500'
                                : 'bg-indigo-600'
                            }`}
                            style={{ width: `${item.utilizationRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.isBottleneck ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> High Demand Bottleneck
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Available Capacity
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
