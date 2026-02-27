type TimeLike = string | Date | null | undefined

type TimeRange = {
    start: TimeLike
    end: TimeLike
}

function toMillis(value: TimeLike): number | null {
    if (!value) return null
    const date = value instanceof Date ? value : new Date(value)
    const ms = date.getTime()
    return Number.isFinite(ms) ? ms : null
}

// Half-open interval check: [start, end)
// Back-to-back slots (end == next start) do not overlap.
export function hasTimeConflict(
    slotStart: Date,
    slotEnd: Date,
    ranges: TimeRange[]
): boolean {
    const slotStartMs = toMillis(slotStart)
    const slotEndMs = toMillis(slotEnd)
    if (slotStartMs == null || slotEndMs == null || slotEndMs <= slotStartMs) return true

    for (const range of ranges) {
        const rangeStartMs = toMillis(range.start)
        const rangeEndMs = toMillis(range.end)
        if (rangeStartMs == null || rangeEndMs == null || rangeEndMs <= rangeStartMs) {
            continue
        }
        if (slotStartMs < rangeEndMs && slotEndMs > rangeStartMs) {
            return true
        }
    }

    return false
}

