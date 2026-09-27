import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Meta User Data Deletion Callback Endpoint
 * Specification: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback/
 */

export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'Salim Habib University Meta Data Deletion Callback Endpoint',
  });
}

export async function POST(req: NextRequest) {
  try {
    let signedRequest = '';
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      signedRequest = (formData.get('signed_request') as string) || '';
    } else if (contentType.includes('application/json')) {
      const json = await req.json();
      signedRequest = json.signed_request || '';
    }

    let userId = 'anonymous';

    if (signedRequest) {
      const parts = signedRequest.split('.');
      if (parts.length === 2) {
        try {
          const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
          const payload = JSON.parse(payloadJson);
          if (payload.user_id) {
            userId = payload.user_id;
          }
        } catch (e) {
          console.warn('Failed to parse signed_request payload', e);
        }
      }
    }

    const confirmationCode = `DEL-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const host = req.headers.get('host') || 'shu.edu.pk';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const trackingUrl = `${protocol}://${host}/data-deletion?code=${confirmationCode}&user=${userId}`;

    console.log(`[Meta Data Deletion Request] User ID: ${userId}, Code: ${confirmationCode}`);

    return NextResponse.json({
      url: trackingUrl,
      confirmation_code: confirmationCode,
    });
  } catch (error: any) {
    console.error('Data Deletion Callback Error:', error);
    return NextResponse.json(
      { error: 'Failed to process data deletion request' },
      { status: 500 }
    );
  }
}
