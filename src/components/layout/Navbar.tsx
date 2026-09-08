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
        <div className="flex items-center justify-between h-20">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-auto flex items-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/fbs-logo.png"
                alt="Fatima Business School - Salim Habib University"
                className="h-12 w-auto object-contain"
              />
            </div>

            <div className="hidden sm:block border-l border-slate-200 pl-3.5">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                  Fatima Business School
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-50 text-shu-700 border border-red-200">
                  Salim Habib University
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500">
                Faculty of Management Sciences • Faculty of Computer Science
              </p>
            </div>
          </div>

          {/* Center: Live Sync & Academic Term */}
          <div className="hidden xl:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-800">
              {activeSemester?.name || 'Fall 2026 Term'}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 text-[11px]">Realtime Synced: {lastSyncTime}</span>
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
                    className="p-2 text-slate-500 hover:text-shu-700 hover:bg-red-50 rounded-xl transition-all"
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
                <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-shu-700 border border-red-200">
                  <GraduationCap className="w-3.5 h-3.5 text-shu-700" />
                  <span>Student Public Portal</span>
                </span>

                <button
                  onClick={onOpenLoginModal}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-shu-700 hover:bg-shu-800 rounded-xl shadow-xs hover:shadow transition-all"
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
