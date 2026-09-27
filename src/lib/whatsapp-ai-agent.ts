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
  roomInfo?: {
    roomName: string;
    building: string;
    floor: number;
    directions: string;
  };
  multipleBatchesFound?: string[];
  intent?: 'next_class' | 'today' | 'tomorrow' | 'full_schedule' | 'room_navigation' | 'batch_selection' | 'general';
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
    'agli', 'agla', 'kamra', 'rasta', 'kiddar', 'idhar', 'udhar', 'acha',
    'theek', 'jee', 'bhai', 'sir'
  ];

  const words = lower.split(/[\s,?!.]+/);
  const matchCount = words.filter((w) => romanUrduKeywords.includes(w)).length;

  if (matchCount >= 1 || lower.includes('class kahan') || lower.includes('konsi class') || lower.includes('aaj ki class')) {
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
  const timetableContext = {
    studentName: p.studentName || 'Student',
    batchName: p.batchName || 'Not selected yet',
    program: p.programName || '',
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
  };

  return `You are the official AI Timetable Assistant for Salim Habib University (SHU), Karachi.
A student just sent a message on WhatsApp: "${p.userMessage}".

LIVE TIMETABLE CONTEXT FOR THIS STUDENT/BATCH:
${JSON.stringify(timetableContext, null, 2)}

INSTRUCTIONS:
1. Speak warmly, respectfully, clearly, and concisely like a human university coordinator or counselor.
2. ABSOLUTELY DO NOT output rigid robotic menus or numbered command options like "1. What is my next class, 2. Today's classes, 3. Full Timetable, 4. Where is room TF-308".
3. Language Matching:
   - If language is 'roman_urdu', reply in natural, polite Roman Urdu (e.g. "Assalam-o-Alaikum! Batch-3A-BAC ke schedule ke mutabiq aap ki agli class...").
   - If language is 'urdu', reply in Urdu Arabic script.
   - If language is 'english', reply in warm, clear English.
4. If multiple sections were found for their batch (e.g. Batch-3A-BAC, Batch-3B-BAC, Batch-3C-BAC), politely inform them that there are sections available and ask them to confirm their section. Note: WhatsApp interactive buttons will also be sent with this message, so invite them to tap their section below.
5. Format important details (Course, Time, Room, Instructor) with subtle WhatsApp bolding (*text*) for readability.
6. Keep the message concise (1 to 2 short paragraphs or bullet points).`;
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

  // Next Class query
  if (p.intent === 'next_class' || p.nextClass) {
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
