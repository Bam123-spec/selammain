"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { CourseSession, Enrollment, SessionAttendance } from "@/types/student-portal"
import { Loader2, CheckCircle2, XCircle, Clock, Video, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { toast } from "sonner"

export default function CourseDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const enrollmentId = params.enrollmentId as string

    const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
    const [sessions, setSessions] = useState<CourseSession[]>([])
    const [attendance, setAttendance] = useState<SessionAttendance[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Enrollment
                const { data: enrollmentData, error: enrollmentError } = await supabase
                    .from('enrollments')
                    .select(`*, courses(*)`)
                    .eq('id', enrollmentId)
                    .single()

                if (enrollmentError) throw enrollmentError
                setEnrollment(enrollmentData)

                // 2. Fetch Course Sessions
                const { data: sessionsData, error: sessionsError } = await supabase
                    .from('course_sessions')
                    .select('*')
                    .eq('course_id', enrollmentData.course_id)
                    .order('session_number', { ascending: true })

                if (sessionsError) throw sessionsError
                setSessions(sessionsData || [])

                // 3. Fetch Attendance
                const { data: attendanceData, error: attendanceError } = await supabase
                    .from('session_attendance')
                    .select('*')
                    .eq('enrollment_id', enrollmentId)

                if (attendanceError) throw attendanceError
                setAttendance(attendanceData || [])

            } catch (error) {
                console.error("Error fetching course details:", error)
                toast.error("Failed to load course details")
                router.push("/student/dashboard")
            } finally {
                setLoading(false)
            }
        }

        if (enrollmentId) {
            fetchData()
        }
    }, [enrollmentId, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary/30">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!enrollment) return null

    // Merge sessions with attendance
    const curriculum = sessions.map(session => {
        const record = attendance.find(a => a.course_session_id === session.id)
        return {
            ...session,
            attendance: record
        }
    })

    const completedCount = attendance.filter(a => a.status === 'present').length
    const progress = Math.round((completedCount / (enrollment.courses?.total_sessions || 10)) * 100)

    return (
        <div className="min-h-screen bg-secondary/30 py-8">
            <div className="container mx-auto px-4 max-w-4xl">

                {/* Header */}
                <div className="mb-8">
                    <Button variant="ghost" size="sm" asChild className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
                        <Link href="/student/dashboard" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 mb-2">{enrollment.courses?.title}</h1>
                            <p className="text-gray-500">{enrollment.courses?.description}</p>
                        </div>
                        <div className="bg-white px-6 py-4 rounded-xl border border-gray-100 shadow-sm text-center">
                            <div className="text-3xl font-bold text-primary">{progress}%</div>
                            <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Complete</div>
                        </div>
                    </div>
                </div>

                {/* Curriculum List */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="font-bold text-lg">Course Curriculum</h2>
                        <p className="text-sm text-gray-500">Complete all sessions to finish the course.</p>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {curriculum.map((item) => (
                            <div key={item.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className={`
                                        h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                                        ${item.attendance?.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}
                                    `}>
                                        {item.attendance?.status === 'present' ? <CheckCircle2 className="h-5 w-5" /> : item.session_number}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{item.title || `Session ${item.session_number}`}</h3>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                                            {item.scheduled_at && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(item.scheduled_at), "MMM dd, h:mm a")}
                                                </span>
                                            )}
                                            {item.zoom_link && (
                                                <a href={item.zoom_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                                    <Video className="h-3 w-3" />
                                                    Zoom Link
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    {item.attendance ? (
                                        <Badge variant={
                                            item.attendance.status === 'present' ? 'default' :
                                                item.attendance.status === 'absent' ? 'destructive' : 'secondary'
                                        } className="capitalize">
                                            {item.attendance.status.replace('_', ' ')}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-gray-400 border-gray-200">
                                            Upcoming
                                        </Badge>
                                    )}
                                    {item.attendance?.quiz_score !== undefined && (
                                        <div className="text-xs text-right mt-1 font-medium text-gray-600">
                                            Score: {item.attendance.quiz_score}%
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {curriculum.length === 0 && (
                            <div className="p-8 text-center text-gray-500">
                                No sessions scheduled yet.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
