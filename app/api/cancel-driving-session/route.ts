export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripeFetch } from "@/lib/stripe-lite";

function parseStripeSessionIdFromNotes(notes: unknown) {
    const text = typeof notes === "string" ? notes : "";
    const match = text.match(/\b(cs_[A-Za-z0-9_]+)\b/);
    return match?.[1] || "";
}

function isRefundEligiblePlan(planKey: string) {
    return planKey.startsWith("driving-practice-") || planKey.startsWith("road-test-");
}

export async function DELETE(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "").trim();
        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
        const user = authData?.user;

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : "";
        if (!sessionId) {
            return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
        }

        const { data: existingSession, error: lookupError } = await supabaseAdmin
            .from("driving_sessions")
            .select("id, student_id, start_time, status, plan_key, service_slug, notes")
            .eq("id", sessionId)
            .eq("student_id", user.id)
            .maybeSingle();

        if (lookupError) {
            console.error("Cancel session lookup error:", lookupError);
            return NextResponse.json({ error: "Failed to load booking" }, { status: 500 });
        }
        if (!existingSession) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }
        if (existingSession.status === "cancelled") {
            return NextResponse.json({ error: "Booking is already cancelled" }, { status: 400 });
        }
        const now = new Date();
        if (existingSession.start_time && new Date(existingSession.start_time) <= now) {
            return NextResponse.json({ error: "Only future bookings can be cancelled" }, { status: 400 });
        }
        if (existingSession.start_time) {
            const startTime = new Date(existingSession.start_time);
            const twentyFourHoursMs = 24 * 60 * 60 * 1000;
            if (startTime.getTime() - now.getTime() < twentyFourHoursMs) {
                return NextResponse.json(
                    { error: "Bookings can only be cancelled at least 24 hours in advance." },
                    { status: 400 }
                );
            }
        }

        const planKey = String(existingSession.plan_key || existingSession.service_slug || "").trim();
        let refunded = false;
        let refundedAmount = 0;

        if (isRefundEligiblePlan(planKey)) {
            const stripeSessionId = parseStripeSessionIdFromNotes((existingSession as any).notes);
            if (!stripeSessionId) {
                return NextResponse.json(
                    { error: "Unable to locate payment record for refund. Please contact support." },
                    { status: 400 }
                );
            }

            const { data: enrollment, error: enrollmentError } = await supabaseAdmin
                .from("enrollments")
                .select("id, stripe_payment_intent_id, customer_details")
                .eq("stripe_session_id", stripeSessionId)
                .limit(1)
                .maybeSingle();

            if (enrollmentError) {
                console.error("Cancel session enrollment lookup error:", enrollmentError);
                return NextResponse.json({ error: "Unable to verify payment for refund" }, { status: 500 });
            }

            const serviceSlug =
                String((enrollment?.customer_details as any)?.service_slug || "").trim() ||
                String(existingSession.service_slug || "").trim() ||
                planKey;
            const paymentIntentId = String(enrollment?.stripe_payment_intent_id || "").trim();

            if (!paymentIntentId) {
                return NextResponse.json(
                    { error: "Payment record is missing refund information. Please contact support." },
                    { status: 400 }
                );
            }

            const { data: serviceOffering, error: offeringError } = await supabaseAdmin
                .from("service_offerings")
                .select("connected_account_id")
                .eq("slug", serviceSlug)
                .maybeSingle();

            if (offeringError) {
                console.error("Cancel session service offering lookup error:", offeringError);
                return NextResponse.json({ error: "Unable to verify payment account for refund" }, { status: 500 });
            }

            const connectedAccountId = String(serviceOffering?.connected_account_id || "").trim();
            if (!connectedAccountId) {
                return NextResponse.json(
                    { error: "Service payment account is not configured for refund. Please contact support." },
                    { status: 400 }
                );
            }

            try {
                const refund = await stripeFetch(
                    "/refunds",
                    "POST",
                    {
                        payment_intent: paymentIntentId,
                        reason: "requested_by_customer",
                        metadata: {
                            driving_session_id: existingSession.id,
                            stripe_session_id: stripeSessionId,
                            cancelled_by: user.id,
                        },
                    },
                    { stripeAccount: connectedAccountId }
                );
                refunded = true;
                refundedAmount = typeof refund?.amount === "number" ? refund.amount : 0;

                if (enrollment?.id) {
                    const currentDetails = ((enrollment as any).customer_details || {}) as Record<string, unknown>;
                    const { error: enrollUpdateError } = await supabaseAdmin
                        .from("enrollments")
                        .update({
                            customer_details: {
                                ...currentDetails,
                                refund_id: refund?.id || null,
                                refunded_at: new Date().toISOString(),
                                cancelled_at: new Date().toISOString(),
                            },
                            status: "cancelled",
                            payment_status: "refunded",
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", enrollment.id);
                    if (enrollUpdateError) {
                        console.error("Cancel session enrollment refund update error:", enrollUpdateError);
                    }
                }
            } catch (refundError) {
                console.error("Cancel session refund error:", refundError);
                return NextResponse.json(
                    { error: "Refund failed. Booking was not cancelled." },
                    { status: 502 }
                );
            }
        }

        const { error: deleteError } = await supabaseAdmin
            .from("driving_sessions")
            .delete()
            .eq("id", sessionId)
            .eq("student_id", user.id);

        if (deleteError) {
            console.error("Cancel session delete error:", deleteError);
            return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
        }

        return NextResponse.json({ ok: true, refunded, refunded_amount: refundedAmount });
    } catch (error) {
        console.error("Cancel driving session error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
