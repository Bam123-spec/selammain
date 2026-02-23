import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendBrevoEmail, generateStudentBookingEmail, generateInstructorBookingEmail, generateGoogleCalendarUrl, generateDriversEdBookingEmail, generateRsepDipBookingEmail } from '@/lib/email'
import { verifyStripeWebhook } from '@/lib/stripe-lite';

export const runtime = 'edge';

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

function isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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

function normalizeStudentDisplayName(name?: string, email?: string) {
    const trimmed = typeof name === "string" ? name.trim() : "";
    if (trimmed && trimmed.toLowerCase() !== "guest") return trimmed;
    return friendlyNameFromEmail(email);
}

async function ensureStudentIdentity(userId: string, params: {
    email: string;
    fullName: string;
    phone?: string;
}) {
    const email = params.email.trim().toLowerCase();
    const fullName = params.fullName.trim();
    const phone = params.phone?.trim() || null;
    if (!email || !fullName) return;

    try {
        const { data: profileRow, error: profileReadError } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, email, phone, role')
            .eq('id', userId)
            .maybeSingle();

        if (profileReadError) {
            console.error('Profile identity lookup error:', profileReadError);
        }

        if (!profileRow) {
            const { error: insertProfileError } = await supabaseAdmin.from('profiles').insert({
                id: userId,
                email,
                full_name: fullName,
                phone,
                role: 'student',
            });
            if (insertProfileError) {
                console.error('Profile identity insert error:', insertProfileError);
            }
        } else {
            const currentName = typeof (profileRow as any).full_name === 'string' ? (profileRow as any).full_name.trim() : '';
            const shouldReplaceName = !currentName || currentName.toLowerCase() === 'guest';
            const profileUpdate: Record<string, unknown> = {};
            if (shouldReplaceName) profileUpdate.full_name = fullName;
            if (!profileRow.email || String(profileRow.email).trim().toLowerCase() !== email) profileUpdate.email = email;
            if (phone && !profileRow.phone) profileUpdate.phone = phone;
            if (!(profileRow as any).role) profileUpdate.role = 'student';

            if (Object.keys(profileUpdate).length > 0) {
                const { error: updateProfileError } = await supabaseAdmin
                    .from('profiles')
                    .update(profileUpdate)
                    .eq('id', userId);
                if (updateProfileError) {
                    console.error('Profile identity update error:', updateProfileError);
                }
            }
        }
    } catch (error) {
        console.error('ensureStudentIdentity profile exception:', error);
    }

    try {
        const firstName = fullName.split(' ').filter(Boolean)[0] || fullName;
        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: {
                full_name: fullName,
                name: firstName,
                role: 'student',
            }
        });
        if (authUpdateError) {
            console.error('Auth user metadata update error:', authUpdateError);
        }
    } catch (error) {
        console.error('ensureStudentIdentity auth exception:', error);
    }
}

function resolveInstructorId(rawInstructorId: unknown, planSlug?: string) {
    const instructorId = typeof rawInstructorId === "string" ? rawInstructorId.trim() : "";
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

async function buildManageBookingUrl(siteOrigin: string, email?: string, options?: { isFirstTimeUser?: boolean }) {
    const fallbackUrl = `${siteOrigin}/student/login?next=/student/dashboard`;
    if (!email) return fallbackUrl;
    const isFirstTimeUser = !!options?.isFirstTimeUser;

    try {
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: isFirstTimeUser ? 'recovery' : 'magiclink',
            email,
            options: {
                redirectTo: isFirstTimeUser
                    ? `${siteOrigin}/student/reset-password`
                    : `${siteOrigin}/student/magic?next=/student/dashboard`
            }
        });

        if (error) {
            console.error(`${isFirstTimeUser ? 'Recovery' : 'Magic'} link generation error:`, error);
            return fallbackUrl;
        }

        return data?.properties?.action_link || fallbackUrl;
    } catch (error) {
        console.error(`${isFirstTimeUser ? 'Recovery' : 'Magic'} link generation exception:`, error);
        return fallbackUrl;
    }
}

