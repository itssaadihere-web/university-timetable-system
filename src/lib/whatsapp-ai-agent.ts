import { EnrichedClassSession } from '@/lib/whatsapp-data-service';

export interface GenerateAIResponseParams {
  userMessage: string;
  studentName?: string;
  batchName?: string;
  programName?: string;
  language?: 'english' | 'roman_urdu' | 'urdu';
  currentClass?: EnrichedClassSession;
  nextClass?: EnrichedClassSession;
  todayClasses?: EnrichedClassSession[];
  upcomingClasses?: EnrichedClassSession[];
  weeklySchedule?: Record<string, EnrichedClassSession[]> | string;
  matchedCourseSession?: EnrichedClassSession;
  roomInfo?: {
    roomName: string;
    building: string;
    floor: number;
    directions: string;
  };
  multipleBatchesFound?: string[];
  conversationHistory?: Array<{ role: 'user' | 'assistant'; text: string }>;
  intent?: 'next_class' | 'today' | 'tomorrow' | 'full_schedule' | 'course_inquiry' | 'room_navigation' | 'batch_selection' | 'general';
}

/**
 * Detects language of user query: english, roman_urdu, or urdu script
 */
export function detectLanguage(text: string): 'english' | 'roman_urdu' | 'urdu' {
  // Check for Urdu Arabic script unicode range (\u0600-\u06FF)
  if (/[\u0600-\u06FF]/.test(text)) {
    return 'urdu';
  }

  const lower = text.toLowerCase();
  const romanUrduKeywords = [
    'kahan', 'kab', 'konsi', 'kaunsi', 'kis', 'meri', 'mera', 'mere', 
    'aaj', 'kal', 'parson', 'batao', 'bataen', 'bata dein', 'shukriya', 
    'assalam', 'salaam', 'kya', 'hai', 'hain', 'hogi', 'hoga', 'pehle', 
    'agli', 'agla', 'kamra', 'rasta', 'kiddar', 'kidhr', 'kidher', 'kdr', 
    'hy', 'hn', 'he', 'kon', 'kaun', 'bhi', 'me', 'mein', 'mai', 'se', 
    'ko', 'par', 'pe', 'idhar', 'udhar', 'acha', 'theek', 'jee', 'bhai', 
    'sir', 'btao', 'h', 'kia', 'kitne'
  ];

  const words = lower.split(/[\s,?!.]+/);
  const matchCount = words.filter((w) => romanUrduKeywords.includes(w)).length;

  if (
    matchCount >= 1 || 
    lower.includes('kidhr') || 
    lower.includes('class kahan') || 
    lower.includes('konsi class') || 
    lower.includes('aaj ki class') ||
    lower.includes('class hy') ||
    lower.includes('class he')
  ) {
    return 'roman_urdu';
  }

  return 'english';
}

/**
 * Transcribes audio buffer from WhatsApp voice note using Google Gemini Multimodal
 */
export async function transcribeWhatsAppAudio(
  audioBuffer: Buffer,
  mimeType = 'audio/ogg'
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[Gemini AI] No GEMINI_API_KEY found, cannot transcribe audio.');
    return null;
  }

  try {
    const base64Audio = audioBuffer.toString('base64');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType.split(';')[0].trim(), // e.g. audio/ogg
                  data: base64Audio,
                },
              },
              {
                text: 'You are listening to a WhatsApp voice note from a student at Salim Habib University (SHU). The student may speak in English, Urdu, or Roman Urdu inquiring about their timetable, classes, or campus navigation. Please transcribe what the student said verbatim. Output ONLY the transcribed text, nothing else.',
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errData = await res.json();
      console.error('[Gemini AI Audio Transcription Error]:', errData);
      return null;
    }

    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    
    // Find text part (ignoring thinking signatures)
    let transcript = '';
    for (const p of parts) {
      if (p.text) {
        transcript += p.text + ' ';
      }
    }

    return transcript.trim() || null;
  } catch (err) {
    console.error('[Gemini AI Audio Transcription Exception]:', err);
    return null;
  }
}

/**
 * Generates human conversational text response using Gemini 3.8 Flash
 */
