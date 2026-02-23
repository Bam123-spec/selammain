import { NextRequest, NextResponse } from "next/server";
import { stripeFetch } from "@/lib/stripe-lite";
import { requireAdminAuth } from "@/lib/api-admin-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSafeStripeError } from "@/lib/stripe-errors";

export const runtime = "edge";

function isValidConnectedAccountId(value: string) {
    return /^acct_[A-Za-z0-9]+$/.test(value);
}

function errorResponse(status: number, code: string, message: string) {
    return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(request: NextRequest) {
    const adminAuth = await requireAdminAuth(request);
    if ("errorResponse" in adminAuth) {
        return adminAuth.errorResponse;
    }

    const { data: dipService, error: dipServiceError } = await supabaseAdmin
        .from("service_offerings")
        .select("connected_account_id")
        .eq("slug", "dip")
        .maybeSingle();

    if (dipServiceError) {
        return errorResponse(500, "service_lookup_failed", "Unable to load DIP service configuration.");
    }

    const acct = dipService?.connected_account_id || "";
    if (!acct) {
        return errorResponse(
            400,
            "missing_connected_account",
            "DIP connected account is not configured."
        );
    }
    if (!isValidConnectedAccountId(acct)) {
        return errorResponse(400, "invalid_connected_account", "DIP connected account id is invalid.");
    }

    const limitInput = Number(request.nextUrl.searchParams.get("limit") || 50);
    const limit = Number.isFinite(limitInput) ? Math.max(1, Math.min(100, Math.trunc(limitInput))) : 50;

    try {
        const params = new URLSearchParams();
        params.set("active", "true");
        params.set("limit", String(limit));
        params.append("expand[]", "data.product");

        const pricesResponse = await stripeFetch(
            `/prices?${params.toString()}`,
            "GET",
            undefined,
            { stripeAccount: acct }
        );

        const prices = (pricesResponse?.data || []).map((price: any) => {
            const product = price.product || {};
            return {
                id: price.id,
                currency: price.currency,
                unit_amount: price.unit_amount,
                active: price.active,
                product: {
                    id: typeof product === "string" ? product : product.id,
                    name: typeof product === "string" ? null : product.name,
                    description: typeof product === "string" ? null : product.description,
                    active: typeof product === "string" ? null : product.active,
                },
            };
        });

        return NextResponse.json({
            account: acct,
            prices,
            has_more: Boolean(pricesResponse?.has_more),
        });
    } catch (error: any) {
        const safe = getSafeStripeError(error);
        console.error("Stripe prices list error:", safe.code);
        return errorResponse(safe.status, safe.code, safe.message);
    }
}
