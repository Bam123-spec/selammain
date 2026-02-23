export function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
    const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const parts = dtf.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
        acc[part.type] = part.value;
        return acc;
    }, {});

    const utcMillis = Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
        Number(parts.second)
    );

    return (utcMillis - date.getTime()) / 60000;
}

export function getTimeZoneOffsetMinutesForDate(year: number, month: number, day: number, timeZone: string): number {
    // Use noon UTC to avoid edge cases around DST transitions at midnight.
    const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    return getTimeZoneOffsetMinutes(noonUtc, timeZone);
}

export function toUtcDateFromLocal(
    year: number,
    month: number,
    day: number,
    hours: number,
    minutes: number,
    seconds: number,
    timeZone: string
): Date {
    const offsetMinutes = getTimeZoneOffsetMinutesForDate(year, month, day, timeZone);
    const utcMillis = Date.UTC(year, month - 1, day, hours, minutes, seconds) - offsetMinutes * 60000;
    return new Date(utcMillis);
}
