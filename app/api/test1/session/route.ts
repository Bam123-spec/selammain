import { NextRequest, NextResponse } from "next/server";
import { stripeFetch } from "@/lib/stripe-lite";
import { getSafeStripeError } from "@/lib/stripe-errors";

export const runtime = "edge";

function errorResponse(status: number, code: string, message: string) {
    return NextResponse.json({ error: { code, message } }, { status });
}

function sanitizeText(value: unknown, maxLength: number) {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, maxLength);
}

function isValidSessionId(value: string) {
    return value.length >= 8 && value.length <= 128 && /^cs_[A-Za-z0-9_]+$/.test(value);
}

export async function GET(request: NextRequest) {
    try {
        const sessionId = sanitizeText(request.nextUrl.searchParams.get("session_id"), 128);

        if (!isValidSessionId(sessionId)) {
            return errorResponse(400, "invalid_session_id", "session_id is missing or invalid.");
        }

        const session = await stripeFetch(`/checkout/sessions/${encodeURIComponent(sessionId)}`, "GET");
        const metadata = (session?.metadata || {}) as Record<string, unknown>;
        const paymentStatus = sanitizeText(session?.payment_status, 20);

        if (paymentStatus !== "paid") {
            return errorResponse(409, "payment_not_completed", "Payment has not completed yet.");
        }

        return NextResponse.json({
            session: {
                id: sanitizeText(session?.id, 128),
                payment_status: paymentStatus,
                status: sanitizeText(session?.status, 40),
                amount_total: typeof session?.amount_total === "number" ? session.amount_total : null,
                currency: typeof session?.currency === "string" ? session.currency : null,
                customer_email:
                    sanitizeText(session?.customer_details?.email, 200) ||
                    sanitizeText(session?.customer_email, 200) ||
                    sanitizeText(metadata.email, 200) ||
                    null,
                customer_name:
                    sanitizeText(session?.customer_details?.name, 120) ||
                    sanitizeText(metadata.name, 120) ||
                    null,
                service: sanitizeText(metadata.service, 150) || sanitizeText(metadata.product_name, 150) || null,
                date: sanitizeText(metadata.date, 40) || null,
                time: sanitizeText(metadata.time, 40) || null,
                instructor: sanitizeText(metadata.instructor, 120) || null,
                email_type: sanitizeText(metadata.email_type, 20) || null,
            },
        });
    } catch (error: any) {
        const safe = getSafeStripeError(error);
        console.error("Test session route error:", safe.code);
        return errorResponse(safe.status, safe.code, safe.message);
    }
}
