export interface Student {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    avatar_url?: string; // Add avatar_url
    status: 'active' | 'completed' | 'dropped';
    created_at: string;
    driving_balance_sessions?: number;
    driving_balance_hours?: number;
    btw_cooldown_until?: string;
    btw_access_enabled?: boolean;
    ten_hour_package_paid?: boolean;
    ten_hour_sessions_total?: number;
    ten_hour_sessions_used?: number;
    enrollments?: {
        status: string;
        grade?: string;
        btw_credits_granted?: boolean;
        class_id?: string;
        completion_date?: string;
    }[]
}

export interface Course {
    id: string;
    title: string;
    slug: string;
    description?: string;
    type: 'drivers_ed' | 'alcohol_drug';
    total_sessions: number;
    created_at: string;
}

export interface Enrollment {
    id: string;
    user_id: string;
    course_id: string;
    class_id?: string;
    status: 'active' | 'completed' | 'expired' | 'enrolled' | 'pending_payment';
    enrolled_at: string;
    completed_at?: string;
    courses?: Course | Course[];
    classes?: any | any[]; // Joined data
    certification_status?: 'Pending' | 'Approved' | 'certified' | 'denied';
    payment_status?: 'pending' | 'paid' | 'partial';
    grade?: string;
    final_grade?: string | number;
    btw_credits_granted?: boolean;
    class_type?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
}

export interface CourseSession {
    id: string;
    course_id: string;
    session_number: number;
    title: string;
    scheduled_at?: string;
    zoom_link?: string;
    created_at: string;
}

export interface SessionAttendance {
    id: string;
    enrollment_id: string;
    course_session_id: string;
    status: 'present' | 'absent' | 'makeup_required';
    quiz_score?: number;
    marked_at?: string;
    notes?: string;
    created_at: string;
    course_sessions?: CourseSession; // Joined data
}

export interface BtwPackage {
    id: string;
    name: string;
    included_sessions: number;
    session_duration_minutes: number;
    created_at: string;
}

export interface StudentBtwAllocation {
    id: string;
    student_id: string;
    package_id: string;
    total_included_sessions: number;
    sessions_used: number;
    created_at: string;
    behind_the_wheel_packages?: BtwPackage; // Joined data
}

export interface Instructor {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    created_at: string;
}

export interface BtwSession {
    id: string;
    student_id: string;
    instructor_id?: string;
    start_time: string;
    end_time: string;
    plan_key?: string;
    service_type: string;
    service_slug?: string;
    source?: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
    notes?: string;
    created_at: string;
    instructors?: Instructor; // Joined data
}

export interface TenHourSession {
    id: string;
    student_id: string;
    instructor_id: string;
    start_time: string;
    end_time: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
    created_at: string;
    instructors?: Instructor; // Joined data
}
