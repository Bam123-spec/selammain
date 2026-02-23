import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripeFetch } from "@/lib/stripe-lite";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSafeStripeError } from "@/lib/stripe-errors";

// No Stripe SDK init needed
export const runtime = 'edge';

function errorResponse(status: number, code: string, message: string) {
    return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(req: Request) {
    try {
        const { classId, className, classDate, classTime, type, userId, studentEmail, studentName, studentPhone, uiMode, plan_slug, metadata: bodyMetadata } = await req.json();

        const NON_CLASS_TYPES = ['TEN_HOUR_PACKAGE', 'DRIVING_PRACTICE_PACKAGE', 'ROAD_TEST_PACKAGE'];
        if (!classId && !NON_CLASS_TYPES.includes(type)) {
            return NextResponse.json({ error: "Missing class ID" }, { status: 400 });
        }

        // Note: booking-level blocks for 10-hour sessions are enforced in /api/book-ten-hour

        const headersList = await headers();
        const host = headersList.get('host');
        const protocol = headersList.get('x-forwarded-proto') || 'https';
        const origin = `${protocol}://${host}`;

        // Determine Price and URLs based on Type
        let priceId = "price_1StT8hD0SlycNJKisH9kA4O0"; // Default RSEP/DIP
        let connectedAccountId: string | null = null;
        let successUrl = `${origin}/services/rsep/success?session_id={CHECKOUT_SESSION_ID}`;
        let cancelUrl = `${origin}/services/rsep-packages`;
        let metadata: any = {
            class_id: classId,
            class_name: className,
            class_date: classDate,
            class_time: classTime,
            type: type || "CLASS_ENROLLMENT",
            origin: origin,
            ...bodyMetadata
        };

        const classType = typeof bodyMetadata?.class_type === "string"
            ? bodyMetadata.class_type.trim().toUpperCase()
            : "";
        const connectServiceSlug = classType === "DIP" ? "dip" : classType === "RSEP" ? "rsep" : null;

        if (connectServiceSlug) {
            const { data: serviceOffering, error: serviceError } = await supabaseAdmin
                .from("service_offerings")
                .select("slug, active, stripe_price_id, connected_account_id")
                .eq("slug", connectServiceSlug)
                .maybeSingle();

            if (serviceError) {
                return errorResponse(500, "service_lookup_failed", "Unable to load service checkout configuration.");
            }

            if (!serviceOffering?.active || !serviceOffering?.stripe_price_id) {
                return errorResponse(400, "service_not_configured", `${connectServiceSlug.toUpperCase()} checkout is not configured.`);
            }

            priceId = serviceOffering.stripe_price_id;
            connectedAccountId = serviceOffering.connected_account_id || null;
            metadata.service_slug = connectServiceSlug;

            if (connectServiceSlug === "dip") {
                successUrl = `${origin}/services/dip/success?session_id={CHECKOUT_SESSION_ID}`;
                cancelUrl = `${origin}/services/improvement-program-packages`;
            } else {
                successUrl = `${origin}/services/rsep/success?session_id={CHECKOUT_SESSION_ID}`;
                cancelUrl = `${origin}/services/rsep-packages`;
            }
        }

        if (studentEmail) metadata.student_email = studentEmail;
        if (studentName) metadata.student_name = studentName;
        if (studentPhone) metadata.student_phone = studentPhone;

        if (type === 'TEN_HOUR_PACKAGE') {
            priceId = "price_1StT8hD0SlycNJKisH9kA4O0"; // Using same test Price ID as requested
            successUrl = `${origin}/checkout/success?service_slug=driving-practice-10hr&session_id={CHECKOUT_SESSION_ID}`;
            cancelUrl = `${origin}/student/dashboard`;
            metadata = {
                type: "TEN_HOUR_PACKAGE",
                service_slug: "driving-practice-10hr",
                plan_slug: "driving-practice-10hr",
                student_id: userId,
                student_email: studentEmail,
                student_name: studentName,
                origin: origin
            };
        } else if (type === 'DRIVING_PRACTICE_PACKAGE' || type === 'ROAD_TEST_PACKAGE') {
            const resolvedPlanSlug =
                typeof plan_slug === "string" && plan_slug.trim().length > 0
                    ? plan_slug.trim().toLowerCase()
                    : (type === "ROAD_TEST_PACKAGE" ? "road-test-escort" : "driving-practice-1hr");
            // In production, map plan_slug to specific Price IDs
            priceId = resolvedPlanSlug.includes('2hr') || resolvedPlanSlug.includes('escort') ? "price_1StT8hD0SlycNJKisH9kA4O0" : "price_1StT8hD0SlycNJKisH9kA4O0";

            successUrl = `${origin}/checkout/success?service_slug=${encodeURIComponent(resolvedPlanSlug)}&session_id={CHECKOUT_SESSION_ID}`;
            cancelUrl = type === 'DRIVING_PRACTICE_PACKAGE'
                ? `${origin}/services/driving-practice-packages`
                : `${origin}/services/road-test-packages`;

            metadata = {
                type: type,
                service_slug: resolvedPlanSlug,
                plan_slug: resolvedPlanSlug,
                class_date: classDate,
                class_time: classTime,
                student_email: studentEmail,
                student_name: studentName,
                student_id: userId,
                origin: origin
            };
        }

        const sessionConfig: any = {
            payment_method_types: ["card"],
            allow_promotion_codes: true,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: "payment",
            metadata: metadata,
            ...(studentEmail ? { customer_email: studentEmail } : {}),
            shipping_address_collection: {
                allowed_countries: ['US'],
            },
            phone_number_collection: {
                enabled: true,
            },
            custom_fields: [
                {
                    key: 'student_name',
                    label: {
                        type: 'custom',
                        custom: 'Student Full Name (if different from billing)',
                    },
                    type: 'text',
                    optional: true,
                },
            ],
        };

        if (uiMode === 'embedded') {
            sessionConfig.ui_mode = 'embedded';
            sessionConfig.return_url = successUrl; // embedded mode uses return_url
            // Remove success_url and cancel_url just in case, though they aren't in sessionConfig yet if we build it carefully
        } else {
            sessionConfig.success_url = successUrl;
            sessionConfig.cancel_url = cancelUrl;
        }

        // Create Checkout Session
        const session = await stripeFetch(
            '/checkout/sessions',
            'POST',
            sessionConfig,
            connectedAccountId ? { stripeAccount: connectedAccountId } : undefined
        );

        if (uiMode === 'embedded') {
            return NextResponse.json({ clientSecret: session.client_secret });
        }

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        const safe = getSafeStripeError(error);
        console.error("Stripe Checkout Error:", safe.code);
        return errorResponse(safe.status, safe.code, safe.message);
    }
}
