// Supabase Edge Function: sends a "session starts in 1 hour" push via
// OneSignal's REST API. Invoked on a schedule by pg_cron — see
// PUSH_NOTIFICATIONS_SETUP.md for the cron SQL and one-time setup.
//
// Required secrets (set once via `supabase secrets set ...`):
//   ONESIGNAL_APP_ID   — same value used client-side as VITE_ONESIGNAL_APP_ID
//   ONESIGNAL_API_KEY  — OneSignal's REST API key (Settings → Keys & IDs).
//                        Server-side only — never exposed to the client.
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'

const MESSAGES: Record<string, { en: string; si: string; ta: string }> = {
  wed: {
    en: '🏸 Wednesday Night Doubles starts in 1 hour — Green Badminton Club, 8 PM. See you on court!',
    si: '🏸 බදාදා රාත්‍රී යුගල තරගය පැයකින් ආරම්භ වේ — Green Badminton Club, රාත්‍රි 8. කෝට්ටයේදී හමුවෙමු!',
    ta: '🏸 புதன்கிழமை இரவு ஜோடி போட்டி 1 மணி நேரத்தில் தொடங்குகிறது — Green Badminton Club, இரவு 8. கோர்ட்டில் சந்திப்போம்!',
  },
  sat: {
    en: '🏸 Saturday Morning Doubles starts in 1 hour — Green Badminton Club, 8 AM. See you on court!',
    si: '🏸 සෙනසුරාදා උදෑසන යුගල තරගය පැයකින් ආරම්භ වේ — Green Badminton Club, උදේ 8. කෝට්ටයේදී හමුවෙමු!',
    ta: '🏸 சனிக்கிழமை காலை ஜோடி போட்டி 1 மணி நேரத்தில் தொடங்குகிறது — Green Badminton Club, காலை 8. கோர்ட்டில் சந்திப்போம்!',
  },
}

serve(async (req) => {
  const appId = Deno.env.get('ONESIGNAL_APP_ID')
  const apiKey = Deno.env.get('ONESIGNAL_API_KEY')
  if (!appId || !apiKey) {
    return new Response(JSON.stringify({ error: 'ONESIGNAL_APP_ID / ONESIGNAL_API_KEY not configured' }), { status: 500 })
  }

  let session = 'wed'
  try {
    const body = await req.json()
    if (body?.session === 'sat') session = 'sat'
  } catch {
    /* no/invalid body — default to 'wed' */
  }

  const contents = MESSAGES[session]
  const res = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      included_segments: ['Subscribed Users'],
      headings: { en: 'Ceylon Badminton Club' },
      contents,
    }),
  })

  const result = await res.json()
  return new Response(JSON.stringify(result), { status: res.ok ? 200 : 502 })
})
