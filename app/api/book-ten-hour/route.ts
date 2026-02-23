import { NextRequest, NextResponse } from "next/server"
import { addMinutes, format, setHours, setMinutes, startOfDay, endOfDay, isBefore } from "date-fns"
import { sendBrevoEmail, generateStudentBookingEmail } from "@/lib/email"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getTimeZoneOffsetMinutesForDate, toUtcDateFromLocal } from "@/lib/timezone"

// Edge Runtime Config
export const runtime = 'edge';

export async function POST(request: NextRequest) {
    try {
        const { slot } = await request.json()
        const slotDate = new Date(slot)

        // 1. Authenticate User
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 2. Fetch package/instructor info for ten_hour
        const { data: pkg, error: pkgError } = await supabaseAdmin
            .from('service_packages')
            .select('instructor_id, duration_minutes, instructors!inner(*)')
            .eq('plan_key', 'ten_hour')
            .single() as { data: any, error: any };

        if (pkgError || !pkg?.instructor_id) {
            return NextResponse.json({ error: "Service package or instructor mapping not found" }, { status: 400 })
        }

        const durationMinutes = pkg.duration_minutes || 120
        const instructorId = pkg.instructor_id
        const instructor = pkg.instructors

        if (!instructor || !instructor.is_active) {
            return NextResponse.json({ error: "Instructor not available" }, { status: 400 })
        }

        // 3. Check 10-Hour Package Credits
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('ten_hour_package_paid, ten_hour_sessions_used, ten_hour_sessions_total')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            return NextResponse.json({ error: "Could not verify student credits" }, { status: 400 })
        }

        if (!profile.ten_hour_package_paid) {
            return NextResponse.json({ error: "You have not purchased the 10-Hour Package" }, { status: 400 })
        }

        const used = profile.ten_hour_sessions_used || 0
        const total = profile.ten_hour_sessions_total || 5

        if (used >= total) {
            return NextResponse.json({ error: "No 10-Hour Package credits remaining" }, { status: 400 })
        }

        // Block booking if there is an upcoming 10-hour session already
        const { data: upcomingTenHour } = await supabaseAdmin
            .from("ten_hour_package_sessions")
            .select("id")
            .eq("student_id", user.id)
            .neq("status", "cancelled")
            .gt("start_time", new Date().toISOString())
            .limit(1)

        if (upcomingTenHour && upcomingTenHour.length > 0) {
            return NextResponse.json({ error: "You already have an upcoming 2-hour session from your 10-Hour Package. Please complete or reschedule it first." }, { status: 400 })
        }

        // 4. Double Check Availability (Concurrency) - Inline for Edge Runtime compatibility
        const dateStr = format(slotDate, "yyyy-MM-dd")
        const [year, month, day] = dateStr.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay();
        const offsetMinutes = getTimeZoneOffsetMinutesForDate(year, month, day, 'America/New_York');
        const workingDays = (instructor.working_days || []).map((d: any) => {
            const num = Number(d);
            return num === 0 ? 7 : num;
        });

        // Check Working Days
        if (!workingDays.includes(dayOfWeek)) {
            return NextResponse.json({ error: "Instructor not working on this day" }, { status: 400 })
        }

        // Fetch Existing Bookings for the full local day in UTC
        const dayStartUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMinutes * 60000).toISOString();
        const dayEndUTC = new Date(Date.UTC(year, month - 1, day, 23, 59, 59) - offsetMinutes * 60000).toISOString();

        const [drivingParams, btwParams, tenHourParams] = await Promise.all([
            supabaseAdmin.from("driving_sessions")
                .select("start_time, end_time")
                .eq("instructor_id", instructor.id)
                .neq("status", "cancelled")
                .gte("start_time", dayStartUTC)
                .lte("start_time", dayEndUTC),
            supabaseAdmin.from("behind_the_wheel_sessions")
                .select("starts_at, ends_at")
                .eq("instructor_id", instructor.id)
                .neq("status", "cancelled")
                .gte("starts_at", dayStartUTC)
                .lte("starts_at", dayEndUTC),
            supabaseAdmin.from("ten_hour_package_sessions")
                .select("start_time, end_time")
                .eq("instructor_id", instructor.id)
                .neq("status", "cancelled")
                .gte("start_time", dayStartUTC)
                .lte("start_time", dayEndUTC)
        ])

        if (drivingParams.error || btwParams.error || tenHourParams.error) {
            return NextResponse.json({ error: "Failed to check availability" }, { status: 500 })
        }

        // Normalize all bookings
        const bookings = [
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
            if (period === 'PM' && hours !== 12) hours += 12
            if (period === 'AM' && hours === 12) hours = 0
            return { hours, mins }
        }

        const startClock = parseClockTime(instructor.start_time)
        const endClock = parseClockTime(instructor.end_time)

        let currentSlotUTC = toUtcDateFromLocal(year, month, day, startClock.hours, startClock.mins, 0, 'America/New_York');
        const dayEndLimitUTC = toUtcDateFromLocal(year, month, day, endClock.hours, endClock.mins, 0, 'America/New_York');

        while (isBefore(currentSlotUTC, dayEndLimitUTC)) {
            const slotEndUTC = addMinutes(currentSlotUTC, durationMinutes)
            if (slotEndUTC > dayEndLimitUTC) break;

            const slotStartStr = currentSlotUTC.toISOString()
            const slotEndStr = slotEndUTC.toISOString()

            const overlaps = bookings.some(b => {
                return (slotStartStr < b.end && slotEndStr > b.start)
            })

            if (!overlaps) {
                slots.push(currentSlotUTC.toISOString())
            }

            currentSlotUTC = addMinutes(currentSlotUTC, instructor.slot_minutes || 60)
        }

        const requestedSlotISO = slotDate.toISOString()
        const isAvailable = slots.some(s => s === requestedSlotISO)
        if (!isAvailable) {
            console.error("Slot not found in available list. Requested:", requestedSlotISO, "Available slots:", slots)
            return NextResponse.json({ error: "Slot no longer available" }, { status: 400 })
        }

        // 5. Insert Booking into ten_hour_package_sessions table
        const sessionEndTime = addMinutes(slotDate, durationMinutes)
        const { error: sessionError } = await supabaseAdmin
            .from("ten_hour_package_sessions")
            .insert({
                student_id: user.id,
                instructor_id: instructorId,
                start_time: slotDate.toISOString(),
                end_time: sessionEndTime.toISOString(),
                status: 'scheduled'
            })

        if (sessionError) {
            console.error("Session insert error:", sessionError)
            return NextResponse.json({ error: "Failed to book session" }, { status: 500 })
        }

        // 6. Increment usage
        const { data: currentProfile } = await supabaseAdmin
            .from('profiles')
            .select('ten_hour_sessions_used')
            .eq('id', user.id)
            .single()

        const { error: profileUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({
                ten_hour_sessions_used: (currentProfile?.ten_hour_sessions_used || 0) + 1
            })
            .eq('id', user.id)

        if (profileUpdateError) {
            console.error("Profile update error:", profileUpdateError)
            // Don't fail the booking if credit update fails, log it
        }

        // 7. Send Confirmation Email
        try {
            const { data: profileData } = await supabaseAdmin
                .from('profiles')
                .select('full_name, email')
                .eq('id', user.id)
                .single()

            if (profileData?.email) {
                const emailContent = generateStudentBookingEmail({
                    name: profileData.full_name || 'Student',
                    email: profileData.email,
                    service: '10-Hour Package Session',
                    date: format(slotDate, 'EEEE, MMMM d, yyyy'),
                    time: format(slotDate, 'h:mm a'),
                    instructor: instructor.name || 'Instructor',
                    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://selamdrivingschool.com'}/student/dashboard`
                })

                await sendBrevoEmail({
                    to: [{ email: profileData.email }],
                    subject: '10-Hour Session Confirmed',
                    htmlContent: emailContent
                })
            }
        } catch (emailError) {
            console.error("Email send error:", emailError)
            // Don't fail the booking if email fails
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error("10-Hour booking error:", error)
        return NextResponse.json(
            { error: error.message || "An unexpected error occurred" },
            { status: 500 }
        )
    }
}
