import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
    addMinutes,
    isBefore,
    addHours,
} from 'date-fns';
import { getTimeZoneOffsetMinutesForDate, toUtcDateFromLocal } from '@/lib/timezone';
import { hasTimeConflict } from '@/lib/time-overlap';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const planKey = searchParams.get('plan_key');
        const dateStr = searchParams.get('date'); // YYYY-MM-DD

        if (!planKey || !dateStr) {
            return NextResponse.json({ error: 'Missing plan_key or date' }, { status: 400 });
        }

        // 1. Fetch package and instructor rules
        const { data: pkg, error: pkgError } = await (supabaseAdmin
            .from('service_packages')
            .select('instructor_id, duration_minutes, instructors!inner(*)')
            .eq('plan_key', planKey)
            .single() as any);

        if (pkgError || !pkg) {
            console.error('Package fetch error:', pkgError);
            return NextResponse.json({ error: 'Package not found' }, { status: 404 });
        }

        const instructor: any = pkg.instructors;
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

        const allSessions = [
            ...(drivingSessionsResult.data || []).map(s => ({ start: s.start_time, end: s.end_time })),
            ...(btwSessionsResult.data || []).map(s => ({ start: s.starts_at, end: s.ends_at })),
            ...(tenHourSessionsResult.data || []).map(s => ({ start: s.start_time, end: s.end_time }))
        ];

        // 4. Generate slots in UTC
        const slots: string[] = [];

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

        const startRule = parseClockTime(instructor.start_time || '7:00 AM');
        const endRule = parseClockTime(instructor.end_time || '7:00 PM');

        // Current point in time being evaluated (In UTC)
        let currentSlotUTC = toUtcDateFromLocal(year, month, day, startRule.hours, startRule.mins, 0, 'America/New_York');
        const dayEndLimitUTC = toUtcDateFromLocal(year, month, day, endRule.hours, endRule.mins, 0, 'America/New_York');

        const minNoticeTime = addHours(new Date(), instructor.min_notice_hours || 12);
        const durationNeeded = pkg.duration_minutes;

        while (isBefore(currentSlotUTC, dayEndLimitUTC)) {
            const slotEndUTC = addMinutes(currentSlotUTC, durationNeeded);

            if (slotEndUTC > dayEndLimitUTC) break;

            if (isBefore(minNoticeTime, currentSlotUTC)) {
                // Conflict check
                const hasConflict = hasTimeConflict(currentSlotUTC, slotEndUTC, allSessions);

                // Break check
                let inBreak = false;
                if (instructor.break_start && instructor.break_end) {
                    const bStart = parseClockTime(instructor.break_start);
                    const bEnd = parseClockTime(instructor.break_end);
                    const breakStartUTC = toUtcDateFromLocal(year, month, day, bStart.hours, bStart.mins, 0, 'America/New_York');
                    const breakEndUTC = toUtcDateFromLocal(year, month, day, bEnd.hours, bEnd.mins, 0, 'America/New_York');
                    if (currentSlotUTC < breakEndUTC && breakStartUTC < slotEndUTC) {
                        inBreak = true;
                    }
                }

                if (!hasConflict && !inBreak) {
                    slots.push(currentSlotUTC.toISOString());
                }
            }

            currentSlotUTC = addMinutes(currentSlotUTC, instructor.slot_minutes || 60);
        }

        return NextResponse.json({ slots });
    } catch (error: any) {
        console.error('Availability API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
