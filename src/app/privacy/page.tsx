import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, Database, UserX, Mail, Building, Bell } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Salim Habib University Timetable & WhatsApp System',
  description: 'Official Privacy Policy for Salim Habib University and Fatima Business School Academic Timetable & WhatsApp Assistant System.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 backdrop-blur-md bg-white/90">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-shu-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Timetable Portal
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-shu-700" />
            Meta & Regulatory Compliant
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Document Header */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-10 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold bg-red-50 text-shu-700 border border-red-200 mb-4">
            Salim Habib University • Fatima Business School
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Academic Timetable Portal & Automated WhatsApp Assistant System
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span><strong>Effective Date:</strong> January 1, 2026</span>
            <span><strong>Last Updated:</strong> September 2026</span>
            <span><strong>Data Controller:</strong> Salim Habib University IT & Academic Registrar</span>
          </div>
        </div>

        {/* Policy Body */}
        <div className="space-y-6 text-slate-700 text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Building className="w-5 h-5 text-shu-700 shrink-0" />
              1. Overview & Data Controller
            </h2>
            <p className="mb-3">
              This Privacy Policy explains how <strong>Salim Habib University (SHU)</strong>, including the 
              <strong> Fatima Business School (FBS)</strong> and the <strong>Faculty of Computer Science</strong>, 
              collects, uses, protects, and handles personal data through its official web application portal 
              and the connected <strong>WhatsApp Cloud API Timetable Bot</strong>.
            </p>
            <p>
              Salim Habib University acts as the Data Controller. Our registered campus is located at NC-24, Deh Dih, 
              Korangi Creek Road, Karachi, Pakistan.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Database className="w-5 h-5 text-shu-700 shrink-0" />
              2. Information We Collect
            </h2>
            <p className="mb-4">
              We strictly adhere to data minimization principles. We only collect and process data necessary to provide academic schedule services:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>
                <strong>WhatsApp Messaging Data:</strong> When you message the SHU Timetable WhatsApp number, we receive your phone number (E.164 format) and your message text to parse scheduling queries (e.g., student batch, faculty name, course code, room lookups).
              </li>
              <li>
                <strong>Academic Identity (Internal):</strong> Enrolled student batch codes (e.g., BBA-4, BSCS-6) or faculty assignment names provided during query execution.
              </li>
              <li>
                <strong>Portal Authentication:</strong> For administrative, coordinator, or faculty portal logins, we securely process encrypted institutional credentials.
              </li>
              <li>
                <strong>Technical Logs:</strong> Server and webhook timestamps, delivery status reports, and anonymous query performance metrics to ensure system uptime.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Bell className="w-5 h-5 text-shu-700 shrink-0" />
              3. Purpose & Legal Basis of Processing
            </h2>
            <p className="mb-3">We process your information solely for the following legitimate academic purposes:</p>
            <ol className="list-decimal pl-6 space-y-2 text-slate-600">
              <li>Delivering automated real-time answers to timetable, room schedule, and faculty venue queries via WhatsApp.</li>
              <li>Dispatching authorized university notices regarding class cancellations, venue migrations, or makeup sessions.</li>
              <li>Assisting students and faculty with step-by-step campus room navigation.</li>
              <li>Maintaining system security, preventing unauthorized access, and debugging technical disruptions.</li>
            </ol>
            <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
              <strong>Strict Guarantee:</strong> We do NOT sell, rent, monetize, or trade student or faculty personal data to any third-party marketing companies, ad brokers, or commercial entities under any circumstances.
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-shu-700 shrink-0" />
              4. WhatsApp Cloud API & Meta Infrastructure
            </h2>
            <p className="mb-3">
              Our WhatsApp automated bot operates over the official <strong>Meta WhatsApp Cloud API</strong>. 
              By engaging with our WhatsApp support line, you acknowledge that messages pass through Meta’s secure 
              end-to-end and transport-layer encrypted transmission channels subject to Meta’s Platform Terms.
            </p>
            <p>
              Meta processes data as our enterprise technology infrastructure provider. No WhatsApp chat logs 
              are repurposed for external behavioral tracking.
            </p>
          </section>

          {/* Section 5 */}
          <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <UserX className="w-5 h-5 text-shu-700 shrink-0" />
              5. Data Retention & User Deletion Rights
            </h2>
            <p className="mb-3">
              We retain query logs only for as long as necessary to maintain academic operational records and 
              satisfy academic audit requirements.
            </p>
            <p className="mb-4">
              You possess full rights to request deletion of your phone number, chat records, and associated metadata:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600 mb-4">
              <li>
                <strong>Instant Opt-Out:</strong> Text <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono font-bold text-slate-800">STOP</code> or <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono font-bold text-slate-800">DELETE</code> to our WhatsApp service number at any time to instantly revoke bot interaction.
              </li>
              <li>
                <strong>Formal Erasure:</strong> Visit our dedicated <Link href="/data-deletion" className="text-shu-700 font-semibold underline hover:text-shu-800">User Data Deletion Instructions Page</Link> for detailed steps to have your records permanently purged from university databases.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-shu-700 shrink-0" />
              6. Contact & Data Protection Officer
            </h2>
            <p className="mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please contact:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm space-y-1.5">
              <p><strong>Department:</strong> Directorate of Information Technology & Academic Scheduling</p>
              <p><strong>Institution:</strong> Salim Habib University (SHU) / Fatima Business School</p>
              <p><strong>Campus Address:</strong> NC-24, Deh Dih, Korangi Creek Road, Karachi-74900, Pakistan</p>
              <p><strong>Official Email:</strong> <a href="mailto:timetable@shu.edu.pk" className="text-shu-700 font-semibold underline">timetable@shu.edu.pk</a> / <a href="mailto:info@shu.edu.pk" className="text-shu-700 font-semibold underline">info@shu.edu.pk</a></p>
              <p><strong>University Website:</strong> <a href="https://shu.edu.pk" target="_blank" rel="noreferrer" className="text-shu-700 font-semibold underline">https://shu.edu.pk</a></p>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Salim Habib University & Fatima Business School. All rights reserved.</p>
          <div className="flex items-center gap-4 font-medium">
            <Link href="/terms" className="hover:text-shu-700 transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link href="/data-deletion" className="hover:text-shu-700 transition-colors">Data Deletion Instructions</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
