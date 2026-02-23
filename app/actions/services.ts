"use server"


import { supabaseAdmin } from "@/lib/supabase/admin"

export async function getServiceBySlug(slug: string) {
    const supabase = supabaseAdmin

    // Debug: Check if we are using the placeholder key in production
    // This often happens if the env var isn't set in Vercel/Cloudflare
    if (process.env.NODE_ENV === 'production' && process.env.SUPABASE_SERVICE_ROLE_KEY === 'placeholder') {
        console.error("CRITICAL ERROR: SUPABASE_SERVICE_ROLE_KEY is missing in production!")
        return { error: 'MISSING_ENV_VAR', price: null }
    }

    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('slug', slug)
        .single()

    if (error) {
        console.error(`Error fetching service ${slug}:`, error)
        return null
    }

    return data
}

export async function getAllServices() {
    const supabase = supabaseAdmin

    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)

    if (error) {
        console.error('Error fetching services:', error)
        return []
    }

    return data
}
