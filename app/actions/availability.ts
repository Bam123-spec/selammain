"use server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { addMinutes, format, parse, setHours, setMinutes, isSameDay, isAfter, startOfDay, endOfDay } from "date-fns"
import { createServerClient } from '@supabase/ssr'
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { sendBrevoEmail, generateStudentBookingEmail } from "@/lib/email"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Note: Schedule logic is now dynamic and fetched from the database per instructor.

export async function getInstructorAvailability(date: Date, planKey: string = 'btw') {
    try {
        const dateStr = format(date, "yyyy-MM-dd")
        const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay() // 1=Mon, 7=Sun

        // 1. Fetch package and instructor rules
        const { data: pkg, error: pkgError } = await supabaseAdmin
            .from('service_packages')
            .select('instructor_id, duration_minutes, instructors!inner(*)')
            .eq('plan_key', planKey)
            .single() as { data: any, error: any };

        if (pkgError || !pkg) {
            console.error('Package fetch error:', pkgError);
            return { slots: [], error: "Package not found" };
        }

        const instructor = pkg.instructors;
        if (!instructor || !instructor.is_active) {
            return { slots: [] };
        }

        // 2. Check Working Days
        if (!instructor.working_days.includes(dayOfWeek)) {
            return { slots: [] }
        }

        // 3. Fetch Existing Bookings for this Instructor on this Date (Check ALL tables)
        const dayStart = startOfDay(date).toISOString()
        const dayEnd = endOfDay(date).toISOString()

        const [drivingParams, btwParams, tenHourParams] = await Promise.all([
            // Standard Driving Sessions
            supabaseAdmin.from("driving_sessions")
                .select("start_time, end_time")
                .eq("instructor_id", instructor.id)
                .neq("status", "cancelled")
                .gte("start_time", dayStart)
                .lte("start_time", dayEnd),
            // BTW Sessions
            supabaseAdmin.from("behind_the_wheel_sessions")
                .select("starts_at, ends_at")
                .eq("instructor_id", instructor.id)
                .neq("status", "cancelled")
                .gte("starts_at", dayStart)
                .lte("starts_at", dayEnd),
            // 10-Hour Package Sessions
            supabaseAdmin.from("ten_hour_package_sessions")
                .select("start_time, end_time")
                .eq("instructor_id", instructor.id)
                .neq("status", "cancelled")
                .gte("start_time", dayStart)
                .lte("start_time", dayEnd)
        ]);

        if (drivingParams.error || btwParams.error || tenHourParams.error) {
            console.error("Error fetching bookings:", { d: drivingParams.error, b: btwParams.error, t: tenHourParams.error })
            throw new Error("Failed to fetch schedule")
        }

        // Normalize all bookings
        const bookings = [
            ...(drivingParams.data || []).map(b => ({ start: b.start_time, end: b.end_time })),
            ...(btwParams.data || []).map(b => ({ start: b.starts_at, end: b.ends_at })),
            ...(tenHourParams.data || []).map(b => ({ start: b.start_time, end: b.end_time }))
        ];

        // 4. Generate All Possible Slots
        const slots: string[] = []

        const parseClockTime = (timeStr: string) => {
            const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!match) return { hours: 0, mins: 0 };
            let hours = parseInt(match[1]);
            const mins = parseInt(match[2]);
            const period = match[3].toUpperCase();
            if (period === 'PM' && hours < 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return { hours, mins };
        };

        const startRule = parseClockTime(instructor.start_time || '8:00 AM');
        const endRule = parseClockTime(instructor.end_time || '7:00 PM');

        let currentSlot = setMinutes(setHours(date, startRule.hours), startRule.mins);
        const dayEndLimit = setMinutes(setHours(date, endRule.hours), endRule.mins);

        const durationNeeded = pkg.duration_minutes || 120;
        const slotMinutes = instructor.slot_minutes || 60;

        while (addMinutes(currentSlot, durationNeeded) <= dayEndLimit) {
            const slotStart = currentSlot
            const slotEnd = addMinutes(currentSlot, durationNeeded)

            // Check collision with any existing booking
            const hasConflict = bookings.some(booking => {
                const bookingStart = new Date(booking.start)
                const bookingEnd = new Date(booking.end)
                return slotStart < bookingEnd && slotEnd > bookingStart
            })

            // Check for break conflicts
            let inBreak = false;
            if (instructor.break_start && instructor.break_end) {
                const bStart = parseClockTime(instructor.break_start);
                const bEnd = parseClockTime(instructor.break_end);
                const breakStart = setMinutes(setHours(date, bStart.hours), bStart.mins);
                const breakEnd = setMinutes(setHours(date, bEnd.hours), bEnd.mins);
                if (slotStart < breakEnd && breakStart < slotEnd) inBreak = true;
            }

            // Also check if slot is in the past (if today)
            const isInPast = new Date() > slotStart

            if (!hasConflict && !isInPast && !inBreak) {
                slots.push(currentSlot.toISOString())
            }

            currentSlot = addMinutes(currentSlot, slotMinutes)
        }

        return { slots }

    } catch (error) {
        console.error("getInstructorAvailability error:", error)
        return { slots: [], error: "Failed to load availability" }
    }
}

