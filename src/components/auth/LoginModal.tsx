'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { 
  X, 
  Lock, 
  Mail, 
  ShieldCheck, 
  GraduationCap, 
  UserCheck, 
  ArrowRight, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login, quickLogin, userAccounts } = useAuth();
  const [email, setEmail] = useState<string>('coordinator@univ.edu');
  const [password, setPassword] = useState<string>('••••••••');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (!res.success && res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
        return;
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (role: UserRole, userEmail?: string) => {
    quickLogin(role, userEmail);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-auto flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/fbs-logo.png"
                alt="Fatima Business School"
                className="h-10 w-auto object-contain"
              />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Fatima Business School</h3>
              <p className="text-[11px] text-shu-700 font-semibold">Salim Habib University Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Fast Role Switcher */}
        <div className="mt-4 p-3 bg-red-50/50 rounded-2xl border border-red-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Quick 1-Click Demo Login:
            </span>
            <span className="text-[10px] text-shu-700 font-bold">Instant Access</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleQuickLogin('admin', 'admin@univ.edu')}
              className="px-2 py-2 rounded-xl text-xs font-bold bg-white text-slate-800 border border-slate-200 hover:border-shu-700 hover:text-shu-700 hover:shadow-xs transition-all flex flex-col items-center gap-1"
            >
              <ShieldCheck className="w-4 h-4 text-shu-700" />
              <span>Admin</span>
            </button>

            <button
              onClick={() => handleQuickLogin('coordinator', 'coordinator@univ.edu')}
              className="px-2 py-2 rounded-xl text-xs font-bold bg-white text-slate-800 border border-slate-200 hover:border-shu-700 hover:text-shu-700 hover:shadow-xs transition-all flex flex-col items-center gap-1"
            >
              <Sparkles className="w-4 h-4 text-shu-700" />
              <span>Coordinator</span>
            </button>

            <button
              onClick={() => handleQuickLogin('faculty', 'alan.turing@univ.edu')}
              className="px-2 py-2 rounded-xl text-xs font-bold bg-white text-slate-800 border border-slate-200 hover:border-shu-700 hover:text-shu-700 hover:shadow-xs transition-all flex flex-col items-center gap-1"
            >
              <UserCheck className="w-4 h-4 text-teal-600" />
              <span>Faculty</span>
            </button>
          </div>
        </div>

        {/* Standard Email / Password Form */}
        <form onSubmit={handleStandardLogin} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Institutional Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="e.g. coordinator@shu.edu.pk"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-shu-700"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-shu-700"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-shu-700 hover:bg-shu-800 text-white font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
          >
            <span>{isSubmitting ? 'Verifying...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Public Student Mode Notice */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <button
            onClick={() => handleQuickLogin('student')}
            className="text-xs font-semibold text-slate-500 hover:text-shu-700 inline-flex items-center gap-1.5 transition-colors"
          >
            <GraduationCap className="w-4 h-4 text-shu-700" />
            <span>Are you a Student? No login required. View Public Schedule &rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};

