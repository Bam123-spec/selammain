"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getClasses } from "@/app/actions/classes"
import { ClassBookingList } from "@/components/sections/class-booking-list"

interface RawClassSession {
    id: string
    name: string
    start_date: string
    end_date: string
    time_slot?: string
    daily_start_time?: string
    daily_end_time?: string
    price?: number | string | null
    classification?: string | null
    status?: string
}

interface DisplayClassSession {
    id: string
    name: string
    start_date: string
    end_date: string
    time_slot?: string
    daily_start_time?: string
    daily_end_time?: string
    price: number
    status: string
    type?: string
}

type DeClassification = "morning" | "evening" | "weekend"

function normalizeClassification(value: string | null): DeClassification {
    const v = (value || "").toLowerCase()
    if (v === "evening") return "evening"
    if (v === "weekend") return "weekend"
    return "morning"
}

function matchesClassification(session: RawClassSession, classification: DeClassification) {
    const explicitClassification = typeof session.classification === "string"
        ? session.classification.toLowerCase()
        : ""
    const name = typeof session.name === "string" ? session.name.toLowerCase() : ""
    const startTime = typeof session.daily_start_time === "string" ? session.daily_start_time : ""
    const startDate = typeof session.start_date === "string" ? session.start_date : ""

    const parsedStartDate = startDate ? new Date(`${startDate}T00:00:00`) : null
    const startsOnWeekend =
        !!parsedStartDate &&
        !Number.isNaN(parsedStartDate.getTime()) &&
        (parsedStartDate.getDay() === 0 || parsedStartDate.getDay() === 6)

    const looksWeekend =
        explicitClassification.includes("weekend") ||
        name.includes("weekend") ||
        startsOnWeekend ||
        startTime.startsWith("10") ||
        name.includes("5 week")

    // Prefer explicit classification from DB when available, but keep name/time heuristics
    // to support older rows that may not have classification populated consistently.
    if (classification === "weekend") {
        return looksWeekend || explicitClassification.includes("weekend")
    }

    // Guard against weekend classes mislabeled as "evening" in old rows.
    if (looksWeekend) return false

    if (explicitClassification.includes(classification)) return true

    if (classification === "morning") {
        return startTime.startsWith("09") || name.includes("morning")
    }
    if (classification === "evening") {
        return startTime.startsWith("17") || startTime.startsWith("18") || name.includes("evening")
    }
    return looksWeekend
}

function defaultPriceFor(classification: DeClassification) {
    return classification === "weekend" ? 450 : 390
}

export default function DriversEducationScheduleContent() {
    const searchParams = useSearchParams()
    const classification = normalizeClassification(searchParams.get("classification"))
    const location = (searchParams.get("location") || "").toLowerCase() || null

    const [classes, setClasses] = useState<DisplayClassSession[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let active = true

        const fetchClasses = async () => {
            setLoading(true)
            setError(null)

            try {
                // Fetch DE schedules from Supabase through the shared server action.
                const allDeClasses = await getClasses("DE")
                if (!active) return

                const fallbackPrice = defaultPriceFor(classification)

                const filtered = (allDeClasses || [])
                    .filter((session: RawClassSession) => matchesClassification(session, classification))
                    .map((session: RawClassSession): DisplayClassSession => {
                        const numericPrice = Number(session?.price)
                        return {
                            ...session,
                            name: location === "bethesda" ? `Bethesda ${session?.name || "Driver's Ed"}` : (session?.name || "Driver's Ed"),
                            price: Number.isFinite(numericPrice) && numericPrice > 0 ? numericPrice : fallbackPrice,
                            status: typeof session?.status === "string" ? session.status : "upcoming",
                            time_slot: typeof session?.time_slot === "string" ? session.time_slot : "",
                            daily_start_time: typeof session?.daily_start_time === "string" ? session.daily_start_time : undefined,
                            daily_end_time: typeof session?.daily_end_time === "string" ? session.daily_end_time : undefined,
                        }
                    })

                setClasses(filtered)
            } catch (err: any) {
                console.error("Failed to load Driver's Ed classes:", err)
                if (!active) return
                setError(err?.message || "Failed to load class schedules.")
                setClasses([])
            } finally {
                if (active) setLoading(false)
            }
        }

        fetchClasses()

        return () => {
            active = false
        }
    }, [classification, location])

    const locationPrefix = location === "bethesda" ? "Bethesda " : ""
    const displayTitle = classification === "morning"
        ? `${locationPrefix}Driver's Ed (Morning)`
        : classification === "evening"
            ? `${locationPrefix}Driver's Ed (Evening)`
            : `${locationPrefix}Driver's Ed (Weekend)`

    if (loading) {
        return (
            <div className="flex justify-center py-20 bg-white min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-[#FDB813]" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white py-16 px-4">
                <div className="max-w-xl mx-auto text-center text-red-500 bg-red-50 rounded-xl border border-red-100 p-8">
                    <AlertCircle className="h-10 w-10 mx-auto mb-4 opacity-50" />
                    <p className="font-bold text-lg mb-2">Error Loading Schedules</p>
                    <p className="text-sm mb-6">{error}</p>
                    <Button
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-100"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <ClassBookingList
            classes={classes}
            title={displayTitle}
            location={location}
            classification={classification}
        />
    )
}
