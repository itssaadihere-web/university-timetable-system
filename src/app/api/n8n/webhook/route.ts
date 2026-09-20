import { NextRequest, NextResponse } from 'next/server';

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
    console.log('Meta WhatsApp Webhook Verified Successfully!');
    return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  if (mode && token) {
    return new Response('Forbidden', { status: 403 });
  }

  return NextResponse.json({
    status: 'online',
    agent: 'Salim Habib University n8n AI WhatsApp Agent Gateway',
    webhookConfigured: true,
  });
}

/**
 * POST Handler for forwarding WhatsApp Inbound payloads to n8n AI Agent Workflow
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const n8nWebhookUrl = process.env.N8N_WHATSAPP_WEBHOOK_URL || process.env.N8N_SCHEDULE_CHANGE_WEBHOOK_URL;

    if (n8nWebhookUrl) {
      // Forward payload to n8n workflow
      fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch((e) => console.error('Error forwarding to n8n:', e));
    }

    // Always respond 200 OK to Meta immediately
    return NextResponse.json({
      status: 'acknowledged',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
