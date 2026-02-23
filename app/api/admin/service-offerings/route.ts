import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminAuth } from "@/lib/api-admin-auth";

export const runtime = "edge";

function normalizeNullableText(value: unknown) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function validAccountId(value: string | null) {
    return value ? /^acct_[A-Za-z0-9]+$/.test(value) : true;
}

function validPriceId(value: string | null) {
    return value ? /^price_[A-Za-z0-9]+$/.test(value) : true;
}

export async function GET(request: NextRequest) {
    const adminAuth = await requireAdminAuth(request);
    if ("errorResponse" in adminAuth) {
        return adminAuth.errorResponse;
    }

    const slug = request.nextUrl.searchParams.get("slug")?.trim().toLowerCase();
    let query = supabaseAdmin
        .from("service_offerings")
        .select("*")
        .order("created_at", { ascending: true });

    if (slug) {
        query = query.eq("slug", slug);
    }

    const { data, error } = await query;
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ services: data || [] });
}

export async function POST(request: NextRequest) {
    const adminAuth = await requireAdminAuth(request);
    if ("errorResponse" in adminAuth) {
        return adminAuth.errorResponse;
    }

    const body = await request.json();
    const slug = normalizeNullableText(body.slug)?.toLowerCase();
    const displayName = normalizeNullableText(body.display_name);
    const description = normalizeNullableText(body.description);
    const stripeProductId = normalizeNullableText(body.stripe_product_id);
    const stripePriceId = normalizeNullableText(body.stripe_price_id);
    const connectedAccountId = normalizeNullableText(body.connected_account_id);
    const priceDisplay = normalizeNullableText(body.price_display);
    const currency = normalizeNullableText(body.currency)?.toLowerCase() || "usd";
    const amountCents = Number.isFinite(Number(body.amount_cents))
        ? Math.max(0, Math.trunc(Number(body.amount_cents)))
        : null;
    const active = Boolean(body.active);

    if (!slug) {
        return NextResponse.json({ error: "slug is required." }, { status: 400 });
    }
    if (!displayName) {
        return NextResponse.json({ error: "display_name is required." }, { status: 400 });
    }
    if (!validAccountId(connectedAccountId)) {
        return NextResponse.json(
            { error: "connected_account_id must look like acct_..." },
            { status: 400 }
        );
    }
    if (!validPriceId(stripePriceId)) {
        return NextResponse.json(
            { error: "stripe_price_id must look like price_..." },
            { status: 400 }
        );
    }
    if (active && (!stripePriceId || !connectedAccountId)) {
        return NextResponse.json(
            { error: "Active offerings require both stripe_price_id and connected_account_id." },
            { status: 400 }
        );
    }

    const { data, error } = await supabaseAdmin
        .from("service_offerings")
        .upsert(
            {
                slug,
                display_name: displayName,
                description,
                active,
                stripe_product_id: stripeProductId,
                stripe_price_id: stripePriceId,
                connected_account_id: connectedAccountId,
                currency,
                amount_cents: amountCents,
                price_display: priceDisplay,
                metadata: typeof body.metadata === "object" && body.metadata !== null ? body.metadata : {},
            },
            { onConflict: "slug" }
        )
        .select("*")
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ service: data });
}
