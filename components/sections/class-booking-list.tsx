"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns/format"
import { parseISO } from "date-fns/parseISO"
import { differenceInWeeks } from "date-fns/differenceInWeeks"
import { Loader2, ChevronRight, AlertCircle } from "lucide-react"

interface ClassSession {
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

export function ClassBookingList({
    classes,
    title,
    location,
    classification,
}: {
    classes: ClassSession[],
    title: string,
    location?: string | null,
    classification?: string
}) {
    const [loading, setLoading] = useState(false)
    const [limit, setLimit] = useState(4)
    const [bookingLoading, setBookingLoading] = useState<string | null>(null)

    const visibleClasses = classes.slice(0, limit)
    const hasMore = classes.length > limit

    const handleLoadMore = () => {
        setLimit(prev => prev + 4)
    }

    const formatTime = (timeStr?: string) => {
        try {
            if (!timeStr) return ""
            const parts = timeStr.split(':')
            if (parts.length < 2) return timeStr
            const [hours, minutes] = parts
            const date = new Date()
            date.setHours(parseInt(hours))
            date.setMinutes(parseInt(minutes))
            return format(date, 'h:mm a')
        } catch (e) {
            console.error("Error formatting time:", timeStr, e)
            return timeStr
        }
    }

    const getWeeksAway = (dateStr: string) => {
        try {
            const weeks = differenceInWeeks(parseISO(dateStr), new Date())
            if (weeks <= 0) return "next week"
            if (weeks === 1) return "in 1 week"
            return `in ${weeks} weeks`
        } catch (e) {
            console.error("Error calculating weeks away:", dateStr, e)
            return "coming soon"
        }
    }

    const formatDisplayDate = (dateStr?: string) => {
        try {
            if (!dateStr) return "Date TBA"
            return format(parseISO(dateStr), 'EEEE, MMMM do, yyyy')
        } catch (e) {
            console.error("Error formatting class date:", dateStr, e)
            return "Date TBA"
        }
    }

    const handleBook = async (session: ClassSession) => {
        // Driver's Ed now requires student details before payment; route through intake first.
        window.location.href = `/enroll/${session.id}/intake`
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Header */}
            <section className="bg-white pt-10 pb-6 border-b">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col items-center text-center mb-8">
                        <h1 className="text-2xl font-bold mb-2 text-gray-900">Selam Driving School</h1>
                        <h2 className="text-xl text-gray-700">Select {title} Class</h2>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center max-w-4xl mx-auto text-sm text-gray-600">
                        <div className="flex items-center gap-2 mb-4 md:mb-0">
                            <span>Quantity:</span>
                            <div className="border rounded px-3 py-1">1</div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="uppercase text-xs font-bold tracking-wider">
                                Time Zone: <span className="underline decoration-dotted">Eastern Time (GMT-05:00)</span>
                            </div>
                            {hasMore && (
                                <div
                                    className="flex items-center gap-1 font-bold cursor-pointer hover:text-[#FDB813]"
                                    onClick={handleLoadMore}
                                >
                                    MORE TIMES <ChevronRight className="h-4 w-4" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Class List */}
            <section className="py-8 bg-white flex-grow">
                <div className="container mx-auto px-4 max-w-4xl">
                    {classes.length === 0 ? (
                        <div className="text-center py-20 text-gray-500">
                            No upcoming {title} classes available at the moment. Please check back later.
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {visibleClasses.map((session) => {
                                const startTimeDisplay = session.daily_start_time ? formatTime(session.daily_start_time) : session.time_slot?.split('-')[0] || "TBA"
                                const endTimeDisplay = session.daily_end_time ? formatTime(session.daily_end_time) : session.time_slot?.split('-')[1] || "TBA"

                                return (
                                    <div key={session.id} className="border-b pb-8 last:border-0">
                                    <div className="bg-gray-100 p-3 flex justify-between items-center font-medium text-gray-700 mb-6">
                                            <span>{formatDisplayDate(session.start_date)}</span>
                                            <span className="uppercase text-xs tracking-wider font-bold text-gray-500">
                                                {session.start_date ? getWeeksAway(session.start_date) : "Coming Soon"}
                                            </span>
                                    </div>

                                        <div className="flex flex-col md:flex-row gap-6">
                                            <div className="flex-grow">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h3 className="text-2xl font-semibold text-gray-900 font-[family-name:var(--font-pontano)] leading-none">
                                                        {startTimeDisplay}
                                                    </h3>
                                                    <Button
                                                        className="bg-[#27ae60] hover:bg-[#219150] text-white font-bold py-4 px-6 rounded-none uppercase tracking-wider min-w-[100px]"
                                                        onClick={() => handleBook(session)}
                                                        disabled={bookingLoading === session.id}
                                                    >
                                                        {bookingLoading === session.id ? (
                                                            <Loader2 className="h-5 w-5 animate-spin" />
                                                        ) : (
                                                            "Book"
                                                        )}
                                                    </Button>
                                                </div>

                                                <h4 className="text-lg font-normal text-gray-900 mb-1">
                                                    {session.name}
                                                </h4>
                                                <div className="text-gray-500 font-light mb-4 text-sm">
                                                    2-week session @ ${session.price || "390"}.00
                                                </div>

                                                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                                    {location === 'bethesda'
                                                        ? "Our premium Bethesda Driver's Education program covers all necessary theory and safety regulations for our local community."
                                                        : "Our comprehensive Driver's Education program covers all necessary theory and safety regulations."
                                                    }
                                                    {" "}This session runs from {startTimeDisplay} to {endTimeDisplay}, Monday through Friday for two weeks.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {hasMore && (
                        <div className="flex justify-center mt-8">
                            <Button
                                variant="outline"
                                onClick={handleLoadMore}
                                className="border-gray-300 hover:bg-gray-50 text-gray-900 font-bold uppercase tracking-wider rounded-none"
                            >
                                More Times <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
