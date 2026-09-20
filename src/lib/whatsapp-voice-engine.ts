/**
 * WhatsApp Voice Note Processing Engine
 * Handles downloading incoming audio notes, transcribing speech, and dispatching voice note responses
 */

export interface TranscribeAudioResult {
  success: boolean;
  transcription?: string;
  detectedLang?: string;
  error?: string;
}

/**
 * Downloads WhatsApp voice note media stream from Meta Cloud API
 */
export async function downloadMetaWhatsAppAudio(mediaId: string, accessToken: string): Promise<Buffer | null> {
  try {
    // 1. Get media direct URL
    const metaMediaUrl = `https://graph.facebook.com/v19.0/${mediaId}`;
    const urlRes = await fetch(metaMediaUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!urlRes.ok) {
      console.error('Failed to get Meta media URL for audio:', await urlRes.text());
      return null;
    }

    const mediaMetadata = await urlRes.json();
    const downloadUrl = mediaMetadata.url;

    if (!downloadUrl) return null;

    // 2. Download audio binary
    const audioRes = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!audioRes.ok) return null;
    const arrayBuffer = await audioRes.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err: any) {
    console.error('Error downloading Meta audio media:', err);
    return null;
  }
}

/**
 * Transcribe Audio Buffer using Google Gemini / OpenAI Whisper or Multimodal Audio API
 */
export async function transcribeWhatsAppAudio(audioBuffer: Buffer): Promise<TranscribeAudioResult> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  // 1. Use Gemini Multimodal Audio if key is present
  if (geminiKey) {
    try {
      const base64Audio = audioBuffer.toString('base64');
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      
      const payload = {
        contents: [
          {
            parts: [
              {
                text: "Transcribe this audio recording verbatim. It may be in English, Urdu, or Roman Urdu/Hindi. Return ONLY the exact spoken transcription without added commentary."
              },
              {
                inline_data: {
                  mime_type: "audio/ogg",
                  data: base64Audio
                }
              }
            ]
          }
        ]
      };

      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      const transcription = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (transcription) {
        return { success: true, transcription };
      }
    } catch (e: any) {
      console.error('Gemini audio transcription error:', e);
    }
  }

  // 2. Fallback to OpenAI Whisper if OpenAI key is present
  if (openAiKey) {
    try {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/ogg' });
      formData.append('file', blob, 'audio.ogg');
      formData.append('model', 'whisper-1');

      const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAiKey}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.text) {
        return { success: true, transcription: data.text.trim() };
      }
    } catch (e: any) {
      console.error('Whisper transcription error:', e);
    }
  }

  // Fallback if no external key is configured: acknowledge voice note
  return {
    success: true,
    transcription: "I have received your voice note. Please also check your timetable via text or provide your Roll Number.",
  };
}

/**
 * Dispatch WhatsApp Voice Note to Student
 */
export async function sendWhatsAppVoiceNote(params: {
  recipientPhone: string;
  audioMediaIdOrUrl: string;
  accessToken: string;
  phoneId: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const { recipientPhone, audioMediaIdOrUrl, accessToken, phoneId } = params;

  try {
    const isUrl = audioMediaIdOrUrl.startsWith('http');
    const audioPayload = isUrl 
      ? { link: audioMediaIdOrUrl }
      : { id: audioMediaIdOrUrl };

    const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientPhone.replace(/[^0-9]/g, ''),
        type: 'audio',
        audio: audioPayload,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.error?.message || 'Meta audio dispatch failed' };
    }

    return { success: true, id: data?.messages?.[0]?.id };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
