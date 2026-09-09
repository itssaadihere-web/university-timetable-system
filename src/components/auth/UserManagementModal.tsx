'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTimetable } from '@/context/TimetableContext';
import { UserRole } from '@/types';
import { 
  X, 
  UserPlus, 
  ShieldCheck, 
  Sparkles, 
  UserCheck, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Mail,
  User,
  Building,
  Lock
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userAccounts, createAccount, deleteAccount } = useAuth();
  const { faculty } = useTimetable();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('pass@123');
  const [role, setRole] = useState<UserRole>('faculty');
  const [department, setDepartment] = useState<string>('Management Sciences');
  const [facultyId, setFacultyId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'admin';
  const isCoordinator = currentUser?.role === 'coordinator';

  // Allowed roles for creation
  // Admin -> admin, coordinator, faculty
  // Coordinator -> faculty only
  const allowedRoles: { value: UserRole; label: string }[] = isAdmin
    ? [
        { value: 'faculty', label: 'Faculty / Instructor' },
        { value: 'coordinator', label: 'Program Coordinator' },
        { value: 'admin', label: 'System Administrator' },
      ]
    : [{ value: 'faculty', label: 'Faculty / Instructor' }];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await createAccount({
        name,
        email,
        password,
        role,
        department,
        faculty_id: role === 'faculty' ? facultyId : undefined,
      });

      if (!res.success && res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(`Account for "${name}" (${role}) successfully created.`);
      setName('');
      setEmail('');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create user account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to remove the account for "${userName}"?`)) {
      const res = await deleteAccount(userId);
      if (!res.success && res.error) {
        alert(res.error);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isAdmin ? 'User & Role Management Console' : 'Create Faculty Account'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAdmin
                  ? 'Provision Admin, Coordinator, and Faculty accounts'
                  : 'Program Coordinator: Provision Instructor & Faculty credentials'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs">
          {/* Create Form */}
          <form onSubmit={handleCreate} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3.5">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-indigo-600" />
              <span>Create New Institutional User</span>
            </h4>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Dr. Muhammad Ahmed"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="e.g. muhammad.ahmed@shu.edu.pk"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="e.g. pass@123"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign User Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {allowedRoles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Department</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                    placeholder="e.g. Computer Science"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {role === 'faculty' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Link to Faculty Profile (Optional)</label>
                <select
                  value={facultyId}
                  onChange={(e) => setFacultyId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Link to existing Faculty Profile --</option>
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.department})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm hover:shadow transition-all"
              >
                {isSubmitting ? 'Creating...' : 'Provision User Account'}
              </button>
            </div>
          </form>

          {/* User List */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs flex items-center justify-between">
              <span>Registered System Accounts ({userAccounts.length})</span>
            </h4>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
              {userAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        acc.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : acc.role === 'coordinator'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-teal-100 text-teal-700'
                      }`}
                    >
                      {acc.role === 'admin' ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : acc.role === 'coordinator' ? (
                        <Sparkles className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">{acc.name}</h5>
                      <p className="text-[11px] text-slate-500">
                        {acc.email} • <span className="font-medium">{acc.department}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        acc.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : acc.role === 'coordinator'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {acc.role}
                    </span>

                    {isAdmin && acc.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDelete(acc.id, acc.name)}
                        title="Delete User Account"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
