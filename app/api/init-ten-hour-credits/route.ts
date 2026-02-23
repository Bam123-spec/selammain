export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('ten_hour_sessions_total, ten_hour_sessions_used, ten_hour_package_paid')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 })
        }

        const currentTotal = profile.ten_hour_sessions_total || 0

        if (currentTotal > 0) {
            return NextResponse.json({ success: true, updated: false, total: currentTotal })
        }

        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
                ten_hour_package_paid: true,
                ten_hour_sessions_total: 5,
                ten_hour_sessions_used: profile.ten_hour_sessions_used || 0
            })
            .eq('id', user.id)

        if (updateError) {
            return NextResponse.json({ error: "Failed to initialize credits" }, { status: 500 })
        }

        return NextResponse.json({ success: true, updated: true, total: 5 })
    } catch (error: any) {
        console.error("init-ten-hour-credits error:", error)
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
    }
}
