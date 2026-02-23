import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

// Use createBrowserClient for automatic cookie handling in Client Components
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Log initialization status
if (typeof window === 'undefined') {
    // console.log("Supabase client initialized on server/edge") // No longer relevant for browser client usage
    if (supabaseUrl.includes('placeholder')) {
        console.warn("CRITICAL: Supabase URL is using placeholder value!")
    }
}