export async function POST(req: Request) {
    const body = await req.text()
    const headersList = await headers()
    const sig = headersList.get('stripe-signature') as string
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    let event: any;

    try {
        if (!sig || !webhookSecret) {
            console.error('Webhook signature missing')
            return new NextResponse("Webhook signature validation failed", { status: 400 })
        }
        event = await verifyStripeWebhook(body, sig, webhookSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed')
        return new NextResponse('Webhook signature verification failed', { status: 400 })
    }

    const siteOrigin = (process.env.NEXT_PUBLIC_APP_URL || 'https://selamdrivingschool.com').replace(/\/$/, '');

    const lookupUserIdByEmail = async (email: string): Promise<string | null> => {
        const normalizedEmail = email.trim().toLowerCase();

        // Fast path: profiles table usually mirrors auth user IDs.
        const { data: profileRows, error: profileLookupError } = await supabaseAdmin
            .from('profiles')
            .select('id, email')
            .ilike('email', normalizedEmail)
            .limit(1);

        if (profileLookupError) {
            console.error('Profile email lookup error:', profileLookupError);
        }

        if (profileRows && profileRows.length > 0 && profileRows[0]?.id) {
            return profileRows[0].id as string;
        }

        // Compatibility path: some Supabase admin clients don't implement getUserByEmail.
        // listUsers is paginated, so we scan a bounded number of pages.
        let page = 1;
        const perPage = 200;

        while (page <= 10) {
            const { data: usersPage, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });

            if (listUsersError) {
                console.error('Auth listUsers lookup error:', listUsersError);
                break;
            }

            const match = usersPage?.users?.find((u: any) => u.email?.toLowerCase() === normalizedEmail);
            if (match?.id) {
                return match.id as string;
            }

            if (!usersPage?.users || usersPage.users.length < perPage) {
                break;
            }

            page += 1;
        }

        return null;
    };

    // --- Unified Helper Function ---
    async function handleSuccessfulPayment(data: {
        studentEmail: string;
        studentName: string;
        type: string;
        classId?: string;
        className?: string;
        classDate?: string;
        classTime?: string;
        classEndDate?: string;
        classType?: string;
        plan_slug?: string;
        instructorId?: string;
        stripeSessionId?: string;
        stripePaymentIntentId?: string;
        amountPaid: number;
        metadataStudentId?: string;
        phone?: string;
        address?: any;
    }) {
        console.log(`Processing payment for ${data.studentEmail} (${data.type})`);
        const studentDisplayName = normalizeStudentDisplayName(data.studentName, data.studentEmail);

        // 1. Resolve User (Find or Create)
        let userId = data.metadataStudentId || null;
        let userCreatedThisPayment = false;

        if (!userId && data.studentEmail) {
            const existingUserId = await lookupUserIdByEmail(data.studentEmail);

            if (existingUserId) {
                userId = existingUserId;
            } else {
                // Auto-create user
                const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email: data.studentEmail,
                    email_confirm: true,
                    user_metadata: { full_name: data.studentName, name: data.studentName.split(' ')[0] }
                });
                if (newUser?.user) {
                    userId = newUser.user.id;
                    userCreatedThisPayment = true;
                } else {
                    console.error('Failed to auto-create user:', createError);

                    // Handle race conditions where user was created by another worker/request.
                    const retryUserId = await lookupUserIdByEmail(data.studentEmail);
                    if (retryUserId) {
                        userId = retryUserId;
                    }
                }
            }
        }

        if (userId) {
            await ensureStudentIdentity(userId, {
                email: data.studentEmail,
                fullName: studentDisplayName,
                phone: data.phone,
            });
        }

        // 2. Specific Logic based on Type (The "Differentiator")
        let serviceDisplayName = data.className || "Driving Service";

        if (!data.className && data.plan_slug) {
            if (data.plan_slug === 'driving-practice-1hr') serviceDisplayName = "Driving Practice (1 Hour)";
            else if (data.plan_slug === 'driving-practice-2hr') serviceDisplayName = "Driving Practice (2 Hours)";
            else if (data.plan_slug === 'driving-practice-10hr') serviceDisplayName = "10-Hour Driving Package";
            else if (data.plan_slug === 'road-test-escort') serviceDisplayName = "Road Test (Vehicle Escort)";
            else if (data.plan_slug === 'road-test-1hr') serviceDisplayName = "Road Test (1 Hour Prep)";
            else if (data.plan_slug === 'road-test-2hr') serviceDisplayName = "Road Test (2 Hour Prep)";
            else serviceDisplayName = data.plan_slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }

        if (data.type === 'TEN_HOUR_PACKAGE') {
            serviceDisplayName = "10-Hour Driving Package";
            // Grant Credits Logic
            if (userId) {
                const { data: profile } = await supabaseAdmin.from('profiles').select('ten_hour_package_paid, ten_hour_sessions_total').eq('id', userId).single();
                let newTotal = (profile?.ten_hour_sessions_total || 0);

                // Logic: If already paid once, add 5. If first time, ensure at least 5.
                if (profile?.ten_hour_package_paid) {
                    newTotal += 5;
                } else {
                    newTotal = Math.max(newTotal, 5);
                }

                await supabaseAdmin.from('profiles').update({
                    ten_hour_package_paid: true,
                    ten_hour_sessions_total: newTotal
                }).eq('id', userId);
                console.log(`Updated 10-hour credits for ${userId} to ${newTotal}`);
            }
        } else if ((data.type === 'DRIVING_PRACTICE_PACKAGE' || data.type === 'ROAD_TEST_PACKAGE') && data.classTime) {
            // Schedule Session Logic
            // Only create driving sessions from checkout-session events (session id required).
            if (data.stripeSessionId) {
                const { data: existingDrivingSessionRows, error: existingDrivingSessionError } = await supabaseAdmin
                    .from('driving_sessions')
                    .select('id')
                    .ilike('notes', `%${data.stripeSessionId}%`)
                    .limit(1);

                if (existingDrivingSessionError) {
                    console.error('Driving session lookup error:', existingDrivingSessionError);
                } else if (!existingDrivingSessionRows || existingDrivingSessionRows.length === 0) {
                    const start = new Date(data.classTime);
                    let duration = 60;
                    if (data.plan_slug?.includes('2hr')) duration = 120;
                    if (data.plan_slug?.includes('escort')) duration = 120;
                    if (data.plan_slug === 'road-test-1hr') duration = 150;
                    if (data.plan_slug === 'road-test-2hr') duration = 210;

                    const { error: drivingInsertError } = await supabaseAdmin.from('driving_sessions').insert([{
                        start_time: start.toISOString(),
                        end_time: new Date(start.getTime() + duration * 60000).toISOString(),
                        service_type: data.type === 'ROAD_TEST_PACKAGE' ? 'road_test' :
                            data.type === 'DRIVING_PRACTICE_PACKAGE' ? 'practice' : 'behind_the_wheel',
                        service_slug: data.plan_slug,
                        status: 'scheduled',
                        student_id: userId,
                        instructor_id: resolveInstructorId(data.instructorId, data.plan_slug) || undefined,
                        plan_key: data.plan_slug || data.type,
                        duration_minutes: duration,
                        source: 'student_portal',
                        notes: `Paid via Stripe (${data.stripeSessionId})`
                    }]);

                    if (drivingInsertError) {
                        console.error('Driving session insert error:', drivingInsertError);
                    }
                } else {
                    console.log('Driving session already exists for Stripe session, skipping insert.');
                }
            } else {
                console.log('Skipping driving session insert without Stripe session id (likely payment_intent fallback).');
            }
        }

        // 3. Create Enrollment Record (Unified Step)
        // User requested "same flow as DIP", which implies creating an enrollment.
        const enrollmentData = {
            class_id: data.classId || null, // Can be null for packages
            student_id: userId,
            user_id: userId,
            email: data.studentEmail,
            stripe_session_id: data.stripeSessionId,
            stripe_payment_intent_id: data.stripePaymentIntentId,
            amount_paid: data.amountPaid,
            status: 'enrolled',
            payment_status: 'paid',
            customer_details: {
                name: studentDisplayName,
                email: data.studentEmail,
                phone: data.phone,
                service_type: data.type,
                address: data.address
            },
            enrolled_at: new Date().toISOString()
        };

        if (data.stripeSessionId) {
            const { data: existingEnrollmentRows, error: existingEnrollmentError } = await supabaseAdmin
                .from('enrollments')
                .select('id')
                .eq('stripe_session_id', data.stripeSessionId)
                .limit(1);

            if (existingEnrollmentError) {
                console.error('Enrollment lookup error:', existingEnrollmentError);
            } else if (existingEnrollmentRows && existingEnrollmentRows.length > 0) {
                const existingId = existingEnrollmentRows[0]?.id;
                if (existingId) {
                    const { error: updateEnrollError } = await supabaseAdmin
                        .from('enrollments')
                        .update({
                            ...enrollmentData,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', existingId);

                    if (updateEnrollError) {
                        console.error('Enrollment update error:', updateEnrollError);
                    } else {
                        console.log('Enrollment record updated.');
                    }
                }
            } else {
                const { error: enrollError } = await supabaseAdmin.from('enrollments').insert(enrollmentData);
                if (enrollError) {
                    console.error('Enrollment insert error:', enrollError);
                } else {
                    console.log('Enrollment record created.');
                }
            }
        } else {
            const { error: enrollError } = await supabaseAdmin.from('enrollments').insert(enrollmentData);
            if (enrollError) {
                console.error('Enrollment insert error:', enrollError);
            } else {
                console.log('Enrollment record created.');
            }
        }

        // 4. Send Confirmation Emails (idempotent; avoid duplicate sends when reconciliation already sent one)
        let confirmationEmailAlreadySent = false;
        if (data.stripeSessionId) {
            const { data: enrollmentRowsForEmailFlag, error: enrollmentEmailFlagError } = await supabaseAdmin
                .from('enrollments')
                .select('id, customer_details')
                .eq('stripe_session_id', data.stripeSessionId)
                .limit(1);

            if (enrollmentEmailFlagError) {
                console.error('Enrollment email-flag lookup error:', enrollmentEmailFlagError);
            } else {
                const row = enrollmentRowsForEmailFlag?.[0];
                const details = (row?.customer_details || {}) as any;
                confirmationEmailAlreadySent = !!details?.confirmation_email_sent_at;
            }
        }

        const dashboardUrl = await buildManageBookingUrl(siteOrigin, data.studentEmail, {
            isFirstTimeUser: userCreatedThisPayment,
        });

        const dateDisp = data.classDate ? new Date(data.classDate).toLocaleDateString() : (data.type === 'TEN_HOUR_PACKAGE' ? 'Flexible' : 'TBD');
        const endDateDisp = data.classEndDate ? new Date(data.classEndDate).toLocaleDateString() : '';

        const resolveStartDateTime = (classDate?: string, classTime?: string) => {
            if (!classTime) return null;
            const direct = new Date(classTime);
            if (!isNaN(direct.getTime())) return direct;
            if (classDate) {
                const combined = new Date(`${classDate}T${classTime}`);
                if (!isNaN(combined.getTime())) return combined;
            }
            return null;
        };

        const startDateTime = resolveStartDateTime(data.classDate, data.classTime);
        const timeDisp = startDateTime
            ? startDateTime.toLocaleTimeString()
            : (data.classTime || (data.type === 'TEN_HOUR_PACKAGE' ? 'Flexible' : 'TBD'));

        // Generate Google Calendar Link
        let googleCalendarUrl = '';
        if (startDateTime) {
            let duration = 60;
            if (data.plan_slug?.includes('2hr')) duration = 120;
            if (data.plan_slug?.includes('escort')) duration = 120;
            if (data.plan_slug === 'road-test-1hr') duration = 150;
            if (data.plan_slug === 'road-test-2hr') duration = 210;

            try {
                googleCalendarUrl = generateGoogleCalendarUrl({
                    text: `Selam Driving School: ${serviceDisplayName}`,
                    details: `Driving lesson scheduled for ${studentDisplayName}. Service: ${serviceDisplayName}`,
                    location: '10111 Colesville Rd Suite 103, Silver Spring, MD 20901',
                    startDate: startDateTime,
                    durationMinutes: duration
                });
            } catch (e) {
                console.error("Failed to generate Google Calendar URL:", e);
            }
        }

        let studentEmailHtml = generateStudentBookingEmail({
            name: studentDisplayName,
            email: data.studentEmail,
            service: serviceDisplayName,
            date: dateDisp,
            time: timeDisp,
            dashboardUrl: dashboardUrl,
            phone: data.phone,
            googleCalendarUrl: googleCalendarUrl
        });

        if (data.classType === 'DE') {
            studentEmailHtml = generateDriversEdBookingEmail({
                name: studentDisplayName,
                email: data.studentEmail,
                service: serviceDisplayName,
                date: dateDisp,
                time: timeDisp,
                endDate: endDateDisp,
                dashboardUrl: dashboardUrl,
                phone: data.phone,
                googleCalendarUrl: googleCalendarUrl
            });
        } else if (data.classType === 'DIP' || data.classType === 'RSEP') {
            studentEmailHtml = generateRsepDipBookingEmail({
                name: studentDisplayName,
                email: data.studentEmail,
                service: serviceDisplayName,
                date: dateDisp,
                time: timeDisp,
                endDate: endDateDisp,
                dashboardUrl: dashboardUrl,
                phone: data.phone,
                googleCalendarUrl: googleCalendarUrl
            });
        }

        if (!confirmationEmailAlreadySent) {
            try {
                await sendBrevoEmail({
                    to: [{ email: data.studentEmail, name: studentDisplayName }],
                    subject: `Booking Confirmed - ${serviceDisplayName}`,
                    htmlContent: studentEmailHtml
                });

                if (data.stripeSessionId) {
                    const { data: rowsToMark } = await supabaseAdmin
                        .from('enrollments')
                        .select('id, customer_details')
                        .eq('stripe_session_id', data.stripeSessionId)
                        .limit(1);

                    const row = rowsToMark?.[0];
                    if (row?.id) {
                        const details = (row.customer_details || {}) as any;
                        await supabaseAdmin
                            .from('enrollments')
                            .update({
                                customer_details: {
                                    ...details,
                                    confirmation_email_sent_at: new Date().toISOString(),
                                },
                                updated_at: new Date().toISOString(),
                            })
                            .eq('id', row.id);
                    }
                }
            } catch (emailError) {
                console.error('Failed to send student confirmation email:', emailError);
            }
        } else {
            console.log('Student confirmation email already sent, skipping duplicate.');
        }

        try {
            await sendBrevoEmail({
                to: [{ email: 'beamlaky9@gmail.com', name: 'Instructor' }],
                subject: `New Booking: ${serviceDisplayName}`,
                htmlContent: generateInstructorBookingEmail({
                    name: studentDisplayName,
                    email: data.studentEmail,
                    phone: data.phone,
                    service: serviceDisplayName,
                    date: dateDisp,
                    time: timeDisp,
                    dashboardUrl: '#',
                    googleCalendarUrl: googleCalendarUrl
                })
            });
        } catch (emailError) {
            console.error('Failed to send instructor notification email:', emailError);
        }
    }


    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const meta = session.metadata || {};
        const customer = session.customer_details;

        try {
            const email = customer?.email || (session as any).customer_email || meta.student_email;
            const rawName = meta.student_name || session.custom_fields?.find((f: any) => f.key === 'student_name')?.text?.value || customer?.name || '';
            const phone = customer?.phone || meta.student_phone;

            if (!email) {
                console.error('No email in session');
                return new NextResponse('Received (no email)', { status: 200 });
            }

            await handleSuccessfulPayment({
                studentEmail: email,
                studentName: normalizeStudentDisplayName(rawName, email),
                type: meta.type || 'UNKNOWN',
                classId: meta.class_id,
                className: meta.class_name,
                classDate: meta.class_date,
                classTime: meta.class_time,
                classEndDate: meta.class_end_date,
                classType: meta.class_type,
                plan_slug: meta.plan_slug,
                instructorId: meta.instructor_id,
                stripeSessionId: session.id,
                stripePaymentIntentId: session.payment_intent as string,
                amountPaid: session.amount_total ? session.amount_total / 100 : 0,
                // If the user was logged in during checkout, we might have their ID in metadata
                metadataStudentId: meta.student_id,
                phone: phone || undefined,
                address: customer?.address
            });

        } catch (error: any) {
            console.error('Checkout processing error');
            return new NextResponse('Webhook processing error', { status: 500 });
        }
    }
    else if (event.type === 'payment_intent.succeeded') {
        const intent = event.data.object;
        const meta = intent.metadata;

        // Unified handling for Intents as well
        // Only process if explicitly marked for PI webhook handling. Checkout-based flows use checkout.session.completed.
        if (meta?.type && meta?.processed_by_checkout === 'false') {
            try {
                // Intents might not have all details, but we try our best
                const email = meta.studentEmail || meta.email;
                if (email) {
                    await handleSuccessfulPayment({
                        studentEmail: email,
                        studentName: normalizeStudentDisplayName(meta.studentName, email),
                        type: meta.type,
                        classId: meta.classId,
                        className: meta.className,
                        classDate: meta.classDate,
                        classTime: meta.classTime,
                        stripePaymentIntentId: intent.id,
                        amountPaid: intent.amount_received ? intent.amount_received / 100 : 0,
                        phone: meta.studentPhone
                    });
                }
            } catch (error: any) {
                console.error('Intent processing error:', error);
            }
        }
    }

    return new NextResponse('Received', { status: 200 })
}
