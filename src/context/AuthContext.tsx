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
  isInitialized: boolean;
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

const AUTH_USER_STORAGE_KEY = 'shu_timetable_active_user_v1';
const AUTH_ACCOUNTS_STORAGE_KEY = 'shu_timetable_user_accounts_v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(INITIAL_USER_ACCOUNTS);
  // Default to Public Student view initially until explicit credential login or localStorage recovery
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Restore authenticated user and accounts from localStorage on client mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // 1. Hydrate user accounts
      const storedAccountsRaw = localStorage.getItem(AUTH_ACCOUNTS_STORAGE_KEY);
      let currentAccounts = INITIAL_USER_ACCOUNTS;

      if (storedAccountsRaw) {
        const parsedAccounts = JSON.parse(storedAccountsRaw);
        if (Array.isArray(parsedAccounts) && parsedAccounts.length > 0) {
          // Merge initial system accounts to ensure default admin & coordinator are always available
          const existingIds = new Set(parsedAccounts.map((a: UserAccount) => a.id));
          const missingDefaults = INITIAL_USER_ACCOUNTS.filter((a) => !existingIds.has(a.id));
          currentAccounts = [...parsedAccounts, ...missingDefaults];
          setUserAccounts(currentAccounts);
        }
      } else {
        localStorage.setItem(AUTH_ACCOUNTS_STORAGE_KEY, JSON.stringify(INITIAL_USER_ACCOUNTS));
      }

      // 2. Hydrate active logged-in session
      const storedUserRaw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
      if (storedUserRaw) {
        const parsedUser = JSON.parse(storedUserRaw) as UserAccount;
        if (parsedUser && parsedUser.id) {
          // Re-validate against current accounts to get fresh details/permissions
          const matchedUser = currentAccounts.find(
            (u) => u.id === parsedUser.id || u.email.toLowerCase() === parsedUser.email.toLowerCase()
          );
          if (matchedUser) {
            setCurrentUser(matchedUser);
            // Refresh stored snapshot
            localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(matchedUser));
          } else {
            // Keep stored user if custom
            setCurrentUser(parsedUser);
          }
        }
      }
    } catch (e) {
      console.error('Failed to restore authentication session from localStorage:', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  const currentRole: UserRole = currentUser ? currentUser.role : 'student';
  const isAuthenticated = Boolean(currentUser);

  // Strict Login handler based on credential evaluation with localStorage persistence
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

    // Save active session in localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(found));
      } catch (e) {
        console.error('Failed to save user session to localStorage:', e);
      }
    }

    return { success: true };
  };

  // Logout (reverts to Public Student view and removes stored session)
  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(AUTH_USER_STORAGE_KEY);
      } catch (e) {
        console.error('Failed to clear user session from localStorage:', e);
      }
    }
  };

  // Role-based Account Creation with storage persistence
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

    const updated = [...userAccounts, newAccount];
    setUserAccounts(updated);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(AUTH_ACCOUNTS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist accounts to localStorage:', e);
      }
    }

    return { success: true };
  };

  // Delete Account (Admin only) with storage persistence
  const deleteAccount = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (currentUser?.role !== 'admin') {
      return { success: false, error: 'Only Administrators can remove user accounts.' };
    }

    if (userId === currentUser.id) {
      return { success: false, error: 'You cannot delete your own active admin account.' };
    }

    const updated = userAccounts.filter((u) => u.id !== userId);
    setUserAccounts(updated);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(AUTH_ACCOUNTS_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist accounts to localStorage:', e);
      }
    }

    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        isAuthenticated,
        isInitialized,
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
