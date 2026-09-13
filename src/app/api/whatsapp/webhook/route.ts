import { NextRequest, NextResponse } from 'next/server';
import { 
  processIncomingWhatsAppMessage, 
  sendRealWhatsAppMessage 
} from '@/lib/whatsapp-state-engine';
import { 
  INITIAL_STUDENTS, 
  INITIAL_BATCHES, 
  INITIAL_COURSES, 
  INITIAL_FACULTY, 
  INITIAL_ROOMS, 
  INITIAL_SESSIONS 
} from '@/lib/mock-data';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { 
  Student, 
  Batch, 
  Course, 
  Faculty, 
  Room, 
  ClassSession 
} from '@/types';

/**
 * GET Handler for Meta WhatsApp Cloud API Webhook Verification
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'shu_timetable_webhook_secret_2026';

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WhatsApp Webhook Verified Successfully!');
      return new Response(challenge, { status: 200 });
    } else {
      return new Response('Forbidden', { status: 403 });
    }
  }

  return NextResponse.json({
    status: 'online',
    agent: 'Salim Habib University WhatsApp Timetable & Navigation Agent',
    designatedNumber: process.env.WHATSAPP_BUSINESS_PHONE_NUMBER || '+92 300 1234567',
    webhookConfigured: true,
  });
}

/**
 * Helper to get active datasets from Supabase or fallback mock data
 */
async function getActiveDatasets() {
  let students: Student[] = INITIAL_STUDENTS;
  let batches: Batch[] = INITIAL_BATCHES;
  let courses: Course[] = INITIAL_COURSES;
  let faculty: Faculty[] = INITIAL_FACULTY;
  let rooms: Room[] = INITIAL_ROOMS;
  let sessions: ClassSession[] = INITIAL_SESSIONS;

  if (isSupabaseConfigured && supabase) {
    try {
      const [
        { data: stData },
        { data: bData },
        { data: cData },
        { data: fData },
        { data: rData },
        { data: sData }
      ] = await Promise.all([
        supabase.from('students').select('*'),
        supabase.from('batches').select('*'),
        supabase.from('courses').select('*'),
        supabase.from('faculty').select('*'),
        supabase.from('rooms').select('*'),
        supabase.from('class_sessions').select('*'),
      ]);

      if (stData && stData.length > 0) students = stData;
      if (bData && bData.length > 0) batches = bData;
      if (cData && cData.length > 0) courses = cData;
      if (fData && fData.length > 0) faculty = fData;
      if (rData && rData.length > 0) rooms = rData;
      if (sData && sData.length > 0) sessions = sData;
    } catch (e) {
      console.warn('Using local fallback state for WhatsApp Agent');
    }
  }

  return { students, batches, courses, faculty, rooms, sessions };
}

/**
 * POST Handler for Processing Incoming Messages from WhatsApp Cloud API or Twilio
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let fromPhone = '';
    let messageText = '';

    // Case 1: Standard Meta WhatsApp Cloud API Payload
    if (body.object === 'whatsapp_business_account' || body.entry) {
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const message = value?.messages?.[0];

      if (!message) {
        // Status updates (delivered, read, etc.)
        return NextResponse.json({ status: 'ignored_status_update' });
      }

      fromPhone = message.from;
      if (message.type === 'text') {
        messageText = message.text?.body || '';
      } else if (message.type === 'button') {
        messageText = message.button?.text || message.button?.payload || '';
      } else if (message.type === 'interactive') {
        messageText = message.interactive?.button_reply?.title || message.interactive?.list_reply?.title || '';
      }
    } 
    // Case 2: Custom JSON Direct Test Call (e.g. from Coordinator Dashboard)
    else if (body.phoneNumber && body.message) {
      fromPhone = body.phoneNumber;
      messageText = body.message;
    }

    if (!fromPhone || !messageText) {
      return NextResponse.json({ error: 'Missing phoneNumber or message body' }, { status: 400 });
    }

    // Load active timetable and campus metadata
    const datasets = await getActiveDatasets();

    // Process message through Multi-Turn State & Reconfirmation Engine
    const result = processIncomingWhatsAppMessage({
      phoneNumber: fromPhone,
      incomingText: messageText,
      students: datasets.students,
      batches: datasets.batches,
      courses: datasets.courses,
      faculty: datasets.faculty,
      rooms: datasets.rooms,
      sessions: datasets.sessions,
      customTimeStr: body.customTimeStr,
      customDayOfWeek: body.customDayOfWeek,
    });

    // Send the real WhatsApp message back to the student's phone
    const dispatchRes = await sendRealWhatsAppMessage(fromPhone, result.replyText);

    return NextResponse.json({
      success: true,
      senderPhone: fromPhone,
      studentInput: messageText,
      agentReply: result.replyText,
      conversationState: result.sessionState.state,
      pendingIntent: result.sessionState.pendingIntent,
      metaDispatchStatus: dispatchRes,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('WhatsApp Webhook Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal error processing WhatsApp message' },
      { status: 500 }
    );
  }
}