export async function generateHumanTimetableResponse(
  params: GenerateAIResponseParams
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const lang = params.language || detectLanguage(params.userMessage);

  if (apiKey) {
    try {
      const prompt = buildGeminiPrompt(params, lang);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        let aiText = '';
        for (const p of parts) {
          if (p.text) aiText += p.text;
        }

        if (aiText.trim()) {
          return aiText.trim();
        }
      } else {
        console.error('[Gemini AI Response Error]:', await res.text());
      }
    } catch (err) {
      console.error('[Gemini AI Exception]:', err);
    }
  }

  // Graceful fallback to natural human template engine if Gemini is offline
  return generateHumanFallbackResponse(params, lang);
}

/**
 * Builds system prompt for Gemini
 */
function buildGeminiPrompt(
  p: GenerateAIResponseParams,
  lang: 'english' | 'roman_urdu' | 'urdu'
): string {
  let weeklyStr = '';
  if (typeof p.weeklySchedule === 'string') {
    weeklyStr = p.weeklySchedule;
  } else if (p.weeklySchedule) {
    for (const [dayName, dayClasses] of Object.entries(p.weeklySchedule)) {
      weeklyStr += `Day: ${dayName}\n` + dayClasses.map(c => `  - ${c.startTime} to ${c.endTime}: ${c.courseName} (${c.courseCode}) in Room ${c.roomName} (${c.roomBuilding}, Floor ${c.roomFloor}) with ${c.facultyName}`).join('\n') + '\n';
    }
  }

  const timetableContext = {
    studentName: p.studentName || 'Student',
    batchName: p.batchName || 'Not selected yet',
    program: p.programName || '',
    completeWeeklyScheduleForThisBatch: weeklyStr || 'No weekly sessions recorded',
    specificCourseMatched: p.matchedCourseSession
      ? {
          courseName: p.matchedCourseSession.courseName,
          courseCode: p.matchedCourseSession.courseCode,
          day: p.matchedCourseSession.dayName,
          timings: `${p.matchedCourseSession.startTime} to ${p.matchedCourseSession.endTime}`,
          room: p.matchedCourseSession.roomName,
          building: p.matchedCourseSession.roomBuilding,
          floor: p.matchedCourseSession.roomFloor,
          faculty: p.matchedCourseSession.facultyName,
          walkingDirections: p.matchedCourseSession.navigationDirections,
        }
      : null,
    currentClass: p.currentClass
      ? `${p.currentClass.courseName} (${p.currentClass.courseCode}) in Room ${p.currentClass.roomName} (${p.currentClass.roomBuilding}) with ${p.currentClass.facultyName} from ${p.currentClass.startTime} to ${p.currentClass.endTime}`
      : 'None right now',
    nextClass: p.nextClass
      ? `${p.nextClass.courseName} (${p.nextClass.courseCode}) on ${p.nextClass.dayName} at ${p.nextClass.startTime} - ${p.nextClass.endTime} in Room ${p.nextClass.roomName} (${p.nextClass.roomBuilding}, Floor ${p.nextClass.roomFloor}) with ${p.nextClass.facultyName}`
      : 'No upcoming classes found',
    todayClasses: p.todayClasses && p.todayClasses.length > 0
      ? p.todayClasses.map(
          (c) =>
            `- ${c.startTime} to ${c.endTime}: ${c.courseName} (${c.courseCode}) in Room ${c.roomName} with ${c.facultyName}`
        ).join('\n')
      : 'No classes scheduled for today.',
    roomInfo: p.roomInfo
      ? `Room: ${p.roomInfo.roomName}, Building: ${p.roomInfo.building}, Floor: ${p.roomInfo.floor}. Directions: ${p.roomInfo.directions}`
      : null,
    multipleBatchesFound: p.multipleBatchesFound || [],
    recentConversationMemory: p.conversationHistory && p.conversationHistory.length > 0
      ? p.conversationHistory.slice(-5).map((m) => `${m.role === 'user' ? 'Student' : 'Assistant'}: ${m.text}`)
      : ['No previous messages (first message in session)'],
  };

  return `You are the official AI Timetable Assistant for Salim Habib University (SHU), Karachi.
A student sent a message on WhatsApp: "${p.userMessage}".

LIVE TIMETABLE CONTEXT FOR THIS STUDENT/BATCH:
${JSON.stringify(timetableContext, null, 2)}

CRITICAL INSTRUCTIONS:
1. STRICT LANGUAGE MATCHING:
   - You MUST reply in the EXACT SAME LANGUAGE and phrasing style as the user's question!
   - If the student asked in Roman Urdu (e.g. "Batch 1A acf islamic studies class kidhr hy?", "meri class kahan hai?", "aaj konsi class hy?"), your entire response MUST be in natural, polite Roman Urdu (e.g. "Batch 1A ACF ki Islamic Studies ki class Monday ko 01:00 PM se 03:00 PM tak Room TF-306 mein hogi...").
   - If the student asked in English (e.g. "Where is the Islamic studies class?"), reply in fluent, clear English.
   - If the student asked in Urdu script (اردو), reply in polite Urdu script.

2. ANSWER THE EXACT QUESTION ASKED:
   - DO NOT default to talking about "next class" unless the user specifically asked "What is my next class?"!
   - If the user asked about a specific subject (such as Islamic Studies, Islamiat, Marketing, Accounting, Microeconomics, Fehm-ul-Quran, Mathematics, etc.): Look up that subject in the weekly schedule and provide its exact day, timing (12-hour format e.g. 01:00 PM - 03:00 PM), room, and instructor!
   - If the user asked where a room is, explain its floor and directions.

3. TONE & FORMAT:
   - Speak warmly, respectfully, and clearly like an intelligent human university coordinator.
   - Absolutely DO NOT output robotic numbered command lists (e.g. "1. Next class, 2. Today's classes").
   - Format important details (Course, Timings, Room, Faculty) with subtle WhatsApp bolding (*text*).
   - Keep the reply direct and concise.`;
}

