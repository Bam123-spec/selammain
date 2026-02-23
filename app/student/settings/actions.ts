'use server'

import { supabaseAdmin } from "@/lib/supabase/admin"
import { headers } from "next/headers"

export async function uploadAvatarAction(formData: FormData) {
    const file = formData.get('file') as File
    const studentId = formData.get('studentId') as string

    if (!file || !studentId) {
        return { error: "Missing file or student ID" }
    }

    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${studentId}/${Date.now()}.${fileExt}`

        // Convert File to ArrayBuffer for Supabase Admin upload
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload using Admin Client (Bypasses RLS)
        const { error: uploadError } = await supabaseAdmin.storage
            .from('avatars')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true
            })

        if (uploadError) throw uploadError

        // Get Public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('avatars')
            .getPublicUrl(fileName)

        // Update Profile
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', studentId)

        if (updateError) throw updateError

        return { success: true, publicUrl }

    } catch (error: any) {
        console.error("Upload error:", error)
        return { error: error.message }
    }
}
