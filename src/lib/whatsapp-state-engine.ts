import { 
  ClassSession, 
  Student, 
  Batch, 
  Course, 
  Faculty, 
  Room 
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

export interface WhatsAppConversationSession {
  phoneNumber: string;
  studentId?: string;
  studentName?: string;
  batchId?: string;
  batchName?: string;
  pendingIntent?: {
    type: 'full_timetable' | 'next_class' | 'room_navigation' | 'course_schedule' | 'general';
    quotedSummary: string;
    targetCourseId?: string;
    targetRoomId?: string;
    targetDay?: number;
  } | null;
  state: 'IDLE' | 'AWAITING_CONFIRMATION';
  lastActivity: number;
}

// In-Memory store for conversation states
const conversationStore: Record<string, WhatsAppConversationSession> = {};

export interface ProcessMessageContext {
  phoneNumber: string;
  incomingText: string;
  students: Student[];
  batches: Batch[];
  courses: Course[];
  faculty: Faculty[];
  rooms: Room[];
  sessions: ClassSession[];
  customTimeStr?: string; // e.g. "10:15" for testing
  customDayOfWeek?: number; // 1-7 for testing
}

export interface ProcessMessageResult {
  replyText: string;
  sessionState: WhatsAppConversationSession;
  dispatchedToPhone: string;
}

/**
 * Normalizes text for matching
 */
function clean(str: string): string {
  return (str || '').toLowerCase().trim();
}

/**
 * Detects if the incoming message is a confirmation
 */
function isConfirmation(text: string): boolean {
  const t = clean(text);
  const positiveAnswers = [
    '1', 'yes', 'y', 'confirm', 'confirmed', 'ok', 'okay', 
    'haan', 'ha', 'sahi hai', 'proceed', 'send', 'dikhao', 'tell me', 'yep', 'sure', 'pls send'
  ];
  return positiveAnswers.includes(t) || t.startsWith('yes') || t.startsWith('confirm');
}

/**
 * Main WhatsApp Multi-Turn Conversation Processor
 */
export function processIncomingWhatsAppMessage(ctx: ProcessMessageContext): ProcessMessageResult {
  const { phoneNumber, incomingText, students, batches, courses, faculty, rooms, sessions } = ctx;
  const rawText = incomingText.trim();
  const lowerText = clean(rawText);

  let session = conversationStore[phoneNumber];
  if (!session) {
    session = {
      phoneNumber,
      state: 'IDLE',
      lastActivity: Date.now(),
    };
    conversationStore[phoneNumber] = session;
  }
  session.lastActivity = Date.now();

  // -------------------------------------------------------------
  // STEP 1: Handle User in 'AWAITING_CONFIRMATION' State
  // -------------------------------------------------------------
  if (session.state === 'AWAITING_CONFIRMATION' && session.pendingIntent) {
    if (isConfirmation(lowerText)) {
      // Execute the pending action
      const intent = session.pendingIntent;
      session.state = 'IDLE';
      session.pendingIntent = null;

      const reply = executeConfirmedIntent(intent, session, {
        students,
        batches,
        courses,
        faculty,
        rooms,
        sessions,
        customTimeStr: ctx.customTimeStr,
        customDayOfWeek: ctx.customDayOfWeek,
      });

      return {
        replyText: reply,
        sessionState: session,
        dispatchedToPhone: phoneNumber,
      };
    } else {
      // Student declined or provided new instructions
      session.state = 'IDLE';
      session.pendingIntent = null;
      // Fall through to parse new message
    }
  }

  // -------------------------------------------------------------
  // STEP 2: Intent Parsing & Entity Extraction
  // -------------------------------------------------------------

  // Check 1: Did the student provide a Student Roll Number or ID?
  const matchedStudent = students.find((s) => {
    return (
      clean(s.roll_number) === lowerText ||
      lowerText.includes(clean(s.roll_number)) ||
      (s.roll_number.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === lowerText.replace(/[^a-zA-Z0-9]/g, ''))
    );
  });

  if (matchedStudent) {
    const studentBatch = batches.find((b) => b.id === matchedStudent.batch_id);
    session.studentId = matchedStudent.id;
    session.studentName = matchedStudent.name;
    session.batchId = matchedStudent.batch_id;
    session.batchName = studentBatch ? `${studentBatch.name} (${studentBatch.program})` : 'Assigned Batch';

    session.state = 'AWAITING_CONFIRMATION';
    session.pendingIntent = {
      type: 'full_timetable',
      quotedSummary: `Full Weekly Timetable for ${matchedStudent.name} (Roll: ${matchedStudent.roll_number}, Batch: ${session.batchName})`,
    };

    const reply = [
      `👋 *Hello ${matchedStudent.name}!*`,
      `We found your student profile:`,
      `🎓 *Roll No:* ${matchedStudent.roll_number}`,
      `📚 *Enrolled Batch:* ${session.batchName}`,
      ``,
      `❓ *Reconfirmation:*`,
      `You requested your *Weekly Class Timetable*.`,
      `Please reply *'1'* or *'Yes'* to confirm and view your complete schedule.`,
    ].join('\n');

    return { replyText: reply, sessionState: session, dispatchedToPhone: phoneNumber };
  }

  // Check 2: Did user mention a specific Batch Name?
  const matchedBatch = batches.find((b) => {
    const bName = clean(b.name);
    const bProg = clean(b.program);
    return lowerText.includes(bName) || (bProg && lowerText.includes(bProg) && lowerText.includes(`sem ${b.semester}`));
  });

  if (matchedBatch) {
    session.batchId = matchedBatch.id;
    session.batchName = `${matchedBatch.name} (${matchedBatch.program})`;

    // Check if asking for next class or full timetable
    const isNextClass = lowerText.includes('next') || lowerText.includes('upcoming') || lowerText.includes('ab konsi') || lowerText.includes('current');
    const isRoom = lowerText.includes('room') || lowerText.includes('kahan') || lowerText.includes('location') || lowerText.includes('where');

    session.state = 'AWAITING_CONFIRMATION';
    session.pendingIntent = {
      type: isNextClass ? 'next_class' : isRoom ? 'room_navigation' : 'full_timetable',
      quotedSummary: isNextClass
        ? `Next upcoming class schedule for ${session.batchName}`
        : isRoom
        ? `Classroom venue & navigation guidance for ${session.batchName}`
        : `Complete timetable for Batch ${session.batchName}`,
    };

    const reply = [
      `🏛️ *Batch Identified:* ${session.batchName}`,
      ``,
      `❓ *Reconfirmation:*`,
      `You are inquiring about: *${session.pendingIntent.quotedSummary}*.`,
      `Please reply *'1'* or *'Yes'* to proceed and receive the exact details on WhatsApp.`,
    ].join('\n');

    return { replyText: reply, sessionState: session, dispatchedToPhone: phoneNumber };
  }

  // Check 3: Next Class Query (for existing batch or general)
  const isNextClassQuery = 
    lowerText.includes('next class') || 
    lowerText.includes('next lecture') || 
    lowerText.includes('upcoming class') || 
    lowerText.includes('agli class') || 
    lowerText.includes('class right now') || 
    lowerText.includes('next');

  if (isNextClassQuery) {
    const targetBatchId = session.batchId || batches[0]?.id;
    const targetBatchName = session.batchName || batches[0]?.name || 'Current Batch';

    session.state = 'AWAITING_CONFIRMATION';
    session.pendingIntent = {
      type: 'next_class',
      quotedSummary: `Next class details & room location for ${targetBatchName}`,
    };

    const reply = [
      `⏰ *Next Class Inquiry Recognized!*`,
      `Batch: *${targetBatchName}*`,
      ``,
      `❓ *Reconfirmation:*`,
      `Do you want to see the details of your *Next Upcoming Class* (Time, Course, Faculty, Room & Floor)?`,
      `Please reply *'1'* or *'Yes'* to confirm.`,
    ].join('\n');

    return { replyText: reply, sessionState: session, dispatchedToPhone: phoneNumber };
  }

  // Check 4: Specific Room / Navigation Query
  const matchedRoom = rooms.find((r) => {
    const rName = clean(r.name);
    const rId = clean(r.id.replace('room-', ''));
    return lowerText.includes(rName) || lowerText.includes(rId) || lowerText.includes(r.id.toLowerCase());
  });

  const isRoomQuery = lowerText.includes('room') || lowerText.includes('location') || lowerText.includes('kahan') || lowerText.includes('where is') || lowerText.includes('navigate') || lowerText.includes('floor');

  if (matchedRoom || isRoomQuery) {
    const targetRoom = matchedRoom || rooms[0];
    session.state = 'AWAITING_CONFIRMATION';
    session.pendingIntent = {
      type: 'room_navigation',
      quotedSummary: `Room navigation & floor directions for ${targetRoom.name}`,
      targetRoomId: targetRoom.id,
    };

    const reply = [
      `📍 *Campus Room Navigation Request*`,
      `Target Room: *${targetRoom.name}* (${targetRoom.building})`,
      ``,
      `❓ *Reconfirmation:*`,
      `You are asking for *Step-by-step Floor Navigation & Venue Details* for Room *${targetRoom.name}*.`,
      `Please reply *'1'* or *'Yes'* to get full directions.`,
    ].join('\n');

    return { replyText: reply, sessionState: session, dispatchedToPhone: phoneNumber };
  }

  // Check 5: Specific Course Query (e.g. "Accounting class timing", "CSC-110")
  const matchedCourse = courses.find((c) => {
    return lowerText.includes(clean(c.code)) || lowerText.includes(clean(c.name));
  });

  if (matchedCourse) {
    session.state = 'AWAITING_CONFIRMATION';
    session.pendingIntent = {
      type: 'course_schedule',
      quotedSummary: `Scheduled classes and room venues for Course "${matchedCourse.code} - ${matchedCourse.name}"`,
      targetCourseId: matchedCourse.id,
    };

    const reply = [
      `📖 *Course Identified:* ${matchedCourse.code} (${matchedCourse.name})`,
      ``,
      `❓ *Reconfirmation:*`,
      `You are asking for the *Lecture Schedule & Venues* for *${matchedCourse.code}*.`,
      `Please reply *'1'* or *'Yes'* to view all sessions.`,
    ].join('\n');

    return { replyText: reply, sessionState: session, dispatchedToPhone: phoneNumber };
  }

  // Fallback: Welcome & Guide Message
  const reply = [
    `🎓 *Welcome to Salim Habib University (SHU) Timetable Assistant!*`,
    ``,
    `You can message me to ask for:`,
    `1️⃣ *Your Timetable:* Send your *Student Roll No* (e.g., \`AF-2026-001\`) or *Batch* (e.g., \`Section 1A\`, \`BAN-2\`).`,
    `2️⃣ *Next Class:* Ask *"What is my next class?"* or *"Next lecture"*.`,
    `3️⃣ *Room & Navigation:* Ask *"Where is room A-04?"* or *"How to reach TF-308?"*.`,
    `4️⃣ *Course Timing:* Ask *"When is Accounting class?"*.`,
    ``,
    `💡 *Note:* We will first reconfirm your inquiry and then deliver your results instantly!`,
  ].join('\n');

  return { replyText: reply, sessionState: session, dispatchedToPhone: phoneNumber };
}

/**
 * Executes the confirmed intent and builds the comprehensive WhatsApp response
 */
function executeConfirmedIntent(
  intent: NonNullable<WhatsAppConversationSession['pendingIntent']>,
  session: WhatsAppConversationSession,
  data: {
    students: Student[];
    batches: Batch[];
    courses: Course[];
    faculty: Faculty[];
    rooms: Room[];
    sessions: ClassSession[];
    customTimeStr?: string;
    customDayOfWeek?: number;
  }
): string {
  const { batches, courses, faculty, rooms, sessions } = data;
  const now = new Date();
  const currentDayOfWeek = data.customDayOfWeek || (now.getDay() === 0 ? 7 : now.getDay()); // 1=Mon ... 7=Sun
  const currentMinutes = data.customTimeStr ? timeToMinutes(data.customTimeStr) : now.getHours() * 60 + now.getMinutes();

  // ========================================================
  // 1. FULL TIMETABLE DISPATCH
  // ========================================================
  if (intent.type === 'full_timetable') {
    const batchId = session.batchId || batches[0]?.id;
    const batchObj = batches.find((b) => b.id === batchId);
    const batchSessions = sessions.filter((s) => s.batch_id === batchId && s.status === 'published');

    if (batchSessions.length === 0) {
      return `📅 *Timetable for ${batchObj?.name || 'Batch'}:*\n\nNo active classes are currently scheduled for this batch.`;
    }

    const lines: string[] = [
      `📅 *OFFICIAL TIMETABLE: ${batchObj?.name || 'Batch'}*`,
      `🎓 *Program:* ${batchObj?.program || 'Academic Program'}`,
      `🏢 *Campus:* Salim Habib University (SHU)`,
      `──────────────────────────`,
    ];

    const sortedDays = [1, 2, 3, 4, 5, 6, 7];
    for (const dayId of sortedDays) {
      const dayName = TIMETABLE_DAYS.find((d) => d.id === dayId)?.name || `Day ${dayId}`;
      const dayClasses = batchSessions
        .filter((s) => s.day_of_week === dayId)
        .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

      if (dayClasses.length > 0) {
        lines.push(``);
        lines.push(`📌 *${dayName.toUpperCase()}:*`);
        for (const cls of dayClasses) {
          const crs = courses.find((c) => c.id === cls.course_id);
          const fac = faculty.find((f) => f.id === cls.faculty_id);
          const rm = rooms.find((r) => r.id === cls.room_id);
          const nav = rm ? getRoomNavigationDetails(rm.id, rm.name, rm.building) : null;

          const timeStr = formatTimeRange(cls.start_time, cls.end_time);
          const roomLabel = rm ? `${rm.name} (${nav?.floorLabel || 'Level'})` : '⚠️ Venue TBA';

          lines.push(`• *${crs?.code || 'Course'}* - ${crs?.name || 'Class'}`);
          lines.push(`  ⏰ ${timeStr}`);
          lines.push(`  👨‍🏫 Instructor: ${fac?.name || 'Faculty TBA'}`);
          lines.push(`  🚪 Room: ${roomLabel}`);
          if (nav && nav.specialtyTags.some((t) => t.includes('Lab'))) {
            lines.push(`  💻 *Specialty:* ${nav.specialtyDescription}`);
          }
        }
      }
    }

    lines.push(``);
    lines.push(`──────────────────────────`);
    lines.push(`📍 *Need Room Directions?* Reply with *"Where is [Room Name]?"* anytime!`);
    return lines.join('\n');
  }

  // ========================================================
  // 2. NEXT CLASS INQUIRY DISPATCH
  // ========================================================
  if (intent.type === 'next_class') {
    const batchId = session.batchId || batches[0]?.id;
    const batchObj = batches.find((b) => b.id === batchId);
    const publishedSessions = sessions.filter((s) => s.batch_id === batchId && s.status === 'published');

    // Find upcoming classes today
    const todaysUpcoming = publishedSessions
      .filter((s) => s.day_of_week === currentDayOfWeek && timeToMinutes(s.start_time) >= currentMinutes)
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

    let nextClass: ClassSession | null = todaysUpcoming[0] || null;
    let dayLabel = 'Today';

    // If no more classes today, look for next day's first class
    if (!nextClass) {
      for (let offset = 1; offset <= 7; offset++) {
        const nextDayId = ((currentDayOfWeek + offset - 1) % 7) + 1;
        const nextDayClasses = publishedSessions
          .filter((s) => s.day_of_week === nextDayId)
          .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

        if (nextDayClasses.length > 0) {
          nextClass = nextDayClasses[0];
          const dName = TIMETABLE_DAYS.find((d) => d.id === nextDayId)?.name;
          dayLabel = offset === 1 ? `Tomorrow (${dName})` : `${dName}`;
          break;
        }
      }
    }

    if (!nextClass) {
      return `⏰ *Next Class Status:*\nNo upcoming scheduled classes found for *${batchObj?.name || 'your batch'}*. Enjoy your time!`;
    }

    const crs = courses.find((c) => c.id === nextClass.course_id);
    const fac = faculty.find((f) => f.id === nextClass.faculty_id);
    const rm = rooms.find((r) => r.id === nextClass.room_id);
    const nav = rm ? getRoomNavigationDetails(rm.id, rm.name, rm.building) : null;

    const timeRange = formatTimeRange(nextClass.start_time, nextClass.end_time);

    const lines: string[] = [
      `🔔 *YOUR NEXT CLASS DETAILS:*`,
      `🎓 *Batch:* ${batchObj?.name || 'Batch'}`,
      `🗓️ *When:* ${dayLabel} at *${timeRange}*`,
      `📚 *Course:* *${crs?.code}* – ${crs?.name}`,
      `👨‍🏫 *Instructor:* ${fac?.name} (${fac?.department})`,
      ``,
    ];

    if (rm && nav) {
      lines.push(formatWhatsAppRoomNavigation(nav));
    } else {
      lines.push(`🚪 *Room Status:* Venue pending allocation by Program Coordinator.`);
    }

    return lines.join('\n');
  }

  // ========================================================
  // 3. ROOM NAVIGATION DISPATCH
  // ========================================================
  if (intent.type === 'room_navigation') {
    const targetRoomId = intent.targetRoomId || rooms[0]?.id;
    const rm = rooms.find((r) => r.id === targetRoomId) || rooms[0];
    const nav = getRoomNavigationDetails(rm.id, rm.name, rm.building);

    return [
      `🗺️ *CAMPUS VENUE NAVIGATION GUIDE*`,
      `──────────────────────────`,
      formatWhatsAppRoomNavigation(nav),
      `──────────────────────────`,
      `💡 *Did you know?* SHU is the Old Building (A=Ground, B=1st, C=2nd, D=3rd), and FPS is the New Building.`,
    ].join('\n');
  }

  // ========================================================
  // 4. SPECIFIC COURSE SCHEDULE DISPATCH
  // ========================================================
  if (intent.type === 'course_schedule') {
    const crs = courses.find((c) => c.id === intent.targetCourseId);
    if (!crs) return `Course information not found.`;

    const courseSessions = sessions.filter((s) => s.course_id === crs.id && s.status === 'published');

    const lines: string[] = [
      `📖 *COURSE TIMETABLE: ${crs.code}*`,
      `📘 *Name:* ${crs.name} (${crs.credit_hours} Credit Hours)`,
      `🏛️ *Department:* ${crs.department}`,
      `──────────────────────────`,
    ];

    if (courseSessions.length === 0) {
      lines.push(`No active sessions are scheduled for this course.`);
    } else {
      for (const cls of courseSessions) {
        const dName = TIMETABLE_DAYS.find((d) => d.id === cls.day_of_week)?.name || `Day ${cls.day_of_week}`;
        const b = batches.find((b) => b.id === cls.batch_id);
        const fac = faculty.find((f) => f.id === cls.faculty_id);
        const rm = rooms.find((r) => r.id === cls.room_id);
        const nav = rm ? getRoomNavigationDetails(rm.id, rm.name, rm.building) : null;

        lines.push(``);
        lines.push(`🗓️ *${dName}* | ${formatTimeRange(cls.start_time, cls.end_time)}`);
        lines.push(`  👥 Batch: ${b?.name} (${b?.program})`);
        lines.push(`  👨‍🏫 Faculty: ${fac?.name}`);
        lines.push(`  🚪 Room: ${rm?.name || 'TBA'} ${nav ? `(${nav.floorLabel})` : ''}`);
      }
    }

    return lines.join('\n');
  }

  return `Request completed. If you need anything else, please message us anytime!`;
}

/**
 * Dispatches an outgoing message to the real WhatsApp Cloud API or Twilio
 */
export async function sendRealWhatsAppMessage(toPhone: string, messageText: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    // If not yet configured in env, log to console for development
    console.info(`[WhatsApp Cloud API Simulated Dispatch] To: ${toPhone} | Message Length: ${messageText.length}`);
    return { success: true, id: `local-sim-${Date.now()}` };
  }

  try {
    const formattedPhone = toPhone.replace(/[^0-9]/g, '');
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: { body: messageText },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('Meta WhatsApp Cloud API error response:', data);
      return { success: false, error: data?.error?.message || 'Meta API error' };
    }

    return { success: true, id: data.messages?.[0]?.id };
  } catch (err: any) {
    console.error('Failed to dispatch real WhatsApp message:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
}
