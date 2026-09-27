import { NextRequest, NextResponse } from 'next/server';
import { processIncomingWhatsAppMessage, sendRealWhatsAppMessage } from '@/lib/whatsapp-state-engine';
import { 
  INITIAL_BATCHES, 
  INITIAL_COURSES, 
  INITIAL_FACULTY, 
  INITIAL_ROOMS, 
  INITIAL_SESSIONS, 
  INITIAL_STUDENTS 
} from '@/lib/mock-data';

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
    service: 'Salim Habib University WhatsApp Cloud API Gateway',
    webhookConfigured: true,
  });
}

/**
 * POST Handler for Meta WhatsApp Inbound Messages
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if forward to external n8n workflow is configured
    const n8nWebhookUrl = process.env.N8N_WHATSAPP_WEBHOOK_URL || process.env.N8N_SCHEDULE_CHANGE_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch((e) => console.error('Error forwarding to n8n:', e));
    }

    // Parse Meta WhatsApp Webhook Payload structure
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];

    if (message && message.type === 'text') {
      const fromPhone = message.from; // e.g. "923200269021"
      const text = message.text?.body || '';

      console.log(`[WhatsApp Inbound] Received from: ${fromPhone}, text: "${text}"`);

      // Process message through conversational timetable state engine
      const result = processIncomingWhatsAppMessage({
        phoneNumber: fromPhone,
        incomingText: text,
        students: INITIAL_STUDENTS,
        batches: INITIAL_BATCHES,
        courses: INITIAL_COURSES,
        faculty: INITIAL_FACULTY,
        rooms: INITIAL_ROOMS,
        sessions: INITIAL_SESSIONS,
      });

      if (result.replyText) {
        console.log(`[WhatsApp Reply] Dispatching answer to ${fromPhone}...`);
        await sendRealWhatsAppMessage(fromPhone, result.replyText);
      }
    }

    // Meta requires an immediate 200 OK
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