export async function bookSession(slot: string, planKey: string = 'btw') {
    try {
        const slotDate = new Date(slot)

        // 1. Authenticate User
        const cookieStore = await cookies()
        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // Ignored
                        }
                    },
                },
            }
        )
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Unauthorized")

        // 2. Fetch package/instructor info
        const { data: pkg, error: pkgError } = await supabaseAdmin
            .from('service_packages')
            .select('instructor_id, duration_minutes')
            .eq('plan_key', planKey)
            .single();

        if (pkgError || !pkg?.instructor_id) {
            throw new Error("Service package or instructor mapping not found");
        }

        const durationMinutes = pkg.duration_minutes || 120;
        const instructorId = pkg.instructor_id;

        // 3. Credit Enforcement
        if (planKey === 'btw') {
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('driving_balance_sessions, driving_balance_hours')
                .eq('id', user.id)
                .single();

            const { data: allocation } = await supabaseAdmin
                .from('student_btw_allocations')
                .select('sessions_used, total_included_sessions')
                .eq('student_id', user.id)
                .maybeSingle();

            if (profileError || !profile) throw new Error("Could not verify student credits");

            const sessionsRemaining = profile.driving_balance_sessions || 0;
            const sessionsUsed = allocation?.sessions_used || 0;

            if (sessionsRemaining <= 0 || sessionsUsed >= 3) {
                return { error: "No BTW credits remaining" };
            }
        } else if (planKey === 'ten_hour') {
            // Check 10-Hour Package Credits
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('ten_hour_package_paid, ten_hour_sessions_used, ten_hour_sessions_total')
                .eq('id', user.id)
                .single();

            if (profileError || !profile) throw new Error("Could not verify student credits");

            if (!profile.ten_hour_package_paid) {
                return { error: "You have not purchased the 10-Hour Package" };
            }

            const used = profile.ten_hour_sessions_used || 0;
            const total = profile.ten_hour_sessions_total || 5;

            if (used >= total) {
                return { error: "No 10-Hour Package credits remaining" };
            }
        }

        // 4. Double Check Availability (Concurrency)
        const check = await getInstructorAvailability(slotDate, planKey)
        const isAvailable = check.slots.some(s => s === slotDate.toISOString())
        if (!isAvailable) {
            return { error: "Slot no longer available" }
        }

        // 5. Insert Booking & Update Credits (BTW Only)
        const endTime = addMinutes(slotDate, durationMinutes)

        if (planKey === 'btw') {
            // Atomic update using a transaction-like approach (manual sequential for now, or RPC if needed)
            // But since we are using supabaseAdmin, we can just do them sequentially here as it's server-side

            const { error: sessionError } = await supabaseAdmin
                .from("driving_sessions")
                .insert({
                    student_id: user.id,
                    instructor_id: instructorId,
                    start_time: slotDate.toISOString(),
                    end_time: endTime.toISOString(),
                    status: 'scheduled',
                    plan_key: 'btw',
                    service_type: 'BTW' // Add service type to differentiate BTW from other sessions
                });

            if (sessionError) throw sessionError;

            // Fetch current profile for accurate decrement
            const { data: currentProfile } = await supabaseAdmin.from('profiles').select('driving_balance_sessions, driving_balance_hours').eq('id', user.id).single();

            // Atomic update profile
            const { error: profileUpdateError } = await supabaseAdmin
                .from('profiles')
                .update({
                    driving_balance_sessions: Math.max(0, (currentProfile?.driving_balance_sessions || 0) - 1),
                    driving_balance_hours: Math.max(0, (currentProfile?.driving_balance_hours || 0) - 2)
                })
                .eq('id', user.id);

            if (profileUpdateError) throw profileUpdateError;

            // Increment allocation usage
            const { data: currentAlloc } = await supabaseAdmin.from('student_btw_allocations').select('sessions_used').eq('student_id', user.id).maybeSingle();
            if (currentAlloc) {
                const { error: allocUpdateError } = await supabaseAdmin
                    .from('student_btw_allocations')
                    .update({
                        sessions_used: (currentAlloc.sessions_used || 0) + 1
                    })
                    .eq('student_id', user.id);
                if (allocUpdateError) throw allocUpdateError;
            }

            revalidatePath('/student/dashboard')
            revalidatePath('/student/behind-the-wheel')
        } else if (planKey === 'ten_hour') {
            // 10-Hour Package Booking
            const { error: sessionError } = await supabaseAdmin
                .from("ten_hour_package_sessions")
                .insert({
                    student_id: user.id,
                    instructor_id: instructorId,
                    start_time: slotDate.toISOString(),
                    end_time: endTime.toISOString(),
                    status: 'scheduled'
                });

            if (sessionError) throw sessionError;

            // Increment usage
            const { data: currentProfile } = await supabaseAdmin.from('profiles').select('ten_hour_sessions_used').eq('id', user.id).single();
            const { error: profileUpdateError } = await supabaseAdmin
                .from('profiles')
                .update({
                    ten_hour_sessions_used: (currentProfile?.ten_hour_sessions_used || 0) + 1
                })
                .eq('id', user.id);

            if (profileUpdateError) throw profileUpdateError;

            revalidatePath('/student/dashboard')
            revalidatePath('/student/ten-hour')
        } else {
            // Regular Driving Session
            const { error: insertError } = await supabaseAdmin
                .from("driving_sessions")
                .insert({
                    student_id: user.id,
                    instructor_id: instructorId,
                    start_time: slotDate.toISOString(),
                    end_time: endTime.toISOString(),
                    status: 'scheduled'
                });

            if (insertError) throw insertError;
        }

        // 6. Send Confirmation Email
        try {
            const { data: profile } = await supabaseAdmin.from('profiles').select('full_name, email').eq('id', user.id).single();
            const { data: instructor } = await supabaseAdmin.from('instructors').select('full_name').eq('id', instructorId).single();

            if (profile?.email) {
                let serviceName = 'Driving Session';
                if (planKey === 'btw') serviceName = 'Behind-the-Wheel Training';
                if (planKey === 'ten_hour') serviceName = '10-Hour Package Session';

                const dateFormatted = format(slotDate, "MMMM do, yyyy");
                const timeFormatted = format(slotDate, "h:mm a");

                await sendBrevoEmail({
                    to: [{ email: profile.email, name: profile.full_name }],
                    subject: `Booking Confirmed: ${serviceName} - Selam Driving School`,
                    htmlContent: generateStudentBookingEmail({
                        name: profile.full_name,
                        email: profile.email,
                        service: serviceName,
                        date: dateFormatted,
                        time: timeFormatted,
                        instructor: instructor?.full_name || 'Assigned Instructor',
                        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://selamdrivingschool.com'}/student/dashboard`
                    })
                });
            }
        } catch (emailError) {
            console.error("Failed to send confirmation email:", emailError);
            // Don't fail the whole booking if email fails
        }

        return { success: true }

    } catch (error: any) {
        console.error("Book Session Error:", error)
        return { error: error.message || "Booking failed" }
    }
}
