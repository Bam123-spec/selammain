import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripeFetch } from "@/lib/stripe-lite";
import { getSafeStripeError } from "@/lib/stripe-errors";

export const runtime = "edge";

type EmbeddedCheckoutBody = {
    service_slug?: string;
    customer_email?: string;
    class_id?: string;
    class_name?: string;
    class_date?: string;
    class_time?: string;
    location?: string;
    student_name?: string;
    student_phone?: string;
    return_path?: string;
    metadata?: Record<string, unknown>;
};

const REQUIRE_STUDENT_DETAILS_TYPES = new Set([
    "DRIVING_PRACTICE_PACKAGE",
    "ROAD_TEST_PACKAGE",
    "RSEP_DIP_ENROLLMENT",
]);

function errorResponse(status: number, code: string, message: string) {
    return NextResponse.json({ error: { code, message } }, { status });
}

function isValidServiceSlug(value: string) {
    return value.length >= 1 && value.length <= 64 && /^[a-z0-9-]+$/.test(value);
}

function isValidConnectedAccountId(value: string) {
    return /^acct_[A-Za-z0-9]+$/.test(value);
}

function isValidPriceId(value: string) {
    return /^price_[A-Za-z0-9]+$/.test(value);
}

function sanitizeText(value: unknown, maxLength: number) {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, maxLength);
}

function sanitizeReturnPath(value: unknown) {
    if (typeof value !== "string") return "";
    const trimmed = value.trim();
    if (!trimmed.startsWith("/")) return "";
    if (trimmed.startsWith("//")) return "";
    return trimmed.slice(0, 500);
}

export async function POST(request: NextRequest) {
    try {
        let body: EmbeddedCheckoutBody;
        try {
            body = (await request.json()) as EmbeddedCheckoutBody;
        } catch {
            return errorResponse(400, "invalid_json", "Request body must be valid JSON.");
        }

        if (typeof body?.service_slug !== "string") {
            return errorResponse(400, "invalid_service_slug", "service_slug is required.");
        }

        const serviceSlug = body.service_slug.trim().toLowerCase();
        if (!isValidServiceSlug(serviceSlug)) {
            return errorResponse(
                400,
                "invalid_service_slug",
                "service_slug must be 1-64 chars of lowercase letters, numbers, or dashes."
            );
        }

        const { data: serviceOffering, error: serviceError } = await supabaseAdmin
            .from("service_offerings")
            .select("slug, active, stripe_price_id, connected_account_id")
            .eq("slug", serviceSlug)
            .eq("active", true)
            .maybeSingle();

        if (serviceError) {
            return errorResponse(500, "service_lookup_failed", "Unable to load service configuration.");
        }

        if (!serviceOffering) {
            return errorResponse(404, "service_not_found", "Service not found.");
        }

        const priceId = serviceOffering.stripe_price_id || "";
        const connectedAccountId = serviceOffering.connected_account_id || "";

        if (!priceId || !connectedAccountId) {
            return errorResponse(400, "service_not_configured", "Service checkout is not configured.");
        }
        if (!isValidPriceId(priceId)) {
            return errorResponse(400, "invalid_price_id", "Service has an invalid Stripe price configuration.");
        }
        if (!isValidConnectedAccountId(connectedAccountId)) {
            return errorResponse(
                400,
                "invalid_connected_account",
                "Service has an invalid connected account configuration."
            );
        }

        const forwardedProto = request.headers.get("x-forwarded-proto");
        const forwardedHost = request.headers.get("x-forwarded-host");
        const host = forwardedHost || request.headers.get("host") || request.nextUrl.host;
        const protocol = forwardedProto || "https";
        const origin = `${protocol}://${host}`;

        const defaultReturnPath = `/services/${encodeURIComponent(serviceOffering.slug)}/success`;
        const returnPath = sanitizeReturnPath(body.return_path) || defaultReturnPath;
        const returnUrl = returnPath.includes("{CHECKOUT_SESSION_ID}")
            ? `${origin}${returnPath}`
            : `${origin}${returnPath}${returnPath.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`;

        const metadata: Record<string, string> = {
            service_slug: serviceOffering.slug,
        };

        const classId = sanitizeText(body.class_id, 100);
        const className = sanitizeText(body.class_name, 150);
        const classDate = sanitizeText(body.class_date, 40);
        const classTime = sanitizeText(body.class_time, 40);
        const location = sanitizeText(body.location, 40);
        const studentName = sanitizeText(body.student_name, 120);
        const studentPhone = sanitizeText(body.student_phone, 40);
        if (classId) metadata.class_id = classId;
        if (className) metadata.class_name = className;
        if (classDate) metadata.class_date = classDate;
        if (classTime) metadata.class_time = classTime;
        if (location) metadata.location = location;
        if (studentName) metadata.student_name = studentName;
        if (studentPhone) metadata.student_phone = studentPhone;

        if (body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)) {
            for (const [rawKey, rawValue] of Object.entries(body.metadata)) {
                const key = rawKey.trim().slice(0, 40);
                if (!/^[a-zA-Z0-9_]+$/.test(key)) continue;
                const value = String(rawValue ?? "").trim().slice(0, 500);
                if (!value) continue;
                metadata[key] = value;
            }
        }

        const customerEmail = sanitizeText(body.customer_email, 200);
        const paymentType = String(body?.metadata?.type ?? metadata.type ?? "").trim().toUpperCase();

        if (REQUIRE_STUDENT_DETAILS_TYPES.has(paymentType)) {
            if (!studentName) {
                return errorResponse(400, "missing_student_name", "Student name is required.");
            }
            if (!customerEmail) {
                return errorResponse(400, "missing_customer_email", "Email is required.");
            }
        }

        const checkoutSession = await stripeFetch(
            "/checkout/sessions",
            "POST",
            {
                ui_mode: "embedded",
                mode: "payment",
                allow_promotion_codes: true,
                phone_number_collection: {
                    enabled: true,
                },
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                return_url: returnUrl,
                ...(customerEmail ? { customer_email: customerEmail } : {}),
                metadata,
            },
            {
                stripeAccount: connectedAccountId,
            }
        );

        if (!checkoutSession?.client_secret) {
            return errorResponse(
                502,
                "checkout_client_secret_missing",
                "Unable to initialize embedded checkout."
            );
        }

        return NextResponse.json({ clientSecret: checkoutSession.client_secret });
    } catch (error: unknown) {
        const safe = getSafeStripeError(error);
        console.error("Embedded checkout route error:", safe.code);
        return errorResponse(safe.status, safe.code, safe.message);
    }
}
