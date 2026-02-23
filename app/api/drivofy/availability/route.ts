import { NextRequest, NextResponse } from "next/server";
import { ensureDrivofyStudent } from "@/lib/drivofyStudentMap";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    const searchParams = new URL(request.url).searchParams;
    const baseUrl = process.env.DRIVOFY_API_BASE_URL;
    const secret = process.env.DRIVOFY_PROXY_SECRET;

    if (!baseUrl || !secret) {
        return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    try {
        // 1. Authenticate User via Bearer Token
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Ensure Drivofy Mapping exists
        const drivofyStudentId = await ensureDrivofyStudent(user.id);

        // 3. Inject Drivofy ID into query params
        searchParams.set("student_id", drivofyStudentId);
        const queryString = searchParams.toString();

        // 4. Proxy Request
        const res = await fetch(`${baseUrl}/api/availability?${queryString}`, {
            headers: {
                "Authorization": `Bearer ${secret}`,
                "Content-Type": "application/json",
            },
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });

    } catch (error) {
        console.error("Proxy error:", error);
        return NextResponse.json(
            { error: "Failed to fetch availability" },
            { status: 500 }
        );
    }
}

export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}
