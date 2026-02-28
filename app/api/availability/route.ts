import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getTimeZoneOffsetMinutesForDate, toUtcDateFromLocal } from '@/lib/timezone';

export const runtime = 'edge';

type BusyRange = {
    startMs: number;
    endMs: number;
};

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

const toMillis = (value: unknown) => {
    if (!value || typeof value !== 'string') return null;
    const ms = new Date(value).getTime();
    return Number.isFinite(ms) ? ms : null;
};

const toBusyRange = (start: unknown, end: unknown): BusyRange | null => {
    const startMs = toMillis(start);
    const endMs = toMillis(end);
    if (startMs == null || endMs == null || endMs <= startMs) return null;
    return { startMs, endMs };
};

const hasBusyConflict = (slotStartMs: number, slotEndMs: number, ranges: BusyRange[]) => {
    for (const range of ranges) {
        if (range.startMs >= slotEndMs) break;
        if (slotStartMs < range.endMs && slotEndMs > range.startMs) return true;
    }
    return false;
};

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const planKey = searchParams.get('plan_key');
        const dateStr = searchParams.get('date'); // YYYY-MM-DD

        if (!planKey || !dateStr) {
            return NextResponse.json({ error: 'Missing plan_key or date' }, { status: 400 });
        }

        // 1. Fetch package + instructor configuration (only needed columns)
        const { data: pkg, error: pkgError } = await (supabaseAdmin
            .from('service_packages')
            .select('instructor_id, duration_minutes')
            .eq('plan_key', planKey)
            .single() as any);

        if (pkgError || !pkg) {
            console.error('Package fetch error:', pkgError);
            return NextResponse.json({ error: 'Package not found' }, { status: 404 });
        }

        const { data: instructor, error: instructorError } = await supabaseAdmin
            .from('instructors')
            .select('id, is_active, working_days, start_time, end_time, break_start, break_end, min_notice_hours, slot_minutes')
            .eq('id', pkg.instructor_id)
            .single();

        if (instructorError || !instructor) {
            console.error('Instructor fetch error:', instructorError);
            return NextResponse.json({ slots: [] });
        }

        if (!instructor || !instructor.is_active) {
            return NextResponse.json({ slots: [] });
        }

        // 2. Check if working day (using local date components)
        const [year, month, day] = dateStr.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay();
        const workingDays = (instructor.working_days || []).map((d: any) => {
            const num = Number(d);
            return num === 0 ? 7 : num;
        });

        if (!workingDays.includes(dayOfWeek)) {
            return NextResponse.json({ slots: [] });
        }

        // 3. Fetch existing bookings for this instructor on this local day
        const offsetMinutes = getTimeZoneOffsetMinutesForDate(year, month, day, 'America/New_York');
        const dayStartUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMinutes * 60000).toISOString();
        const dayEndUTC = new Date(Date.UTC(year, month - 1, day, 23, 59, 59) - offsetMinutes * 60000).toISOString();

        const [drivingSessionsResult, btwSessionsResult, tenHourSessionsResult] = await Promise.all([
            supabaseAdmin.from('driving_sessions')
                .select('start_time, end_time')
                .eq('instructor_id', instructor.id)
                .neq('status', 'cancelled')
                .gte('start_time', dayStartUTC)
                .lte('start_time', dayEndUTC),
            supabaseAdmin.from('behind_the_wheel_sessions')
                .select('starts_at, ends_at')
                .eq('instructor_id', instructor.id)
                .neq('status', 'cancelled')
                .gte('starts_at', dayStartUTC)
                .lte('starts_at', dayEndUTC),
            supabaseAdmin.from('ten_hour_package_sessions')
                .select('start_time, end_time')
                .eq('instructor_id', instructor.id)
                .neq('status', 'cancelled')
                .gte('start_time', dayStartUTC)
                .lte('start_time', dayEndUTC)
        ]);

        const busyRanges = [
            ...(drivingSessionsResult.data || []).map((s) => toBusyRange(s.start_time, s.end_time)),
            ...(btwSessionsResult.data || []).map((s) => toBusyRange(s.starts_at, s.ends_at)),
            ...(tenHourSessionsResult.data || []).map((s) => toBusyRange(s.start_time, s.end_time))
        ]
            .filter((s): s is BusyRange => !!s)
            .sort((a, b) => a.startMs - b.startMs);

        // 4. Generate slots in UTC
        const slots: string[] = [];

        const startRule = parseClockTime(instructor.start_time || '7:00 AM');
        const endRule = parseClockTime(instructor.end_time || '7:00 PM');

        // Current point in time being evaluated (In UTC)
        let currentSlotMs = toUtcDateFromLocal(year, month, day, startRule.hours, startRule.mins, 0, 'America/New_York').getTime();
        const dayEndLimitMs = toUtcDateFromLocal(year, month, day, endRule.hours, endRule.mins, 0, 'America/New_York').getTime();
        const slotStepMs = (instructor.slot_minutes || 60) * 60_000;
        const durationMs = (pkg.duration_minutes || 60) * 60_000;
        const minNoticeTimeMs = Date.now() + (instructor.min_notice_hours || 12) * 60 * 60 * 1000;

        let breakStartMs: number | null = null;
        let breakEndMs: number | null = null;
        if (instructor.break_start && instructor.break_end) {
            const bStart = parseClockTime(instructor.break_start);
            const bEnd = parseClockTime(instructor.break_end);
            breakStartMs = toUtcDateFromLocal(year, month, day, bStart.hours, bStart.mins, 0, 'America/New_York').getTime();
            breakEndMs = toUtcDateFromLocal(year, month, day, bEnd.hours, bEnd.mins, 0, 'America/New_York').getTime();
        }

        while (currentSlotMs < dayEndLimitMs) {
            const slotEndMs = currentSlotMs + durationMs;

            if (slotEndMs > dayEndLimitMs) break;

            if (currentSlotMs > minNoticeTimeMs) {
                // Conflict check
                const hasConflict = hasBusyConflict(currentSlotMs, slotEndMs, busyRanges);

                // Break check
                const inBreak =
                    breakStartMs != null &&
                    breakEndMs != null &&
                    currentSlotMs < breakEndMs &&
                    breakStartMs < slotEndMs;

                if (!hasConflict && !inBreak) {
                    slots.push(new Date(currentSlotMs).toISOString());
                }
            }

            currentSlotMs += slotStepMs;
        }

        return NextResponse.json({ slots });
    } catch (error: any) {
        console.error('Availability API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
