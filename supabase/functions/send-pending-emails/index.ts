import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const RESEND_API = 'https://api.resend.com/emails'

serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const resendApiKey = Deno.env.get('RESEND_API_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ ok: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
  }

  if (!resendApiKey) {
    return Response.json({ ok: false, error: 'Missing RESEND_API_KEY' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  const { data, error: fetchError } = await supabase
    .from('inbox_entries')
    .select('*')
    .eq('status', 'pending')
    .limit(50)

  if (fetchError) {
    return Response.json({ ok: false, error: fetchError.message }, { status: 500 })
  }

  const rows = data || []
  let sent = 0
  let failed = 0

  for (const row of rows) {
    try {
      const response = await fetch(RESEND_API, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: row.from_address,
          to: row.to_address,
          subject: row.subject,
          text: row.body,
        }),
      })

      if (!response.ok) {
        const body = await response.text()
        const message = `Resend ${response.status}: ${body}`
        await markFailed(supabase, row.id, message)
        failed += 1
        continue
      }

      await markSent(supabase, row.id)
      sent += 1
    } catch (err) {
      await markFailed(supabase, row.id, err instanceof Error ? err.message : String(err))
      failed += 1
    }
  }

  return Response.json({ ok: true, processed: rows.length, sent, failed })
})

async function markSent(supabase, id) {
  const { error } = await supabase.from('inbox_entries').update({ status: 'sent', error_message: null }).eq('id', id)
  if (error) {
    // Fallback if the error_message column is absent in the user's configured schema.
    await supabase.from('inbox_entries').update({ status: 'sent' }).eq('id', id)
  }
}

async function markFailed(supabase, id, message) {
  const { error } = await supabase
    .from('inbox_entries')
    .update({ status: 'failed', error_message: message })
    .eq('id', id)

  if (error) {
    // Some installations of inbox_entries may not have error_message yet.
    await supabase.from('inbox_entries').update({ status: 'failed' }).eq('id', id)
  }
}
