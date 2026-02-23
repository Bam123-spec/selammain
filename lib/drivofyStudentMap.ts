import { supabaseAdmin } from './supabase/admin'

const DRIVOFY_API_URL = process.env.DRIVOFY_API_BASE_URL
const DRIVOFY_SECRET = process.env.DRIVOFY_PROXY_SECRET

export async function getDrivofyStudentId(drivingSchoolId: string): Promise<string | null> {
    const { data } = await supabaseAdmin
        .from('drivofy_student_map')
        .select('drivofy_student_id')
        .eq('driving_school_student_id', drivingSchoolId)
        .single()

    return data?.drivofy_student_id || null
}

export async function createMapping(drivingSchoolId: string, drivofyId: string) {
    const { error } = await supabaseAdmin
        .from('drivofy_student_map')
        .insert({
            driving_school_student_id: drivingSchoolId,
            drivofy_student_id: drivofyId
        })

    if (error) {
        console.error('Error creating mapping:', error)
        throw error
    }
}

export async function ensureDrivofyStudent(drivingSchoolId: string): Promise<string> {
    // 1. Check existing mapping
    const existingIds = await getDrivofyStudentId(drivingSchoolId)
    if (existingIds) return existingIds

    // 2. Fetch student profile
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name, phone')
        .eq('id', drivingSchoolId)
        .single()

    if (!profile) throw new Error('Student profile not found')

    // 3. Create student in Drivofy
    const res = await fetch(`${DRIVOFY_API_URL}/api/students/create`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${DRIVOFY_SECRET}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: profile.email,
            name: profile.full_name,
            phone: profile.phone,
            external_reference_id: drivingSchoolId
        })
    })

    if (!res.ok) {
        const error = await res.text()
        console.error('Failed to create Drivofy student:', error)
        throw new Error('Failed to sync student with Drivofy')
    }

    const data = await res.json()
    const drivofyId = data.id

    if (!drivofyId) throw new Error('Drivofy response missing ID')

    // 4. Save mapping
    await createMapping(drivingSchoolId, drivofyId)

    return drivofyId
}
