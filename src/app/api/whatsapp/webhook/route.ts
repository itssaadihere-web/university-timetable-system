import { NextRequest, NextResponse } from 'next/server';
import { 
  generateConversationalResponse 
} from '@/lib/ai-agent-engine';
import { 
  downloadMetaWhatsAppAudio, 
  transcribeWhatsAppAudio 
} from '@/lib/whatsapp-voice-engine';
import { 
  sendRealWhatsAppMessage,
  sendRealWhatsAppInteractiveMessage
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
    agent: 'Salim Habib University AI Conversational Timetable & Navigation Agent',
    designatedNumber: process.env.WHATSAPP_BUSINESS_PHONE_NUMBER || '+1 555 179-3865',
    webhookConfigured: true,
  });
}

/**
 * Helper to get active datasets directly from live Supabase tables (with safe fallback)
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

export async function POST(req: NextRequest) {
  try {
    let fromPhone = '';
    let messageText = '';
    let isVoiceNote = false;
    let body: any = {};

    const contentType = req.headers.get('content-type') || '';

    // Handle Form URL Encoded (Default Twilio Webhook Format)
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      fromPhone = (formData.get('From') as string) || (formData.get('from') as string) || '';
      messageText = (formData.get('Body') as string) || (formData.get('body') as string) || (formData.get('message') as string) || '';
    } else {
      // Handle JSON Payloads
      body = await req.json();

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
        } else if (message.type === 'audio' || message.type === 'voice') {
          isVoiceNote = true;
          const mediaId = message.audio?.id || message.voice?.id;
          const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
          if (mediaId && accessToken) {
            const audioBuffer = await downloadMetaWhatsAppAudio(mediaId, accessToken);
            if (audioBuffer) {
              const transcribed = await transcribeWhatsAppAudio(audioBuffer);
              messageText = transcribed.transcription || 'voice message received';
            }
          }
        } else if (message.type === 'button') {
          messageText = message.button?.text || message.button?.payload || '';
        } else if (message.type === 'interactive') {
          const btnId = message.interactive?.button_reply?.id;
          const btnTitle = message.interactive?.button_reply?.title;
          const listId = message.interactive?.list_reply?.id;
          const listTitle = message.interactive?.list_reply?.title;

          // Prefer specific identifier ID (e.g. batch_xxx, btn_next_class) if present
          messageText = btnId || listId || btnTitle || listTitle || '';
        }
      } 
      // Case 2: Twilio JSON Payload
      else if (body.From && (body.Body || body.body)) {
        fromPhone = body.From;
        messageText = body.Body || body.body || '';
      }
      // Case 3: UltraMsg / Green API Webhook Payload
      else if (body.data?.from || body.from) {
        fromPhone = body.data?.from || body.from || '';
        messageText = body.data?.body || body.body || body.message || body.data?.message || '';
      }
      // Case 4: Evolution API / Baileys QR Webhook Payload
      else if (body.data?.key?.remoteJid || body.key?.remoteJid) {
        fromPhone = body.data?.key?.remoteJid || body.key?.remoteJid || '';
        messageText = 
          body.data?.message?.conversation || 
          body.data?.message?.extendedTextMessage?.text || 
          body.message?.conversation || 
          body.message?.extendedTextMessage?.text || '';
      }
      // Case 5: Generic JSON direct format { phoneNumber/sender, message/text }
      else if (body.phoneNumber || body.sender || body.phone) {
        fromPhone = body.phoneNumber || body.sender || body.phone;
        messageText = body.message || body.text || '';
      }
    }

    // Clean phone number (strip "whatsapp:" and "@c.us" / "@s.whatsapp.net")
    fromPhone = fromPhone.replace('whatsapp:', '').replace('@c.us', '').replace('@s.whatsapp.net', '').trim();

    if (!fromPhone || !messageText) {
      return NextResponse.json({ error: 'Missing phoneNumber or message body' }, { status: 400 });
    }

    // Load active timetable and campus metadata from live Supabase tables
    const datasets = await getActiveDatasets();

    // Process message through Conversational AI Reasoning Engine (English, Roman Urdu, Urdu Script)
    const result = await generateConversationalResponse({
      phoneNumber: fromPhone,
      userMessage: messageText,
      datasets: {
        students: datasets.students,
        batches: datasets.batches,
        courses: datasets.courses,
        faculty: datasets.faculty,
        rooms: datasets.rooms,
        sessions: datasets.sessions,
        currentTimeStr: body.customTimeStr,
        currentDayOfWeek: body.customDayOfWeek,
      },
    });

    let finalReply = result.replyText;
    let dispatchRes: { success: boolean; id?: string; error?: string };

    if (isVoiceNote) {
      const voicePrefix = result.detectedLang === 'roman_urdu' 
        ? `🎙️ *(Aapke voice note ka jawab)*:\n\n`
        : `🎙️ *(Voice Note Response)*:\n\n`;
      finalReply = voicePrefix + finalReply;
      dispatchRes = await sendRealWhatsAppMessage(fromPhone, finalReply);
    } else if (result.interactive) {
      dispatchRes = await sendRealWhatsAppInteractiveMessage(fromPhone, result.interactive);
    } else {
      dispatchRes = await sendRealWhatsAppMessage(fromPhone, finalReply);
    }

    return NextResponse.json({
      success: true,
      senderPhone: fromPhone,
      studentInput: messageText,
      agentReply: finalReply,
      hasInteractive: Boolean(result.interactive),
      interactiveType: result.interactive?.type || null,
      detectedLanguage: result.detectedLang,
      isVoiceNote,
      isIdentified: result.profile.isIdentified,
      studentName: result.profile.studentName,
      batchName: result.profile.batchName,
      rollNumber: result.profile.rollNumber,
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
