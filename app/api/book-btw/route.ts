export const runtime = 'edge'

import { addMinutes, format, isBefore } from "date-fns"
import { NextRequest, NextResponse } from "next/server"
import { sendBrevoEmail, generateStudentBookingEmail, generateBtwCompletionEmail } from "@/lib/email"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getTimeZoneOffsetMinutesForDate, toUtcDateFromLocal } from "@/lib/timezone"

export async function POST(request: NextRequest) {
    try {
        const { slot, planKey = 'btw' } = await request.json()

        if (!slot) {
            return NextResponse.json({ error: "Slot is required" }, { status: 400 })
        }

        const slotDate = new Date(slot)

        // 1. Authenticate User via Bearer Token
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 2. Fetch package/instructor info
        const { data: pkg, error: pkgError } = await supabaseAdmin
            .from('service_packages')
            .select('instructor_id, duration_minutes')
            .eq('plan_key', planKey)
            .single();

        if (pkgError || !pkg?.instructor_id) {
            return NextResponse.json({ error: "Service package or instructor mapping not found" }, { status: 404 })
        }

        const durationMinutes = pkg.duration_minutes || 120;
        const instructorId = pkg.instructor_id;

        // 3. Credit Enforcement for BTW
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('driving_balance_sessions, driving_balance_hours, btw_access_enabled, email, full_name')
            .eq('id', user.id)
            .single();

        const { data: allocationRows } = await supabaseAdmin
            .from('student_btw_allocations')
            .select('id, package_id, sessions_used, total_included_sessions')
            .eq('student_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (profileError || !profile) {
            return NextResponse.json({ error: "Could not verify student credits" }, { status: 400 })
        }

        const allocation = allocationRows?.[0] || null
        let sessionsUsed = allocation?.sessions_used || 0
        let totalIncluded = allocation?.total_included_sessions || 3
        let sessionsRemaining = profile.driving_balance_sessions || 0
        let hoursRemaining = profile.driving_balance_hours || 0
        let allocationId = allocation?.id as string | undefined

        const { data: deEnrollments } = await supabaseAdmin
            .from('enrollments')
            .select(`
                status,
                grade,
                final_grade,
                btw_credits_granted,
                classes:class_id (class_type),
                courses:course_id (type)
            `)
            .or(`user_id.eq.${user.id},student_id.eq.${user.id},email.eq.${user.email?.toLowerCase()}`)

        const hasPassingDriversEd = (deEnrollments || []).some((e: any) => {
            const cls = Array.isArray(e.classes) ? e.classes[0] : e.classes
            const course = Array.isArray(e.courses) ? e.courses[0] : e.courses
            const isDE = cls?.class_type === 'DE' || course?.type === 'drivers_ed'
            const numericGrade = Number(e.grade ?? e.final_grade)
            return isDE && (
                e.status === 'completed' ||
                e.btw_credits_granted ||
                (!Number.isNaN(numericGrade) && numericGrade >= 80)
            )
        })

        // Self-heal missing allocation/profile credits for eligible students.
        if (hasPassingDriversEd && !allocationId) {
            let btwPackageId: string | undefined
            const { data: packageRows } = await supabaseAdmin
                .from('behind_the_wheel_packages')
                .select('id')
                .eq('included_sessions', 3)
                .limit(1)
            btwPackageId = packageRows?.[0]?.id

            if (!btwPackageId) {
                const { data: createdPackage, error: packageCreateError } = await supabaseAdmin
                    .from('behind_the_wheel_packages')
                    .insert({
                        name: 'Standard 3-Session Package',
                        included_sessions: 3,
                        session_duration_minutes: 120,
                    })
                    .select('id')
                    .single()
                if (packageCreateError || !createdPackage?.id) {
                    console.error("Failed to create BTW package:", packageCreateError)
                    return NextResponse.json({ error: "Could not initialize BTW package" }, { status: 500 })
                }
                btwPackageId = createdPackage.id
            }

            const { data: createdAllocation, error: allocationCreateError } = await supabaseAdmin
                .from('student_btw_allocations')
                .insert({
                    student_id: user.id,
                    package_id: btwPackageId,
                    total_included_sessions: 3,
                    sessions_used: 0,
                })
                .select('id, sessions_used, total_included_sessions')
                .single()

            if (allocationCreateError || !createdAllocation) {
                console.error("Failed to create BTW allocation:", allocationCreateError)
                return NextResponse.json({ error: "Could not initialize BTW credits" }, { status: 500 })
            }

            allocationId = createdAllocation.id
            sessionsUsed = createdAllocation.sessions_used || 0
            totalIncluded = createdAllocation.total_included_sessions || 3
        }

        const allocationRemaining = Math.max(0, totalIncluded - sessionsUsed)
        if (sessionsRemaining <= 0 && hasPassingDriversEd && allocationRemaining > 0) {
            sessionsRemaining = allocationRemaining
            hoursRemaining = Math.max(hoursRemaining, sessionsRemaining * 2)
            const { error: bootstrapProfileError } = await supabaseAdmin
                .from('profiles')
                .update({
                    btw_access_enabled: true,
                    driving_balance_sessions: sessionsRemaining,
                    driving_balance_hours: hoursRemaining,
                })
                .eq('id', user.id)

            if (bootstrapProfileError) {
                console.error("Failed to bootstrap BTW profile credits:", bootstrapProfileError)
            }
        }

        if (sessionsRemaining <= 0 || sessionsUsed >= totalIncluded) {
            return NextResponse.json({ error: "No BTW credits remaining" }, { status: 400 })
        }

        // 3b. Block booking if there is an upcoming BTW session already
        const { data: upcomingBtw } = await supabaseAdmin
            .from('behind_the_wheel_sessions')
            .select('id')
            .eq('student_id', user.id)
            .neq('status', 'cancelled')
            .gt('starts_at', new Date().toISOString())
            .limit(1);

        if (upcomingBtw && upcomingBtw.length > 0) {
            return NextResponse.json({ error: "You already have an upcoming Behind-the-Wheel session. Please complete or reschedule it first." }, { status: 400 })
        }

        // 4. Double Check Availability (Concurrency) - Inline for Edge Runtime compatibility
        const dateStr = format(slotDate, "yyyy-MM-dd");
        const [year, month, day] = dateStr.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay();
        const offsetMinutes = getTimeZoneOffsetMinutesForDate(year, month, day, 'America/New_York');

        // Fetch instructor details
        const { data: instructor } = await supabaseAdmin
            .from('instructors')
            .select('*')
            .eq('id', instructorId)
            .single()

        const workingDays = (instructor?.working_days || []).map((d: any) => {
            const num = Number(d);
            return num === 0 ? 7 : num;
        });

        if (!instructor || !instructor.is_active || !workingDays.includes(dayOfWeek)) {
            return NextResponse.json({ error: "Instructor not available on this day" }, { status: 400 })
        }

        // Fetch Existing Bookings for the full local day in UTC
        const dayStartUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMinutes * 60000).toISOString();
        const dayEndUTC = new Date(Date.UTC(year, month - 1, day, 23, 59, 59) - offsetMinutes * 60000).toISOString();

        const [drivingParams, btwParams, tenHourParams] = await Promise.all([
            supabaseAdmin.from("driving_sessions")
                .select("start_time, end_time")
                .eq("instructor_id", instructorId)
                .neq("status", "cancelled")
                .gte("start_time", dayStartUTC)
                .lte("start_time", dayEndUTC),
            supabaseAdmin.from("behind_the_wheel_sessions")
                .select("starts_at, ends_at")
                .eq("instructor_id", instructorId)
                .neq("status", "cancelled")
                .gte("starts_at", dayStartUTC)
                .lte("starts_at", dayEndUTC),
            supabaseAdmin.from("ten_hour_package_sessions")
                .select("start_time, end_time")
                .eq("instructor_id", instructorId)
                .neq("status", "cancelled")
                .gte("start_time", dayStartUTC)
                .lte("start_time", dayEndUTC)
        ])

        const bookingsFiltered = [
            ...(drivingParams.data || []).map(b => ({ start: b.start_time, end: b.end_time })),
            ...(btwParams.data || []).map(b => ({ start: b.starts_at, end: b.ends_at })),
            ...(tenHourParams.data || []).map(b => ({ start: b.start_time, end: b.end_time }))
        ]

        // Generate All Possible Slots in UTC
        const slots: string[] = []

        const parseClockTime = (timeStr: string) => {
            const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
            if (!match) return { hours: 0, mins: 0 }
            let hours = parseInt(match[1])
            const mins = parseInt(match[2])
            const period = match[3].toUpperCase()
            if (period === 'PM' && hours < 12) hours += 12
            if (period === 'AM' && hours === 12) hours = 0
            return { hours, mins }
        }

        const startClock = parseClockTime(instructor.start_time || '7:00 AM')
        const endClock = parseClockTime(instructor.end_time || '7:00 PM')

        let currentSlotUTC = toUtcDateFromLocal(year, month, day, startClock.hours, startClock.mins, 0, 'America/New_York');
        const dayEndLimitUTC = toUtcDateFromLocal(year, month, day, endClock.hours, endClock.mins, 0, 'America/New_York');

        while (isBefore(currentSlotUTC, dayEndLimitUTC)) {
            const slotEndUTC = addMinutes(currentSlotUTC, durationMinutes)
            if (slotEndUTC > dayEndLimitUTC) break;

            const slotStartStr = currentSlotUTC.toISOString()
            const slotEndStr = slotEndUTC.toISOString()

            const overlaps = bookingsFiltered.some(b => {
                return (slotStartStr < b.end && slotEndStr > b.start)
            })

            // Break check
            let inBreak = false
            if (instructor.break_start && instructor.break_end) {
                const bStart = parseClockTime(instructor.break_start)
                const bEnd = parseClockTime(instructor.break_end)
                const breakStartUTC = toUtcDateFromLocal(year, month, day, bStart.hours, bStart.mins, 0, 'America/New_York');
                const breakEndUTC = toUtcDateFromLocal(year, month, day, bEnd.hours, bEnd.mins, 0, 'America/New_York');
                if (currentSlotUTC < breakEndUTC && breakStartUTC < slotEndUTC) inBreak = true
            }

            if (!overlaps && !inBreak) {
                slots.push(currentSlotUTC.toISOString())
            }

            currentSlotUTC = addMinutes(currentSlotUTC, instructor.slot_minutes || 60)
        }

        // Final verification
        const requestedSlotISO = slotDate.toISOString()
        const isAvailable = slots.some(s => s === requestedSlotISO)

        // Check if slot is in the past
        const isInPast = new Date() > slotDate

        if (!isAvailable || isInPast) {
            console.error("Booking verification failed. Available:", isAvailable, "InPast:", isInPast, "Requested:", requestedSlotISO, "List:", slots)
            return NextResponse.json({ error: "Slot no longer available" }, { status: 400 })
        }

        // 5. Insert Booking into behind_the_wheel_sessions table
        const endTime = addMinutes(slotDate, durationMinutes)

        const { error: sessionError } = await supabaseAdmin
            .from("behind_the_wheel_sessions")
            .insert({
                student_id: user.id,
                instructor_id: instructorId,
                starts_at: slotDate.toISOString(),
                ends_at: endTime.toISOString(),
                status: 'scheduled',
                session_type: 'BTW'
            });

        if (sessionError) {
            console.error("Session insert error:", sessionError)
            return NextResponse.json({ error: sessionError.message }, { status: 500 })
        }

        // 6. Update Credits
        const nextSessionsRemaining = Math.max(0, sessionsRemaining - 1)
        const nextHoursRemaining = Math.max(0, (hoursRemaining || (sessionsRemaining * 2)) - 2)
        const { error: profileUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({
                btw_access_enabled: true,
                driving_balance_sessions: nextSessionsRemaining,
                driving_balance_hours: nextHoursRemaining
            })
            .eq('id', user.id);

        if (profileUpdateError) {
            console.error("Profile update error:", profileUpdateError)
            return NextResponse.json({ error: "Failed to update credits" }, { status: 500 })
        }

        // 7. Increment allocation usage
        if (allocationId) {
            const nextSessionsUsed = Math.min(totalIncluded, sessionsUsed + 1)
            const { error: allocUpdateError } = await supabaseAdmin
                .from('student_btw_allocations')
                .update({
                    sessions_used: nextSessionsUsed
                })
                .eq('id', allocationId);
            if (allocUpdateError) {
                console.error("Allocation update error:", allocUpdateError)
            }
        }

        // 8. Send Confirmation Email
        try {
            const { data: instructorData } = await supabaseAdmin.from('instructors').select('full_name').eq('id', instructorId).single();

            if (profile.email) {
                const dateFormatted = format(slotDate, "MMMM do, yyyy");
                const timeFormatted = format(slotDate, "h:mm a");
                const isCompletion = allocationId ? (sessionsUsed + 1 >= totalIncluded) : (nextSessionsRemaining <= 0);

                // Send standard booking confirmation
                await sendBrevoEmail({
                    to: [{ email: profile.email, name: profile.full_name }],
                    subject: `Booking Confirmed: Behind-the-Wheel Training - Selam Driving School`,
                    htmlContent: generateStudentBookingEmail({
                        name: profile.full_name,
                        email: profile.email,
                        service: 'Behind-the-Wheel Training',
                        date: dateFormatted,
                        time: timeFormatted,
                        instructor: instructorData?.full_name || 'Assigned Instructor',
                        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://selamdrivingschool.com'}/student/dashboard`
                    })
                });

                // If this is the 3rd session, also send the completion congratulations email
                if (isCompletion) {
                    await sendBrevoEmail({
                        to: [{ email: profile.email, name: profile.full_name }],
                        subject: `Congratulations! You've Completed Your BTW Training - Selam Driving School`,
                        htmlContent: generateBtwCompletionEmail({
                            name: profile.full_name,
                                dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://selamdrivingschool.com'}/student/dashboard`
                        })
                    });
                }
            }
        } catch (emailError) {
            console.error("Failed to send confirmation email:", emailError);
            // Don't fail the whole booking if email fails
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error("BTW Booking API Error:", error)
        return NextResponse.json({ error: error.message || "Booking failed" }, { status: 500 })
    }
}
