
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'

if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseServiceRoleKey === 'placeholder') {
    // Ensure we don't crash at build time if these are missing, but warn
    if (process.env.NODE_ENV !== 'production') {
        console.warn('Missing Supabase Service Role Key or URL')
    }
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
    global: {
        fetch: (url, options) => {
            return fetch(url, {
                ...options,
                cache: 'no-store',
            })
        }
    }
})
