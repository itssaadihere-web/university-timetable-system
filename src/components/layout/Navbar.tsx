'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTimetable } from '@/context/TimetableContext';
import { 
  Lock, 
  LogOut, 
  ShieldCheck, 
  Sparkles, 
  UserCheck, 
  GraduationCap, 
  UserPlus,
  CloudUpload,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface NavbarProps {
  onOpenLoginModal?: () => void;
  onOpenUserManagement: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLoginModal,
  onOpenUserManagement,
}) => {
  const { currentUser, currentRole, isAuthenticated, logout } = useAuth();
  const { syncAllToSupabase, sessions } = useTimetable();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ message: string; isError?: boolean } | null>(null);

  const handleSyncCloud = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await syncAllToSupabase();
      if (res.success) {
        setSyncStatus({ message: res.message || 'Synced successfully!' });
      } else {
        setSyncStatus({ message: res.message || 'Sync failed', isError: true });
      }
      setTimeout(() => setSyncStatus(null), 4500);
    } catch (err: any) {
      setSyncStatus({ message: err?.message || 'Sync error', isError: true });
      setTimeout(() => setSyncStatus(null), 4500);
    } finally {
      setIsSyncing(false);
    }
  };

  const getRoleBadge = () => {
    switch (currentRole) {
      case 'admin':
        return {
          label: 'System Admin',
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
          icon: ShieldCheck,
        };
      case 'coordinator':
        return {
          label: 'Program Coordinator',
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
          icon: Sparkles,
        };
      case 'faculty':
        return {
          label: 'Faculty Member',
          badgeClass: 'bg-teal-50 text-teal-700 border-teal-200/80',
          icon: UserCheck,
        };
      default:
        return {
          label: 'Student Portal',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: GraduationCap,
        };
    }
  };

  const roleInfo = getRoleBadge();
  const RoleIcon = roleInfo.icon;

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          {/* Brand & Logo */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="h-11 w-auto flex items-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/fbs-logo.png"
                alt="Fatima Business School - Salim Habib University"
                className="h-11 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </div>

            <div className="hidden sm:block border-l border-slate-200 pl-3.5">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg group-hover:text-shu-700 transition-colors">
                  Fatima Business School
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-shu-700 border border-red-200/80 tracking-wide uppercase">
                  SHU
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500">
                Faculty of Management Sciences
              </p>
            </div>
          </Link>

          {/* Center: Salim Habib University Logo */}
          <div className="flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/shu-logo.png"
              alt="Salim Habib University"
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </div>

          {/* Right: Auth Profile & Login Action */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Sync to Cloud Button */}
            <div className="relative flex items-center">
              <button
                onClick={handleSyncCloud}
                disabled={isSyncing}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all shadow-2xs ${
                  isSyncing
                    ? 'bg-amber-50 text-amber-700 border-amber-200 cursor-wait'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200/80 active:scale-95'
                }`}
                title="Sync all timetable sessions, rooms, faculty and batches to Supabase database"
              >
                <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce text-amber-600' : 'text-emerald-600'}`} />
                <span className="hidden sm:inline font-bold">
                  {isSyncing ? 'Syncing...' : 'Sync to Cloud'}
                </span>
                {sessions.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-emerald-200/80 text-emerald-900">
                    {sessions.length}
                  </span>
                )}
              </button>

              {/* Status Toast */}
              {syncStatus && (
                <div
                  className={`absolute right-0 top-full mt-2 w-72 p-2.5 rounded-xl border shadow-xl text-xs z-50 animate-fadeIn ${
                    syncStatus.isError
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {syncStatus.isError ? (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <span className="font-medium leading-relaxed">{syncStatus.message}</span>
                  </div>
                </div>
              )}
            </div>

            {isAuthenticated && currentUser ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* User Role Tag */}
                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-xs font-bold text-slate-900">{currentUser.name}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleInfo.badgeClass}`}
                    >
                      <RoleIcon className="w-3 h-3" />
                      <span>{roleInfo.label}</span>
                    </span>
                  </div>
                </div>

                {/* User Console (Admin/Coord) */}
                {(currentUser.role === 'admin' || currentUser.role === 'coordinator') && (
                  <button
                    onClick={onOpenUserManagement}
                    className="p-2 text-slate-500 hover:text-shu-700 hover:bg-red-50/80 rounded-xl transition-all border border-transparent hover:border-red-100"
                    title={
                      currentUser.role === 'admin'
                        ? 'Manage Users & Roles'
                        : 'Create Faculty Account'
                    }
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                )}

                {/* Logout */}
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50/80 hover:bg-rose-100 border border-rose-200/60 rounded-xl transition-all shadow-2xs"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-bold text-white bg-shu-700 hover:bg-shu-800 rounded-xl shadow-sm hover:shadow transition-all"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Faculty Login</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
