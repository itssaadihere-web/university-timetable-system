import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { TimetableProvider } from '@/context/TimetableContext';

export const metadata: Metadata = {
  title: 'University Timetable & Resource Scheduling System',
  description: 'Zero-operational-cost centralized timetable scheduling and resource allocation engine',
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
