import React from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, ShieldAlert, CheckCircle2, MessageSquare, AlertTriangle, Scale } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Salim Habib University Timetable & WhatsApp System',
  description: 'Official Terms of Service for Salim Habib University Academic Timetable Portal and WhatsApp Notification Services.',
};

export default function TermsOfServicePage() {
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
            <Scale className="w-3.5 h-3.5 text-shu-700" />
            Official Terms of Service
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
            Terms of Service
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Academic Timetable Portal & Automated WhatsApp Notification Service
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span><strong>Effective Date:</strong> January 1, 2026</span>
            <span><strong>Last Updated:</strong> September 2026</span>
            <span><strong>Governing Body:</strong> Academic Operations, Salim Habib University</span>
          </div>
        </div>

        {/* Terms Body */}
        <div className="space-y-6 text-slate-700 text-sm sm:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-shu-700 shrink-0" />
              1. Acceptance of Terms
            </h2>
            <p className="mb-3">
              By accessing, browsing, or utilizing the <strong>Salim Habib University (SHU) Timetable Web Portal</strong> 
              or engaging with the connected <strong>WhatsApp Automated Academic Assistant</strong>, you confirm 
              that you have read, understood, and agreed to be bound by these Terms of Service and our connected Privacy Policy.
            </p>
            <p>
              If you do not agree to these terms, please refrain from using the web portal and discontinue 
              sending queries via WhatsApp.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-shu-700 shrink-0" />
              2. Scope of Service & Permitted Use
            </h2>
            <p className="mb-3">
              The Timetable System and WhatsApp Bot are provided exclusively for university students, faculty members, 
              department heads, and program coordinators to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>Check official course schedules, class timings, and room numbers.</li>
              <li>Receive real-time notifications about makeup sessions, room migrations, and exam timetable adjustments.</li>
              <li>Query venue equipment capabilities (e.g., interactive LCDs, multimedia setups, computer labs).</li>
              <li>Obtain campus room navigation directions for classroom complexes.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-shu-700 shrink-0" />
              3. WhatsApp Bot Acceptable Use & Guidelines
            </h2>
            <p className="mb-3">
              Users of the automated WhatsApp scheduling bot agree to the following operational parameters:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li>
                <strong>Authorized Academic Queries Only:</strong> Use messages solely for legitimate academic timetable inquiries (e.g., &ldquo;What is BSCS-4 next class?&rdquo; or &ldquo;Room 204 schedule today&rdquo;).
              </li>
              <li>
                <strong>No Abuse or Automated Flooding:</strong> You must not flood, script, reverse-engineer, or spam the WhatsApp number with repetitive or malicious payloads.
              </li>
              <li>
                <strong>Opting Out:</strong> You may cease receiving proactive WhatsApp timetable alerts at any point by typing <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono font-bold text-slate-800">STOP</code>.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-shu-700 shrink-0" />
              4. Timetable Accuracy & Schedule Disclaimers
            </h2>
            <p className="mb-3">
              While every reasonable effort is made by university coordinators to publish and maintain 100% clash-free schedules, 
              emergency circumstances (such as weather advisories, sudden instructor illnesses, or technical maintenance) may require 
              ad-hoc changes.
            </p>
            <p>
              Official announcements issued by the Office of the Registrar and official departmental notice boards always supersede 
              unprocessed or cached automated responses.
            </p>
          </section>

          {/* Section 5 */}
          <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-shu-700 shrink-0" />
              5. Intellectual Property & System Ownership
            </h2>
            <p>
              All academic course structures, timetable matrices, algorithms, custom software interfaces, trademarks, and logos 
              (including Fatima Business School and Salim Habib University insignia) are the intellectual property of Salim Habib 
              University. Unauthorized scraping or commercial reproduction is strictly prohibited.
            </p>
          </section>

          {/* Section 6 */}
          <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Scale className="w-5 h-5 text-shu-700 shrink-0" />
              6. Modifications & Contact Information
            </h2>
            <p className="mb-3">
              The University reserves the right to modify these Terms of Service at any time. Continued use of the portal 
              or WhatsApp assistant following any updates constitutes acceptance of the new terms.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm space-y-1.5 mt-3">
              <p><strong>Department:</strong> Academic Timetable & Scheduling Committee</p>
              <p><strong>Email:</strong> <a href="mailto:timetable@shu.edu.pk" className="text-shu-700 font-semibold underline">timetable@shu.edu.pk</a></p>
              <p><strong>Campus:</strong> Salim Habib University, NC-24, Deh Dih, Korangi Creek Road, Karachi, Pakistan</p>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Salim Habib University & Fatima Business School. All rights reserved.</p>
          <div className="flex items-center gap-4 font-medium">
            <Link href="/privacy" className="hover:text-shu-700 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/data-deletion" className="hover:text-shu-700 transition-colors">Data Deletion Instructions</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
