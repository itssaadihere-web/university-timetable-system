'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  Lock, 
  Mail, 
  GraduationCap, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  UserCheck, 
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, currentUser, isAuthenticated, logout } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showQuickHints, setShowQuickHints] = useState<boolean>(false);

  const handleQuickFill = (presetEmail: string, presetPass: string = 'pass@123') => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      // Successful login -> Redirect to main dashboard
      router.push('/');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Simple Navigation */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-shu-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Public Timetable</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-shu-700 border border-red-200">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Salim Habib University</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Login Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* Left Hero / Branding Panel */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-shu-950 p-8 text-white flex flex-col justify-between relative overflow-hidden">
            {/* Background Decorative Glows */}
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-shu-700/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-red-600/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/10 text-xs font-semibold text-red-200 mb-6">
                <Building2 className="w-3.5 h-3.5" />
                <span>Academic Portal</span>
              </div>

              <div className="h-16 w-auto flex items-center mb-4 bg-white/95 p-2 rounded-2xl w-fit shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/fbs-logo.png"
                  alt="Fatima Business School"
                  className="h-12 w-auto object-contain"
                />
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-2">
                Fatima Business School
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-300 mt-2">
                Faculty of Management Sciences & Faculty of Computer Science
              </p>
              <div className="w-12 h-1 bg-shu-600 rounded-full my-4"></div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Centralized timetable scheduling, classroom allocation management, and faculty advising workflow system.
              </p>
            </div>

            <div className="relative z-10 mt-8 pt-6 border-t border-white/10 space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero-Cost Server-Side Architecture</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Calendar className="w-4 h-4 text-shu-300 shrink-0" />
                <span>Role-Based Operational Access</span>
              </div>
            </div>
          </div>

          {/* Right Login Form Panel */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
            {isAuthenticated && currentUser ? (
              <div className="my-auto text-center py-6">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Already Signed In</h2>
                <p className="text-xs text-slate-500 mt-1">
                  You are currently logged in as <span className="font-bold text-slate-800">{currentUser.name}</span> ({currentUser.role}).
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => router.push('/')}
                    className="px-5 py-2.5 bg-shu-700 hover:bg-shu-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={logout}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Sign Out & Switch User
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Institutional Login
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Sign in with your Salim Habib University staff or faculty credentials.
                  </p>
                </div>

                <form onSubmit={handleSubmit} method="post" action="#" className="space-y-4">
                  <div>
                    <label htmlFor="login-page-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                      Institutional Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="login-page-email"
                        name="email"
                        type="email"
                        autoComplete="username email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="e.g. name@shu.edu.pk"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-shu-700 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="login-page-password" className="block text-xs font-bold text-slate-700">
                        Password
                      </label>
                      <span className="text-[11px] text-slate-400">Default: <code className="font-mono text-slate-600 bg-slate-100 px-1 py-0.5 rounded">pass@123</code></span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="login-page-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your account password"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-shu-700 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-shu-700 hover:bg-shu-800 active:bg-shu-900 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                  >
                    <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Quick Role Fill Credentials Bar */}
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-600">Quick Test Accounts:</span>
                    <button
                      type="button"
                      onClick={() => setShowQuickHints(!showQuickHints)}
                      className="text-[11px] text-shu-700 hover:underline font-semibold cursor-pointer"
                    >
                      {showQuickHints ? 'Hide Hints' : 'Show All Accounts'}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-left">
                    <button
                      type="button"
                      onClick={() => handleQuickFill('amanat.jalbani@shu.edu.pk')}
                      className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-[11px] font-semibold transition-all flex flex-col items-center text-center gap-1 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                      <span>Admin</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickFill('Priyanka.Bajaj@shu.edu.pk')}
                      className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 text-[11px] font-semibold transition-all flex flex-col items-center text-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-700" />
                      <span>Coordinator</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickFill('ghulam.mustafa@shu.edu.pk')}
                      className="p-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 text-[11px] font-semibold transition-all flex flex-col items-center text-center gap-1 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                      <span>Faculty</span>
                    </button>
                  </div>

                  {showQuickHints && (
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
                      <p><strong>Admin:</strong> <code className="text-slate-800 font-mono">amanat.jalbani@shu.edu.pk</code></p>
                      <p><strong>Coordinator:</strong> <code className="text-slate-800 font-mono">Priyanka.Bajaj@shu.edu.pk</code></p>
                      <p><strong>Faculty:</strong> <code className="text-slate-800 font-mono">ghulam.mustafa@shu.edu.pk</code>, <code className="text-slate-800 font-mono">yasar.rizwan@shu.edu.pk</code>, <code className="text-slate-800 font-mono">amna.alvi@shu.edu.pk</code></p>
                      <p className="text-[10px] text-slate-400 mt-1">All accounts use default password: <code className="font-mono">pass@123</code></p>
                    </div>
                  )}
                </div>

                {/* Public Student Access Link */}
                <div className="mt-6 text-center">
                  <Link
                    href="/"
                    className="text-xs font-semibold text-slate-500 hover:text-shu-700 inline-flex items-center gap-1.5 transition-colors"
                  >
                    <GraduationCap className="w-4 h-4 text-shu-700" />
                    <span>Are you a Student? No login required. View Public Timetable &rarr;</span>
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
              Salim Habib University • Fatima Business School Timetable Portal
            </div>
          </div>

        </div>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1">
          <span>Salim Habib University Academic Timetable System</span>
          <span className="text-[11px] text-slate-400">Secure Institutional Authentication</span>
        </div>
      </footer>
    </div>
  );
}
