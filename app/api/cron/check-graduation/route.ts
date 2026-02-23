
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendBrevoEmail, generateGraduationEmail } from '@/lib/email'
import { addHours, isBefore } from 'date-fns'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function GET(req: Request) {
    // Optional: Add a secret key check for security (e.g., Bearer token)
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return new Response('Unauthorized', { status: 401 });
    // }

    try {
        console.log('Starting graduation check...');

        // 1. Find potential graduates
        // Students who have used all their sessions (usually 3) and haven't seemingly been emailed
        const { data: allocations, error: allocError } = await supabaseAdmin
            .from('student_btw_allocations')
            .select(`
                student_id,
                sessions_used,
                total_included_sessions,
                graduation_email_sent,
                profiles:student_id (
                    full_name,
                    email,
                    phone
                )
            `)
            .gte('sessions_used', 3) // Assuming 3 is the threshold, or use the column comparison in code
            .eq('graduation_email_sent', false);

        if (allocError) throw allocError;

        if (!allocations || allocations.length === 0) {
            return NextResponse.json({ message: 'No new graduates found.' });
        }

        const results = [];

        for (const alloc of allocations) {
            // Check if they truly finished (>= total)
            if (alloc.sessions_used < alloc.total_included_sessions) continue;

            const studentId = alloc.student_id;
            // Handle potential array response from join
            const profilesData = alloc.profiles as any;
            const studentProfile = Array.isArray(profilesData) ? profilesData[0] : profilesData;

            if (!studentProfile || !studentProfile.email) continue;

            // 2. Check time of Last Session
            const { data: lastSession, error: sessionError } = await supabaseAdmin
                .from('driving_sessions')
                .select('end_time')
                .eq('student_id', studentId)
                .eq('status', 'completed') // Only count completed sessions
                .order('end_time', { ascending: false })
                .limit(1)
                .single();

            // If no completed sessions found (maybe marked used manually?), skip or send immediately?
            // Let's assume we need at least one completed session to verify the time.
            if (sessionError || !lastSession) {
                console.log(`Skipping ${studentId}: No completed sessions found.`);
                continue;
            }

            const lastSessionTime = new Date(lastSession.end_time);
            const twelveHoursAfter = addHours(lastSessionTime, 12);
            const now = new Date();

            // 3. Check 12-Hour Delay
            if (isBefore(now, twelveHoursAfter)) {
                console.log(`Skipping ${studentId}: 12 hour waiting period not met. (Wait until ${twelveHoursAfter.toISOString()})`);
                continue;
            }

            // 4. Send Email
            try {
                const emailHtml = generateGraduationEmail({
                    name: studentProfile.full_name || 'Student',
                    phoneNumber: '(240) 205-5942', // Hardcoded or env var
                    websiteUrl: 'https://selamdrivingschool.com'
                });

                await sendBrevoEmail({
                    to: [{ email: studentProfile.email, name: studentProfile.full_name }],
                    subject: 'Congratulations on completing your Driver\'s Ed! 🎉',
                    htmlContent: emailHtml,
                    sender: { name: 'Selam Driving School', email: 'no-reply@portifol.com' }
                });

                // 5. Update Flag
                await supabaseAdmin
                    .from('student_btw_allocations')
                    .update({ graduation_email_sent: true })
                    .eq('student_id', studentId);

                results.push({ student: studentProfile.email, status: 'Sent' });

            } catch (err) {
                console.error(`Failed to email ${studentId}:`, err);
                results.push({ student: studentProfile.email, status: 'Failed', error: err });
            }
        }

        return NextResponse.json({ success: true, processed: results });

    } catch (error) {
        console.error('Cron job failed:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
