import React from 'react';
import Link from 'next/link';
import { Trash2, ArrowLeft, CheckCircle, Mail, MessageSquare, ShieldCheck, Clock } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Data Deletion Instructions | Salim Habib University WhatsApp Timetable Bot',
  description: 'Step-by-step instructions for deleting personal data and WhatsApp messaging records associated with Salim Habib University Timetable System.',
};

export default function DataDeletionPage() {
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
            <Trash2 className="w-3.5 h-3.5 text-shu-700" />
            Meta Platform Compliant
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Document Header */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-10 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold bg-red-50 text-shu-700 border border-red-200 mb-4">
            Salim Habib University • Meta WhatsApp Cloud API
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            User Data Deletion Instructions
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            How to request the removal and permanent erasure of your personal data and WhatsApp message logs.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span><strong>Compliance Standard:</strong> Meta Platform Terms & GDPR Right to Erasure</span>
            <span><strong>Response SLA:</strong> Within 48–72 Business Hours</span>
          </div>
        </div>

        {/* Steps Card */}
        <div className="space-y-6 text-slate-700 text-sm sm:text-base leading-relaxed">
          {/* Method 1: Instant WhatsApp Opt-Out */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-green-700">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Option 1: Instant Bot Stop & Session Clear (Immediate)</h2>
                <p className="text-xs text-slate-500">Fastest method directly from your WhatsApp phone</p>
              </div>
            </div>
            <ol className="list-decimal pl-6 space-y-3 text-slate-600">
              <li>
                Open WhatsApp on your mobile device or WhatsApp Web.
              </li>
              <li>
                Navigate to your chat conversation with the <strong>SHU Timetable Assistant</strong> bot.
              </li>
              <li>
                Type and send the single word <code className="bg-slate-100 px-2.5 py-1 rounded text-xs font-mono font-bold text-slate-900 border border-slate-200">STOP</code> or <code className="bg-slate-100 px-2.5 py-1 rounded text-xs font-mono font-bold text-slate-900 border border-slate-200">DELETE</code>.
              </li>
              <li>
                The automated system will instantly terminate your active dialogue session and mark your phone number as unsubscribed from automated notification broadcasts.
              </li>
            </ol>
          </div>

          {/* Method 2: Complete Historical Erasure via Email */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-shu-700">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Option 2: Complete Database Record Erasure (Permanent)</h2>
                <p className="text-xs text-slate-500">For students, alumni, or faculty requesting full data purging</p>
              </div>
            </div>
            <p className="mb-4">
              If you wish to have all stored records, query logs, phone numbers, and notification histories completely deleted from our cloud servers and Supabase database, follow these steps:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-5 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-shu-700 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                <p className="text-xs sm:text-sm">
                  Send an email to: <a href="mailto:timetable@shu.edu.pk?subject=User%20Data%20Deletion%20Request" className="font-bold text-shu-700 underline">timetable@shu.edu.pk</a> (cc: <a href="mailto:info@shu.edu.pk" className="font-semibold underline text-slate-700">info@shu.edu.pk</a>).
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-shu-700 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                <p className="text-xs sm:text-sm">
                  Use the subject line: <code className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-900 font-semibold">User Data Deletion Request - WhatsApp Timetable</code>.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-shu-700 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                <p className="text-xs sm:text-sm">
                  Include in the message body your <strong>WhatsApp Phone Number</strong> (with country code, e.g., <code className="font-mono text-slate-800">+92 300 XXXXXXX</code>) and your University Student/Faculty ID (if applicable).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm">
              <Clock className="w-5 h-5 shrink-0 text-blue-700" />
              <span>
                <strong>Processing SLA:</strong> Our IT engineering desk verifies and purges all matching phone records within <strong>48 to 72 business hours</strong>, and will send a written confirmation email upon successful deletion.
              </span>
            </div>
          </div>

          {/* Scope of Deleted Data */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-shu-700" />
              What Data is Deleted Upon Request?
            </h3>
            <ul className="grid sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-600">
              <li className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>WhatsApp Phone Number (E.164)</span>
              </li>
              <li className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Chat query and interaction history</span>
              </li>
              <li className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Notification broadcast preferences</span>
              </li>
              <li className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Temporary session cache & tokens</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Salim Habib University & Fatima Business School. All rights reserved.</p>
          <div className="flex items-center gap-4 font-medium">
            <Link href="/privacy" className="hover:text-shu-700 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-shu-700 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
