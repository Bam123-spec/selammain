import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type AdminAuthResult =
    | { userId: string }
    | { errorResponse: NextResponse };

export async function requireAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return {
            errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        };
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
        return {
            errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        };
    }

    const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError || profile?.role !== "admin") {
        return {
            errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
        };
    }

    return { userId: user.id };
}
