"use client"

import { useState, useEffect } from "react"
import { format, parseISO, addHours } from "date-fns"
import { supabase } from "@/lib/supabaseClient"
import { Calendar, Clock, Lock, Timer, ChevronLeft, Loader2, CheckCircle2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useCurrentStudent, useStudentDashboardData } from "@/hooks/useStudentPortal"
import { useRouter, useSearchParams } from "next/navigation"

export const dynamic = 'force-dynamic'

export default function BtwBookingPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { student, loading: studentLoading } = useCurrentStudent()
    const { enrollments, btwAllocation, loading: enrollmentsLoading } = useStudentDashboardData()
    const rescheduleId = searchParams.get('reschedule')
    const isRescheduleMode = Boolean(rescheduleId)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [rescheduleSession, setRescheduleSession] = useState<any | null>(null)
    const [eligibility, setEligibility] = useState<{
        status: 'eligible' | 'no_credits' | 'cooldown' | 'idle'
        reason?: string
        nextAvailableAt?: string
    }>({ status: 'idle' })
    const [isLoading, setIsLoading] = useState(false)
    const [isBooking, setIsBooking] = useState(false)

    // Check Eligibility via Internal Profile Data
    const hasDriversEd = enrollments.some(e => {
        const cls = Array.isArray(e.classes) ? e.classes[0] : e.classes;
        const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
        return cls?.class_type === 'DE' || course?.type === 'drivers_ed';
    });
    const hasPassedDriversEd = enrollments.some(e => {
        const cls = Array.isArray(e.classes) ? e.classes[0] : e.classes;
        const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
        const isDE = cls?.class_type === 'DE' || course?.type === 'drivers_ed';
        const numericGrade = Number((e as any).grade ?? (e as any).final_grade);
        return isDE && (e.status === 'completed' || (!Number.isNaN(numericGrade) && numericGrade >= 80) || e.btw_credits_granted);
    });
    const showBtw = (student?.btw_access_enabled || hasPassedDriversEd) && hasDriversEd;

    useEffect(() => {
        if (!studentLoading && !enrollmentsLoading && student && !showBtw) {
            router.push('/student/dashboard')
            toast.error("You are not eligible for Behind-the-Wheel booking yet.")
        }
    }, [studentLoading, enrollmentsLoading, student, showBtw, router])

    useEffect(() => {
        if (!student || !showBtw) return

        if (isRescheduleMode) {
            setEligibility({ status: 'eligible' })
            return
        }

        // Check Cooldown
        if (student.btw_cooldown_until) {
            const cooldownUntil = new Date(student.btw_cooldown_until)
            if (cooldownUntil > new Date()) {
                setEligibility({
                    status: 'cooldown',
                    nextAvailableAt: student.btw_cooldown_until
                })
                return
            }
        }

        const profileCredits = student.driving_balance_sessions || 0
        const allocationCredits = Math.max(
            0,
            (btwAllocation?.total_included_sessions || 3) - (btwAllocation?.sessions_used || 0)
        )
        const hasCredits = profileCredits > 0 || (hasPassedDriversEd && allocationCredits > 0)
        if (!hasCredits) {
            setEligibility({ status: 'no_credits' })
            return
        }

        // 3. Eligible
        setEligibility({ status: 'eligible' })

    }, [student, showBtw, isRescheduleMode, hasPassedDriversEd, btwAllocation])

    useEffect(() => {
        const loadRescheduleSession = async () => {
            if (!isRescheduleMode) return
            const { data: { user } } = await supabase.auth.getUser()
            if (!user || !rescheduleId) return

            const { data, error } = await supabase
                .from('behind_the_wheel_sessions')
                .select('*')
                .eq('id', rescheduleId)
                .eq('student_id', user.id)
                .single()

            if (error || !data) {
                toast.error("Could not load that session for rescheduling.")
                router.push('/student/dashboard')
                return
            }

            setRescheduleSession(data)
            const existingDate = new Date(data.starts_at)
            setSelectedDate(existingDate)
        }

        loadRescheduleSession()
    }, [isRescheduleMode, rescheduleId, router])

    // Load initial availability if eligible
    useEffect(() => {
        if (selectedDate && eligibility.status === 'eligible') {
            fetchAvailability(selectedDate)
        }
    }, [selectedDate, eligibility.status])

    const fetchAvailability = async (date: Date) => {
        setIsLoading(true)
        try {
            const dateStr = format(date, "yyyy-MM-dd")
            const response = await fetch(`/api/availability?plan_key=btw&date=${dateStr}`)
            const data = await response.json()

            if (data.slots) {
                setAvailableSlots(data.slots)
            } else {
                toast.error(data.error || "Failed to load availability.")
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
        setSelectedTime(null)
        fetchAvailability(date)
    }

    const handleBooking = async (slot: string) => {
        setIsBooking(true)
        try {
            // Get auth token for API call
            const { data: { session } } = await supabase.auth.getSession()

            if (!session?.access_token) {
                toast.error("Authentication required")
                router.push('/student/login')
                return
            }

            const endpoint = isRescheduleMode ? '/api/reschedule-btw' : '/api/book-btw'
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(isRescheduleMode ? { sessionId: rescheduleId, slot } : { slot, planKey: 'btw' })
            })

            const result = await response.json()

            if (result.success) {
                toast.success(isRescheduleMode ? "Rescheduled successfully!" : "Booked successfully!")
                router.push('/student/dashboard?refresh=true')
            } else {
                console.error("Booking failed:", result.error)
                toast.error(result.error || "Booking failed")
            }
        } catch (error) {
            console.error("Booking API error:", error)
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

    const formatTimeRange = (timeStr: string) => {
        try {
            const start = parseISO(timeStr)
            const end = addHours(start, 2)
            return `${format(start, "h:mm a")} - ${format(end, "h:mm a")}`
        } catch {
            return timeStr
        }
    }

    const formatCooldownDate = (dateStr: string) => {
        try {
            return format(parseISO(dateStr), "MMMM do, h:mm a")
        } catch {
            return dateStr
        }
    }

    if (studentLoading || enrollmentsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
            </div>
        )
    }

    if (!showBtw) return null;

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
                            <span className="text-[10px] font-black text-[#FDB813] uppercase tracking-[0.2em]">Service: BTW</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
                            Behind-the-Wheel <span className="text-blue-600">{isRescheduleMode ? "Reschedule" : "Booking"}</span>
                        </h1>
                        <p className="text-gray-500 mt-2 text-lg">
                            {isRescheduleMode ? "Choose a new time for your session." : "Schedule your next driving session below."}
                        </p>
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
                                onDateChange={handleDateSelect}
                                onSelect={(date, time) => {
                                    const slot = availableSlots.find(s => formatTimeDisplay(s) === time)
                                    if (slot) setSelectedTime(slot)
                                }}
                                availableTimes={availableSlots.map(s => formatTimeDisplay(s))}
                                minDate={new Date()}
                                isLoading={isLoading}
                                selectedDate={selectedDate}
                                selectedTime={selectedTime ? formatTimeDisplay(selectedTime) : null}
                            />
                        </div>

                        {/* Status/Summary Sidebar */}
                        <div className="w-full lg:w-96 shrink-0 space-y-6">
                            <AnimatePresence mode="wait">
                                {eligibility.status === 'no_credits' ? (
                                    <motion.div
                                        key="no_credits"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-amber-50 border border-amber-200 rounded-[2rem] p-8 flex flex-col items-center text-center space-y-4 shadow-sm"
                                    >
                                        <div className="h-16 w-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 mb-2">
                                            <Lock className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-black text-amber-900 uppercase tracking-tight leading-tight">Eligibility Required</h3>
                                        <p className="text-sm font-medium text-amber-800 leading-relaxed italic">
                                            You are not eligible to book BTW yet. Complete Driver&apos;s Ed Theory (80%+) or contact the office.
                                        </p>
                                    </motion.div>
                                ) : eligibility.status === 'cooldown' ? (
                                    <motion.div
                                        key="cooldown"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-blue-50 border border-blue-200 rounded-[2rem] p-8 flex flex-col items-center text-center space-y-4 shadow-sm"
                                    >
                                        <div className="h-16 w-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
                                            <Timer className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-black text-blue-900 uppercase tracking-tight leading-tight">Cooldown Active</h3>
                                        <p className="text-sm font-medium text-blue-800 leading-relaxed">
                                            You can book again after <span className="font-black block text-blue-600 mt-1">{formatCooldownDate(eligibility.nextAvailableAt || "")}</span>
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="summary"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm h-full flex flex-col justify-between min-h-[400px]"
                                    >
                                        <div className="space-y-8">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Session Summary</h3>
                                                {selectedDate && (
                                                    <div className="px-3 py-1 bg-green-50 rounded-full border border-green-100">
                                                        <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Selected</span>
                                                    </div>
                                                )}
                                            </div>

                                            {isLoading ? (
                                                <div className="flex flex-col items-center justify-center py-10 gap-4">
                                                    <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Checking Availability...</p>
                                                </div>
                                            ) : selectedDate ? (
                                                <div className="space-y-6">
                                                    {isRescheduleMode && rescheduleSession && (
                                                        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Current Session</p>
                                                            <p className="text-sm font-bold text-blue-900">
                                                                {format(new Date(rescheduleSession.starts_at), "MMM do, yyyy")} • {format(new Date(rescheduleSession.starts_at), "h:mm a")}
                                                            </p>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Service</p>
                                                        <p className="text-xl font-black text-gray-900 leading-tight">Behind-the-Wheel Training</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Date</p>
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                                                <Calendar className="w-5 h-5" />
                                                            </div>
                                                            <p className="text-blue-900 font-bold text-lg">{format(selectedDate, "MMM do, yyyy")}</p>
                                                        </div>
                                                    </div>

                                                    {selectedTime && (
                                                        <div>
                                                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Time (2 Hours)</p>
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                                                    <Clock className="w-5 h-5" />
                                                                </div>
                                                                <p className="text-blue-900 font-bold text-lg">{formatTimeRange(selectedTime)}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {!selectedTime && (
                                                        <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-bold uppercase tracking-widest bg-emerald-50 w-fit px-3 py-2 rounded-lg">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            {availableSlots.length} Slots Open
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-12 gap-6 text-center opacity-50">
                                                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
                                                        <Calendar className="h-8 w-8" />
                                                    </div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-8 leading-relaxed">
                                                        Select a date to view<br />availability details
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-8 pt-8 border-t border-gray-50 space-y-4">
                                            {selectedDate && selectedTime && (
                                                <Button
                                                    onClick={() => handleBooking(selectedTime)}
                                                    disabled={isBooking}
                                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black h-14 rounded-none text-sm uppercase tracking-[0.1em] shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                                                >
                                                    {isBooking ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                            {isRescheduleMode ? "Rescheduling..." : "Booking..."}
                                                        </>
                                                    ) : (
                                                        isRescheduleMode ? "Confirm Reschedule" : "Confirm Booking"
                                                    )}
                                                </Button>
                                            )}
                                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                <Info className="w-3 h-3 text-blue-500" />
                                                Instant Confirmation
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
