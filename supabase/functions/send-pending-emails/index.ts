import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { SMTPClient } from 'https://deno.land/x/denomailer/mod.ts'

serve(async (req) => {
  const expectedSecret = Deno.env.get('CRON_SECRET')
  const providedSecret = req.headers.get('x-cron-secret') || req.headers.get('X-Cron-Secret') || ''

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const gmailAppPassword = Deno.env.get('GMAIL_APP_PASSWORD')
  const gmailUser = Deno.env.get('GMAIL_USER')

  if (!gmailUser || !gmailAppPassword) {
    return Response.json({ ok: false, error: 'GMAIL_USER and GMAIL_APP_PASSWORD must be set' }, { status: 500 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ ok: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
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
  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
        auth: {
          username: gmailUser,
        password: gmailAppPassword,
      },
    },
  })

  let sent = 0
  let failed = 0

  try {
    for (const row of rows) {
      try {
        await client.send({
          from: row.from_address,
          to: row.to_address,
          subject: row.subject,
          content: row.body,
        })
        await markSent(supabase, row.id)
        sent += 1
      } catch (err) {
        await markFailed(supabase, row.id, err instanceof Error ? err.message : String(err))
        failed += 1
      }
    }

    await client.close()
  } catch (err) {
    await client.close().catch(() => {})
    return Response.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }

  return Response.json({ ok: true, processed: rows.length, sent, failed })
})

async function markSent(supabase, id) {
  const { error } = await supabase
    .from('inbox_entries')
    .update({ status: 'sent', error_message: null, sent_at: new Date().toISOString() })
    .eq('id', id)
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
