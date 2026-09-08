'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, UserRole } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const INITIAL_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr-admin-01',
    name: 'Dr. Sarah Jenkins',
    email: 'admin@univ.edu',
    role: 'admin',
    department: 'Central Administration',
    created_at: '2026-09-01T00:00:00Z',
  },
  {
    id: 'usr-coord-01',
    name: 'Prof. Alice Martin',
    email: 'coordinator@univ.edu',
    role: 'coordinator',
    department: 'Computer Science & Engineering',
    created_at: '2026-09-01T00:00:00Z',
    created_by: 'Dr. Sarah Jenkins',
  },
  {
    id: 'usr-fac-turing',
    name: 'Dr. Alan Turing',
    email: 'alan.turing@univ.edu',
    role: 'faculty',
    department: 'Computer Science',
    faculty_id: 'f0000001-0000-0000-0000-000000000001',
    created_at: '2026-09-01T00:00:00Z',
    created_by: 'Prof. Alice Martin',
  },
  {
    id: 'usr-fac-hopper',
    name: 'Dr. Grace Hopper',
    email: 'grace.hopper@univ.edu',
    role: 'faculty',
    department: 'Computer Science',
    faculty_id: 'f0000004-0000-0000-0000-000000000004',
    created_at: '2026-09-01T00:00:00Z',
    created_by: 'Prof. Alice Martin',
  },
  {
    id: 'usr-fac-lovelace',
    name: 'Prof. Ada Lovelace',
    email: 'ada.lovelace@univ.edu',
    role: 'faculty',
    department: 'Software Engineering',
    faculty_id: 'f0000002-0000-0000-0000-000000000002',
    created_at: '2026-09-01T00:00:00Z',
    created_by: 'Prof. Alice Martin',
  },
];

interface AuthContextType {
  currentUser: UserAccount | null; // null means Public Student View
  currentRole: UserRole;
  isAuthenticated: boolean;
  userAccounts: UserAccount[];
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  quickLogin: (role: UserRole, email?: string) => void;
  logout: () => void;
  createAccount: (data: {
    name: string;
    email: string;
    role: UserRole;
    department?: string;
    faculty_id?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: (userId: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(INITIAL_USER_ACCOUNTS);
  // Default to Coordinator for demo/evaluation convenience, or public student
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(INITIAL_USER_ACCOUNTS[1]); // Program Coordinator

  const currentRole: UserRole = currentUser ? currentUser.role : 'student';
  const isAuthenticated = Boolean(currentUser);

  // Login handler
  const login = async (email: string, _password?: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const found = userAccounts.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (!found) {
      return {
        success: false,
        error: `No registered account found for ${email}. Please check credentials or contact an administrator.`,
      };
    }

    setCurrentUser(found);
    return { success: true };
  };

  // Quick 1-click role switcher for evaluating different views
  const quickLogin = (role: UserRole, specificEmail?: string) => {
    if (role === 'student') {
      setCurrentUser(null); // Public Student view
      return;
    }

    if (specificEmail) {
      const match = userAccounts.find((u) => u.email.toLowerCase() === specificEmail.toLowerCase());
      if (match) {
        setCurrentUser(match);
        return;
      }
    }

    // Default match by role
    const match = userAccounts.find((u) => u.role === role);
    if (match) {
      setCurrentUser(match);
    }
  };

  // Logout (reverts to Public Student view)
  const logout = () => {
    setCurrentUser(null);
  };

  // Role-based Account Creation
  const createAccount = async (data: {
    name: string;
    email: string;
    role: UserRole;
    department?: string;
    faculty_id?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    // Permission Check
    if (!currentUser) {
      return { success: false, error: 'You must be logged in to create accounts.' };
    }

    if (currentUser.role === 'faculty') {
      return { success: false, error: 'Faculty members do not have permission to create accounts.' };
    }

    if (currentUser.role === 'coordinator' && data.role !== 'faculty') {
      return {
        success: false,
        error: 'Program Coordinators can only create Faculty accounts. Admin accounts must be created by an Admin.',
      };
    }

    // Check duplicate email
    const exists = userAccounts.some((u) => u.email.toLowerCase() === data.email.trim().toLowerCase());
    if (exists) {
      return { success: false, error: `An account with email "${data.email}" already exists.` };
    }

    const newAccount: UserAccount = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      role: data.role,
      department: data.department || currentUser.department || 'Academic Department',
      faculty_id: data.faculty_id,
      created_at: new Date().toISOString(),
      created_by: currentUser.name,
    };

    setUserAccounts((prev) => [...prev, newAccount]);
    return { success: true };
  };

  // Delete Account (Admin only)
  const deleteAccount = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Only Administrators can remove user accounts.' };
    }

    if (userId === currentUser.id) {
      return { success: false, error: 'You cannot delete your own active admin account.' };
    }

    setUserAccounts((prev) => prev.filter((u) => u.id !== userId));
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        isAuthenticated,
        userAccounts,
        login,
        quickLogin,
        logout,
        createAccount,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
