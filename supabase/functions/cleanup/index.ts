import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // ── 1. Verify the user is logged in ────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
  }

  // ── 2. Clean the transcript with GPT-4o mini ───────────────────────────────
  const { text } = await req.json()
  if (!text?.trim()) {
    return new Response(JSON.stringify({ cleaned: '' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const openaiKey = Deno.env.get('OPENAI_API_KEY')!

  const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method:  'POST',
    headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:       'gpt-4o-mini',
      temperature: 0,
      max_tokens:  500,
      messages: [
        {
          role:    'system',
          content: 'Clean up this speech transcript. Remove filler words (um, uh, like, you know, basically, right, so yeah, actually, literally, I mean, kind of, sort of). Fix grammar and punctuation. Keep exact meaning. Return ONLY the cleaned text with no explanation.',
        },
        { role: 'user', content: text },
      ],
    }),
  })

  if (!aiRes.ok) {
    // If GPT fails, return the raw transcript rather than an error
    return new Response(JSON.stringify({ cleaned: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const data    = await aiRes.json()
  const cleaned = data.choices?.[0]?.message?.content?.trim() ?? text

  return new Response(JSON.stringify({ cleaned }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
