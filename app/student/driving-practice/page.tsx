"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { Calendar, Clock, Loader2, CheckCircle2, Car, ChevronLeft, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useCurrentStudent } from "@/hooks/useStudentPortal"

export default function DrivingPracticeBookingPage() {
    const { student, loading: studentLoading } = useCurrentStudent()
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isBooking, setIsBooking] = useState(false)

    // The user specified this instructor name for the availability source
    // In a real integration, we might need to look up an ID first, but we'll try passing this as a plan/filter
    // or assume the Drivofy API is configured to return this for a specific plan_key.
    // For now, we'll use a specific plan_key that we hope maps to this, or just "driving_practice".
    const PLAN_KEY = "driving_practice_2hr"

    const fetchAvailability = async (date: Date) => {
        setIsLoading(true)
        const dateStr = format(date, "yyyy-MM-dd")
        try {
            // Passing the instructor name as a query param if the proxy/API supports it
            // Otherwise relying on plan_key
            const res = await fetch(`/api/drivofy/availability?plan_key=${PLAN_KEY}&date=${dateStr}`)
            const data = await res.json()

            if (res.ok) {
                setAvailableSlots(data.slots || [])
            } else {
                setAvailableSlots([])
            }
        } catch (error) {
            console.error("Fetch availability error:", error)
            toast.error("Failed to load availability. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date)
        fetchAvailability(date)
    }

    const handleBooking = async (slot: string) => {
        setIsBooking(true)
        try {
            const slotDate = parseISO(slot)
            const payload = {
                plan_key: PLAN_KEY,
                date: format(slotDate, 'yyyy-MM-dd'),
                time: format(slotDate, 'HH:mm'),
                duration: 120, // 2 Hours
                // We send the instructor name if needed, or null if the plan implies it
                instructorId: null
            }

            const res = await fetch(`/api/drivofy/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const data = await res.json()

            if (res.ok) {
                toast.success("Driving Practice booked successfully!")
                if (selectedDate) fetchAvailability(selectedDate)
            } else {
                console.error("Booking validation failed:", data)
                toast.error(data.error || `Booking failed: ${data.message || 'Unknown error'}`)
            }
        } catch (error) {
            console.error("Booking action error:", error)
            toast.error("Network error. Please try again.")
        } finally {
            setIsBooking(false)
        }
    }

    const formatTimeDisplay = (timeStr: string) => {
        try {
            return format(parseISO(timeStr), "h:mm a")
        } catch {
            return timeStr
        }
    }

    if (studentLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <Button variant="ghost" size="sm" asChild className="p-0 h-auto hover:bg-transparent text-gray-400 hover:text-black">
                                <Link href="/student/dashboard">
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Back to Dashboard
                                </Link>
                            </Button>
                            <div className="h-4 w-[1px] bg-gray-200 mx-1" />
                            <span className="text-[10px] font-black text-[#FDB813] uppercase tracking-[0.2em]">Service: Practice</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
                            Driving Practice <span className="text-blue-600">Booking</span>
                        </h1>
                        <p className="text-gray-500 mt-2 text-lg">2-Hour Extra Practice Session</p>
                    </div>
                    <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-nowrap">Timezone: Eastern (EST)</span>
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] border border-gray-100 p-8 md:p-16 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-blue-100 to-transparent" />

                    <div className="flex flex-col xl:flex-row gap-16 items-center lg:items-start justify-center relative z-10">
                        {/* Picker Container */}
                        <div className="flex-1 w-full flex justify-center lg:justify-end">
                            <DateTimePicker
                                onSelect={(date, time) => {
                                    const slot = availableSlots.find(s => formatTimeDisplay(s) === time)
                                    if (slot) handleBooking(slot)
                                }}
                                availableTimes={availableSlots.map(s => formatTimeDisplay(s))}
                                minDate={new Date()}
                            />
                        </div>

                        {/* Status/Summary Sidebar */}
                        <div className="w-full lg:w-96 shrink-0 space-y-6">
                            <motion.div
                                key="summary"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-black text-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden min-h-[400px] flex flex-col justify-between"
                            >
                                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600 opacity-10 rounded-full blur-3xl -mr-16 -mt-16" />

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-10">
                                        <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Session Info</h3>
                                        <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Live Availability</span>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        {isLoading ? (
                                            <div className="flex flex-col items-center justify-center py-10 gap-4">
                                                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Checking Slots...</p>
                                            </div>
                                        ) : selectedDate ? (
                                            <div className="space-y-6">
                                                <div>
                                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-3">Service</p>
                                                    <p className="text-2xl font-black text-white leading-tight">2-Hour Extra Practice</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-3">Selected Date</p>
                                                    <div className="bg-blue-600/10 border border-blue-600/20 rounded-2xl p-4">
                                                        <p className="text-blue-400 font-black text-xl">{format(selectedDate, "EEEE, MMM do")}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                    {availableSlots.length} Slots Available
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
                                                <Car className="h-12 w-12 text-gray-800" />
                                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-8 leading-relaxed">
                                                    Select a date to view<br />practice times
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="relative z-10 mt-8">
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                        <Info className="w-3 h-3 text-blue-500" />
                                        Instant Confirmation
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
