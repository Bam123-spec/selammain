import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Student, Enrollment, BtwSession, StudentBtwAllocation, SessionAttendance, TenHourSession } from '@/types/student-portal'
import { toast } from 'sonner'

export function useCurrentStudent() {
    const [student, setStudent] = useState<Student | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    setLoading(false)
                    return
                }

                const { data, error } = await supabase
                    .from('profiles')
                    .select(`
                        *,
                        enrollments (
                            status,
                            grade,
                            btw_credits_granted,
                            final_grade,
                            class_id,
                            completion_date
                        )`
                    )
                    .eq('id', user.id)
                    .maybeSingle()

                if (error) throw error
                setStudent(data)
            } catch (error) {
                console.error('Error fetching student:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchStudent()
    }, [])

    return { student, loading }
}

export function useStudentDashboardData() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([])
    const [upcomingBtw, setUpcomingBtw] = useState<BtwSession[]>([])
    const [tenHourSessions, setTenHourSessions] = useState<TenHourSession[]>([])
    const [latestTenHourSession, setLatestTenHourSession] = useState<TenHourSession | null>(null)
    const [drivingSessions, setDrivingSessions] = useState<any[]>([])
    const [btwAllocation, setBtwAllocation] = useState<StudentBtwAllocation | null>(null)
    const [loading, setLoading] = useState(true)

    const refreshData = useCallback(async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setEnrollments([])
                setUpcomingBtw([])
                setTenHourSessions([])
                setLatestTenHourSession(null)
                setDrivingSessions([])
                setBtwAllocation(null)
                return
            }

            const [
                enrollmentResponse,
                btwResponse,
                drivingResponse,
                allocationResponse,
                tenHourResponse,
                latestTenHourResponse
            ] = await Promise.all([
                // 1. Fetch Enrollments
                supabase
                    .from('enrollments')
                    .select(`
                            *,
                            classes:class_id (*),
                            courses:course_id (*)
                        `)
                    .or(`user_id.eq.${user.id},student_id.eq.${user.id},email.eq.${user.email?.toLowerCase()}`)
                    .in('status', ['active', 'enrolled', 'pending_payment', 'completed']),

                // 2. Fetch Upcoming BTW Sessions (from correct table)
                supabase
                    .from('behind_the_wheel_sessions')
                    .select(`*`)
                    .eq('student_id', user.id)
                    .gte('ends_at', new Date().toISOString())
                    .order('starts_at', { ascending: true })
                    .limit(5),

                // 3. Fetch Driving Practice & Road Test Sessions
                supabase
                    .from('driving_sessions')
                    .select(`*, instructors(*)`)
                    .eq('student_id', user.id)
                    .gte('start_time', new Date().toISOString())
                    .order('start_time', { ascending: true })
                    .limit(10),

                // 4. Fetch Allocation
                supabase
                    .from('student_btw_allocations')
                    .select(`*, behind_the_wheel_packages(*)`)
                    .eq('student_id', user.id)
                    .maybeSingle(),

                // 5. Fetch 10-Hour Package Sessions
                supabase
                    .from('ten_hour_package_sessions')
                    .select(`*, instructors(*)`)
                    .eq('student_id', user.id)
                    .gte('end_time', new Date().toISOString())
                    .order('start_time', { ascending: true })
                    .limit(5),

                // 6. Fetch most recent 10-Hour Package Session (for completion timing)
                supabase
                    .from('ten_hour_package_sessions')
                    .select(`*, instructors(*)`)
                    .eq('student_id', user.id)
                    .order('start_time', { ascending: false })
                    .limit(1)
            ])

            // Log any errors with full details
            if (enrollmentResponse.error) {
                console.error('Dashboard Error (enrollments):', enrollmentResponse.error)
                console.error('Full error details:', JSON.stringify(enrollmentResponse.error, null, 2))
            }
            if (btwResponse.error) {
                console.error('Dashboard Error (btw):', btwResponse.error)
                console.error('Full BTW error details:', JSON.stringify(btwResponse.error, null, 2))
                console.error('Error message:', btwResponse.error.message)
                console.error('Error code:', btwResponse.error.code)
            }

            if (enrollmentResponse.data) setEnrollments(enrollmentResponse.data)
            if (btwResponse.data) {
                // Map starts_at/ends_at to start_time/end_time for compatibility
                const mappedBtw = btwResponse.data.map(session => ({
                    ...session,
                    start_time: session.starts_at,
                    end_time: session.ends_at,
                    // Ensure service_type is set for compatibility if missing
                    service_type: session.session_type === 'BTW' ? 'Behind the Wheel' : (session.session_type || 'Behind the Wheel')
                }))
                setUpcomingBtw(mappedBtw)
            }
            if (drivingResponse.data) setDrivingSessions(drivingResponse.data)
            if (allocationResponse.data) setBtwAllocation(allocationResponse.data)
            if (tenHourResponse.data) setTenHourSessions(tenHourResponse.data)
            if (latestTenHourResponse.data?.length) {
                setLatestTenHourSession(latestTenHourResponse.data[0])
            } else {
                setLatestTenHourSession(null)
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error)
            toast.error('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        refreshData()
    }, [refreshData])

    return { enrollments, upcomingBtw, tenHourSessions, latestTenHourSession, drivingSessions, btwAllocation, loading, refreshData }
}

