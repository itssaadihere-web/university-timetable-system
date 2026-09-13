'use client';

import React, { useState } from 'react';
import { 
  MessageSquare, 
  Smartphone, 
  CheckCircle2, 
  Copy, 
  Send, 
  Bot, 
  User, 
  Clock, 
  HelpCircle, 
  Compass, 
  ShieldCheck, 
  RefreshCw,
  Building,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useTimetable } from '@/context/TimetableContext';

export const WhatsAppAgentManager: React.FC = () => {
  const { students, batches, courses, faculty, rooms } = useTimetable();

  // Test state
  const [testPhoneNumber, setTestPhoneNumber] = useState<string>('+92 300 9876543');
  const [testInput, setTestInput] = useState<string>('My roll number is AF-2026-001');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'agent'; text: string; time: string }>>([
    {
      sender: 'agent',
      text: '👋 *Welcome to Salim Habib University (SHU) Timetable Assistant!*\n\nYou can ask me for:\n1️⃣ *Timetable:* Send Roll No (e.g. `AF-2026-001`) or Batch (e.g. `Section 1A`)\n2️⃣ *Next Class:* Ask *"What is my next class?"*\n3️⃣ *Room & Floor:* Ask *"Where is room TF-308?"*\n\n*Note:* We will first reconfirm your inquiry and then deliver your schedule instantly!',
      time: 'Just now',
    },
  ]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : '/api/whatsapp/webhook';
  const designatedNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+92 300 1234567';

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim() || isSending) return;

    const userMsg = testInput.trim();
    setTestInput('');

    const newHistory = [
      ...chatHistory,
      { sender: 'user' as const, text: userMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ];
    setChatHistory(newHistory);
    setIsSending(true);

    try {
      const res = await fetch('/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: testPhoneNumber,
          message: userMsg,
        }),
      });

      const data = await res.json();
      if (data.agentReply) {
        setChatHistory([
          ...newHistory,
          {
            sender: 'agent',
            text: data.agentReply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      setChatHistory([
        ...newHistory,
        {
          sender: 'agent',
          text: '⚠️ Failed to connect to WhatsApp Agent engine. Please verify server status.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner: Designated WhatsApp Agent Overview */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-700/40">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-400/30">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Designated Official WhatsApp Agent Active</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Salim Habib University WhatsApp Timetable & Navigation Hub
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Students can message the designated university WhatsApp number directly from their phones to receive instant personalized schedules, next class alerts, and step-by-step SHU/FPS campus room navigation.
          </p>

          <div className="flex items-center gap-4 flex-wrap pt-2">
            <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-2xl border border-white/10 text-xs font-mono font-bold">
              <span className="text-emerald-400">Designated Number:</span>
              <span className="text-white">{designatedNumber}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-2xl border border-white/10 text-xs font-mono">
              <span className="text-emerald-400">Response Speed:</span>
              <span className="text-white">&lt; 3 Seconds</span>
            </div>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none"></div>
      </div>

      {/* Grid: 2 Columns (Configuration Details & Live Interactive Tester) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 Cols): Rules & Campus Navigation Guide */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Cloud API & Webhook Configuration Box */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Meta WhatsApp Cloud API Endpoint</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                Live
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Configure this Webhook URL in your Meta Business Suite or WhatsApp Cloud Developer portal:
            </p>

            <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 font-mono text-[11px] text-slate-800 break-all">
              <span className="flex-1 truncate">{webhookUrl}</span>
              <button
                onClick={handleCopyWebhook}
                className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 shrink-0 cursor-pointer"
                title="Copy Webhook URL"
              >
                {copiedUrl ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Strict Reconfirmation & Campus Rules Box */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-shu-700" />
              <span>Campus Navigation & Floor Decoding Rules</span>
            </h3>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80">
                <strong className="text-amber-950 block mb-1">🏢 Campus Building Clarification:</strong>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-900">
                  <li><strong>SHU Building</strong> = The Old Main Campus Building</li>
                  <li><strong>FPS Building</strong> = The New Pharmacy & Sciences Building</li>
                </ul>
              </div>

              <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-200/80">
                <strong className="text-indigo-950 block mb-1">📶 SHU Room Floor Code System:</strong>
                <ul className="grid grid-cols-2 gap-1.5 text-[11px] text-indigo-900">
                  <li><strong>Prefix A-*</strong> ➔ Ground Floor</li>
                  <li><strong>Prefix B-* / FF-*</strong> ➔ 1st Floor</li>
                  <li><strong>Prefix C-* / SF-*</strong> ➔ 2nd Floor</li>
                  <li><strong>Prefix D-* / TF-*</strong> ➔ 3rd Floor</li>
                  <li className="col-span-2"><strong>Prefix FRF-*</strong> ➔ 4th Floor Horseshoe Halls</li>
                </ul>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/80">
                <strong className="text-emerald-950 block mb-1">💬 Reconfirmation Protocol:</strong>
                <p className="text-[11px] text-emerald-900">
                  When a student messages, the agent first quotes and reconfirms their inquiry in the next message. Once the student replies <strong>'1'</strong> or <strong>'Yes'</strong>, the exact schedule/navigation is delivered immediately!
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (7 Cols): WhatsApp Live Chat Simulator */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-[640px]">
          
          {/* Chat Header */}
          <div className="p-4 bg-emerald-800 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white border border-white/20">
                <Bot className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">
                  SHU WhatsApp Timetable Agent
                </h4>
                <span className="text-[10px] text-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Online • Serving Real WhatsApp Users</span>
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setChatHistory([
                  {
                    sender: 'agent',
                    text: '👋 *Welcome to Salim Habib University (SHU) Timetable Assistant!*\n\nYou can ask me for:\n1️⃣ *Timetable:* Send Roll No (e.g. `AF-2026-001`) or Batch (e.g. `Section 1A`)\n2️⃣ *Next Class:* Ask *"What is my next class?"*\n3️⃣ *Room & Floor:* Ask *"Where is room TF-308?"*\n\n*Note:* We will first reconfirm your inquiry and then deliver your schedule instantly!',
                    time: 'Just now',
                  },
                ]);
              }}
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-700/50 rounded-xl transition-all cursor-pointer text-xs flex items-center gap-1"
              title="Reset Conversation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
            <span className="text-[11px] font-bold text-slate-500 shrink-0">Try Query:</span>
            <button
              onClick={() => setTestInput('My roll number is AF-2026-001')}
              className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 font-semibold text-[11px] shrink-0 cursor-pointer"
            >
              AF-2026-001
            </button>
            <button
              onClick={() => setTestInput('Section 1A timetable')}
              className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 font-semibold text-[11px] shrink-0 cursor-pointer"
            >
              Section 1A
            </button>
            <button
              onClick={() => setTestInput('What is my next class?')}
              className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 font-semibold text-[11px] shrink-0 cursor-pointer"
            >
              Next Class
            </button>
            <button
              onClick={() => setTestInput('Where is room TF-308?')}
              className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 font-semibold text-[11px] shrink-0 cursor-pointer"
            >
              Where is TF-308?
            </button>
            <button
              onClick={() => setTestInput('Yes')}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shrink-0 cursor-pointer"
            >
              Reply &quot;Yes&quot;
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#efeae2]/40">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-2xs whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-none'
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/70'
                  }`}
                >
                  {msg.text}
                  <span className="block text-[9px] text-slate-400 text-right mt-1 font-mono">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce"></span>
                <span>Agent is thinking...</span>
              </div>
            )}
          </div>

          {/* Message Input Bar */}
          <form onSubmit={handleSendTestMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
            <input
              type="text"
              placeholder="Type message (e.g. 'My roll no is AF-2026-001', 'Where is room TF-308', 'Yes')..."
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />

            <button
              type="submit"
              disabled={!testInput.trim() || isSending}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-2xl shadow-xs transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
