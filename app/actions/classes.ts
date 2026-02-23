"use server"


import { supabaseAdmin } from "@/lib/supabase/admin"

export async function getClasses(
    classType: string = 'DE',
    classification?: string,
    limit?: number,
    categoryId?: string
) {
    const supabase = supabaseAdmin

    let query = supabase
        .from('classes')
        .select('*')
        .ilike('class_type', classType)
        .in('status', ['active', 'upcoming'])
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true })

    if (classification) {
        query = query.ilike('classification', classification)
    }

    if (categoryId) {
        query = query.eq('category_id', categoryId)
    }

    if (limit) {
        query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching classes:', error)
        return []
    }

    return data || []
}
