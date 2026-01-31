/**
 * Generate Museum Description using AI
 * Creates rich descriptions for museums based on their name, city, and country
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { museum_name, city, country, website } = await req.json();

    if (!museum_name) {
      return new Response(
        JSON.stringify({ error: 'Museum name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Tu es un expert en histoire de l'art et en muséologie. Génère une description riche et informative pour ce musée:

Nom: ${museum_name}
${city ? `Ville: ${city}` : ''}
${country ? `Pays: ${country}` : ''}
${website ? `Site web: ${website}` : ''}

La description doit être en français, faire environ 150-200 mots et inclure:
- L'histoire et la fondation du musée (si connu)
- Les collections principales et œuvres majeures
- L'architecture du bâtiment (si remarquable)
- Ce qui rend ce musée unique ou incontournable

Réponds uniquement avec la description, sans titre ni introduction.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      throw new Error('AI generation failed');
    }

    const data = await response.json();
    const description = data.content?.[0]?.text || '';

    return new Response(
      JSON.stringify({ description }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Generation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
