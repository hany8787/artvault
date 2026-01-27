import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { limit = 3 } = await req.json().catch(() => ({}))

    // Fetch from Paris Open Data API
    const url = `https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/que-faire-a-paris-/records?limit=10&refine=tags%3Aexposition`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`)
    }

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      return new Response(
        JSON.stringify({ exhibitions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const now = new Date()
    const exhibitions = data.results
      .filter((record: any) => {
        if (!record.date_end) return true
        const endDate = new Date(record.date_end)
        return endDate >= now
      })
      .slice(0, limit)
      .map((record: any) => ({
        id: record.id || Math.random().toString(),
        title: record.title || 'Sans titre',
        venue: record.address_name || record.address_street || 'Paris',
        date_start: record.date_start,
        date_end: record.date_end,
        description: record.lead_text || record.description,
        url: record.url,
        image_url: record.cover_url || record.cover?.url,
      }))

    return new Response(
      JSON.stringify({ exhibitions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error fetching exhibitions:', error)
    return new Response(
      JSON.stringify({ error: error.message, exhibitions: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
