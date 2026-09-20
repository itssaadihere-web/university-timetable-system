import { 
  ClassSession, 
  Student, 
  Batch, 
  Course, 
  Faculty, 
  Room, 
  SemesterCalendarEvent 
} from '@/types';
import { 
  TIMETABLE_DAYS, 
  formatTo12Hour, 
  formatTimeRange, 
  timeToMinutes 
} from '@/lib/conflict-engine';
import { 
  getRoomNavigationDetails, 
  formatWhatsAppRoomNavigation 
} from '@/lib/campus-navigation';

export interface UserConversationProfile {
  phoneNumber: string;
  studentId?: string;
  studentName?: string;
  rollNumber?: string;
  batchId?: string;
  batchName?: string;
  program?: string;
  isIdentified: boolean;
  preferredLanguage?: 'en' | 'roman_urdu' | 'urdu';
  conversationHistory: Array<{ role: 'user' | 'assistant'; text: string; timestamp: number }>;
  lastActivity: number;
}

// Global in-memory conversation store for multi-turn conversational memory
const userProfiles: Record<string, UserConversationProfile> = {};

export function getUserProfile(phoneNumber: string): UserConversationProfile {
  if (!userProfiles[phoneNumber]) {
    userProfiles[phoneNumber] = {
      phoneNumber,
      isIdentified: false,
      conversationHistory: [],
      lastActivity: Date.now(),
    };
  }
  return userProfiles[phoneNumber];
}

export function updateUserProfile(phoneNumber: string, updates: Partial<UserConversationProfile>): UserConversationProfile {
  const current = getUserProfile(phoneNumber);
  userProfiles[phoneNumber] = {
    ...current,
    ...updates,
    lastActivity: Date.now(),
  };
  return userProfiles[phoneNumber];
}

/**
 * Detect language: English, Urdu script, or Roman Urdu / Hindi
 */
export function detectLanguage(text: string): 'en' | 'roman_urdu' | 'urdu' {
  // Check for Arabic/Urdu unicode script
  const urduRegex = /[\u0600-\u06FF\u0750-\u077F]/;
  if (urduRegex.test(text)) {
    return 'urdu';
  }

  // Common Roman Urdu / Hindi keywords
  const romanKeywords = [
    'meri', 'mera', 'mere', 'mujhe', 'batao', 'bata', 'bhai', 'kahan', 'kidhar', 'kab', 'hai', 'hain',
    'kya', 'konsi', 'pehle', 'pehli', 'agli', 'aaj', 'kal', 'parson', 'nahi', 'pata', 'roll', 'shukriya',
    'salam', 'kuch', 'kaun', 'kitne', 'baje', 'chutti', 'room', 'sir', 'maam'
  ];

  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  const matchCount = words.filter(w => romanKeywords.includes(w)).length;

  if (matchCount >= 1 || text.toLowerCase().includes('nahi pata') || text.toLowerCase().includes('kahan hai')) {
    return 'roman_urdu';
  }

  return 'en';
}

export interface AIContextData {
  students: Student[];
  batches: Batch[];
  courses: Course[];
  faculty: Faculty[];
  rooms: Room[];
  sessions: ClassSession[];
  calendarEvents?: SemesterCalendarEvent[];
  currentTimeStr?: string;
  currentDayOfWeek?: number;
}

/**
 * Core Conversational AI Response Generator
 * Evaluates live database data and responds in the student's exact language and dialect
 */
