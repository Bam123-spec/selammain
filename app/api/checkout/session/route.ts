import { NextRequest, NextResponse } from "next/server";
import { parseISO } from "date-fns";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripeFetch } from "@/lib/stripe-lite";
import { getSafeStripeError } from "@/lib/stripe-errors";
import { generateStudentBookingEmail, sendBrevoEmail } from "@/lib/email";

export const runtime = "edge";
// Enable confirmation-email fallback by default when the success page reconciles a paid Stripe session.
// Set RECONCILIATION_SEND_CONFIRMATION_EMAIL=0 to disable explicitly.
const RECONCILIATION_SEND_CONFIRMATION_EMAIL = process.env.RECONCILIATION_SEND_CONFIRMATION_EMAIL !== "0";

type ServiceOfferingRow = {
    slug: string;
    connected_account_id: string | null;
};

const DEFAULT_DRIVING_PRACTICE_2HR_INSTRUCTOR_ID =
    process.env.DEFAULT_DRIVING_PRACTICE_2HR_INSTRUCTOR_ID || "510c8aaa-a8d3-43a6-afe2-0af3cd1cf187";
const DEFAULT_DRIVING_PRACTICE_1HR_INSTRUCTOR_ID =
    process.env.DEFAULT_DRIVING_PRACTICE_1HR_INSTRUCTOR_ID || "23f41f04-3ee4-4c0f-9c79-c9afd26b3593";
const DEFAULT_ROAD_TEST_1HR_INSTRUCTOR_ID =
    process.env.DEFAULT_ROAD_TEST_1HR_INSTRUCTOR_ID || "d7bf4096-8999-4875-a16f-80498d7f7b4c";
const DEFAULT_ROAD_TEST_ESCORT_INSTRUCTOR_ID =
    process.env.DEFAULT_ROAD_TEST_ESCORT_INSTRUCTOR_ID || "0f1331f6-8f01-486b-b99b-69d7b0d82023";
const DEFAULT_ROAD_TEST_2HR_INSTRUCTOR_ID =
    process.env.DEFAULT_ROAD_TEST_2HR_INSTRUCTOR_ID || "36a849ef-1b8e-4ea8-bdec-f2ed757e61b6";

function errorResponse(status: number, code: string, message: string) {
    return NextResponse.json({ error: { code, message } }, { status });
}

function isValidSessionId(value: string) {
    return value.length >= 8 && value.length <= 128 && /^cs_[A-Za-z0-9_]+$/.test(value);
}

function isValidConnectedAccountId(value: string) {
    return /^acct_[A-Za-z0-9]+$/.test(value);
}

function isValidServiceSlug(value: string) {
    return value.length >= 1 && value.length <= 64 && /^[a-z0-9-]+$/.test(value);
}

function isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseBooleanParam(value: string | null, defaultValue: boolean) {
    if (value == null) return defaultValue;
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "y"].includes(normalized)) return true;
    if (["0", "false", "no", "n"].includes(normalized)) return false;
    return defaultValue;
}

function safeText(value: unknown, maxLength: number) {
    if (typeof value !== "string") return "";
    return value.trim().slice(0, maxLength);
}