/**
 * Natural Human Fallback Generator (English & Roman Urdu)
 */
function generateHumanFallbackResponse(
  p: GenerateAIResponseParams,
  lang: 'english' | 'roman_urdu' | 'urdu'
): string {
  // If multiple batches need confirmation
  if (p.multipleBatchesFound && p.multipleBatchesFound.length > 0) {
    if (lang === 'roman_urdu') {
      return `Assalam-o-Alaikum! Aapke program ke liye yeh sections available hain:\n\n${p.multipleBatchesFound.map((b) => `• *${b}*`).join('\n')}\n\nMeherbani farma kar apna section tap karein ya bata dein taake main aapka schedule dikha sakoon.`;
    }
    if (lang === 'urdu') {
      return `السلام علیکم! آپ کے پروگرام کے لیے یہ سیکشنز دستیاب ہیں:\n\n${p.multipleBatchesFound.map((b) => `• *${b}*`).join('\n')}\n\nبراہ کرم اپنا سیکشن منتخب کریں تاکہ آپ کا ٹائم ٹیبل پیش کیا جا سکے۔`;
    }
    return `Hello! We found multiple sections for your program:\n\n${p.multipleBatchesFound.map((b) => `• *${b}*`).join('\n')}\n\nPlease tap your section below so I can show your exact schedule!`;
  }

  // If a specific course inquiry was matched
  if (p.matchedCourseSession) {
    const s = p.matchedCourseSession;
    if (lang === 'roman_urdu') {
      return `*${s.courseName}* (${s.courseCode}) ki class *${s.dayName}* ko *${s.startTime} se ${s.endTime}* tak *Room ${s.roomName}* (${s.roomBuilding}, Floor ${s.roomFloor}) mein hogi *${s.facultyName}* ke sath.\n\n${s.navigationDirections ? `💡 *Rasta:* ${s.navigationDirections}\n\n` : ''}Agar koi aur sawal ho tou zaroor batayein!`;
    }
    return `Your *${s.courseName}* (${s.courseCode}) class is scheduled on *${s.dayName}* from *${s.startTime} to ${s.endTime}* in *Room ${s.roomName}* (${s.roomBuilding}, Floor ${s.roomFloor}) with *${s.facultyName}*.\n\n${s.navigationDirections ? `💡 *Directions:* ${s.navigationDirections}\n\n` : ''}Have a great class!`;
  }

  // Next Class query ONLY if explicitly requested
  if (p.intent === 'next_class') {
    const next = p.nextClass;
    if (!next) {
      if (lang === 'roman_urdu') {
        return `Assalam-o-Alaikum! ${p.batchName ? `*${p.batchName}* ke liye ` : ''}filhal koi aainda class schedule nahi hai. Agar aapko pooray hafte ka timetable dekhna hai toh zaroor batayein!`;
      }
      return `Hi! ${p.batchName ? `For *${p.batchName}*, ` : ''}you do not have any upcoming lectures scheduled at the moment. Let me know if you would like to see your full weekly schedule!`;
    }

    if (lang === 'roman_urdu') {
      return `Assalam-o-Alaikum! ${p.studentName ? `${p.studentName}, ` : ''}aapki agli class:\n\n📚 *${next.courseName}* (${next.courseCode})\n🕒 *${next.dayName} | ${next.startTime} - ${next.endTime}*\n🏛️ *Room:* ${next.roomName} (${next.roomBuilding}, Floor ${next.roomFloor})\n👨‍🏫 *Instructor:* ${next.facultyName}\n\n${next.navigationDirections ? `💡 *Directions:* ${next.navigationDirections}\n\n` : ''}Agar koi aur sawal ho tou batayein!`;
    }
    return `Hey ${p.studentName || 'there'}! Here is your next upcoming lecture:\n\n📚 *${next.courseName}* (${next.courseCode})\n🕒 *${next.dayName} | ${next.startTime} - ${next.endTime}*\n🏛️ *Room:* ${next.roomName} (${next.roomBuilding}, Floor ${next.roomFloor})\n👨‍🏫 *Instructor:* ${next.facultyName}\n\n${next.navigationDirections ? `💡 *Directions:* ${next.navigationDirections}\n\n` : ''}Have a great class!`;
  }

  // Today's classes
  if (p.intent === 'today' || (p.todayClasses && p.todayClasses.length > 0)) {
    const classes = p.todayClasses || [];
    if (classes.length === 0) {
      if (lang === 'roman_urdu') {
        return `Assalam-o-Alaikum! Aaj ${p.batchName ? `*${p.batchName}* ki ` : ''}koi class schedule nahi hai. Enjoy your day!`;
      }
      return `Hi! There are no classes scheduled for today ${p.batchName ? `for *${p.batchName}*` : ''}. Enjoy your day!`;
    }

    const list = classes
      .map(
        (c) =>
          `• *${c.startTime} - ${c.endTime}*: ${c.courseName}\n  🏛️ Room: ${c.roomName} | 👨‍🏫 ${c.facultyName}`
      )
      .join('\n\n');

    if (lang === 'roman_urdu') {
      return `Assalam-o-Alaikum! Aaj ka schedule yeh hai:\n\n${list}\n\nAgar kisi room ka rasta chahiye ho toh pooch lijiye ga!`;
    }
    return `Here is your schedule for today:\n\n${list}\n\nLet me know if you need room walking directions or tomorrow's schedule!`;
  }

  // Room navigation
  if (p.roomInfo) {
    if (lang === 'roman_urdu') {
      return `🏛️ *Room ${p.roomInfo.roomName}*:\n• *Building:* ${p.roomInfo.building}\n• *Floor:* Floor ${p.roomInfo.floor}\n\n🚶 *Directions:*\n${p.roomInfo.directions}\n\nUmeed hai asani se mil jayega!`;
    }
    return `🏛️ *Room ${p.roomInfo.roomName} Location*:\n• *Building:* ${p.roomInfo.building}\n• *Floor:* Floor ${p.roomInfo.floor}\n\n🚶 *Walking Guide:*\n${p.roomInfo.directions}`;
  }

  // Greeting / General
  if (lang === 'roman_urdu') {
    return `Assalam-o-Alaikum! Salim Habib University Timetable Assistant mein khush-aamdeed. Main aapki classes, timings aur room locations batane ke liye hazir hoon. Kripya apna Roll Number ya Batch (maslan *Batch-3A-BAC*, *BAN-2*, ya *BBA 3rd*) batayein!`;
  }
  return `Assalam-o-Alaikum & Welcome to Salim Habib University Timetable Assistant! I'm here to help you with your class schedules, timings, and campus room directions. Please share your Roll Number or Batch (e.g. *Batch-3A-BAC*, *BAN-2*, or *BBA 3rd*) to get started!`;
}
