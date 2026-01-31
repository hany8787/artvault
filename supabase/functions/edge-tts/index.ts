/**
 * Edge TTS - Text-to-Speech using Microsoft Edge voices
 * Provides high-quality neural voices for audio guide
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Microsoft Edge TTS voices
const VOICES = {
  'fr-FR': {
    female: 'fr-FR-DeniseNeural',
    male: 'fr-FR-HenriNeural',
  },
  'en-US': {
    female: 'en-US-JennyNeural',
    male: 'en-US-GuyNeural',
  },
  'en-GB': {
    female: 'en-GB-SoniaNeural',
    male: 'en-GB-RyanNeural',
  }
};

// Rate adjustments by level
const RATE_CONFIG = {
  enfant: '-10%',  // Slower for children
  amateur: '0%',    // Normal speed
  expert: '+5%',    // Slightly faster for experts
};

// Pitch adjustments
const PITCH_CONFIG = {
  enfant: '+5%',
  amateur: '0%',
  expert: '-5%',
};

/**
 * Generate SSML for Edge TTS
 */
function generateSSML(text: string, voice: string, rate: string, pitch: string): string {
  // Escape XML special characters
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  return `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='fr-FR'>
    <voice name='${voice}'>
      <prosody rate='${rate}' pitch='${pitch}'>
        ${escapedText}
      </prosody>
    </voice>
  </speak>`;
}

/**
 * Get Edge TTS audio using Microsoft's service
 */
async function getEdgeTTSAudio(text: string, voice: string, rate: string, pitch: string): Promise<ArrayBuffer> {
  const ssml = generateSSML(text, voice, rate, pitch);

  // Generate unique request ID
  const requestId = crypto.randomUUID().replace(/-/g, '');
  const timestamp = new Date().toISOString();

  // WebSocket URL for Edge TTS
  const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4&ConnectionId=${requestId}`;

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const audioChunks: Uint8Array[] = [];
    let audioStarted = false;

    ws.onopen = () => {
      // Send configuration
      const configMessage = `X-Timestamp:${timestamp}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
      ws.send(configMessage);

      // Send SSML request
      const ssmlMessage = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${timestamp}\r\nPath:ssml\r\n\r\n${ssml}`;
      ws.send(ssmlMessage);
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        if (event.data.includes('Path:turn.end')) {
          ws.close();
        }
      } else if (event.data instanceof Blob) {
        // Handle audio data
        event.data.arrayBuffer().then((buffer) => {
          const data = new Uint8Array(buffer);
          // Skip header (find "Path:audio" header end)
          const headerEnd = findHeaderEnd(data);
          if (headerEnd !== -1) {
            audioChunks.push(data.slice(headerEnd));
            audioStarted = true;
          } else if (audioStarted) {
            audioChunks.push(data);
          }
        });
      }
    };

    ws.onclose = () => {
      if (audioChunks.length > 0) {
        // Combine all chunks
        const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of audioChunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        resolve(result.buffer);
      } else {
        reject(new Error('No audio data received'));
      }
    };

    ws.onerror = (error) => {
      reject(new Error(`WebSocket error: ${error}`));
    };

    // Timeout after 30 seconds
    setTimeout(() => {
      if (ws.readyState !== WebSocket.CLOSED) {
        ws.close();
        reject(new Error('Request timeout'));
      }
    }, 30000);
  });
}

/**
 * Find the end of the binary header in Edge TTS response
 */
function findHeaderEnd(data: Uint8Array): number {
  // Look for the pattern that marks the end of the text header
  const needle = new TextEncoder().encode('Path:audio\r\n');
  for (let i = 0; i < data.length - needle.length; i++) {
    let found = true;
    for (let j = 0; j < needle.length; j++) {
      if (data[i + j] !== needle[j]) {
        found = false;
        break;
      }
    }
    if (found) {
      // Skip past "Path:audio\r\n"
      return i + needle.length;
    }
  }
  return -1;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, level = 'amateur', lang = 'fr-FR', gender = 'female' } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get voice configuration
    const langVoices = VOICES[lang as keyof typeof VOICES] || VOICES['fr-FR'];
    const voice = gender === 'male' ? langVoices.male : langVoices.female;
    const rate = RATE_CONFIG[level as keyof typeof RATE_CONFIG] || RATE_CONFIG.amateur;
    const pitch = PITCH_CONFIG[level as keyof typeof PITCH_CONFIG] || PITCH_CONFIG.amateur;

    // Generate audio
    const audioBuffer = await getEdgeTTSAudio(text, voice, rate, pitch);

    // Convert to base64 for JSON response
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    return new Response(
      JSON.stringify({
        audio: base64Audio,
        format: 'audio/mp3',
        voice,
        duration_estimate: Math.ceil(text.length / 15) // Rough estimate: ~15 chars per second
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Edge TTS error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'TTS generation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
