import { NextRequest, NextResponse } from 'next/server';
import {
  sendRealWhatsAppMessage,
  sendWhatsAppInteractiveButtons,
  sendWhatsAppInteractiveList,
  markWhatsAppMessageAsRead,
  downloadWhatsAppMedia,
  getConversationSession,
  updateConversationSession,
} from '@/lib/whatsapp-state-engine';
import {
  getLiveTimetableData,
  findMatchingBatches,
  findStudent,
  getBatchNextClass,
  getBatchSessionsForDay,
  getBatchFullWeeklySchedule,
  cleanText,
  alphanumericOnly,
} from '@/lib/whatsapp-data-service';
import {
  generateHumanTimetableResponse,
  transcribeWhatsAppAudio,
  detectLanguage,
} from '@/lib/whatsapp-ai-agent';
import { getRoomNavigationDetails } from '@/lib/campus-navigation';
import { TIMETABLE_DAYS } from '@/lib/conflict-engine';

/**
 * GET Handler for Meta WhatsApp Cloud API Webhook Verification Handshake
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'shu_timetable_webhook_secret_2026';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Meta Webhook] Successfully verified handshake!');
    return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  if (mode && token) {
    return new Response('Forbidden', { status: 403 });
  }

  return NextResponse.json({
    status: 'online',
    service: 'Salim Habib University WhatsApp AI Assistant (Gemini 3.8 + Interactive)',
    webhookConfigured: true,
  });
}

/**
 * POST Handler for Meta WhatsApp Inbound Messages
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Forward to n8n if configured
    const n8nWebhookUrl = process.env.N8N_WHATSAPP_WEBHOOK_URL || process.env.N8N_SCHEDULE_CHANGE_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch((e) => console.error('Error forwarding to n8n:', e));
    }

    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];

    // If there is no incoming message (e.g. status update delivered/sent receipt), return 200 OK immediately
    if (!message) {
      return NextResponse.json({ status: 'acknowledged' });
    }

    const fromPhone = message.from; // e.g. "923200269021"
    const messageId = message.id;

    // 1. Mark incoming message as read (blue double ticks)
    if (messageId) {
      markWhatsAppMessageAsRead(messageId).catch(() => {});
    }

    // 2. Extract message content across all formats (text, interactive buttons, list, voice notes)
    let incomingText = '';
    let interactiveId = '';
    let isVoiceNote = false;

    if (message.type === 'text') {
      incomingText = message.text?.body || '';
    } else if (message.type === 'interactive') {
      const interactive = message.interactive;
      if (interactive?.type === 'button_reply') {
        interactiveId = interactive.button_reply?.id || '';
        incomingText = interactive.button_reply?.title || '';
      } else if (interactive?.type === 'list_reply') {
        interactiveId = interactive.list_reply?.id || '';
        incomingText = interactive.list_reply?.title || '';
      }
    } else if (message.type === 'button') {
      incomingText = message.button?.text || '';
      interactiveId = message.button?.payload || '';
    } else if (message.type === 'audio') {
      isVoiceNote = true;
      const audioId = message.audio?.id;
      const mimeType = message.audio?.mime_type || 'audio/ogg';

      if (audioId) {
        console.log(`[WhatsApp Audio] Downloading voice note ${audioId} from ${fromPhone}...`);
        const media = await downloadWhatsAppMedia(audioId);
        if (media?.buffer) {
          const transcribed = await transcribeWhatsAppAudio(media.buffer, mimeType);
          if (transcribed) {
            incomingText = transcribed;
            console.log(`[WhatsApp Audio Transcribed]: "${incomingText}"`);
          }
        }
      }

      if (!incomingText) {
        // Audio could not be transcribed
        await sendRealWhatsAppMessage(
          fromPhone,
          `Assalam-o-Alaikum! Main aapka voice note theek se sun nahi paya. Barah-e-karam apna sawal dobara bheinjiye ya text mein likh dein.`
        );
        return NextResponse.json({ status: 'acknowledged' });
      }
    }

    console.log(`[WhatsApp Inbound] From: ${fromPhone} | Text: "${incomingText}" | InteractiveId: "${interactiveId}"`);

    // 3. Natural Human Typing Delay (1.5 - 2.3 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 800));

    // 4. Retrieve live timetable data from Supabase
    const timetableData = await getLiveTimetableData();
    const { batches, courses, faculty, rooms, sessions, students } = timetableData;

    // 5. Retrieve or initialize user conversation session
    const session = getConversationSession(fromPhone);
    const cleaned = cleanText(incomingText);
    const alpha = alphanumericOnly(incomingText);
    const lang = detectLanguage(incomingText);

    // 6. Reset Command
    if (cleaned === 'reset' || cleaned === 'logout' || cleaned === 'switch batch' || cleaned === 'change batch' || cleaned === 'restart') {
      updateConversationSession(fromPhone, {
        batchId: undefined,
        batchName: undefined,
        studentId: undefined,
        studentName: undefined,
        rollNumber: undefined,
        isIdentified: false,
        pendingIntent: null,
      });

      const resetReply = lang === 'roman_urdu'
        ? `🔄 Session reset ho gaya hai! Salim Habib University Timetable Assistant mein khush-aamdeed. Kripya apna Roll Number (maslan *AF-2026-001*) ya Batch (maslan *Batch-3A-BAC*, *BAN-2*, *BBA 3rd*) batayein.`
        : `🔄 Session reset successfully! Please provide your Student Roll Number (e.g. *AF-2026-001*) or Batch Name (e.g. *Batch-3A-BAC*, *BAN-2*, *BBA 3rd*) to continue.`;

      await sendRealWhatsAppMessage(fromPhone, resetReply);
      return NextResponse.json({ status: 'acknowledged' });
    }

    // 7. Handle Interactive Selection (When student clicked an interactive button or list row)
    if (interactiveId && (interactiveId.startsWith('batch_') || interactiveId.startsWith('btn_batch_'))) {
      const selectedBatchId = interactiveId.replace(/^(batch_|btn_batch_)/, '');
      const matchedBatch = batches.find((b) => b.id === selectedBatchId || b.name === selectedBatchId);

      if (matchedBatch) {
        updateConversationSession(fromPhone, {
          batchId: matchedBatch.id,
          batchName: matchedBatch.name,
          program: matchedBatch.program,
          isIdentified: true,
        });

        // Check if there was a pending query like "today" or "next class"
        const pendingType = session.pendingIntent?.type;
        session.pendingIntent = null; // Clear pending

        if (pendingType === 'today_schedule') {
          const now = new Date();
          const d = now.getDay() === 0 ? 7 : now.getDay();
          const todayClasses = getBatchSessionsForDay(matchedBatch.id, d, sessions, courses, faculty, rooms);
          const reply = await generateHumanTimetableResponse({
            userMessage: "Today's classes",
            batchName: matchedBatch.name,
            language: lang,
            todayClasses,
            intent: 'today',
          });
          await sendRealWhatsAppMessage(fromPhone, reply);
          return NextResponse.json({ status: 'acknowledged' });
        }

        if (pendingType === 'next_class') {
          const nextInfo = getBatchNextClass(matchedBatch.id, sessions, courses, faculty, rooms);
          const reply = await generateHumanTimetableResponse({
            userMessage: 'What is my next class?',
            batchName: matchedBatch.name,
            language: lang,
            nextClass: nextInfo.nextClass,
            currentClass: nextInfo.currentClass,
            intent: 'next_class',
          });
          await sendRealWhatsAppMessage(fromPhone, reply);
          return NextResponse.json({ status: 'acknowledged' });
        }

        // Default greeting upon confirming batch with next upcoming class
        const nextInfo = getBatchNextClass(matchedBatch.id, sessions, courses, faculty, rooms);
        const reply = await generateHumanTimetableResponse({
          userMessage: `I am in ${matchedBatch.name}`,
          batchName: matchedBatch.name,
          language: lang,
          nextClass: nextInfo.nextClass,
          currentClass: nextInfo.currentClass,
          intent: 'next_class',
        });
        await sendRealWhatsAppMessage(fromPhone, reply);
        return NextResponse.json({ status: 'acknowledged' });
      }
    }

    // 8. Identification by Student Roll Number or Name
    const matchedStudent = findStudent(incomingText, students);
    if (matchedStudent) {
      const studentBatch = batches.find((b) => b.id === matchedStudent.batch_id);
      updateConversationSession(fromPhone, {
        studentId: matchedStudent.id,
        studentName: matchedStudent.name,
        rollNumber: matchedStudent.roll_number,
        batchId: matchedStudent.batch_id || undefined,
        batchName: studentBatch ? studentBatch.name : 'Enrolled Batch',
        program: studentBatch ? studentBatch.program : 'Undergraduate Program',
        isIdentified: true,
      });
    }

    // 9. Check if user is asking for or specifying a Batch / Section (e.g. "Acf 3rd semester", "BBA 3rd")
    const candidateBatches = findMatchingBatches(incomingText, batches);

    // If multiple sections match (e.g. Batch-3A-BAC, Batch-3B-BAC, Batch-3C-BAC)
    if (candidateBatches.length > 1) {
      // Remember any intent in this message (e.g. "today", "next class")
      if (cleaned.includes('today') || cleaned.includes('aaj')) {
        session.pendingIntent = { type: 'today_schedule', originalQuestion: incomingText };
      } else if (cleaned.includes('next') || cleaned.includes('agli')) {
        session.pendingIntent = { type: 'next_class', originalQuestion: incomingText };
      }

      const programLabel = candidateBatches[0].program || 'Your program';
      const semLabel = candidateBatches[0].semester ? `Semester ${candidateBatches[0].semester}` : '';

      if (candidateBatches.length <= 3) {
        // Send WhatsApp Interactive Reply Buttons
        const buttonOptions = candidateBatches.map((b) => ({
          id: `batch_${b.id}`,
          title: b.name.slice(0, 20),
        }));

        const bodyText = lang === 'roman_urdu'
          ? `Assalam-o-Alaikum! ${programLabel} ${semLabel} ke liye ${candidateBatches.length} sections hain. Meherbani farma kar apna section tap karein:`
          : `Assalam-o-Alaikum! We found ${candidateBatches.length} sections for ${programLabel} ${semLabel}. Please tap your section below:`;

        await sendWhatsAppInteractiveButtons(
          fromPhone,
          bodyText,
          buttonOptions,
          'Salim Habib University',
          'Tap your section to view schedule'
        );
        return NextResponse.json({ status: 'acknowledged' });
      } else {
        // More than 3 options: Send WhatsApp Interactive List
        const listRows = candidateBatches.slice(0, 10).map((b) => ({
          id: `batch_${b.id}`,
          title: b.name.slice(0, 24),
          description: `${b.program} (${b.semester ? `Sem ${b.semester}` : 'Section'})`.slice(0, 72),
        }));

        const bodyText = lang === 'roman_urdu'
          ? `Aapke program ke liye darj zail sections dastyab hain. Barah-e-karam apna batch select karein:`
          : `We found multiple sections for your search. Please select your batch from the list:`;

        await sendWhatsAppInteractiveList(
          fromPhone,
          bodyText,
          'Select Batch',
          listRows,
          'Salim Habib University',
          'SHU Timetable Assistant'
        );
        return NextResponse.json({ status: 'acknowledged' });
      }
    }

    // Exactly 1 batch matched directly from text
    if (candidateBatches.length === 1 && !session.batchId) {
      const b = candidateBatches[0];
      updateConversationSession(fromPhone, {
        batchId: b.id,
        batchName: b.name,
        program: b.program,
        isIdentified: true,
      });
    }

    // 10. Check for Campus Room Navigation Query
    const matchedRoom = rooms.find((r) => {
      const rAlpha = alphanumericOnly(r.name);
      const rClean = cleanText(r.name);
      return alpha.includes(rAlpha) || cleaned.includes(rClean);
    });

    const isRoomQuery =
      Boolean(matchedRoom) ||
      cleaned.includes('where is room') ||
      cleaned.includes('room location') ||
      cleaned.includes('kahan hai') ||
      cleaned.includes('directions to room');

    if (matchedRoom || (isRoomQuery && !cleaned.includes('class'))) {
      const targetRoom = matchedRoom || rooms[0];
      const nav = getRoomNavigationDetails(targetRoom.id, targetRoom.name, targetRoom.building);

      const reply = await generateHumanTimetableResponse({
        userMessage: incomingText,
        language: lang,
        studentName: session.studentName,
        batchName: session.batchName,
        roomInfo: {
          roomName: targetRoom.name,
          building: targetRoom.building,
          floor: targetRoom.floor,
          directions: nav ? nav.directions.join(' ') : 'Located on SHU Campus.',
        },
        intent: 'room_navigation',
      });

      await sendRealWhatsAppMessage(fromPhone, reply);
      return NextResponse.json({ status: 'acknowledged' });
    }

    // 11. Intent Recognition for Timetable
    const isNextClass =
      cleaned.includes('next class') ||
      cleaned.includes('next lecture') ||
      cleaned.includes('upcoming class') ||
      cleaned.includes('what is my next') ||
      cleaned.includes('where do i go now') ||
      cleaned.includes('agli class') ||
      cleaned.includes('agli') ||
      cleaned === 'next';

    const isToday =
      cleaned.includes('today') ||
      cleaned.includes('aaj') ||
      cleaned.includes("today's class") ||
      cleaned.includes('today class');

    const isTomorrow =
      cleaned.includes('tomorrow') ||
      cleaned.includes('kal');

    const isFullTimetable =
      cleaned.includes('full timetable') ||
      cleaned.includes('whole timetable') ||
      cleaned.includes('complete schedule') ||
      cleaned.includes('weekly') ||
      cleaned.includes('pura timetable') ||
      cleaned === 'timetable';

    const currentBatchId = session.batchId;

    // 12. If student is asking for timetable but batch is not identified yet
    if ((isNextClass || isToday || isTomorrow || isFullTimetable) && !currentBatchId) {
      if (isNextClass) session.pendingIntent = { type: 'next_class', originalQuestion: incomingText };
      if (isToday) session.pendingIntent = { type: 'today_schedule', originalQuestion: incomingText };

      // Friendly human request (no robotic menus)
      const promptText = lang === 'roman_urdu'
        ? `Assalam-o-Alaikum! Aapka timetable check karne ke liye, barah-e-karam apna *Student Roll Number* (maslan \`AF-2026-001\`) ya apna *Batch / Semester* (maslan \`ACF 3rd\`, \`BBA 1st\`, \`BAN-2\`) bata dein.`
        : `Assalam-o-Alaikum! To check your schedule, could you please tell me your *Student Roll Number* (e.g. \`AF-2026-001\`) or your *Batch / Semester* (e.g. \`ACF 3rd\`, \`BBA 1st\`, \`BAN-2\`)?`;

      await sendRealWhatsAppMessage(fromPhone, promptText);
      return NextResponse.json({ status: 'acknowledged' });
    }

    // 13. Answer Timetable Inquiries with Live Data & Generative AI Human Text
    if (currentBatchId) {
      const currentBatch = batches.find((b) => b.id === currentBatchId);

      // A. Next Class
      if (isNextClass) {
        const nextInfo = getBatchNextClass(currentBatchId, sessions, courses, faculty, rooms);
        const reply = await generateHumanTimetableResponse({
          userMessage: incomingText,
          language: lang,
          studentName: session.studentName,
          batchName: currentBatch?.name || session.batchName,
          programName: currentBatch?.program,
          nextClass: nextInfo.nextClass,
          currentClass: nextInfo.currentClass,
          intent: 'next_class',
        });

        await sendRealWhatsAppMessage(fromPhone, reply);
        return NextResponse.json({ status: 'acknowledged' });
      }

      // B. Today's Classes
      if (isToday) {
        const now = new Date();
        const d = now.getDay() === 0 ? 7 : now.getDay();
        const todayClasses = getBatchSessionsForDay(currentBatchId, d, sessions, courses, faculty, rooms);

        const reply = await generateHumanTimetableResponse({
          userMessage: incomingText,
          language: lang,
          studentName: session.studentName,
          batchName: currentBatch?.name || session.batchName,
          programName: currentBatch?.program,
          todayClasses,
          intent: 'today',
        });

        await sendRealWhatsAppMessage(fromPhone, reply);
        return NextResponse.json({ status: 'acknowledged' });
      }

      // C. Tomorrow's Schedule
      if (isTomorrow) {
        const now = new Date();
        const currentD = now.getDay() === 0 ? 7 : now.getDay();
        const tomorrowD = (currentD % 7) + 1;
        const tomorrowClasses = getBatchSessionsForDay(currentBatchId, tomorrowD, sessions, courses, faculty, rooms);

        const reply = await generateHumanTimetableResponse({
          userMessage: incomingText,
          language: lang,
          studentName: session.studentName,
          batchName: currentBatch?.name || session.batchName,
          programName: currentBatch?.program,
          todayClasses: tomorrowClasses,
          intent: 'tomorrow',
        });

        await sendRealWhatsAppMessage(fromPhone, reply);
        return NextResponse.json({ status: 'acknowledged' });
      }

      // D. Full Weekly Timetable
      if (isFullTimetable) {
        const weekly = getBatchFullWeeklySchedule(currentBatchId, sessions, courses, faculty, rooms);
        let scheduleFormatted = '';
        for (const [dayName, dayClasses] of Object.entries(weekly)) {
          scheduleFormatted += `📅 *${dayName}*:\n` + dayClasses.map((c) => `  • ${c.startTime} - ${c.endTime}: *${c.courseName}* (${c.roomName})`).join('\n') + '\n\n';
        }

        if (!scheduleFormatted.trim()) {
          scheduleFormatted = 'No regular classes scheduled for this batch.';
        }

        const reply = lang === 'roman_urdu'
          ? `🗓️ *${currentBatch?.name || 'Aapka'} Weekly Timetable:*\n\n${scheduleFormatted.trim()}\n\nAgar kisi class ya room ka rasta poochna ho tou zaroor batayein!`
          : `🗓️ *Weekly Timetable for ${currentBatch?.name || 'Your Batch'}:*\n\n${scheduleFormatted.trim()}\n\nLet me know if you need specific room directions!`;

        await sendRealWhatsAppMessage(fromPhone, reply);
        return NextResponse.json({ status: 'acknowledged' });
      }
    }

    // 14. Fallback / General Conversational Query
    // Use Generative AI to understand and respond like a helpful human university counselor
    const nextInfo = currentBatchId
      ? getBatchNextClass(currentBatchId, sessions, courses, faculty, rooms)
      : undefined;

    const generalReply = await generateHumanTimetableResponse({
      userMessage: incomingText,
      language: lang,
      studentName: session.studentName,
      batchName: session.batchName,
      programName: session.program,
      nextClass: nextInfo?.nextClass,
      currentClass: nextInfo?.currentClass,
      intent: 'general',
    });

    await sendRealWhatsAppMessage(fromPhone, generalReply);

    return NextResponse.json({
      status: 'acknowledged',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('WhatsApp Webhook Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal webhook error' },
      { status: 500 }
    );
  }
}
