import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripeFetch } from "@/lib/stripe-lite";
import { getSafeStripeError } from "@/lib/stripe-errors";

export const runtime = "edge";

type CheckoutBody = {
    service_slug?: string;
    customer_email?: string;
};

function errorResponse(status: number, code: string, message: string) {
    return NextResponse.json(
        { error: { code, message } },
        { status }
    );
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

export async function POST(request: NextRequest) {
    try {
        let body: CheckoutBody;
        try {
            body = (await request.json()) as CheckoutBody;
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
            .select(
                "slug, display_name, active, stripe_price_id, stripe_product_id, connected_account_id, currency"
            )
            .eq("slug", serviceSlug)
            .eq("active", true)
            .maybeSingle();

        if (serviceError) {
            return errorResponse(500, "service_lookup_failed", "Unable to load service configuration.");
        }

        if (!serviceOffering) {
            return errorResponse(404, "service_not_found", "Service not found.");
        }

        if (!serviceOffering.stripe_price_id || !serviceOffering.connected_account_id) {
            return errorResponse(
                400,
                "service_not_configured",
                "Service checkout is not configured."
            );
        }

        if (!isValidPriceId(serviceOffering.stripe_price_id)) {
            return errorResponse(400, "invalid_price_id", "Service has an invalid Stripe price configuration.");
        }

        if (!isValidConnectedAccountId(serviceOffering.connected_account_id)) {
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

        const successUrl = `${origin}/services/${encodeURIComponent(serviceOffering.slug)}/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${origin}/services/${encodeURIComponent(serviceOffering.slug)}`;

        const checkoutSession = await stripeFetch(
            "/checkout/sessions",
            "POST",
            {
                mode: "payment",
                allow_promotion_codes: true,
                line_items: [
                    {
                        price: serviceOffering.stripe_price_id,
                        quantity: 1,
                    },
                ],
                success_url: successUrl,
                cancel_url: cancelUrl,
                ...(body.customer_email ? { customer_email: body.customer_email } : {}),
                metadata: {
                    service_slug: serviceOffering.slug,
                    service_name: serviceOffering.display_name,
                },
            },
            {
                stripeAccount: serviceOffering.connected_account_id,
            }
        );

        if (!checkoutSession?.url) {
            return errorResponse(502, "checkout_url_missing", "Unable to create checkout session.");
        }

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error: any) {
        const safe = getSafeStripeError(error);
        console.error("Checkout route error:", safe.code);
        return errorResponse(safe.status, safe.code, safe.message);
    }
}
