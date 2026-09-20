'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Mic, 
  X, 
  Minimize2, 
  Maximize2, 
  RotateCcw, 
  CheckCheck, 
  Compass, 
  Clock, 
  User, 
  BookOpen,
  Volume2
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  isVoice?: boolean;
  interactive?: {
    type: 'button' | 'list';
    buttons?: Array<{ id: string; title: string }>;
    sections?: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
    buttonLabel?: string;
  };
}

export function WhatsAppAgentSimulator() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputText, setInputText] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+92 336 2500595');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'agent',
      text: '👋 *Assalam-o-Alaikum! Welcome to Salim Habib University (SHU) AI Timetable Assistant.*\n\nI can help you with your daily schedule, upcoming classes, and campus room directions in English, Urdu, or Roman Urdu.\n\n🎓 *Please select your Batch / Section or enter your Roll Number:*',
      timestamp: 'Just now',
      interactive: {
        type: 'list',
        buttonLabel: 'Select Batch 📚',
        sections: [
          {
            title: 'Active Batches',
            rows: [
              { id: 'batch_sec_1a', title: 'Section 1A', description: 'BBA / AF / BAN 1st Sem' },
              { id: 'batch_bba_4', title: 'BBA-4', description: 'BBA 4th Semester' },
              { id: 'batch_ban_2', title: 'BAN-2', description: 'BS Business Analytics' },
              { id: 'batch_ft_2', title: 'BS(FT)-2', description: 'BS Financial Technology' },
              { id: 'batch_af_3a', title: 'BS(AF)-3A', description: 'Accounting & Finance' },
            ],
          },
        ],
      },
    },
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = (customMessage || inputText).trim();
    if (!textToSend || isLoading) return;

    const userMsgId = 'usr-' + Date.now();
    const newMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!customMessage) setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          message: textToSend,
        }),
      });

      const data = await res.json();

      if (data.success && data.agentReply) {
        let interactiveData: any = undefined;
        if (data.hasInteractive) {
          if (data.interactiveType === 'button') {
            interactiveData = {
              type: 'button',
              buttons: [
                { id: 'btn_next_class', title: '🕒 Next Class' },
                { id: 'btn_today', title: "📅 Today's Schedule" },
                { id: 'btn_full_timetable', title: '📋 Full Timetable' },
              ],
            };
          } else if (data.interactiveType === 'list') {
            interactiveData = {
              type: 'list',
              buttonLabel: 'Select Batch 📚',
              sections: [
                {
                  title: 'Active Batches',
                  rows: [
                    { id: 'batch_sec_1a', title: 'Section 1A', description: 'BBA / AF / BAN 1st Sem' },
                    { id: 'batch_bba_4', title: 'BBA-4', description: 'BBA 4th Semester' },
                    { id: 'batch_ban_2', title: 'BAN-2', description: 'BS Business Analytics' },
                    { id: 'batch_ft_2', title: 'BS(FT)-2', description: 'BS Financial Technology' },
                  ],
                },
              ],
            };
          }
        }

        const agentMsg: ChatMessage = {
          id: 'agent-' + Date.now(),
          sender: 'agent',
          text: data.agentReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          interactive: interactiveData,
        };
        setMessages((prev) => [...prev, agentMsg]);
      } else {
        const errMsg: ChatMessage = {
          id: 'err-' + Date.now(),
          sender: 'agent',
          text: `⚠️ *Response Received:* ${data.error || 'Please try again.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        sender: 'agent',
        text: `⚠️ Connection Error: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceDemo = async () => {
    setIsRecording(true);
    setTimeout(async () => {
      setIsRecording(false);
      const sampleVoiceQueries = [
        'Mujhe meri agli class batao kahan hai',
        'Where is room TF-308 located on campus?',
        'I forgot my roll number, show me Section 1A schedule',
      ];
      const randomQuery = sampleVoiceQueries[Math.floor(Math.random() * sampleVoiceQueries.length)];
      
      const voiceUserMsg: ChatMessage = {
        id: 'voice-' + Date.now(),
        sender: 'user',
        text: `🎙️ "${randomQuery}"`,
        isVoice: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, voiceUserMsg]);
      await handleSendMessage(randomQuery);
    }, 1200);
  };

  const resetSession = async () => {
    await handleSendMessage('reset');
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-full shadow-2xl transition-all transform hover:scale-105 border-2 border-white/20"
          title="Open Live WhatsApp Agent Demo"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 fill-current" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-300 rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full"></span>
          </div>
          <span className="font-semibold text-sm tracking-wide">Live WhatsApp Agent Demo</span>
        </button>
      )}

      {/* WhatsApp Mobile Chat Mockup Window */}
      {isOpen && (
        <div 
          className={`fixed z-50 transition-all duration-300 shadow-2xl border border-slate-700/30 rounded-2xl overflow-hidden flex flex-col bg-[#0b141a] text-slate-100 ${
            isMinimized 
              ? 'bottom-6 right-6 w-80 h-16' 
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[410px] h-[650px] max-h-[90vh]'
          }`}
        >
          {/* WhatsApp Header */}
          <div className="bg-[#202c33] px-3.5 py-2.5 flex items-center justify-between border-b border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-sm shadow">
                  🏛️
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#202c33] rounded-full"></span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs sm:text-sm text-slate-100">SHU Timetable Assistant</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-medium px-1.5 py-0.2 rounded border border-emerald-500/30">Official</span>
                </div>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Online • Multi-lingual AI
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-300">
              <button 
                onClick={resetSession}
                title="Reset Session / Change Student"
                className="p-1.5 hover:bg-slate-700/50 rounded-full transition text-slate-300 hover:text-white"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-slate-700/50 rounded-full transition text-slate-300 hover:text-white"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-700/50 rounded-full transition text-slate-300 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Phone Selector Bar */}
              <div className="bg-[#111b21] px-3 py-1.5 flex items-center justify-between text-[11px] border-b border-slate-800 text-slate-400">
                <span className="flex items-center gap-1">
                  📱 Recipient: <strong className="text-emerald-400">{phoneNumber}</strong>
                </span>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                  Supabase Live Sync
                </span>
              </div>

              {/* Messages Content (WhatsApp Background Wallpaper Style) */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#0b141a] bg-opacity-95 bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px]">
                {messages.map((m) => (
                  <div 
                    key={m.id}
                    className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-xl px-3.5 py-2 text-xs leading-relaxed shadow-md ${
                        m.sender === 'user'
                          ? 'bg-[#005c4b] text-slate-100 rounded-tr-none'
                          : 'bg-[#202c33] text-slate-100 rounded-tl-none border border-slate-700/40'
                      }`}
                    >
                      {/* Voice Note Indicator */}
                      {m.isVoice && (
                        <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-semibold mb-1 pb-1 border-b border-emerald-600/30">
                          <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                          <span>Voice Note (Transcribed)</span>
                        </div>
                      )}

                      {/* Formatted Text Content */}
                      <div className="whitespace-pre-wrap font-sans">
                        {m.text.split('\n').map((line, lIdx) => {
                          let rendered = line;
                          const boldParts = line.split(/\*(.*?)\*/g);
                          if (boldParts.length > 1) {
                            return (
                              <p key={lIdx} className="my-0.5">
                                {boldParts.map((part, pIdx) => 
                                  pIdx % 2 === 1 ? <strong key={pIdx} className="font-semibold text-emerald-300">{part}</strong> : part
                                )}
                              </p>
                            );
                          }
                          return <p key={lIdx} className="my-0.5">{line}</p>;
                        })}
                      </div>

                      {/* Interactive Buttons Rendering */}
                      {m.interactive?.type === 'button' && m.interactive.buttons && (
                        <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex flex-col gap-1.5">
                          {m.interactive.buttons.map((btn) => (
                            <button
                              key={btn.id}
                              onClick={() => handleSendMessage(btn.id)}
                              className="w-full bg-[#111b21] hover:bg-emerald-900/60 text-emerald-400 hover:text-emerald-200 border border-emerald-500/30 py-1.5 px-2.5 rounded-lg text-xs font-medium text-center transition flex items-center justify-center gap-1 shadow-sm"
                            >
                              <span>{btn.title}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Interactive List Picker Rendering */}
                      {m.interactive?.type === 'list' && m.interactive.sections && (
                        <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex flex-col gap-1.5">
                          <span className="text-[11px] text-slate-400 font-semibold mb-0.5">
                            👉 {m.interactive.buttonLabel || 'Select an option'}:
                          </span>
                          {m.interactive.sections[0]?.rows.map((row) => (
                            <button
                              key={row.id}
                              onClick={() => handleSendMessage(row.title)}
                              className="w-full text-left bg-[#111b21] hover:bg-emerald-900/50 text-slate-200 hover:text-white border border-slate-700/70 p-2 rounded-lg text-xs transition flex flex-col gap-0.5 shadow-sm"
                            >
                              <span className="font-semibold text-emerald-400">{row.title}</span>
                              {row.description && <span className="text-[10px] text-slate-400">{row.description}</span>}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400">
                        <span>{m.timestamp}</span>
                        {m.sender === 'user' && <CheckCheck className="w-3.5 h-3.5 text-sky-400 inline" />}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 bg-[#202c33] px-3 py-2 rounded-xl rounded-tl-none w-fit text-xs text-slate-400 border border-slate-700/40 animate-pulse">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                    <span>AI Assistant is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Carousel */}
              <div className="bg-[#111b21] px-2.5 py-1.5 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => handleSendMessage("I don't know my roll number")}
                  className="whitespace-nowrap text-[11px] bg-[#202c33] hover:bg-slate-700 text-emerald-400 px-2 py-1 rounded-md border border-slate-700 flex items-center gap-1"
                >
                  <User className="w-3 h-3" /> Don't know Roll No
                </button>
                <button
                  onClick={() => handleSendMessage('What is my next class?')}
                  className="whitespace-nowrap text-[11px] bg-[#202c33] hover:bg-slate-700 text-sky-400 px-2 py-1 rounded-md border border-slate-700 flex items-center gap-1"
                >
                  <Clock className="w-3 h-3" /> Next Class
                </button>
                <button
                  onClick={() => handleSendMessage('Where is room TF-308?')}
                  className="whitespace-nowrap text-[11px] bg-[#202c33] hover:bg-slate-700 text-amber-400 px-2 py-1 rounded-md border border-slate-700 flex items-center gap-1"
                >
                  <Compass className="w-3 h-3" /> TF-308 Directions
                </button>
                <button
                  onClick={() => handleSendMessage('Sir Ghulam Mustafa class schedule')}
                  className="whitespace-nowrap text-[11px] bg-[#202c33] hover:bg-slate-700 text-purple-400 px-2 py-1 rounded-md border border-slate-700 flex items-center gap-1"
                >
                  <BookOpen className="w-3 h-3" /> Faculty Schedule
                </button>
              </div>

              {/* Chat Input Bar */}
              <div className="bg-[#202c33] p-2.5 flex items-center gap-2 border-t border-slate-700/50">
                <button
                  onClick={handleVoiceDemo}
                  disabled={isLoading || isRecording}
                  title="Simulate Voice Note Message"
                  className={`p-2 rounded-full transition ${
                    isRecording 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-[#111b21] hover:bg-slate-700 text-emerald-400'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder={isRecording ? 'Listening voice note...' : 'Type in Urdu, Roman, or English...'}
                  disabled={isLoading}
                  className="flex-1 bg-[#111b21] text-xs text-slate-100 placeholder-slate-500 px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isLoading}
                  className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
