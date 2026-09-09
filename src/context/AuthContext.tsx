'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, UserRole } from '@/types';
import { INITIAL_FACULTY } from '@/lib/mock-data';

export const INITIAL_USER_ACCOUNTS: UserAccount[] = [
  // Administrator
  {
    id: 'usr-admin-jalbani',
    name: 'Prof. Dr. Amanat Ali Jalbani',
    email: 'amanat.jalbani@shu.edu.pk',
    role: 'admin',
    password: 'pass@123',
    department: 'Executive Administration',
    created_at: '2026-09-01T00:00:00Z',
  },
  // Program Coordinator
  {
    id: 'usr-coord-bajaj',
    name: 'Priyanka Bajaj',
    email: 'Priyanka.Bajaj@shu.edu.pk',
    role: 'coordinator',
    password: 'pass@123',
    department: 'HR & Management',
    created_at: '2026-09-01T00:00:00Z',
    created_by: 'Prof. Dr. Amanat Ali Jalbani',
  },
  // Faculty Accounts (Seeded from all initial faculty with dot-separated SHU emails)
  ...INITIAL_FACULTY.filter(
    (f) => f.email.toLowerCase() !== 'priyanka.bajaj@shu.edu.pk'
  ).map((f) => ({
    id: `usr-${f.id}`,
    name: f.name,
    email: f.email,
    role: 'faculty' as UserRole,
    password: 'pass@123',
    department: f.department,
    faculty_id: f.id,
    created_at: '2026-09-01T00:00:00Z',
    created_by: 'Priyanka Bajaj',
  })),
];

interface AuthContextType {
  currentUser: UserAccount | null; // null means Public Student View
  currentRole: UserRole;
  isAuthenticated: boolean;
  userAccounts: UserAccount[];
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  createAccount: (data: {
    name: string;
    email: string;
    role: UserRole;
    password?: string;
    department?: string;
    faculty_id?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: (userId: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(INITIAL_USER_ACCOUNTS);
  // Default to Public Student view initially until explicit credential login
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  const currentRole: UserRole = currentUser ? currentUser.role : 'student';
  const isAuthenticated = Boolean(currentUser);

  // Strict Login handler based on credential evaluation
  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const providedPass = password ? password.trim() : '';

    if (!trimmedEmail) {
      return {
        success: false,
        error: 'Please enter your institutional email address.',
      };
    }

    if (!providedPass) {
      return {
        success: false,
        error: 'Please enter your account password.',
      };
    }

    const found = userAccounts.find((u) => u.email.toLowerCase() === trimmedEmail);

    if (!found) {
      return {
        success: false,
        error: `No registered account found for "${email}". Please check credentials or contact an administrator.`,
      };
    }

    const expectedPassword = found.password || 'pass@123';
    if (providedPass !== expectedPassword) {
      return {
        success: false,
        error: 'Incorrect password. Please verify your credentials and try again.',
      };
    }

    // Assign logged in user (determines access & dashboard type strictly by role)
    setCurrentUser(found);
    return { success: true };
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
    password?: string;
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
      email: data.email.trim(),
      role: data.role,
      password: data.password || 'pass@123',
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
