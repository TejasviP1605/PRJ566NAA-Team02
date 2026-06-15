import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && publishableKey)

if (!isSupabaseConfigured) {
  console.warn(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env and add your Supabase keys.'
  )
}

let client = null

function getClient() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Copy .env.example to .env and add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
    )
  }
  if (!client) {
    client = createClient(url, publishableKey)
  }
  return client
}

/** Lazy Supabase client — avoids crashing when .env is missing on first load. */
export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const value = getClient()[prop]
      return typeof value === 'function' ? value.bind(getClient()) : value
    },
  }
)
