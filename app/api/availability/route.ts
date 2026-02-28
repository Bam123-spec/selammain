import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getTimeZoneOffsetMinutesForDate, toUtcDateFromLocal } from '@/lib/timezone';

export const runtime = 'edge';

type BusyRange = {
    startMs: number;
    endMs: number;
};

type HardcodedPlanRule = {
    instructorId: string;
    durationMinutes: number;
    slotMinutes: number;
    workingDays: number[];
    startTime: string;
    endTime: string;
    minNoticeHours: number;
    timezone: string;
    ignoreBreakWindow: boolean;
};

const HARDCODED_PLAN_RULES: Record<string, HardcodedPlanRule> = {
    "driving-practice-1hr": {
        instructorId: "23f41f04-3ee4-4c0f-9c79-c9afd26b3593",
        durationMinutes: 60,
        slotMinutes: 60,
        workingDays: [1, 2, 3, 4, 5, 6, 7], // Mon-Sun
        startTime: "8:00 AM",
        endTime: "6:00 PM",
        minNoticeHours: 12,
        timezone: "America/New_York",
        // Break window is display-only for this hardcoded plan.
        ignoreBreakWindow: true,
    },
    "driving-practice-2hr": {
        instructorId: "510c8aaa-a8d3-43a6-afe2-0af3cd1cf187",
        durationMinutes: 120,
        slotMinutes: 120,
        workingDays: [1, 2, 3, 4, 5, 6, 7], // Mon-Sun
        startTime: "8:00 AM",
        endTime: "6:00 PM",
        minNoticeHours: 12,
        timezone: "America/New_York",
        // Break window is display-only for this hardcoded plan.
        ignoreBreakWindow: true,
    },
    "road-test-escort": {
        instructorId: "0f1331f6-8f01-486b-b99b-69d7b0d82023",
        durationMinutes: 120,
        slotMinutes: 60,
        workingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
        startTime: "8:00 AM",
        endTime: "5:00 PM",
        minNoticeHours: 12,
        timezone: "America/New_York",
        ignoreBreakWindow: false,
    },
    "road-test-1hr": {
        instructorId: "d7bf4096-8999-4875-a16f-80498d7f7b4c",
        durationMinutes: 150,
        slotMinutes: 60,
        workingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
        startTime: "7:00 AM",
        endTime: "7:00 PM",
        minNoticeHours: 12,
        timezone: "America/New_York",
        // Break window is display-only for this plan in current setup.
        ignoreBreakWindow: true,
    },
    "road-test-2hr": {
        instructorId: "36a849ef-1b8e-4ea8-bdec-f2ed757e61b6",
        durationMinutes: 210,
        slotMinutes: 60,
        workingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
        startTime: "7:00 AM",
        endTime: "7:00 PM",
        minNoticeHours: 12,
        timezone: "America/New_York",
        // Break window is display-only for this plan in current setup.
        ignoreBreakWindow: true,
    },
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

const parseDateParts = (value: string | null) => {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;
    return { year, month, day };
};

const pad2 = (value: number) => String(value).padStart(2, '0');

const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${pad2(month)}-${pad2(day)}`;
};

const localDateKeyFromUtc = (date: Date, timezone: string) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);

    const year = Number(parts.find((p) => p.type === 'year')?.value || 0);
    const month = Number(parts.find((p) => p.type === 'month')?.value || 0);
    const day = Number(parts.find((p) => p.type === 'day')?.value || 0);
    return formatDateKey(year, month, day);
};

const buildDateRangeKeys = (from: string, to: string) => {
    const start = parseDateParts(from);
    const end = parseDateParts(to);
    if (!start || !end) return [] as string[];

    const current = new Date(Date.UTC(start.year, start.month - 1, start.day));
    const endDate = new Date(Date.UTC(end.year, end.month - 1, end.day));
    const keys: string[] = [];

    while (current.getTime() <= endDate.getTime()) {
        keys.push(formatDateKey(current.getUTCFullYear(), current.getUTCMonth() + 1, current.getUTCDate()));
        current.setUTCDate(current.getUTCDate() + 1);
    }

    return keys;
};

const hasBusyConflict = (slotStartMs: number, slotEndMs: number, ranges: BusyRange[]) => {
    for (const range of ranges) {
        if (range.startMs >= slotEndMs) break;
        if (slotStartMs < range.endMs && slotEndMs > range.startMs) return true;
    }
    return false;
};

const buildSlots = (args: {
    year: number;
    month: number;
    day: number;
    startTime: string;
    endTime: string;
    slotMinutes: number;
    durationMinutes: number;
    minNoticeHours: number;
    timezone: string;
    busyRanges: BusyRange[];
    breakStart?: string | null;
    breakEnd?: string | null;
    ignoreBreakWindow?: boolean;
}) => {
    const {
        year,
        month,
        day,
        startTime,
        endTime,
        slotMinutes,
        durationMinutes,
        minNoticeHours,
        timezone,
        busyRanges,
        breakStart,
        breakEnd,
        ignoreBreakWindow,
    } = args;

    const slots: string[] = [];
    const startRule = parseClockTime(startTime);
    const endRule = parseClockTime(endTime);

    let currentSlotMs = toUtcDateFromLocal(year, month, day, startRule.hours, startRule.mins, 0, timezone).getTime();
    const dayEndLimitMs = toUtcDateFromLocal(year, month, day, endRule.hours, endRule.mins, 0, timezone).getTime();
    const slotStepMs = Math.max(slotMinutes || 60, 1) * 60_000;
    const durationMs = Math.max(durationMinutes || 60, 1) * 60_000;
    const minNoticeTimeMs = Date.now() + Math.max(minNoticeHours || 0, 0) * 60 * 60 * 1000;

    let breakStartMs: number | null = null;
    let breakEndMs: number | null = null;
    if (!ignoreBreakWindow && breakStart && breakEnd) {
        const bStart = parseClockTime(breakStart);
        const bEnd = parseClockTime(breakEnd);
        breakStartMs = toUtcDateFromLocal(year, month, day, bStart.hours, bStart.mins, 0, timezone).getTime();
        breakEndMs = toUtcDateFromLocal(year, month, day, bEnd.hours, bEnd.mins, 0, timezone).getTime();
    }

    while (currentSlotMs < dayEndLimitMs) {
        const slotEndMs = currentSlotMs + durationMs;
        if (slotEndMs > dayEndLimitMs) break;

        if (currentSlotMs > minNoticeTimeMs) {
            const hasConflict = hasBusyConflict(currentSlotMs, slotEndMs, busyRanges);
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

    return slots;
};

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const planKey = searchParams.get('plan_key');
        const dateStr = searchParams.get('date'); // YYYY-MM-DD
        const dateFrom = searchParams.get('date_from'); // YYYY-MM-DD
        const dateTo = searchParams.get('date_to'); // YYYY-MM-DD
        const isRangeRequest = !!dateFrom && !!dateTo;

        if (!planKey || (!dateStr && !isRangeRequest)) {
            return NextResponse.json({ error: 'Missing plan_key and date/date range' }, { status: 400 });
        }

        const hardcodedRule = HARDCODED_PLAN_RULES[planKey];
        if (hardcodedRule) {
            if (isRangeRequest && dateFrom && dateTo) {
                const dateKeys = buildDateRangeKeys(dateFrom, dateTo);
                if (dateKeys.length === 0) {
                    return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
                }

                const firstDate = parseDateParts(dateKeys[0]);
                const lastDate = parseDateParts(dateKeys[dateKeys.length - 1]);
                if (!firstDate || !lastDate) {
                    return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
                }

                const firstOffsetMinutes = getTimeZoneOffsetMinutesForDate(firstDate.year, firstDate.month, firstDate.day, hardcodedRule.timezone);
                const lastOffsetMinutes = getTimeZoneOffsetMinutesForDate(lastDate.year, lastDate.month, lastDate.day, hardcodedRule.timezone);
                const rangeStartUTC = new Date(Date.UTC(firstDate.year, firstDate.month - 1, firstDate.day, 0, 0, 0) - firstOffsetMinutes * 60000).toISOString();
                const rangeEndUTC = new Date(Date.UTC(lastDate.year, lastDate.month - 1, lastDate.day, 23, 59, 59) - lastOffsetMinutes * 60000).toISOString();

                const { data: takenSessions, error: takenSessionsError } = await supabaseAdmin
                    .from('driving_sessions')
                    .select('start_time, end_time')
                    .eq('instructor_id', hardcodedRule.instructorId)
                    .neq('status', 'cancelled')
                    .gte('start_time', rangeStartUTC)
                    .lte('start_time', rangeEndUTC);

                if (takenSessionsError) {
                    console.error('Taken sessions range fetch error:', takenSessionsError);
                    return NextResponse.json({ error: 'Failed to load availability' }, { status: 500 });
                }

                const busyByDate = new Map<string, BusyRange[]>();
                for (const session of (takenSessions || [])) {
                    const range = toBusyRange(session.start_time, session.end_time);
                    if (!range) continue;
                    const localDateKey = localDateKeyFromUtc(new Date(range.startMs), hardcodedRule.timezone);
                    const list = busyByDate.get(localDateKey) || [];
                    list.push(range);
                    busyByDate.set(localDateKey, list);
                }

                const slotsByDate: Record<string, string[]> = {};
                for (const key of dateKeys) {
                    const parts = parseDateParts(key);
                    if (!parts) continue;

                    const dateObj = new Date(parts.year, parts.month - 1, parts.day);
                    const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay();
                    if (!hardcodedRule.workingDays.includes(dayOfWeek)) {
                        slotsByDate[key] = [];
                        continue;
                    }

                    const busyRanges = (busyByDate.get(key) || []).sort((a, b) => a.startMs - b.startMs);
                    slotsByDate[key] = buildSlots({
                        year: parts.year,
                        month: parts.month,
                        day: parts.day,
                        startTime: hardcodedRule.startTime,
                        endTime: hardcodedRule.endTime,
                        slotMinutes: hardcodedRule.slotMinutes,
                        durationMinutes: hardcodedRule.durationMinutes,
                        minNoticeHours: hardcodedRule.minNoticeHours,
                        timezone: hardcodedRule.timezone,
                        busyRanges,
                        ignoreBreakWindow: hardcodedRule.ignoreBreakWindow,
                    });
                }

                return NextResponse.json({ slots_by_date: slotsByDate });
            }

            const parsedDate = parseDateParts(dateStr);
            if (!parsedDate) {
                return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
            }

            const { year, month, day } = parsedDate;
            const dateObj = new Date(year, month - 1, day);
            const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay();

            if (!hardcodedRule.workingDays.includes(dayOfWeek)) {
                return NextResponse.json({ slots: [] });
            }

            const offsetMinutes = getTimeZoneOffsetMinutesForDate(year, month, day, hardcodedRule.timezone);
            const dayStartUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMinutes * 60000).toISOString();
            const dayEndUTC = new Date(Date.UTC(year, month - 1, day, 23, 59, 59) - offsetMinutes * 60000).toISOString();

            // Fast path: only query already-booked sessions for the dedicated instructor.
            const { data: takenSessions, error: takenSessionsError } = await supabaseAdmin
                .from('driving_sessions')
                .select('start_time, end_time')
                .eq('instructor_id', hardcodedRule.instructorId)
                .neq('status', 'cancelled')
                .gte('start_time', dayStartUTC)
                .lte('start_time', dayEndUTC);

            if (takenSessionsError) {
                console.error('Taken sessions fetch error:', takenSessionsError);
                return NextResponse.json({ error: 'Failed to load availability' }, { status: 500 });
            }

            const busyRanges = (takenSessions || [])
                .map((s) => toBusyRange(s.start_time, s.end_time))
                .filter((s): s is BusyRange => !!s)
                .sort((a, b) => a.startMs - b.startMs);

            const slots = buildSlots({
                year,
                month,
                day,
                startTime: hardcodedRule.startTime,
                endTime: hardcodedRule.endTime,
                slotMinutes: hardcodedRule.slotMinutes,
                durationMinutes: hardcodedRule.durationMinutes,
                minNoticeHours: hardcodedRule.minNoticeHours,
                timezone: hardcodedRule.timezone,
                busyRanges,
                ignoreBreakWindow: hardcodedRule.ignoreBreakWindow,
            });

            return NextResponse.json({ slots });
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

        const timezone = 'America/New_York';
        const workingDays = (instructor.working_days || []).map((d: any) => {
            const num = Number(d);
            return num === 0 ? 7 : num;
        });

        if (isRangeRequest && dateFrom && dateTo) {
            const dateKeys = buildDateRangeKeys(dateFrom, dateTo);
            if (dateKeys.length === 0) {
                return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
            }

            const firstDate = parseDateParts(dateKeys[0]);
            const lastDate = parseDateParts(dateKeys[dateKeys.length - 1]);
            if (!firstDate || !lastDate) {
                return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });
            }

            const firstOffsetMinutes = getTimeZoneOffsetMinutesForDate(firstDate.year, firstDate.month, firstDate.day, timezone);
            const lastOffsetMinutes = getTimeZoneOffsetMinutesForDate(lastDate.year, lastDate.month, lastDate.day, timezone);
            const rangeStartUTC = new Date(Date.UTC(firstDate.year, firstDate.month - 1, firstDate.day, 0, 0, 0) - firstOffsetMinutes * 60000).toISOString();
            const rangeEndUTC = new Date(Date.UTC(lastDate.year, lastDate.month - 1, lastDate.day, 23, 59, 59) - lastOffsetMinutes * 60000).toISOString();

            const [drivingSessionsResult, btwSessionsResult, tenHourSessionsResult] = await Promise.all([
                supabaseAdmin.from('driving_sessions')
                    .select('start_time, end_time')
                    .eq('instructor_id', instructor.id)
                    .neq('status', 'cancelled')
                    .gte('start_time', rangeStartUTC)
                    .lte('start_time', rangeEndUTC),
                supabaseAdmin.from('behind_the_wheel_sessions')
                    .select('starts_at, ends_at')
                    .eq('instructor_id', instructor.id)
                    .neq('status', 'cancelled')
                    .gte('starts_at', rangeStartUTC)
                    .lte('starts_at', rangeEndUTC),
                supabaseAdmin.from('ten_hour_package_sessions')
                    .select('start_time, end_time')
                    .eq('instructor_id', instructor.id)
                    .neq('status', 'cancelled')
                    .gte('start_time', rangeStartUTC)
                    .lte('start_time', rangeEndUTC)
            ]);

            const busyByDate = new Map<string, BusyRange[]>();
            const allRanges = [
                ...(drivingSessionsResult.data || []).map((s) => toBusyRange(s.start_time, s.end_time)),
                ...(btwSessionsResult.data || []).map((s) => toBusyRange(s.starts_at, s.ends_at)),
                ...(tenHourSessionsResult.data || []).map((s) => toBusyRange(s.start_time, s.end_time)),
            ].filter((s): s is BusyRange => !!s);

            for (const range of allRanges) {
                const key = localDateKeyFromUtc(new Date(range.startMs), timezone);
                const list = busyByDate.get(key) || [];
                list.push(range);
                busyByDate.set(key, list);
            }

            const slotsByDate: Record<string, string[]> = {};
            for (const key of dateKeys) {
                const parsed = parseDateParts(key);
                if (!parsed) continue;

                const dateObj = new Date(parsed.year, parsed.month - 1, parsed.day);
                const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay();
                if (!workingDays.includes(dayOfWeek)) {
                    slotsByDate[key] = [];
                    continue;
                }

                const busyRanges = (busyByDate.get(key) || []).sort((a, b) => a.startMs - b.startMs);
                slotsByDate[key] = buildSlots({
                    year: parsed.year,
                    month: parsed.month,
                    day: parsed.day,
                    startTime: instructor.start_time || '7:00 AM',
                    endTime: instructor.end_time || '7:00 PM',
                    slotMinutes: instructor.slot_minutes || 60,
                    durationMinutes: pkg.duration_minutes || 60,
                    minNoticeHours: instructor.min_notice_hours || 12,
                    timezone,
                    busyRanges,
                    breakStart: instructor.break_start,
                    breakEnd: instructor.break_end,
                    ignoreBreakWindow: false,
                });
            }

            return NextResponse.json({ slots_by_date: slotsByDate });
        }

        if (!dateStr) {
            return NextResponse.json({ error: 'Date is required for this service' }, { status: 400 });
        }

        const parsedDate = parseDateParts(dateStr);
        if (!parsedDate) {
            return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
        }

        const { year, month, day } = parsedDate;
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay();

        // 2. Check if working day (using local date components)
        if (!workingDays.includes(dayOfWeek)) {
            return NextResponse.json({ slots: [] });
        }

        // 3. Fetch existing bookings for this instructor on this local day
        const offsetMinutes = getTimeZoneOffsetMinutesForDate(year, month, day, timezone);
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
        const slots = buildSlots({
            year,
            month,
            day,
            startTime: instructor.start_time || '7:00 AM',
            endTime: instructor.end_time || '7:00 PM',
            slotMinutes: instructor.slot_minutes || 60,
            durationMinutes: pkg.duration_minutes || 60,
            minNoticeHours: instructor.min_notice_hours || 12,
            timezone,
            busyRanges,
            breakStart: instructor.break_start,
            breakEnd: instructor.break_end,
            ignoreBreakWindow: false,
        });

        return NextResponse.json({ slots });
    } catch (error: any) {
        console.error('Availability API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
