"use client"

import {
    Calendar,
    Clock,
    User,
    Car,
    Loader2,
    CheckCircle2,
    Mail,
    ChevronRight,
    Settings,
    LogOut,
    Home,
    GraduationCap,
    AlertCircle,
    MapPin,
    Shield,
    Compass,
    X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { addMinutes, format } from "date-fns"
import { useCurrentStudent, useStudentDashboardData } from "@/hooks/useStudentPortal"
import { StudentBtwAllocation } from "@/types/student-portal"
import { motion } from "framer-motion"

export default function StudentDashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
                    <p className="text-sm font-medium text-gray-500">Loading Dashboard...</p>
                </div>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    )
}

function DashboardContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { student, loading: studentLoading } = useCurrentStudent()
    const { enrollments, upcomingBtw, tenHourSessions, latestTenHourSession, drivingSessions, btwAllocation, loading: dataLoading, refreshData } = useStudentDashboardData()
    const [cancellingSessionId, setCancellingSessionId] = useState<string | null>(null)

    const isSignupSuccess = searchParams.get('signup') === 'success'

    const handleLogout = async () => {
        await supabase.auth.signOut()
        toast.success("Logged out successfully")
        router.push("/")
    }

    const handleCancelDrivingSession = async (sessionId: string) => {
        const confirmed = window.confirm("Are you sure you want to cancel this booking?")
        if (!confirmed) return

        setCancellingSessionId(sessionId)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) {
                toast.error("Please sign in again to cancel this booking.")
                router.push("/student/login?next=/student/dashboard")
                return
            }

            const response = await fetch("/api/cancel-driving-session", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ sessionId }),
            })
            const payload = await response.json().catch(() => ({}))

            if (!response.ok) {
                throw new Error(payload?.error || "Failed to cancel booking.")
            }

            toast.success(payload?.refunded ? "Booking cancelled and refunded." : "Booking cancelled.")
            await refreshData()
        } catch (error: any) {
            toast.error(error?.message || "Failed to cancel booking.")
        } finally {
            setCancellingSessionId(null)
        }
    }

    // --- Prioritization Logic (New Request) ---
    // 1. Detect if DE is "Done" (Actually Completed)
    // A class is ONLY complete when all 3 BTW sessions are completed
    // btw_credits_granted is for manual eligibility override, NOT completion
    const hasPassedDriversEd = enrollments.some(e => {
        const cls = Array.isArray(e.classes) ? e.classes[0] : e.classes;
        const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
        const isDE = cls?.class_type === 'DE' || course?.type === 'drivers_ed';

        // Check if they've completed all 3 BTW sessions
        const hasCompletedAllBTW = btwAllocation && btwAllocation.sessions_used >= 3;

        return isDE && hasCompletedAllBTW;
    });

    // 2. Detect if student is eligible for BTW (has passing grade OR manually granted)
    // Status='completed' can be used to manually grant BTW access
    const isEligibleForBTW = enrollments.some(e => {
        const cls = Array.isArray(e.classes) ? e.classes[0] : e.classes;
        const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
        const isDE = cls?.class_type === 'DE' || course?.type === 'drivers_ed';
        const numericGrade = Number((e as any).grade ?? (e as any).final_grade);
        return isDE && (e.status === 'completed' || (!Number.isNaN(numericGrade) && numericGrade >= 80) || e.btw_credits_granted);
    });

    // 3. Detect Active "New" Services (Practice, Road Test, 10-Hour)
    // Check for active sessions that are NOT standard BTW
    const specialSessions = drivingSessions.filter(s => s.plan_key !== 'btw');
    const hasActivePracticeOrRoadTest = specialSessions.some(s => new Date(s.start_time) > new Date());
    // Check for active 10-hour package usage or sessions
    const hasActiveTenHour = (student?.ten_hour_sessions_used || 0) < (student?.ten_hour_sessions_total || 0) || tenHourSessions.some(s => new Date(s.start_time) > new Date());

    // Also check for non-DE active enrollments
    const hasActiveOtherEnrollment = enrollments.some(e => {
        const cls = Array.isArray(e.classes) ? e.classes[0] : e.classes;
        const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
        const isDE = cls?.class_type === 'DE' || course?.type === 'drivers_ed';
        return !isDE && (e.status === 'active' || e.status === 'enrolled');
    });

    const isNewServiceActive = hasActivePracticeOrRoadTest || hasActiveTenHour || hasActiveOtherEnrollment;

    // 4. Filter Enrollments to Display
    // If New Service is Active AND DE is Passed -> Hide DE from main list
    const visibleEnrollments = enrollments.filter(e => {
        const cls = Array.isArray(e.classes) ? e.classes[0] : e.classes;
        const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
        const isDE = cls?.class_type === 'DE' || course?.type === 'drivers_ed';

        // Don't hide DE classes based on new services being active
        // Classes only hide when they're truly complete (3 BTW sessions done)

        // Hide one-off practice and road test enrollments from this section 
        // (They already appear in the "Practice & Road Tests" specific section)
        const serviceType = (e as any).customer_details?.service_type;
        const planSlug = (e as any).plan_slug; // Sometimes stored here
        const isOneOff = (serviceType === 'DRIVING_PRACTICE_PACKAGE' || serviceType === 'ROAD_TEST_PACKAGE') &&
            !planSlug?.includes('10hr'); // 10-hour practice is a package, keep it? 
        // Actually, user said 10-hour is Pink and Green is practice/road test.
        // Usually 1hr/2hr/Escort are single sessions. 10hr is a package.

        if (isOneOff) return false;

        return true;
    });

    const hasDriversEd = enrollments.some(e => {
        const cls = Array.isArray(e.classes) ? e.classes[0] : e.classes;
        const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
        return cls?.class_type === 'DE' || course?.type === 'drivers_ed';
    });

    const isDeveloper = student?.email === 'beamlakyenealem@gmail.com';
    const tenHourTotal = student?.ten_hour_sessions_total || 0;
    const tenHourUsed = student?.ten_hour_sessions_used || 0;

    // Check for 10-Hour Package access via enrollment (PRIMARY) or legacy profile flag (FALLBACK)
    const hasTenHourEnrollment = enrollments.some(e =>
        (e as any).customer_details?.service_type === 'TEN_HOUR_PACKAGE' &&
        ['enrolled', 'active'].includes(e.status)
    );
    const hasTenHourPackage = hasTenHourEnrollment || student?.ten_hour_package_paid || isDeveloper;

    const hasTenHourCompleted = hasTenHourPackage && tenHourTotal > 0 && tenHourUsed >= tenHourTotal;
    const lastTenHourStart = latestTenHourSession?.start_time;
    const tenHourExpired = hasTenHourCompleted && lastTenHourStart
        ? new Date() > addMinutes(new Date(lastTenHourStart), 180)
        : false;
    const showTenHourPackage = hasTenHourPackage && !tenHourExpired;

    useEffect(() => {
        const purchase = searchParams.get("purchase")
        const sessionId = searchParams.get("session_id")
        if (purchase !== "success" || !sessionId) return

        let cancelled = false

        const reconcilePayment = async () => {
            try {
                const params = new URLSearchParams({
                    session_id: sessionId,
                    reconcile: "1",
                })
                const serviceSlug = searchParams.get("service_slug")
                if (serviceSlug) {
                    params.set("service_slug", serviceSlug)
                }

                const response = await fetch(`/api/checkout/session?${params.toString()}`, {
                    cache: "no-store",
                })
                const payload = await response.json().catch(() => ({}))

                if (!response.ok) {
                    const message = payload?.error?.message || "Payment verification is still processing."
                    if (!cancelled) {
                        toast.error(message)
                    }
                    return
                }

                if (!cancelled) {
                    toast.success("Payment confirmed and dashboard synced.")
                    router.refresh()
                }
            } catch {
                if (!cancelled) {
                    toast.error("Payment verification is still processing.")
                }
            } finally {
                if (!cancelled) {
                    const nextParams = new URLSearchParams(searchParams.toString())
                    nextParams.delete("purchase")
                    nextParams.delete("session_id")
                    nextParams.delete("service_slug")
                    router.replace(nextParams.toString() ? `/student/dashboard?${nextParams.toString()}` : "/student/dashboard")
                }
            }
        }

        reconcilePayment()

        return () => {
            cancelled = true
        }
    }, [router, searchParams])

    useEffect(() => {
        const initTenHourCredits = async () => {
            if (!hasTenHourEnrollment) return
            if ((student?.ten_hour_sessions_total || 0) > 0) return

            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.access_token) return

            const response = await fetch('/api/init-ten-hour-credits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                }
            })

            if (!response.ok) {
                const payload = await response.json().catch(() => ({}))
                console.error('Failed to initialize 10-hour credits:', payload?.error || response.statusText)
            }
        }

        initTenHourCredits()
    }, [hasTenHourEnrollment, student?.ten_hour_sessions_total])

    // Check for BTW Package access via enrollment (NEW) or legacy allocation/flag (FALLBACK)
    const hasBtwEnrollment = enrollments.some(e =>
        (e as any).customer_details?.service_type === 'BTW_PACKAGE' &&
        ['enrolled', 'active'].includes(e.status)
    );

    // Show BTW section whenever student is eligible.
    // Do not hide BTW when 10-hour package is active, otherwise booked BTW sessions disappear from dashboard.
    const showBtw = (student?.btw_access_enabled || hasBtwEnrollment || isEligibleForBTW) && hasDriversEd;

    if (studentLoading || dataLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
                    <p className="text-sm font-medium text-gray-500">Loading Dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
                {/* Welcome Banner for New Signups */}
                {isSignupSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 bg-white/10 rounded-full blur-3xl" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
                                <Mail className="w-10 h-10 text-white" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-3xl font-black uppercase tracking-tight">Welcome to the Family! 🚗</h2>
                                <p className="text-blue-100 font-medium mt-1">We've sent a welcome email with important details about your training. Please check your inbox (and spam folder) to get started.</p>
                            </div>
                            <Button
                                variant="outline"
                                className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-black uppercase tracking-widest rounded-xl px-8 h-12"
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams.toString())
                                    params.delete('signup')
                                    router.replace(`/student/dashboard?${params.toString()}`)
                                }}
                            >
                                Dismiss
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* Clean Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                    <div>
                        <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider border border-blue-100 mb-4">
                            Student Status • {student?.status || "Active"}
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
                            Welcome back, {student?.full_name?.split(' ')[0] || "Student"}
                        </h1>
                        <p className="text-gray-500 mt-2 text-lg">Your Driving Journey Portal</p>
                    </div>
                    <div className="flex gap-4">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-8 h-12 shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2" asChild>
                            <Link href="/services/drivers-education-packages">
                                <GraduationCap className="w-5 h-5" /> Book Drivers Ed
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Graduation Banner */}
                {btwAllocation && btwAllocation.sessions_used >= btwAllocation.total_included_sessions && !isNewServiceActive && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[2rem] p-8 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden mb-8"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 bg-white/10 rounded-full blur-3xl" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md shrink-0">
                                <span className="text-4xl">🎉</span>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-3xl font-black uppercase tracking-tight">Congratulations!</h2>
                                <p className="text-emerald-50 font-medium mt-1 text-lg">
                                    You've completed all your Driver's Ed driving sessions! You are one step closer to your license.
                                </p>
                            </div>
                            <Button
                                className="bg-white text-emerald-600 hover:bg-emerald-50 font-black uppercase tracking-widest px-8 h-12 rounded-xl shadow-lg whitespace-nowrap"
                                asChild
                            >
                                <Link href="/student/behind-the-wheel">Book More Practice</Link>
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* Action Required: Payments/Pending Enrollment */}
                {enrollments.some(e => e.status === 'pending_payment') && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm"
                    >
                        <div className="flex items-center gap-4 text-amber-800">
                            <div className="bg-amber-100 p-3 rounded-xl">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight uppercase tracking-tight">Payment Required</h3>
                                <p className="text-sm font-medium opacity-90 italic">You have a pending enrollment. Complete payment to secure your spot.</p>
                            </div>
                        </div>
                        <Button className="bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest px-8 rounded-xl h-12 shadow-lg shadow-amber-600/20 whitespace-nowrap">
                            Pay Now
                        </Button>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* Main Content Area */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Current Training Section */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Active <span className="text-blue-600">Training</span></h2>
                                <Link href="/student/courses" className="text-xs font-bold text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors">See all</Link>
                            </div>

                            <div className="grid gap-4">
                                {visibleEnrollments.length > 0 ? (
                                    visibleEnrollments.map((enrollment) => {
                                        const course = Array.isArray(enrollment.courses) ? enrollment.courses[0] : enrollment.courses;
                                        const cls = Array.isArray(enrollment.classes) ? enrollment.classes[0] : enrollment.classes;
                                        const serviceType = (enrollment as any).customer_details?.service_type;
                                        const isDIP = serviceType === 'DIP_PACKAGE' || cls?.class_type === 'DIP' || cls?.name?.includes('Driving Improvement');
                                        const isRSEP = serviceType === 'RSEP_PACKAGE' || cls?.class_type === 'RSEP' || cls?.name?.includes('RSEP');
                                        const isDE = cls?.class_type === 'DE' || course?.type === 'drivers_ed' || isDIP || isRSEP;

                                        const isTenHour = serviceType === 'TEN_HOUR_PACKAGE';
                                        const isBTW = isTenHour || serviceType === 'BTW_PACKAGE' || serviceType === 'BTW';
                                        const isPractice = serviceType === 'DRIVING_PRACTICE_PACKAGE';
                                        const isRoadTest = serviceType === 'ROAD_TEST_PACKAGE';

                                        return (
                                            <div key={enrollment.id} className="bg-white border border-gray-100 rounded-[1.5rem] p-6 shadow-sm hover:shadow-xl transition-all duration-500 group overflow-hidden relative">
                                                {/* Decorative background element */}
                                                {isDE && (
                                                    <div className="absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 bg-blue-50 rounded-full blur-2xl opacity-50 group-hover:bg-blue-100 transition-colors duration-500" />
                                                )}
                                                {isBTW && (
                                                    <div className="absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 bg-pink-50 rounded-full blur-2xl opacity-50 group-hover:bg-pink-100 transition-colors duration-500" />
                                                )}
                                                {(isPractice || isRoadTest) && (
                                                    <div className="absolute top-0 right-0 w-32 h-32 -mr-12 -mt-12 bg-emerald-50 rounded-full blur-2xl opacity-50 group-hover:bg-emerald-100 transition-colors duration-500" />
                                                )}

                                                <div className="relative z-10 flex flex-col md:flex-row gap-6">
                                                    <div className={cn(
                                                        "h-14 w-14 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-500 shadow-sm",
                                                        isDE ? "bg-blue-50 border-blue-100 group-hover:bg-blue-600 group-hover:border-blue-600" :
                                                            isBTW ? "bg-pink-50 border-pink-100 group-hover:bg-pink-600 group-hover:border-pink-600" :
                                                                "bg-emerald-50 border-emerald-100 group-hover:bg-emerald-600 group-hover:border-emerald-600"
                                                    )}>
                                                        {isDE ? (
                                                            <GraduationCap className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors duration-500" />
                                                        ) : (
                                                            <Car className={cn(
                                                                "w-7 h-7 transition-colors duration-500",
                                                                isBTW ? "text-pink-600 group-hover:text-white" : "text-emerald-600 group-hover:text-white"
                                                            )} />
                                                        )}
                                                    </div>

                                                    <div className="flex-1 space-y-4">
                                                        <div className="space-y-1">
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <h3 className={cn(
                                                                    "text-xl font-black text-gray-900 uppercase tracking-tight transition-colors",
                                                                    isDE ? "group-hover:text-blue-600" : isBTW ? "group-hover:text-pink-600" : "group-hover:text-emerald-600"
                                                                )}>
                                                                    {isTenHour ? "10-Hour Driving Package" : isDIP ? "Driving Improvement Program" : isRSEP ? "RSEP Certification" : (cls?.name || course?.title || (isPractice ? "Driving Practice" : isRoadTest ? "Road Test" : "Driving Training"))}
                                                                </h3>
                                                                <Badge className={`${enrollment.status === 'active' || enrollment.status === 'enrolled' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'} border-none font-black uppercase tracking-widest text-[9px] px-2.5 py-1 rounded-full`}>
                                                                    {enrollment.status?.replace('_', ' ')}
                                                                </Badge>
                                                                {isDE && (
                                                                    <Badge variant="outline" className="border-blue-100 text-blue-600 font-black uppercase tracking-widest text-[9px] px-2.5 py-1 rounded-full bg-blue-50/50">
                                                                        MVA Certified
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-gray-500 font-medium text-xs">
                                                                {isTenHour
                                                                    ? "Professional 1-on-1 driving instruction (5 sessions x 2 hours)."
                                                                    : isDIP
                                                                        ? "MVA Licensed Driving Improvement Program (DIP)."
                                                                        : isRSEP
                                                                            ? "Residential Safety Education Program (RSEP)."
                                                                            : (isDE ? "Comprehensive 36-hour MVA-licensed program." : "Professional driving training sessions.")
                                                                }
                                                            </p>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 pt-2">
                                                            {cls?.start_date && (
                                                                <div className="flex items-center gap-2.5 text-[11px] text-gray-500 font-bold group-hover:text-gray-900 transition-colors">
                                                                    <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                                                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                                                    </div>
                                                                    <span>Starts {format(new Date(cls.start_date.split('T')[0] + 'T12:00:00'), "MMM dd, yyyy")}</span>
                                                                </div>
                                                            )}
                                                            {cls?.daily_start_time && (
                                                                <div className="flex items-center gap-2.5 text-[11px] text-gray-500 font-bold group-hover:text-gray-900 transition-colors">
                                                                    <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                                                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                                                                    </div>
                                                                    <span>
                                                                        {format(new Date(`2000-01-01T${cls.daily_start_time}`), "h:mm aa")} - {format(new Date(`2000-01-01T${cls.daily_end_time}`), "h:mm aa")}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2.5 text-[11px] text-gray-500 font-bold group-hover:text-gray-900 transition-colors">
                                                                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                                                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                                                                </div>
                                                                <span>Silver Spring Branch</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-row md:flex-col justify-center gap-2 shrink-0">
                                                        <Button className="flex-1 md:flex-none md:w-32 bg-gray-900 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] py-3 h-auto min-h-0 rounded-xl shadow-sm transition-all transform group-hover:-translate-y-1" asChild>
                                                            <Link href={`/student/history?id=${enrollment.id}`}>Dashboard</Link>
                                                        </Button>
                                                        <Button variant="outline" className="flex-1 md:flex-none md:w-32 border-2 border-gray-100 text-gray-400 font-black uppercase tracking-widest text-[10px] py-3 h-auto min-h-0 rounded-xl hover:border-blue-600 hover:text-blue-600 transition-all" asChild>
                                                            <Link href="/student/courses">Manage All</Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-[1.5rem] p-10 text-center space-y-4">
                                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-gray-300">
                                            <AlertCircle className="w-8 h-8" />
                                        </div>
                                        <div className="max-w-xs mx-auto">
                                            <p className="font-bold text-gray-900 uppercase">No active enrollments</p>
                                            <p className="text-sm text-gray-500 mt-1">Join a Driver's Education class or book practice sessions to begin.</p>
                                        </div>
                                        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest px-8 rounded-xl h-11" asChild>
                                            <Link href="/services/drivers-education-packages">Join A Class</Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Driving Practice & Road Test Sessions */}
                        {specialSessions.length > 0 && (
                            <section className="space-y-4">
                                <div className="flex items-center justify-between px-2 pt-4">
                                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Practice & <span className="text-blue-600">Road Tests</span></h2>
                                    <Link href="/services/driving-practice-packages" className="text-xs font-bold text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Book more</Link>
                                </div>
                                <div className="bg-white border border-gray-100 rounded-[1.5rem] overflow-hidden shadow-sm">
                                    <div className="divide-y divide-gray-50">
                                        {specialSessions.map((session) => (
                                            <div key={session.id} className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "h-12 w-12 rounded-xl flex items-center justify-center border shrink-0 shadow-sm",
                                                        session.plan_key?.includes('road-test') ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-blue-50 text-blue-600 border-blue-100"
                                                    )}>
                                                        {session.plan_key?.includes('road-test') ? <Shield className="w-6 h-6" /> : <Compass className="w-6 h-6" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 uppercase tracking-tight text-sm">
                                                            {session.plan_key?.replace(/-/g, ' ') || "Driving Practice"}
                                                        </h4>
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                            <span className="flex items-center gap-1.5 text-blue-500">
                                                                <Calendar className="w-3.5 h-3.5" />
                                                                {format(new Date(session.start_time), "MMM dd")}
                                                            </span>
                                                            <span className="flex items-center gap-1.5 border-l pl-4 border-gray-100">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {format(new Date(session.start_time), "h:mm aa")} - {format(new Date(session.end_time), "h:mm aa")}
                                                            </span>
                                                            <span className="flex items-center gap-1.5 border-l pl-4 border-gray-100">
                                                                <MapPin className="w-3.5 h-3.5" />
                                                                Silver Spring Branch
                                                            </span>
                                                            {session.instructors && (
                                                                <span className="flex items-center gap-1.5 border-l pl-4 border-gray-100">
                                                                    <User className="w-3.5 h-3.5" />
                                                                    {session.instructors.full_name.split(' ')[0]}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge className={cn(
                                                        "border-none font-black px-2.5 py-1 rounded-full uppercase text-[9px] tracking-widest",
                                                        session.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                                                    )}>
                                                        {session.status}
                                                    </Badge>
                                                    {session.status !== 'cancelled' && new Date(session.start_time) > new Date() && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleCancelDrivingSession(session.id)}
                                                            disabled={cancellingSessionId === session.id}
                                                            className="text-[10px] font-black uppercase tracking-widest border-red-200 text-red-500 hover:border-red-300 hover:text-red-600 hover:bg-red-50"
                                                        >
                                                            {cancellingSessionId === session.id ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <X className="w-3.5 h-3.5" />
                                                            )}
                                                            Cancel
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Behind The Wheel Sessions - ONLY SHOW IF RELEVANT */}
                        {showBtw && (upcomingBtw.length > 0 || (btwAllocation && btwAllocation.total_included_sessions > 0)) && (
                            <section className="space-y-4">
                                <div className="flex items-center justify-between px-2 pt-4">
                                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Behind The <span className="text-blue-600">Wheel</span></h2>
                                    <Link href="/student/behind-the-wheel" className="text-xs font-bold text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Book new</Link>
                                </div>
                                <div className="bg-white border border-gray-100 rounded-[1.5rem] overflow-hidden shadow-sm">
                                    <div className="divide-y divide-gray-50">
                                        {upcomingBtw.length > 0 ? (
                                            upcomingBtw.map((session) => (
                                                <div key={session.id} className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0 shadow-sm">
                                                            <Car className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 uppercase tracking-tight text-sm">
                                                                {session.service_type?.replace(/_/g, ' ') || "Driving Lesson"}
                                                            </h4>
                                                            <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                                <span className="flex items-center gap-1 text-blue-500"><Calendar className="w-3.5 h-3.5" /> {format(new Date(session.start_time), "MMM dd")}</span>
                                                                <span className="flex items-center gap-1 border-l pl-3 border-gray-100"><Clock className="w-3.5 h-3.5" /> {format(new Date(session.start_time), "h:mm aa")}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Badge className={`border-none font-black px-2.5 py-1 rounded-full uppercase text-[9px] tracking-widest ${session.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                                                            (new Date(session.start_time) < new Date() && new Date(session.end_time) > new Date()) ? 'bg-blue-600 text-white animate-pulse' :
                                                                'bg-indigo-50/50 text-indigo-700'
                                                            }`}>
                                                            {session.status === 'cancelled' ? 'Cancelled' :
                                                                (new Date(session.start_time) < new Date() && new Date(session.end_time) > new Date()) ? 'In Progress' :
                                                                    session.status}
                                                        </Badge>
                                                        {session.status !== 'cancelled' && new Date(session.start_time) > new Date() && (
                                                            <Button variant="outline" size="sm" className="text-[10px] font-black uppercase tracking-widest border-gray-200 hover:border-blue-600 hover:text-blue-600" asChild>
                                                                <Link href={`/student/behind-the-wheel?reschedule=${session.id}`}>Reschedule</Link>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-10 text-center text-gray-400">
                                                <p className="text-sm font-bold uppercase tracking-widest">No scheduled sessions</p>
                                                <Button size="sm" variant="ghost" className="mt-2 text-blue-600 font-bold" asChild>
                                                    <Link href="/student/behind-the-wheel">Schedule Now →</Link>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* 10-Hour Package Sessions */}
                        {showTenHourPackage && (
                            <section className="space-y-4">
                                <div className="flex items-center justify-between px-2 pt-4">
                                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">10-Hour <span className="text-indigo-600">Package</span></h2>
                                    <Link href="/student/ten-hour" className="text-xs font-bold text-gray-400 hover:text-indigo-600 uppercase tracking-widest transition-colors">Book new</Link>
                                </div>
                                <div className="bg-white border border-gray-100 rounded-[1.5rem] overflow-hidden shadow-sm">
                                    <div className="divide-y divide-gray-50">
                                        {tenHourSessions && tenHourSessions.length > 0 ? (
                                            tenHourSessions.map((session) => (
                                                <div key={session.id} className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100 shrink-0 shadow-sm">
                                                            <Car className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 uppercase tracking-tight text-sm">
                                                                2-Hour Session
                                                            </h4>
                                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                                                <span className="flex items-center gap-1.5 text-blue-500">
                                                                    <Calendar className="w-3.5 h-3.5" />
                                                                    {format(new Date(session.start_time), "MMM dd")}
                                                                </span>
                                                                <span className="flex items-center gap-1.5 border-l pl-4 border-gray-100">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    {format(new Date(session.start_time), "h:mm aa")} - {format(new Date(session.end_time), "h:mm aa")}
                                                                </span>
                                                                <span className="flex items-center gap-1.5 border-l pl-4 border-gray-100">
                                                                    <MapPin className="w-3.5 h-3.5" />
                                                                    Silver Spring Branch
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Badge className={`border-none font-black px-2.5 py-1 rounded-full uppercase text-[9px] tracking-widest ${session.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                                                            (new Date(session.start_time) < new Date() && new Date(session.end_time) > new Date()) ? 'bg-blue-600 text-white animate-pulse' :
                                                                'bg-purple-50/50 text-purple-700'
                                                            }`}>
                                                            {session.status === 'cancelled' ? 'Cancelled' :
                                                                (new Date(session.start_time) < new Date() && new Date(session.end_time) > new Date()) ? 'In Progress' :
                                                                    session.status}
                                                        </Badge>
                                                        {session.status !== 'cancelled' && new Date(session.start_time) > new Date() && (
                                                            <Button variant="outline" size="sm" className="text-[10px] font-black uppercase tracking-widest border-gray-200 hover:border-indigo-600 hover:text-indigo-600" asChild>
                                                                <Link href={`/student/ten-hour?reschedule=${session.id}`}>Reschedule</Link>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-10 text-center text-gray-400">
                                                <p className="text-sm font-bold uppercase tracking-widest">No scheduled sessions</p>
                                                <Button size="sm" variant="ghost" className="mt-2 text-blue-600 font-bold" asChild>
                                                    <Link href="/student/ten-hour">Schedule Now →</Link>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar Area */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* BTW Eligibility & Booking Card */}
                        {showBtw && (
                            <>
                                <BtwEligibilityCard allocation={btwAllocation} />

                                {/* Summary Metrics - Only show if has data */}
                                {(btwAllocation && btwAllocation.total_included_sessions > 0) && (
                                    <section className="bg-black text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full bg-blue-600 opacity-20 blur-3xl group-hover:scale-150 transition-transform duration-700" />
                                        <div className="relative z-10 space-y-8">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">BTW Progress</p>
                                                <Car className="w-5 h-5 text-gray-500" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-end gap-2">
                                                    <h3 className="text-5xl font-black tracking-tighter">{btwAllocation.sessions_used}</h3>
                                                    <p className="text-xl font-bold text-gray-500 pb-1">/ {btwAllocation.total_included_sessions}</p>
                                                </div>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sessions Completed</p>
                                            </div>
                                            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(btwAllocation.sessions_used / btwAllocation.total_included_sessions) * 100}%` }}
                                                    className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]"
                                                />
                                            </div>
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest py-6 rounded-xl shadow-lg shadow-blue-600/30" asChild>
                                                <Link href="/student/behind-the-wheel">Book a Session Now</Link>
                                            </Button>
                                        </div>
                                    </section>
                                )}
                            </>
                        )}

                        {/* 10-Hour Package Card */}
                        {showTenHourPackage && (
                            <section className="bg-black text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full bg-indigo-600 opacity-20 blur-3xl group-hover:scale-150 transition-transform duration-700" />
                                <div className="relative z-10 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col gap-1">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">10-Hour Package (5 x 2hr)</p>
                                            {student?.btw_cooldown_until && new Date(student.btw_cooldown_until) > new Date() ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">In Cooldown</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                                    <span className="text-[9px] font-black text-green-400 uppercase tracking-widest uppercase">Ready to Book</span>
                                                </div>
                                            )}
                                        </div>
                                        <Car className="w-5 h-5 text-gray-500" />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <div className="flex items-end gap-2">
                                                    <h3 className="text-5xl font-black tracking-tighter text-white">{(student?.ten_hour_sessions_total || 5) - (student?.ten_hour_sessions_used || 0)}</h3>
                                                    <div className="pb-1">
                                                        <p className="text-xl font-bold text-gray-500">Available</p>
                                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none">x 2 Hours Each</p>
                                                    </div>
                                                </div>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Sessions Remaining</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-white">{student?.ten_hour_sessions_used || 0}</p>
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Completed</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${((student?.ten_hour_sessions_used || 0) / (student?.ten_hour_sessions_total || 5)) * 100}%` }}
                                            className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest py-6 rounded-xl shadow-lg shadow-indigo-600/30" asChild>
                                            <Link href="/student/ten-hour">Book a Session Now</Link>
                                        </Button>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Support & Quick Actions */}
                        <div className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-8 px-2">Knowledge Base</h4>
                            <div className="grid gap-6">
                                {[
                                    { href: "/student/settings", icon: Settings, label: "Account Settings", desc: "Manage profile & notifications", color: "bg-blue-50 text-blue-600" },
                                    { href: "/contact", icon: Mail, label: "Support Center", desc: "Get help with your program", color: "bg-purple-50 text-purple-600" }
                                ].map((item, id) => (
                                    <Link key={id} href={item.href} className="flex items-start gap-4 group">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300 ${item.color} group-hover:scale-110 shrink-0 shadow-sm font-bold`}>
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-black text-gray-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{item.label}</p>
                                            <p className="text-[11px] font-medium text-gray-500 leading-tight">{item.desc}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    )
}

function BtwEligibilityCard({ allocation }: { allocation: StudentBtwAllocation | null }) {
    const { student, loading } = useCurrentStudent()
    const [status, setStatus] = useState<{
        type: 'loading' | 'eligible' | 'no_credits' | 'cooldown' | 'error'
        message?: string
        nextAvailableAt?: string
    }>({ type: 'loading' })

    useEffect(() => {
        if (loading) return

        if (!student) {
            setStatus({ type: 'error', message: "Student data unavailable" })
            return
        }

        const checkEligibility = () => {
            // 1. Check Course Grade (Dynamic Eligibility)
            // If any enrollment has grade >= 80, they are eligible regardless of credits
            const hasPassingGrade = student.enrollments?.some(e =>
                (() => {
                    const numericGrade = Number((e as any).grade ?? (e as any).final_grade);
                    return e.btw_credits_granted || (!Number.isNaN(numericGrade) && numericGrade >= 80) || e.status === 'completed';
                })()
            )

            if (hasPassingGrade) {
                // If they have passed, we assume they have 3 credits implicitly
                // Unless they have used them all (which we'd check against allocation, but simplified for now)

                // Still check cooldown
                if (student.btw_cooldown_until) {
                    const cooldownUntil = new Date(student.btw_cooldown_until)
                    if (cooldownUntil > new Date()) {
                        setStatus({
                            type: 'cooldown',
                            nextAvailableAt: student.btw_cooldown_until
                        })
                        return
                    }
                }

                setStatus({ type: 'eligible' })
                return
            }

            // 2. Fallback: Check Credits (Manually added)
            // Use 3-session limit
            const sessionsUsed = allocation?.sessions_used || 0
            const credits = Math.max(0, 3 - sessionsUsed)

            if (credits > 0) {
                // Check Cooldown
                if (student.btw_cooldown_until) {
                    const cooldownUntil = new Date(student.btw_cooldown_until)
                    if (cooldownUntil > new Date()) {
                        setStatus({
                            type: 'cooldown',
                            nextAvailableAt: student.btw_cooldown_until
                        })
                        return
                    }
                }
                setStatus({ type: 'eligible' })
                return
            }

            // 3. Not Eligible
            setStatus({ type: 'no_credits' })
        }
        checkEligibility()
    }, [student, loading])

    const formatCooldown = (dateStr: string) => {
        try {
            return format(new Date(dateStr), "MMM d, h:mm a")
        } catch {
            return dateStr
        }
    }

    return (
        <section className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm overflow-hidden relative group">
            <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Behind-the-Wheel (BTW)</h3>
                    <div className={`w-2 h-2 rounded-full ${status.type === 'loading' ? 'bg-gray-300 animate-pulse' :
                        status.type === 'eligible' ? 'bg-emerald-500' :
                            status.type === 'error' ? 'bg-red-500' : 'bg-amber-500'
                        }`} />
                </div>

                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Current Status</p>
                    <div className="flex items-center gap-2">
                        {status.type === 'loading' ? (
                            <div className="h-6 w-32 bg-gray-100 animate-pulse rounded-md" />
                        ) : status.type === 'no_credits' ? (
                            <p className="font-bold text-amber-600 text-sm italic">0 Credits Available</p>
                        ) : status.type === 'cooldown' ? (
                            <p className="font-bold text-blue-600 text-sm italic">Cooldown (Until: {formatCooldown(status.nextAvailableAt!)})</p>
                        ) : status.type === 'error' ? (
                            <p className="font-bold text-red-500 text-sm italic">{status.message}</p>
                        ) : (
                            <p className="font-bold text-emerald-600 text-sm italic">Eligible ({Math.max(0, 3 - (allocation?.sessions_used || 0))} Credit Sessions)</p>
                        )}
                    </div>
                </div>

                <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest py-6 rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all active:scale-95"
                    asChild
                    disabled={status.type !== 'eligible'}
                >
                    <Link href="/student/behind-the-wheel">Book BTW Sessions</Link>
                </Button>
            </div>
        </section>
    )
}
