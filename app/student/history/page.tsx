"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStudentHistory, useCurrentStudent, useStudentDashboardData } from "@/hooks/useStudentPortal"
import { GraduationCap } from "lucide-react"

function HistoryContent() {
    const searchParams = useSearchParams()
    const enrollmentId = searchParams.get('id')
    const { btwHistory, loading: historyLoading } = useStudentHistory(enrollmentId)
    const { student, loading: studentLoading } = useCurrentStudent()
    const { enrollments, loading: dashboardLoading } = useStudentDashboardData()
    const loading = historyLoading || studentLoading || dashboardLoading

    const driversEdEnrollments = enrollments.filter((e) => {
        const cls = Array.isArray(e.classes) ? e.classes[0] : e.classes
        const course = Array.isArray(e.courses) ? e.courses[0] : e.courses
        return cls?.class_type === 'DE' || course?.type === 'drivers_ed'
    })

    const enrollment = (() => {
        if (driversEdEnrollments.length === 0) return null
        if (enrollmentId) {
            const match = driversEdEnrollments.find((e) => e.id === enrollmentId)
            if (match) return match
        }
        const statusOrder = ['active', 'enrolled', 'completed']
        return [...driversEdEnrollments].sort((a, b) => {
            const aRank = statusOrder.indexOf(a.status)
            const bRank = statusOrder.indexOf(b.status)
            return (aRank === -1 ? 99 : aRank) - (bRank === -1 ? 99 : bRank)
        })[0]
    })()

    const hasDriversEd = driversEdEnrollments.length > 0
    const hasPassedDriversEd = driversEdEnrollments.some((e) => {
        const numericGrade = Number((e as any).grade ?? (e as any).final_grade)
        return e.status === 'completed' || (!Number.isNaN(numericGrade) && numericGrade >= 80) || e.btw_credits_granted
    })

    const isDriverEdBtwSession = (session: any) => {
        const fromBtwTable = Boolean(session.starts_at || session.session_type)
        const legacyBtw = session.plan_key === 'btw' && session.service_slug !== 'ten-hour-package'
        return fromBtwTable || legacyBtw
    }

    // 2. Driver's Ed BTW Sessions
    // Only actual BTW sessions should be shown in Driver's Ed > Behind the Wheel.
    const includedSessions = btwHistory.filter((s) => isDriverEdBtwSession(s))

    // 1. Driving Sessions (Extra / Practice / Package)
    // Keep non-BTW sessions in the Driving Sessions tab.
    const extraSessions = btwHistory.filter((s) => !isDriverEdBtwSession(s))

    const showBtw = ((student?.btw_access_enabled || hasPassedDriversEd) && hasDriversEd) || includedSessions.length > 0

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        )
    }

    // Helper to get descriptive title
    const getSessionTitle = (session: any) => {
        const start = new Date(session.start_time);
        const end = new Date(session.end_time);
        const diffMs = end.getTime() - start.getTime();
        const hours = Math.round(diffMs / (1000 * 60 * 60));
        const durationText = `${hours} Hour `;

        if (session.service_slug === 'ten-hour-package') return `${durationText}Driving Practice (10 Hour package)`;
        if (session.plan_key === 'btw') {
            return "Behind The Wheel";
        }
        if (session.plan_key?.includes('practice') || session.service_type === 'practice') {
            return `${durationText}Driving Practice`;
        }
        if (session.plan_key?.includes('road-test') || session.service_type === 'road_test') {
            return "Road Test Service";
        }
        return session.service_type?.replace(/_/g, ' ') || "Driving Session";
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="container mx-auto px-4 max-w-4xl py-10 pb-20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">History & <span className="text-blue-600">Attendance</span></h1>
                    {showBtw && (
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest px-8 h-12 rounded-none shadow-lg shadow-blue-600/20 transition-all active:scale-95" asChild>
                            <Link href="/student/behind-the-wheel">Book BTW Sessions</Link>
                        </Button>
                    )}
                </div>

                <Tabs defaultValue="drivers-ed" className="w-full">
                    <TabsList className={`grid w-full mb-8 h-auto p-1 bg-gray-200/50 rounded-xl ${showBtw ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        <TabsTrigger value="drivers-ed" className="rounded-lg py-3 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            Driver's Ed
                        </TabsTrigger>
                        {showBtw && (
                            <TabsTrigger value="driving-sessions" className="rounded-lg py-3 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                Driving Sessions
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="drivers-ed" className="space-y-8">
                        <Tabs defaultValue="theory" className="w-full">
                            <TabsList className="flex items-center gap-1 p-1 bg-gray-100/80 border border-gray-200/50 w-fit rounded-xl mb-8">
                                <TabsTrigger value="theory" className="px-8 py-2.5 rounded-lg font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-gray-500">
                                    Theory
                                </TabsTrigger>
                                {showBtw && (
                                    <TabsTrigger value="btw" className="px-8 py-2.5 rounded-lg font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm text-gray-500">
                                        Behind the Wheel
                                    </TabsTrigger>
                                )}
                            </TabsList>

                            <TabsContent value="theory">
                                <div className="space-y-6">
                                    {/* Course Summary Card */}
                                    {enrollment ? (
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 md:p-8">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div>
                                                    <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                                                        {enrollment?.classes?.name || enrollment?.courses?.title || "Driver's Education"}
                                                    </h3>
                                                    <div className="flex items-center gap-3">
                                                        <Badge className={`${enrollment?.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                                            enrollment?.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            } border-none px-3 py-1 text-xs font-black uppercase tracking-wider`}>
                                                            {enrollment?.status || 'Active'}
                                                        </Badge>
                                                        {enrollment?.completion_date && (
                                                            <span className="text-sm text-gray-500 font-medium">
                                                                Completed on {format(new Date(enrollment.completion_date), "MMM d, yyyy")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 bg-gray-50 rounded-2xl p-4 md:px-8 md:py-4">
                                                    <div className="text-center">
                                                        <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Final Grade</div>
                                                        <div className={`text-3xl font-black leading-none ${Number(enrollment?.grade || enrollment?.final_grade) >= 80 || enrollment?.btw_credits_granted ? 'text-emerald-600' :
                                                            (enrollment?.grade || enrollment?.final_grade) ? 'text-amber-600' : 'text-gray-300'
                                                            }`}>
                                                            {enrollment?.grade
                                                                ? (String(enrollment.grade).includes('%') ? String(enrollment.grade) : `${enrollment.grade}%`)
                                                                : (enrollment?.final_grade ? `${enrollment.final_grade}%` : '--')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center flex flex-col items-center justify-center">
                                            <div className="bg-gray-50 p-6 rounded-full mb-6">
                                                <GraduationCap className="w-10 h-10 text-gray-300" />
                                            </div>
                                            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">No Enrollment Data</h3>
                                            <p className="text-gray-500 max-w-xs mb-8 font-medium">You don't have any active or completed course enrollments yet.</p>
                                            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest px-8 h-12 rounded-none shadow-lg shadow-blue-600/20" asChild>
                                                <Link href="/services/drivers-education-packages">Browse Packages</Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="btw">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                        <h2 className="font-bold text-lg flex items-center gap-2 text-gray-900">
                                            <Car className="h-5 w-5 text-gray-500" />
                                            Behind-the-Wheel
                                        </h2>
                                        <Badge variant="outline" className="font-bold text-blue-600 bg-blue-50 border-blue-100">
                                            Package Sessions
                                        </Badge>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {includedSessions.map((session) => (
                                            <div key={session.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="h-12 w-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center font-black text-gray-600 shrink-0">
                                                        {format(new Date(session.start_time), "dd")}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 capitalize">
                                                            {getSessionTitle(session)}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            {format(new Date(session.start_time), "MMM dd, yyyy")} • {format(new Date(session.start_time), "h:mm a")} - {format(new Date(session.end_time), "h:mm a")}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Badge variant="secondary" className="text-[10px] font-black uppercase bg-gray-100 text-gray-600 py-0.5">
                                                                {session.instructors?.full_name || "Instructor"}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Badge variant={
                                                    session.status === 'completed' || (session.status === 'scheduled' && new Date(session.end_time) < new Date()) ? 'default' :
                                                        session.status === 'cancelled' ? 'destructive' : 'secondary'
                                                } className="capitalize px-4 py-1 h-8 rounded-lg font-bold">
                                                    {session.status === 'cancelled' ? 'cancelled' :
                                                        (session.status === 'completed' || new Date(session.end_time) < new Date()) ? 'completed' :
                                                            session.status}
                                                </Badge>
                                            </div>
                                        ))}
                                        {includedSessions.length === 0 && (
                                            <div className="p-12 text-center text-gray-500">
                                                No package driving sessions found.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </TabsContent>

                    <TabsContent value="driving-sessions" className="space-y-4">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h2 className="font-bold text-lg flex items-center gap-2 text-gray-900">
                                    <Car className="h-5 w-5 text-gray-500" />
                                    Extra Driving Activities
                                </h2>
                                <Badge variant="outline" className="font-bold text-amber-600 bg-amber-50 border-amber-100">
                                    Extra / Road Test
                                </Badge>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {extraSessions.map((session) => (
                                    <div key={session.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="h-12 w-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center font-black text-gray-600 shrink-0">
                                                {format(new Date(session.start_time), "dd")}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 capitalize">
                                                    {getSessionTitle(session)}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {format(new Date(session.start_time), "MMM dd, yyyy")} • {format(new Date(session.start_time), "h:mm a")} - {format(new Date(session.end_time), "h:mm a")}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Badge variant="secondary" className="text-[10px] font-black uppercase bg-gray-100 text-gray-600 py-0.5">
                                                        {session.instructors?.full_name || "Instructor"}
                                                    </Badge>
                                                    <Badge variant="secondary" className="text-[10px] font-black uppercase bg-amber-50 text-amber-700 border-amber-100 py-0.5">
                                                        Paid / Add-on
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant={
                                            session.status === 'completed' || (session.status === 'scheduled' && new Date(session.end_time) < new Date()) ? 'default' :
                                                session.status === 'cancelled' ? 'destructive' : 'secondary'
                                        } className="capitalize px-4 py-1 h-8 rounded-lg font-bold">
                                            {session.status === 'cancelled' ? 'cancelled' :
                                                (session.status === 'completed' || new Date(session.end_time) < new Date()) ? 'completed' :
                                                    session.status}
                                        </Badge>
                                    </div>
                                ))}
                                {extraSessions.length === 0 && (
                                    <div className="p-12 text-center text-gray-500">
                                        No extra driving sessions found.
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

export default function HistoryPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        }>
            <HistoryContent />
        </Suspense>
    )
}
