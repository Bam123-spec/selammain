export const runtime = "edge";

import { addHours, addMinutes, format, isBefore } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { generateInstructorBookingEmail, generateStudentBookingEmail, sendBrevoEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getTimeZoneOffsetMinutesForDate, toUtcDateFromLocal } from "@/lib/timezone";

const ADMIN_RESCHEDULE_EMAIL = process.env.ADMIN_RESCHEDULE_EMAIL || "selamdrivingschool@gmail.com";

function serviceLabelFromPlan(planKey: string) {
    if (planKey === "driving-practice-1hr") return "Driving Practice 1 Hour";
    if (planKey === "driving-practice-2hr") return "Driving Practice 2 Hour";
    if (planKey === "road-test-escort") return "Road Test Service";
    if (planKey === "road-test-1hr") return "Road Test Service + 1 Hour";
    if (planKey === "road-test-2hr") return "Road Test Service + 2 Hour";
    return planKey.replace(/-/g, " ");
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

        if (error) return fallbackUrl;
        return data?.properties?.action_link || fallbackUrl;
    } catch {
        return fallbackUrl;
    }
}

function parseClockTime(timeStr: string) {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return { hours: 0, mins: 0 };
    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return { hours, mins };
}

export async function POST(request: NextRequest) {
    try {
        const { sessionId, slot } = await request.json();

        if (!sessionId || !slot) {
            return NextResponse.json({ error: "sessionId and slot are required" }, { status: 400 });
        }

        const slotDate = new Date(slot);
        if (Number.isNaN(slotDate.getTime())) {
            return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
        }

        if (new Date() > slotDate) {
            return NextResponse.json({ error: "Cannot reschedule to a past time" }, { status: 400 });
        }

        const authHeader = request.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
        const user = authData?.user;
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: existingSession, error: sessionError } = await supabaseAdmin
            .from("driving_sessions")
            .select("*")
            .eq("id", sessionId)
            .eq("student_id", user.id)
            .single();

        if (sessionError || !existingSession) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        if (existingSession.status === "cancelled") {
            return NextResponse.json({ error: "Cannot reschedule a cancelled session" }, { status: 400 });
        }

        const planKey = existingSession.plan_key || existingSession.service_slug;
        if (!planKey) {
            return NextResponse.json({ error: "Session is missing plan configuration" }, { status: 400 });
        }

        let durationMinutes = Number(existingSession.duration_minutes || 0);
        if (!durationMinutes && existingSession.start_time && existingSession.end_time) {
            durationMinutes = Math.max(
                30,
                Math.round(
                    (new Date(existingSession.end_time).getTime() - new Date(existingSession.start_time).getTime()) / 60000
                )
            );
        }
        if (!durationMinutes) durationMinutes = 60;

        let instructorId = existingSession.instructor_id || null;
        const { data: pkg } = await supabaseAdmin
            .from("service_packages")
            .select("instructor_id, duration_minutes")
            .eq("plan_key", planKey)
            .maybeSingle();

        if (pkg?.duration_minutes) durationMinutes = pkg.duration_minutes;
        if (!instructorId && pkg?.instructor_id) instructorId = pkg.instructor_id;

        if (!instructorId) {
            return NextResponse.json({ error: "No instructor assigned for this session" }, { status: 400 });
        }

        const dateStr = format(slotDate, "yyyy-MM-dd");
        const [year, month, day] = dateStr.split("-").map(Number);
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay();
        const offsetMinutes = getTimeZoneOffsetMinutesForDate(year, month, day, "America/New_York");

        const { data: instructor } = await supabaseAdmin
            .from("instructors")
            .select("*")
            .eq("id", instructorId)
            .single();

        const workingDays = (instructor?.working_days || []).map((d: any) => {
            const num = Number(d);
            return num === 0 ? 7 : num;
        });

        if (!instructor || !instructor.is_active || !workingDays.includes(dayOfWeek)) {
            return NextResponse.json({ error: "Instructor not available on this day" }, { status: 400 });
        }

        const dayStartUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMinutes * 60000).toISOString();
        const dayEndUTC = new Date(Date.UTC(year, month - 1, day, 23, 59, 59) - offsetMinutes * 60000).toISOString();

        const [drivingParams, btwParams, tenHourParams] = await Promise.all([
            supabaseAdmin
                .from("driving_sessions")
                .select("id, start_time, end_time")
                .eq("instructor_id", instructorId)
                .neq("status", "cancelled")
                .gte("start_time", dayStartUTC)
                .lte("start_time", dayEndUTC),
            supabaseAdmin
                .from("behind_the_wheel_sessions")
                .select("starts_at, ends_at")
                .eq("instructor_id", instructorId)
                .neq("status", "cancelled")
                .gte("starts_at", dayStartUTC)
                .lte("starts_at", dayEndUTC),
            supabaseAdmin
                .from("ten_hour_package_sessions")
                .select("start_time, end_time")
                .eq("instructor_id", instructorId)
                .neq("status", "cancelled")
                .gte("start_time", dayStartUTC)
                .lte("start_time", dayEndUTC),
        ]);

        const bookingsFiltered = [
            ...(drivingParams.data || [])
                .filter((b) => b.id !== sessionId)
                .map((b) => ({ start: b.start_time, end: b.end_time })),
            ...(btwParams.data || []).map((b) => ({ start: b.starts_at, end: b.ends_at })),
            ...(tenHourParams.data || []).map((b) => ({ start: b.start_time, end: b.end_time })),
        ];

        const startClock = parseClockTime(instructor.start_time || "7:00 AM");
        const endClock = parseClockTime(instructor.end_time || "7:00 PM");

        let currentSlotUTC = toUtcDateFromLocal(year, month, day, startClock.hours, startClock.mins, 0, "America/New_York");
        const dayEndLimitUTC = toUtcDateFromLocal(year, month, day, endClock.hours, endClock.mins, 0, "America/New_York");
        const minNoticeTime = addHours(new Date(), instructor.min_notice_hours || 12);
        const slots: string[] = [];

        while (isBefore(currentSlotUTC, dayEndLimitUTC)) {
            const slotEndUTC = addMinutes(currentSlotUTC, durationMinutes);
            if (slotEndUTC > dayEndLimitUTC) break;

            if (isBefore(minNoticeTime, currentSlotUTC)) {
                const slotStartStr = currentSlotUTC.toISOString();
                const slotEndStr = slotEndUTC.toISOString();
                const overlaps = bookingsFiltered.some((b) => slotStartStr < b.end && slotEndStr > b.start);

                let inBreak = false;
                if (instructor.break_start && instructor.break_end) {
                    const bStart = parseClockTime(instructor.break_start);
                    const bEnd = parseClockTime(instructor.break_end);
                    const breakStartUTC = toUtcDateFromLocal(year, month, day, bStart.hours, bStart.mins, 0, "America/New_York");
                    const breakEndUTC = toUtcDateFromLocal(year, month, day, bEnd.hours, bEnd.mins, 0, "America/New_York");
                    if (currentSlotUTC < breakEndUTC && breakStartUTC < slotEndUTC) inBreak = true;
                }

                if (!overlaps && !inBreak) {
                    slots.push(currentSlotUTC.toISOString());
                }
            }

            currentSlotUTC = addMinutes(currentSlotUTC, instructor.slot_minutes || 60);
        }

        const requestedSlotISO = slotDate.toISOString();
        const isAvailable = slots.some((s) => s === requestedSlotISO);
        if (!isAvailable) {
            return NextResponse.json({ error: "Slot no longer available" }, { status: 400 });
        }

        const endTime = addMinutes(slotDate, durationMinutes);
        const { error: updateError } = await supabaseAdmin
            .from("driving_sessions")
            .update({
                start_time: slotDate.toISOString(),
                end_time: endTime.toISOString(),
                status: "scheduled",
                instructor_id: instructorId,
                updated_at: new Date().toISOString(),
            })
            .eq("id", sessionId)
            .eq("student_id", user.id);

        if (updateError) {
            return NextResponse.json({ error: "Failed to reschedule session" }, { status: 500 });
        }

        try {
            const [{ data: profile }, { data: instructorData }] = await Promise.all([
                supabaseAdmin.from("profiles").select("full_name, email").eq("id", user.id).single(),
                supabaseAdmin.from("instructors").select("full_name").eq("id", instructorId).single(),
            ]);

            const studentName = profile?.full_name || "Student";
            const studentEmail = profile?.email || user.email || "";
            const serviceLabel = serviceLabelFromPlan(planKey);
            const dateFormatted = format(slotDate, "MMMM do, yyyy");
            const timeFormatted = format(slotDate, "h:mm a");

            if (studentEmail) {
                const dashboardUrl = await buildManageBookingUrl(studentEmail);
                await sendBrevoEmail({
                    to: [{ email: studentEmail, name: studentName }],
                    subject: `Booking Rescheduled - ${serviceLabel}`,
                    htmlContent: generateStudentBookingEmail({
                        name: studentName,
                        email: studentEmail,
                        service: `${serviceLabel} (Rescheduled)`,
                        date: dateFormatted,
                        time: timeFormatted,
                        instructor: instructorData?.full_name || "Assigned Instructor",
                        dashboardUrl,
                    }),
                });
            }

            await sendBrevoEmail({
                to: [{ email: ADMIN_RESCHEDULE_EMAIL, name: "Admin" }],
                subject: `Rescheduled: ${serviceLabel} - ${studentName}`,
                htmlContent: generateInstructorBookingEmail({
                    name: studentName,
                    email: studentEmail || "not-provided",
                    service: `${serviceLabel} (Rescheduled)`,
                    date: dateFormatted,
                    time: timeFormatted,
                    instructor: instructorData?.full_name || "Assigned Instructor",
                    dashboardUrl: "#",
                }),
            });
        } catch (emailError) {
            console.error("Failed to send practice/road-test reschedule email:", emailError);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Driving session reschedule API error:", error);
        return NextResponse.json({ error: error.message || "Reschedule failed" }, { status: 500 });
    }
}
