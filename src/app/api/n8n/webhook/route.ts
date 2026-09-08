import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint for triggering n8n webhook automations for WhatsApp / Email alerts on schedule updates
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventType, session, changedBy, affectedParties } = body;

    const n8nWebhookUrl = process.env.N8N_SCHEDULE_CHANGE_WEBHOOK_URL;

    if (n8nWebhookUrl) {
      // Forward payload to self-hosted n8n instance
      await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          session,
          changedBy,
          affectedParties,
          timestamp: new Date().toISOString(),
        }),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification event successfully dispatched to n8n automation hub.',
      dispatchedPayload: { eventType, changedBy, timestamp: new Date().toISOString() },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
