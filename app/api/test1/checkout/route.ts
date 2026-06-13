import { NextRequest, NextResponse } from "next/server";
import { stripeFetch } from "@/lib/stripe-lite";
import { getSafeStripeError } from "@/lib/stripe-errors";

export const runtime = "edge";

type TestCheckoutBody = {
    product_id?: string;
    name?: string;
    email?: string;
    service?: string;
    date?: string;
    time?: string;
    instructor?: string;
};

function errorResponse(status: number, code: string, message: string) {
    return NextResponse.json({ error: { code, message } }, { status });
}

function sanitizeText(value: unknown, maxLength: number) {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, maxLength);
}

function isValidProductId(value: string) {
    return /^prod_[A-Za-z0-9]+$/.test(value);
}

export async function POST(request: NextRequest) {
    try {
        let body: TestCheckoutBody;
        try {
            body = (await request.json()) as TestCheckoutBody;
        } catch {
            return errorResponse(400, "invalid_json", "Request body must be valid JSON.");
        }

        const productId = sanitizeText(body.product_id, 100);
        const name = sanitizeText(body.name, 120);
        const email = sanitizeText(body.email, 200);
        const service = sanitizeText(body.service, 150) || "Test Checkout";
        const date = sanitizeText(body.date, 40);
        const time = sanitizeText(body.time, 40);
        const instructor = sanitizeText(body.instructor, 120);

        if (!isValidProductId(productId)) {
            return errorResponse(400, "invalid_product_id", "product_id must look like prod_...");
        }
        if (!email) {
            return errorResponse(400, "missing_email", "customer email is required.");
        }

        const product = await stripeFetch(`/products/${encodeURIComponent(productId)}`, "GET");
        const defaultPriceId = typeof product?.default_price === "string" ? product.default_price : "";

        if (!defaultPriceId) {
            return errorResponse(
                400,
                "missing_default_price",
                "Stripe product must have a default price before it can be used in Checkout."
            );
        }

        const forwardedProto = request.headers.get("x-forwarded-proto");
        const forwardedHost = request.headers.get("x-forwarded-host");
        const host = forwardedHost || request.headers.get("host") || request.nextUrl.host;
        const protocol = forwardedProto || "https";
        const origin = `${protocol}://${host}`;

        const checkoutSession = await stripeFetch("/checkout/sessions", "POST", {
            mode: "payment",
            line_items: [
                {
                    price: defaultPriceId,
                    quantity: 1,
                },
            ],
            allow_promotion_codes: true,
            customer_email: email,
            success_url: `${origin}/test1/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/test1`,
            metadata: {
                product_id: productId,
                product_name: sanitizeText(product?.name, 150) || service,
                name,
                email,
                service,
                date,
                time,
                instructor,
                email_type: "student",
            },
        });

        if (!checkoutSession?.url) {
            return errorResponse(502, "checkout_url_missing", "Unable to create checkout session.");
        }

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error: any) {
        const safe = getSafeStripeError(error);
        console.error("Test checkout route error:", safe.code);
        return errorResponse(safe.status, safe.code, safe.message);
    }
}