function titleCaseFromSlug(value: string) {
    return value
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

function friendlyNameFromEmail(email?: string) {
    if (!email) return "Student";
    const local = email.split("@")[0]?.trim();
    if (!local) return "Student";
    return local
        .replace(/[._-]+/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ") || "Student";
}

function normalizeCustomerDisplayName(name?: string, email?: string) {
    const trimmed = typeof name === "string" ? name.trim() : "";
    if (trimmed && trimmed.toLowerCase() !== "guest") return trimmed;
    return friendlyNameFromEmail(email);
}

function resolveServiceDisplayName(metaClassName: string, paymentType: string, planSlug: string, serviceSlug: string) {
    if (metaClassName) return metaClassName;
    if (planSlug) {
        if (planSlug === "driving-practice-1hr") return "Driving Practice (1 Hour)";
        if (planSlug === "driving-practice-2hr") return "Driving Practice (2 Hour)";
        if (planSlug === "driving-practice-10hr") return "10-Hour Driving Package";
        if (planSlug === "road-test-escort") return "Road Test Escort";
        if (planSlug === "road-test-1hr") return "Road Test Escort + 1 Hour";
        if (planSlug === "road-test-2hr") return "Road Test Escort + 2 Hour";
        return titleCaseFromSlug(planSlug);
    }
    if (serviceSlug) return titleCaseFromSlug(serviceSlug);
    if (paymentType) return titleCaseFromSlug(paymentType.toLowerCase());
    return "Driving Service";
}

function formatDateDisplay(classDate: string) {
    if (!classDate) return "TBD";
    const parsed = new Date(classDate);
    if (Number.isNaN(parsed.getTime())) return classDate;
    return parsed.toLocaleDateString();
}

function formatTimeDisplay(classDate: string, classTime: string) {
    const start = parseStartDateTime(classDate, classTime);
    if (start) return start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return classTime || "TBD";
}

async function lookupUserIdByEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return null;

    const { data: profileRows } = await supabaseAdmin
        .from("profiles")
        .select("id, email")
        .ilike("email", normalizedEmail)
        .limit(1);

    if (profileRows && profileRows.length > 0 && profileRows[0]?.id) {
        return profileRows[0].id as string;
    }

    let page = 1;
    const perPage = 200;
    while (page <= 10) {
        const { data: usersPage, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
        if (error) break;
        const match = usersPage?.users?.find((u: any) => u.email?.toLowerCase() === normalizedEmail);
        if (match?.id) return match.id as string;
        if (!usersPage?.users || usersPage.users.length < perPage) break;
        page += 1;
    }

    return null;
}

async function buildManageBookingUrl(email: string) {
    const siteOrigin = (process.env.NEXT_PUBLIC_APP_URL || "https://selamdrivingschool.com").replace(/\/$/, "");
    const fallbackUrl = `${siteOrigin}/student/login?next=/student/dashboard`;

    try {
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email,
            options: {
                redirectTo: `${siteOrigin}/student/magic?next=/student/dashboard`,
            },
        });

        if (error) {
            console.error("Reconciliation magic link generation error:", error);
            return fallbackUrl;
        }

        return data?.properties?.action_link || fallbackUrl;
    } catch (error) {
        console.error("Reconciliation magic link generation exception:", error);
        return fallbackUrl;
    }
}

function resolveDurationMinutes(type: string, planSlug: string) {
    const normalizedType = type.toUpperCase();
    if (normalizedType === "ROAD_TEST_PACKAGE") {
        if (planSlug === "road-test-1hr") return 150;
        if (planSlug === "road-test-2hr") return 210;
        return 120;
    }
    if (normalizedType === "DRIVING_PRACTICE_PACKAGE") {
        if (planSlug.includes("2hr")) return 120;
        return 60;
    }
    return 60;
}

function parseStartDateTime(classDate: string, classTime: string) {
    if (!classTime) return null;

    if (classTime.includes("T")) {
        const direct = parseISO(classTime);
        if (!Number.isNaN(direct.getTime())) return direct;
    }

    if (classDate) {
        const combined = new Date(`${classDate}T${classTime}`);
        if (!Number.isNaN(combined.getTime())) return combined;
    }

    return null;
}

function resolveInstructorId(rawInstructorId: unknown, planSlug: string) {
    const instructorId = safeText(rawInstructorId, 100);
    if (instructorId && isUuid(instructorId)) return instructorId;
    if (planSlug === "road-test-escort" && isUuid(DEFAULT_ROAD_TEST_ESCORT_INSTRUCTOR_ID)) {
        return DEFAULT_ROAD_TEST_ESCORT_INSTRUCTOR_ID;
    }
    if (planSlug === "driving-practice-1hr" && isUuid(DEFAULT_DRIVING_PRACTICE_1HR_INSTRUCTOR_ID)) {
        return DEFAULT_DRIVING_PRACTICE_1HR_INSTRUCTOR_ID;
    }
    if (planSlug === "driving-practice-2hr" && isUuid(DEFAULT_DRIVING_PRACTICE_2HR_INSTRUCTOR_ID)) {
        return DEFAULT_DRIVING_PRACTICE_2HR_INSTRUCTOR_ID;
    }
    if (planSlug === "road-test-1hr" && isUuid(DEFAULT_ROAD_TEST_1HR_INSTRUCTOR_ID)) {
        return DEFAULT_ROAD_TEST_1HR_INSTRUCTOR_ID;
    }
    if (planSlug === "road-test-2hr" && isUuid(DEFAULT_ROAD_TEST_2HR_INSTRUCTOR_ID)) {
        return DEFAULT_ROAD_TEST_2HR_INSTRUCTOR_ID;
    }
    return null;
}

