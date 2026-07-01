// Optional shared backend (Supabase) for a live, cross-device attendance roster.
//
// Anon keys are safe to ship in the client — they're protected by row-level
// security (see supabase/schema.sql). Paste your project's URL + anon key below
// (or set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY at build time). Leave blank
// and the app stays fully local (per-browser localStorage) — nothing changes.
//
// The client library is dynamically imported, so it's only fetched when a
// project is actually configured — no bundle cost otherwise.

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '' // e.g. 'https://xxxx.supabase.co'
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '' // public anon key

export const hasSupabase = !!(SUPABASE_URL && SUPABASE_ANON_KEY)

let clientPromise = null

// Returns a Supabase client, or null if unconfigured / the lib fails to load.
export function getSupabase() {
  if (!hasSupabase) return Promise.resolve(null)
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js')
      .then(({ createClient }) =>
        createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { persistSession: false },
          realtime: { params: { eventsPerSecond: 2 } },
        })
      )
      .catch(() => null)
  }
  return clientPromise
}
