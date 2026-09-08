import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { TimetableProvider } from '@/context/TimetableContext';

export const metadata: Metadata = {
  title: 'Fatima Business School | Salim Habib University — Academic Timetable Portal',
  description: 'Official Academic Timetable & Resource Scheduling System for Faculty of Management Sciences and Faculty of Computer Science at Fatima Business School, Salim Habib University.',
  icons: {
    icon: '/fbs-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen">
        <AuthProvider>
          <TimetableProvider>{children}</TimetableProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