export async function generateConversationalResponse(params: {
  phoneNumber: string;
  userMessage: string;
  datasets: AIContextData;
}): Promise<{ replyText: string; detectedLang: 'en' | 'roman_urdu' | 'urdu'; profile: UserConversationProfile }> {
  const { phoneNumber, userMessage, datasets } = params;
  const profile = getUserProfile(phoneNumber);
  const lang = detectLanguage(userMessage);
  profile.preferredLanguage = lang;

  // Add user message to history
  profile.conversationHistory.push({ role: 'user', text: userMessage, timestamp: Date.now() });
  if (profile.conversationHistory.length > 20) {
    profile.conversationHistory = profile.conversationHistory.slice(-20);
  }

  const normalized = userMessage.trim().toLowerCase();

  // 1. Try to identify student from message (if not identified or switching identity)
  const isReset = normalized === 'reset' || normalized === 'switch' || normalized === 'logout';
  if (isReset) {
    profile.isIdentified = false;
    profile.studentName = undefined;
    profile.rollNumber = undefined;
    profile.batchId = undefined;
    profile.batchName = undefined;
    profile.program = undefined;

    let reply = '';
    if (lang === 'roman_urdu') {
      reply = 'Aapka profile reset kardiya gaya hai. Apna Roll Number ya Batch Name (jaise BBA-4, Section 1A, BAN-2) batayein taake main aapka schedule dikha sakoon.';
    } else if (lang === 'urdu') {
      reply = 'آپ کا پروفائل ری سیٹ کر دیا گیا ہے۔ براہ کرم اپنا رول نمبر یا بیچ کا نام بتائیں۔';
    } else {
      reply = 'Your profile has been reset. Please provide your Student Roll Number or Batch/Section name (e.g. BBA-4, Section 1A, BAN-2) to access your timetable.';
    }
    profile.conversationHistory.push({ role: 'assistant', text: reply, timestamp: Date.now() });
    return { replyText: reply, detectedLang: lang, profile };
  }

  // Check for Roll Number match in message
  const matchedStudent = datasets.students.find(s => {
    const cleanRoll = s.roll_number.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanInput = normalized.replace(/[^a-z0-9]/g, '');
    return cleanInput.includes(cleanRoll) || (s.name && normalized.includes(s.name.toLowerCase()));
  });

  if (matchedStudent) {
    const matchedBatch = datasets.batches.find(b => b.id === matchedStudent.batch_id);
    profile.isIdentified = true;
    profile.studentId = matchedStudent.id;
    profile.studentName = matchedStudent.name;
    profile.rollNumber = matchedStudent.roll_number;
    profile.batchId = matchedStudent.batch_id || undefined;
    profile.batchName = matchedBatch ? matchedBatch.name : 'Unknown Batch';
    profile.program = matchedBatch ? matchedBatch.program : 'Undergraduate';
  } else {
    // Check for direct Batch / Section name (e.g. "Section 1A", "BBA-4", "BAN-2", "BS(AF)-3A")
    const matchedBatch = datasets.batches.find(b => {
      const cleanBName = b.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanInput = normalized.replace(/[^a-z0-9]/g, '');
      return cleanInput.includes(cleanBName);
    });

    if (matchedBatch) {
      profile.isIdentified = true;
      profile.batchId = matchedBatch.id;
      profile.batchName = matchedBatch.name;
      profile.program = matchedBatch.program;
    }
  }

  // 2. If user mentions they do NOT know their roll number:
  const doesNotKnowRoll = 
    normalized.includes("don't know") || 
    normalized.includes("dont know") || 
    normalized.includes("nahi pata") || 
    normalized.includes("maloom nahi") ||
    normalized.includes("bhool gaya") ||
    normalized.includes("forgot");

  if (doesNotKnowRoll && !profile.isIdentified) {
    let reply = '';
    if (lang === 'roman_urdu') {
      reply = `Koi masla nahi! Agar aapko roll number yaad nahi hai, toh bas mujhe apna **Degree Program aur Semester** bata dein (jaise **BBA Semester 4**, **BS Fintech 2nd Semester**, **Section 1A**, ya **Accounting & Finance**).\n\nMain live database se aapka poora timetable nikaal kar bata doonga! 😊`;
    } else if (lang === 'urdu') {
      reply = `کوئی مسئلہ نہیں! اگر آپ کو رول نمبر یاد نہیں، تو بس اپنا **ڈگری پروگرام اور سمسٹر** بتا دیں (مثلاً **بی بی اے سمسٹر 4** یا **سیکشن 1A**)۔ میں آپ کا پورا شیڈول نکال دوں گا۔`;
    } else {
      reply = `No problem at all! If you don't know your roll number, simply tell me your **Degree Program and Semester** (for example: **BBA 4th Semester**, **Fintech Semester 2**, or **Section 1A**), and I'll find your classes right away! 😊`;
    }
    profile.conversationHistory.push({ role: 'assistant', text: reply, timestamp: Date.now() });
    return { replyText: reply, detectedLang: lang, profile };
  }

  // 3. Check for Room Location / Campus Navigation queries (e.g., "Where is room TF-301?", "TF-308 kahan hai")
  const roomMatch = datasets.rooms.find(r => {
    const cleanRName = r.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanInput = normalized.replace(/[^a-z0-9]/g, '');
    const rCode = r.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleanInput.includes(cleanRName) || (rCode.length > 2 && cleanInput.includes(rCode));
  });

  if (roomMatch && (normalized.includes('where') || normalized.includes('kahan') || normalized.includes('kidhar') || normalized.includes('location') || normalized.includes('room'))) {
    const nav = getRoomNavigationDetails(roomMatch.id, roomMatch.name, roomMatch.building);
    let reply = '';
    if (lang === 'roman_urdu') {
      reply = `📍 **${roomMatch.name} ki Location & Walking Directions:**\n\n🏢 **Building:** ${nav.buildingName} (${nav.buildingType})\n🪜 **Floor:** ${nav.floorLabel}\n🚶‍♂️ **Directions:** ${nav.directions.join('. ')}\n💡 **Tips:** ${nav.tips.join('. ')}`;
    } else if (lang === 'urdu') {
      reply = `📍 **${roomMatch.name} کا راستہ:**\n\n🏢 **عمارت:** ${nav.buildingName}\n🪜 **منزل:** ${nav.floorLabel}\n🚶‍♂️ **رہنمائی:** ${nav.directions.join('. ')}`;
    } else {
      reply = formatWhatsAppRoomNavigation(nav);
    }
    profile.conversationHistory.push({ role: 'assistant', text: reply, timestamp: Date.now() });
    return { replyText: reply, detectedLang: lang, profile };
  }

  // 4. Check for Faculty Specific Schedule (e.g. "Sir Misbah ki class kab hai", "Sir Ghulam Mustafa schedule")
  const facultyMatch = datasets.faculty.find(f => {
    const fNames = f.name.toLowerCase().split(' ').filter(p => p.length > 2);
    return fNames.some(part => normalized.includes(part));
  });

  if (facultyMatch && (normalized.includes('sir') || normalized.includes('dr') || normalized.includes('faculty') || normalized.includes('teacher') || normalized.includes('class') || normalized.includes('schedule'))) {
    const facSessions = datasets.sessions.filter(s => s.faculty_id === facultyMatch.id && s.status !== 'cancelled');
    if (facSessions.length === 0) {
      const reply = lang === 'roman_urdu' 
        ? `${facultyMatch.name} ki filhal database mein koi class scheduled nahi hai.`
        : `No classes are currently scheduled for ${facultyMatch.name} in the active semester.`;
      profile.conversationHistory.push({ role: 'assistant', text: reply, timestamp: Date.now() });
      return { replyText: reply, detectedLang: lang, profile };
    }

    let scheduleText = '';
    facSessions.sort((a,b) => a.day_of_week - b.day_of_week || timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
    facSessions.forEach(s => {
      const dayName = TIMETABLE_DAYS.find(d => d.id === s.day_of_week)?.name || `Day ${s.day_of_week}`;
      const crs = datasets.courses.find(c => c.id === s.course_id);
      const rm = datasets.rooms.find(r => r.id === s.room_id);
      const bch = datasets.batches.find(b => b.id === s.batch_id);
      scheduleText += `• **${dayName}** ${formatTimeRange(s.start_time, s.end_time)}: ${crs?.code || 'Course'} (${bch?.name || 'Batch'}) - Room: ${rm?.name || 'Unassigned'}\n`;
    });

    let reply = '';
    if (lang === 'roman_urdu') {
      reply = `👨‍🏫 **${facultyMatch.name} (${facultyMatch.department}) ka Class Schedule:**\n\n${scheduleText}`;
    } else {
      reply = `👨‍🏫 **Teaching Schedule for ${facultyMatch.name} (${facultyMatch.department}):**\n\n${scheduleText}`;
    }
    profile.conversationHistory.push({ role: 'assistant', text: reply, timestamp: Date.now() });
    return { replyText: reply, detectedLang: lang, profile };
  }

  // 5. If User is Identified, resolve their Timetable queries
  if (profile.isIdentified && profile.batchId) {
    const batchId = profile.batchId;
    const batchName = profile.batchName || 'Your Batch';
    const batchSessions = datasets.sessions.filter(s => s.batch_id === batchId && s.status !== 'cancelled');

    // Get current day context
    const now = new Date();
    // Use Pakistan Time (+5)
    const pkDay = params.datasets.currentDayOfWeek || ((now.getUTCDay() + 0) === 0 ? 7 : (now.getUTCDay()));
    const pkMinutes = params.datasets.currentTimeStr ? timeToMinutes(params.datasets.currentTimeStr) : (now.getUTCHours() + 5) * 60 + now.getUTCMinutes();

    // Query Type: Next Class
    if (normalized.includes('next') || normalized.includes('agli') || normalized.includes('pehli')) {
      const todaySessions = batchSessions
        .filter(s => s.day_of_week === pkDay)
        .sort((a,b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

      const nextSession = todaySessions.find(s => timeToMinutes(s.start_time) >= pkMinutes);

      if (nextSession) {
        const crs = datasets.courses.find(c => c.id === nextSession.course_id);
        const fac = datasets.faculty.find(f => f.id === nextSession.faculty_id);
        const rm = datasets.rooms.find(r => r.id === nextSession.room_id);
        const nav = rm ? getRoomNavigationDetails(rm.id, rm.name, rm.building) : null;

        if (lang === 'roman_urdu') {
          return {
            replyText: `⏰ **Aapki Agli Class:**\n\n📚 **Subject:** ${crs?.code} - ${crs?.name}\n👨‍🏫 **Teacher:** ${fac?.name}\n🕒 **Waqt:** ${formatTimeRange(nextSession.start_time, nextSession.end_time)}\n📍 **Room:** ${rm?.name || 'Room allocate hona baaqi hai'}${nav ? `\n🚶‍♂️ **Directions:** ${nav.buildingName}, ${nav.floorLabel} (${nav.directions[0] || ''})` : ''}`,
            detectedLang: lang,
            profile,
          };
        } else if (lang === 'urdu') {
          return {
            replyText: `⏰ **آپ کی اگلی کلاس:**\n\n📚 **مضمون:** ${crs?.code} - ${crs?.name}\n👨‍🏫 **استاد:** ${fac?.name}\n🕒 **وقت:** ${formatTimeRange(nextSession.start_time, nextSession.end_time)}\n📍 **کمرہ:** ${rm?.name || 'کمرہ کا تعین جاری ہے'}`,
            detectedLang: lang,
            profile,
          };
        } else {
          return {
            replyText: `⏰ **Your Next Upcoming Class:**\n\n📚 **Course:** ${crs?.code} - ${crs?.name}\n👨‍🏫 **Instructor:** ${fac?.name}\n🕒 **Time:** ${formatTimeRange(nextSession.start_time, nextSession.end_time)}\n📍 **Room:** ${rm?.name || 'Unassigned'}${nav ? `\n🚶‍♂️ **Directions:** ${nav.buildingName}, ${nav.floorLabel} (${nav.directions[0] || ''})` : ''}`,
            detectedLang: lang,
            profile,
          };
        }
      } else {
        const reply = lang === 'roman_urdu'
          ? `Aaj aapki baaqi koi classes nahi hain! Aapka din mukammal hogaya hai. Agar kal ka timetable dekhna hai toh *"kal ka schedule"* likhein.`
          : `You have no more classes scheduled for today! Send *"Tomorrow schedule"* or *"Full timetable"* to see upcoming lectures.`;
        return { replyText: reply, detectedLang: lang, profile };
      }
    }

    // Query Type: Specific Day or Full Timetable
    let targetDay: number | null = null;
    if (normalized.includes('monday') || normalized.includes('peer') || normalized.includes('somwar')) targetDay = 1;
    else if (normalized.includes('tuesday') || normalized.includes('mangal')) targetDay = 2;
    else if (normalized.includes('wednesday') || normalized.includes('budh')) targetDay = 3;
    else if (normalized.includes('thursday') || normalized.includes('jumeraat')) targetDay = 4;
    else if (normalized.includes('friday') || normalized.includes('juma')) targetDay = 5;
    else if (normalized.includes('today') || normalized.includes('aaj')) targetDay = pkDay;
    else if (normalized.includes('tomorrow') || normalized.includes('kal')) targetDay = pkDay === 7 ? 1 : pkDay + 1;

    if (targetDay !== null) {
      const dayName = TIMETABLE_DAYS.find(d => d.id === targetDay)?.name || `Day ${targetDay}`;
      const daySessions = batchSessions
        .filter(s => s.day_of_week === targetDay)
        .sort((a,b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

      if (daySessions.length === 0) {
        const reply = lang === 'roman_urdu'
          ? `🎉 **${batchName}** ki **${dayName}** ko koi class scheduled nahi hai (Off day)!`
          : `🎉 No classes are scheduled for **${batchName}** on **${dayName}**!`;
        return { replyText: reply, detectedLang: lang, profile };
      }

      let list = '';
      daySessions.forEach((s, idx) => {
        const crs = datasets.courses.find(c => c.id === s.course_id);
        const fac = datasets.faculty.find(f => f.id === s.faculty_id);
        const rm = datasets.rooms.find(r => r.id === s.room_id);
        list += `${idx + 1}️⃣ **${formatTimeRange(s.start_time, s.end_time)}**\n   📖 ${crs?.code}: ${crs?.name}\n   👨‍🏫 ${fac?.name}\n   📍 ${rm?.name || 'Unassigned'}\n\n`;
      });

      const reply = lang === 'roman_urdu'
        ? `📅 **${batchName} — ${dayName} Timetable:**\n\n${list.trim()}`
        : `📅 **${batchName} — ${dayName} Class Schedule:**\n\n${list.trim()}`;
      return { replyText: reply, detectedLang: lang, profile };
    }

    // Default Full Weekly Timetable
    let weeklySummary = '';
    for (const d of TIMETABLE_DAYS.filter(x => !x.isWeekend)) {
      const sList = batchSessions.filter(s => s.day_of_week === d.id).sort((a,b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
      if (sList.length > 0) {
        weeklySummary += `🗓️ **${d.name}:**\n`;
        sList.forEach(s => {
          const crs = datasets.courses.find(c => c.id === s.course_id);
          const rm = datasets.rooms.find(r => r.id === s.room_id);
          weeklySummary += `  • ${formatTimeRange(s.start_time, s.end_time)} ➔ ${crs?.code} (${rm?.name || 'Room TBA'})\n`;
        });
        weeklySummary += '\n';
      }
    }

    const reply = lang === 'roman_urdu'
      ? `📋 **${batchName} (${profile.program || ''}) ka Poora Weekly Timetable:**\n\n${weeklySummary.trim()}\n\n💡 Kisi specific class ki room directions chahiye toh pucho: *"Where is room TF-301?"*`
      : `📋 **Full Weekly Timetable for ${batchName}:**\n\n${weeklySummary.trim()}\n\n💡 Need directions to any room? Ask: *"Where is room TF-301?"*`;

    return { replyText: reply, detectedLang: lang, profile };
  }

  // 6. Generic Greeting / Identification Request
  let reply = '';
  if (lang === 'roman_urdu') {
    reply = `👋 **Assalam-o-Alaikum! Main Salim Habib University ka AI Timetable Assistant hoon.**\n\nMain aapko aapki classes, room locations, aur schedule batane ke liye hazir hoon.\n\n🎓 **Shuru karne ke liye apna Batch ya Roll Number batayein:**\n• Jaise: **\`BBA-4\`**, **\`Section 1A\`**, **\`BAN-2\`**, **\`BSAF-3A\`**, ya **\`AF-2026-001\`**\n\nAap Roman Urdu, Urdu, ya English mein kuch bhi pooch saktay hain! 😊`;
  } else if (lang === 'urdu') {
    reply = `👋 **اسلام علیکم! میں سلیم حبیب یونیورسٹی کا ٹائم ٹیبل اسسٹنٹ ہوں۔**\n\nاپنا شیڈول جاننے کے لیے براہ کرم اپنا **رول نمبر یا بیچ کا نام** (مثلاً **Section 1A** یا **BBA-4**) بتائیں۔`;
  } else {
    reply = `👋 **Hello! Welcome to the Salim Habib University AI Timetable Assistant.**\n\nI am here to give you real-time schedule information, next class alerts, and campus room walking directions.\n\n🎓 **To get started, please tell me your Batch or Roll Number:**\n• Examples: **\`Section 1A\`**, **\`BBA-4\`**, **\`BAN-2\`**, **\`BSAF-3A\`**, or **\`AF-2026-001\`**\n\nFeel free to ask in English, Urdu, or Roman Urdu! 😊`;
  }

  profile.conversationHistory.push({ role: 'assistant', text: reply, timestamp: Date.now() });
  return { replyText: reply, detectedLang: lang, profile };
}