export function useDriverEdProgress(enrollmentId: string) {
    const [attendance, setAttendance] = useState<SessionAttendance[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!enrollmentId) {
            setAttendance([])
            setLoading(false)
            return
        }

        const fetchProgress = async () => {
            try {
                const { data, error } = await supabase
                    .from('session_attendance')
                    .select(`*, course_sessions(*)`)
                    .eq('enrollment_id', enrollmentId)
                    .order('course_sessions(session_number)', { ascending: true })

                if (error) throw error
                setAttendance(data || [])
            } catch (error) {
                console.error('Error fetching progress:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchProgress()
    }, [enrollmentId])

    return { attendance, loading }
}

export function useBtwSessions() {
    const [sessions, setSessions] = useState<BtwSession[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data, error } = await supabase
                    .from('behind_the_wheel_sessions')
                    .select(`*`)
                    .eq('student_id', user.id)
                    .order('starts_at', { ascending: false })

                if (error) throw error
                const mappedSessions = (data || []).map(session => ({
                    ...session,
                    start_time: session.starts_at,
                    end_time: session.ends_at,
                    service_type: session.session_type === 'BTW' ? 'Behind the Wheel' : (session.session_type || 'Behind the Wheel')
                }))
                setSessions(mappedSessions)
            } catch (error) {
                console.error('Error fetching BTW sessions:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchSessions()
    }, [])

    return { sessions, loading }
}

export function useStudentHistory(enrollmentId?: string | null) {
    const [attendanceHistory, setAttendanceHistory] = useState<any[]>([])
    const [btwHistory, setBtwHistory] = useState<BtwSession[]>([])
    const [activeEnrollment, setActiveEnrollment] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                // 1. Fetch Driving Session History (BTW, Practice, Road Test, 10-Hour sessions)
                const [drivingResponse, btwResponse, tenHourResponse] = await Promise.all([
                    supabase
                        .from('driving_sessions')
                        .select(`*, instructors(*)`)
                        .eq('student_id', user.id)
                        .order('start_time', { ascending: false }),
                    supabase
                        .from('behind_the_wheel_sessions')
                        .select(`*`)
                        .eq('student_id', user.id)
                        .order('starts_at', { ascending: false }),
                    supabase
                        .from('ten_hour_package_sessions')
                        .select(`*, instructors(*)`)
                        .eq('student_id', user.id)
                        .order('start_time', { ascending: false })
                ])

                const drivingData = drivingResponse.data || []
                const btwData = (btwResponse.data || []).map(session => ({
                    ...session,
                    start_time: session.starts_at,
                    end_time: session.ends_at,
                    service_type: session.session_type === 'BTW' ? 'Behind the Wheel' : (session.session_type || 'Behind the Wheel')
                }))
                const tenHourData = (tenHourResponse.data || []).map(session => ({
                    ...session,
                    plan_key: 'ten_hour',
                    service_slug: 'ten-hour-package',
                    service_type: 'practice',
                    source: 'student_portal'
                }))

                // Combine and sort by start time descending
                const combinedHistory = [...drivingData, ...btwData, ...tenHourData].sort((a, b) =>
                    new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
                )

                setBtwHistory(combinedHistory)

                // 2. Fetch Driver's Ed Enrollment
                let query = supabase
                    .from('enrollments')
                    .select(`
                        id, 
                        class_id,
                        status,
                        grade,
                        btw_credits_granted,
                        final_grade,
                        completion_date,
                        classes (id, name),
                        courses (title)
                    `)
                    .or(`user_id.eq.${user.id},student_id.eq.${user.id}`)

                if (enrollmentId) {
                    query = query.eq('id', enrollmentId)
                } else {
                    query = query.in('status', ['active', 'enrolled', 'completed'])
                }

                const { data: enrollments } = await query

                if (enrollments && enrollments.length > 0) {
                    // Sort enrollments: Active > Enrolled > Completed > Others
                    const startOrder = ['active', 'enrolled', 'completed']
                    const sorted = enrollments.sort((a, b) => {
                        const indexA = startOrder.indexOf(a.status)
                        const indexB = startOrder.indexOf(b.status)
                        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB)
                    })

                    // Set requested or most relevant enrollment
                    setActiveEnrollment(sorted[0])
                }

            } catch (error) {
                console.error('Error fetching history:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchHistory()
    }, [enrollmentId])

    return { attendanceHistory, btwHistory, activeEnrollment, loading }
}
