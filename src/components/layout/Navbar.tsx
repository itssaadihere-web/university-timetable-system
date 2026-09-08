'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTimetable } from '@/context/TimetableContext';
import { 
  Calendar, 
  Lock, 
  LogOut, 
  ShieldCheck, 
  Sparkles, 
  UserCheck, 
  GraduationCap, 
  UserPlus,
  Radio,
  User
} from 'lucide-react';

interface NavbarProps {
  onOpenLoginModal: () => void;
  onOpenUserManagement: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLoginModal,
  onOpenUserManagement,
}) => {
  const { currentUser, currentRole, isAuthenticated, logout, quickLogin } = useAuth();
  const { activeSemester, lastSyncTime } = useTimetable();

  const getRoleBadge = () => {
    switch (currentRole) {
      case 'admin':
        return {
          label: 'System Administrator',
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: ShieldCheck,
        };
      case 'coordinator':
        return {
          label: 'Program Coordinator',
          badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          icon: Sparkles,
        };
      case 'faculty':
        return {
          label: 'Faculty / Instructor',
          badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
          icon: UserCheck,
        };
      default:
        return {
          label: 'Student (Public Access)',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: GraduationCap,
        };
    }
  };

  const roleInfo = getRoleBadge();
  const RoleIcon = roleInfo.icon;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Active Semester */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                  UniSchedule
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  {activeSemester?.name || 'Fall 2026'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                University Centralized Timetable & Resource Engine
              </p>
            </div>
          </div>

          {/* Center: Live Sync Pulse */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-700">Centralized Postgres Realtime</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-mono text-[11px]">{lastSyncTime}</span>
          </div>

          {/* Right: Auth Profile & Login Action */}
          <div className="flex items-center gap-3">
            {isAuthenticated && currentUser ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* User Role Tag */}
                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-xs font-bold text-slate-900">{currentUser.name}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold border ${roleInfo.badgeClass}`}
                    >
                      <RoleIcon className="w-3 h-3" />
                      <span>{roleInfo.label}</span>
                    </span>
                  </div>
                </div>

                {/* Switch / User Console (Admin/Coord) */}
                {(currentUser.role === 'admin' || currentUser.role === 'coordinator') && (
                  <button
                    onClick={onOpenUserManagement}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all"
                    title={
                      currentUser.role === 'admin'
                        ? 'Manage Users & Roles'
                        : 'Create Faculty Account'
                    }
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                )}

                {/* Switch Role / Login Modal */}
                <button
                  onClick={onOpenLoginModal}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                  title="Switch User Profile or Role"
                >
                  Switch
                </button>

                {/* Logout to Student View */}
                <button
                  onClick={logout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  title="Sign Out (Return to Student Public Schedule)"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Public Student View</span>
                </span>

                <button
                  onClick={onOpenLoginModal}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs hover:shadow transition-all"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Staff / Faculty Login</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