async function getCandidateOfferings(requestedServiceSlug: string | null) {
    let query = supabaseAdmin
        .from("service_offerings")
        .select("slug, connected_account_id")
        .eq("active", true)
        .not("connected_account_id", "is", null);

    if (requestedServiceSlug) {
        query = query.eq("slug", requestedServiceSlug);
    }

    const { data, error } = await query;
    if (error) {
        return { offerings: [] as ServiceOfferingRow[], error };
    }

    const offerings = (data || []).filter(
        (row) => !!row.connected_account_id && isValidConnectedAccountId(row.connected_account_id)
    ) as ServiceOfferingRow[];

    return { offerings, error: null };
}

async function reconcilePaidSession(session: any) {
    const metadata = (session?.metadata || {}) as Record<string, unknown>;
    const sessionId = safeText(session?.id, 200);
    const paymentIntentId = safeText(session?.payment_intent, 200);
    const amountPaid = typeof session?.amount_total === "number" ? session.amount_total / 100 : null;

    const serviceSlug = safeText(metadata.service_slug, 64);
    const classIdRaw = safeText(metadata.class_id, 100);
    const classId = isUuid(classIdRaw) ? classIdRaw : null;
    const classDate = safeText(metadata.class_date, 40);
    const classTime = safeText(metadata.class_time, 80);
    const planSlug = safeText(metadata.plan_slug, 64);
    const paymentType = safeText(metadata.type, 64).toUpperCase() || "CLASS_ENROLLMENT";

    const customerEmail =
        safeText(session?.customer_details?.email, 200) ||
        safeText(session?.customer_email, 200) ||
        safeText(metadata.student_email, 200);
    const rawCustomerName =
        safeText(metadata.student_name, 120) ||
        safeText(session?.customer_details?.name, 120) ||
        "";
    const customerPhone =
        safeText(session?.customer_details?.phone, 40) ||
        safeText(metadata.student_phone, 40);

    let userId = safeText(metadata.student_id, 100);
    if (userId && !isUuid(userId)) {
        userId = "";
    }
    if (!userId && customerEmail) {
        userId = (await lookupUserIdByEmail(customerEmail)) || "";
    }

    const { data: existingRows, error: existingError } = await supabaseAdmin
        .from("enrollments")
        .select("id, payment_status, status, customer_details")
        .eq("stripe_session_id", sessionId)
        .limit(1);

    if (existingError) {
        throw existingError;
    }

    const existingEnrollment = existingRows && existingRows.length > 0 ? existingRows[0] : null;
    let enrollmentAction: "created" | "updated" | "noop" = "noop";
    const existingCustomerDetails = ((existingEnrollment as any)?.customer_details || {}) as Record<string, unknown>;
    const customerName = normalizeCustomerDisplayName(
        rawCustomerName || safeText(existingCustomerDetails?.name, 120),
        customerEmail
    );
    const confirmationEmailSentAt = safeText(existingCustomerDetails?.confirmation_email_sent_at, 80);

    const customerDetails = {
        name: customerName,
        email: customerEmail || null,
        phone: customerPhone || null,
        service_type: paymentType,
        service_slug: serviceSlug || null,
        plan_slug: planSlug || null,
        class_date: classDate || null,
        class_time: classTime || null,
        address: session?.customer_details?.address || null,
    };

    let enrollmentId = "";

    if (existingEnrollment) {
        const updatePayload: Record<string, unknown> = {
            payment_status: "paid",
            status: existingEnrollment.status === "pending_payment" ? "enrolled" : existingEnrollment.status || "enrolled",
            customer_details: {
                ...existingCustomerDetails,
                ...customerDetails,
            },
            email: customerEmail || null,
            updated_at: new Date().toISOString(),
        };

        if (userId) {
            updatePayload.student_id = userId;
            updatePayload.user_id = userId;
        }
        if (paymentIntentId) updatePayload.stripe_payment_intent_id = paymentIntentId;
        if (typeof amountPaid === "number") updatePayload.amount_paid = amountPaid;

        const { error: updateError } = await supabaseAdmin
            .from("enrollments")
            .update(updatePayload)
            .eq("id", existingEnrollment.id);

        if (updateError) throw updateError;
        enrollmentId = existingEnrollment.id;
        enrollmentAction = "updated";
    } else {
        const enrollmentPayload: Record<string, unknown> = {
            class_id: classId,
            student_id: userId || null,
            user_id: userId || null,
            email: customerEmail || null,
            stripe_session_id: sessionId,
            stripe_payment_intent_id: paymentIntentId || null,
            amount_paid: typeof amountPaid === "number" ? amountPaid : null,
            payment_status: "paid",
            status: "enrolled",
            customer_details: customerDetails,
            enrolled_at: new Date().toISOString(),
        };

        const { data: insertedEnrollment, error: insertError } = await supabaseAdmin
            .from("enrollments")
            .insert(enrollmentPayload)
            .select("id")
            .single();

        if (insertError) throw insertError;
        enrollmentId = insertedEnrollment?.id || "";
        enrollmentAction = "created";
    }

    let drivingSessionAction: "created" | "exists" | "skipped" = "skipped";
    if ((paymentType === "DRIVING_PRACTICE_PACKAGE" || paymentType === "ROAD_TEST_PACKAGE") && userId && classTime) {
        const { data: existingDrivingSession, error: sessionLookupError } = await supabaseAdmin
            .from("driving_sessions")
            .select("id")
            .ilike("notes", `%${sessionId}%`)
            .limit(1);

        if (sessionLookupError) throw sessionLookupError;

        if (existingDrivingSession && existingDrivingSession.length > 0) {
            drivingSessionAction = "exists";
        } else {
            const startDate = parseStartDateTime(classDate, classTime);
            if (startDate) {
                const duration = resolveDurationMinutes(paymentType, planSlug || serviceSlug);
                const endDate = new Date(startDate.getTime() + duration * 60_000);
                const { error: drivingInsertError } = await supabaseAdmin.from("driving_sessions").insert({
                    start_time: startDate.toISOString(),
                    end_time: endDate.toISOString(),
                    service_type: paymentType === "ROAD_TEST_PACKAGE" ? "road_test" : "practice",
                    service_slug: planSlug || serviceSlug || null,
                    status: "scheduled",
                    student_id: userId,
                    instructor_id: resolveInstructorId(metadata.instructor_id, planSlug || serviceSlug),
                    plan_key: planSlug || serviceSlug || paymentType.toLowerCase(),
                    duration_minutes: duration,
                    source: "student_portal",
                    notes: `Paid via Stripe (${sessionId})`,
                });

                if (drivingInsertError) throw drivingInsertError;
                drivingSessionAction = "created";
            }
        }
    }

    let tenHourAction: "updated" | "skipped" = "skipped";
    if (paymentType === "TEN_HOUR_PACKAGE" && userId && enrollmentAction === "created") {
        const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select("ten_hour_package_paid, ten_hour_sessions_total")
            .eq("id", userId)
            .maybeSingle();

        if (profileError) throw profileError;

        const alreadyPaid = !!profile?.ten_hour_package_paid;
        const existingTotal = Number(profile?.ten_hour_sessions_total || 0);
        const newTotal = alreadyPaid ? existingTotal + 5 : Math.max(existingTotal, 5);

        const { error: profileUpdateError } = await supabaseAdmin
            .from("profiles")
            .update({
                ten_hour_package_paid: true,
                ten_hour_sessions_total: newTotal,
            })
            .eq("id", userId);

        if (profileUpdateError) throw profileUpdateError;
        tenHourAction = "updated";
    }

    if (RECONCILIATION_SEND_CONFIRMATION_EMAIL && customerEmail && !confirmationEmailSentAt) {
        const dashboardUrl = await buildManageBookingUrl(customerEmail);
        const serviceDisplayName = resolveServiceDisplayName(
            safeText(metadata.class_name, 150),
            paymentType,
            planSlug,
            serviceSlug
        );

        try {
            const htmlContent = generateStudentBookingEmail({
                name: customerName || "Student",
                email: customerEmail,
                service: serviceDisplayName,
                date: formatDateDisplay(classDate),
                time: formatTimeDisplay(classDate, classTime),
                dashboardUrl,
                phone: customerPhone || undefined,
            });

            await sendBrevoEmail({
                to: [{ email: customerEmail, name: customerName || "Student" }],
                subject: `Booking Confirmed - ${serviceDisplayName}`,
                htmlContent,
            });

            if (enrollmentId) {
                await supabaseAdmin
                    .from("enrollments")
                    .update({
                        customer_details: {
                            ...existingCustomerDetails,
                            ...customerDetails,
                            confirmation_email_sent_at: new Date().toISOString(),
                        },
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", enrollmentId);
            }
        } catch (error) {
            console.error("Reconciliation email fallback failed:", error);
        }
    }

    return {
        enrollment: enrollmentAction,
        driving_session: drivingSessionAction,
        ten_hour_profile: tenHourAction,
    };
}

export async function GET(request: NextRequest) {
    const sessionId = request.nextUrl.searchParams.get("session_id")?.trim() || "";
    const rawServiceSlug = request.nextUrl.searchParams.get("service_slug")?.trim().toLowerCase() || "";
    const requestedServiceSlug = rawServiceSlug || null;
    const shouldReconcile = parseBooleanParam(request.nextUrl.searchParams.get("reconcile"), true);

    if (!isValidSessionId(sessionId)) {
        return errorResponse(400, "invalid_session_id", "session_id is missing or invalid.");
    }
    if (requestedServiceSlug && !isValidServiceSlug(requestedServiceSlug)) {
        return errorResponse(400, "invalid_service_slug", "service_slug is invalid.");
    }

    const { offerings, error: offeringsError } = await getCandidateOfferings(requestedServiceSlug);
    if (offeringsError) {
        return errorResponse(500, "service_lookup_failed", "Unable to load service configuration.");
    }
    if (!offerings.length) {
        return errorResponse(400, "service_not_configured", "Connected account is not configured for this service.");
    }

    const uniqueAccounts = Array.from(
        new Set(offerings.map((row) => row.connected_account_id).filter((id): id is string => !!id))
    );

    let session: any = null;
    let matchedAccountId: string | null = null;
    let lastError: ReturnType<typeof getSafeStripeError> | null = null;

    for (const accountId of uniqueAccounts) {
        try {
            const candidate = await stripeFetch(
                `/checkout/sessions/${encodeURIComponent(sessionId)}`,
                "GET",
                undefined,
                { stripeAccount: accountId }
            );

            if (candidate?.id) {
                session = candidate;
                matchedAccountId = accountId;
                break;
            }
        } catch (error: unknown) {
            const safe = getSafeStripeError(error);
            if (safe.status !== 404 && safe.code !== "resource_missing") {
                lastError = safe;
            }
        }
    }

    if (!session || !matchedAccountId) {
        if (lastError) {
            return errorResponse(lastError.status, lastError.code, lastError.message);
        }
        return errorResponse(404, "session_not_found", "Checkout session not found.");
    }

    const sessionServiceSlug = safeText(session?.metadata?.service_slug, 64) || null;
    if (requestedServiceSlug && sessionServiceSlug && requestedServiceSlug !== sessionServiceSlug) {
        return errorResponse(404, "session_not_found", "Checkout session not found.");
    }

    if (session.payment_status !== "paid") {
        return errorResponse(409, "payment_not_completed", "Payment has not completed yet.");
    }

    let reconciliation: { ok: boolean; actions?: unknown; error_code?: string } | null = null;
    if (shouldReconcile) {
        try {
            const actions = await reconcilePaidSession(session);
            reconciliation = { ok: true, actions };
        } catch (error: unknown) {
            const safe = getSafeStripeError(error);
            console.error("Checkout session reconciliation error:", safe.code);
            reconciliation = { ok: false, error_code: safe.code };
        }
    }

    return NextResponse.json({
        session: {
            id: session.id,
            payment_status: session.payment_status,
            status: session.status,
            amount_total: session.amount_total,
            currency: session.currency,
            customer_email: session.customer_details?.email || session.customer_email || null,
            service_slug: sessionServiceSlug,
            connected_account_id: matchedAccountId,
        },
        reconciliation,
    });
}
