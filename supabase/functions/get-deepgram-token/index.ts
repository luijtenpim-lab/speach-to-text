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

  // ── 2. Create short-lived Deepgram key ─────────────────────────────────────
  const dgKey     = Deno.env.get('DEEPGRAM_API_KEY')!
  const projectId = 'ad351d86-bf36-4102-bd57-4361784c906e'

  const keyRes = await fetch(`https://api.deepgram.com/v1/projects/${projectId}/keys`, {
    method:  'POST',
    headers: { Authorization: `Token ${dgKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      comment:                 `voxa-${user.id.slice(0, 8)}-${Date.now()}`,
      scopes:                  ['usage:write'],
      time_to_live_in_seconds: 60,
    }),
  })

  if (!keyRes.ok) {
    const body = await keyRes.text()
    console.error('Deepgram key creation failed:', keyRes.status, body)
    return new Response(JSON.stringify({ error: 'Failed to create Deepgram token' }), { status: 502, headers: corsHeaders })
  }

  const { key } = await keyRes.json()

  return new Response(JSON.stringify({ key }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
