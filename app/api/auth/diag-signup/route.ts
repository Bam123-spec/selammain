import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: Request) {
    console.log("Diag Signup: POST request received");
    try {
        const body = await request.json();
        console.log("Diag Signup: Request body:", body);
        return NextResponse.json({
            success: true,
            received: body,
            timestamp: new Date().toISOString(),
            message: "Diagnostic POST successful"
        });
    } catch (error: any) {
        console.error("Diag Signup Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: "Diagnostic GET successful. Use POST for full test."
    });
}
