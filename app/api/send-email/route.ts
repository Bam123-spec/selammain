
import { NextResponse } from 'next/server';
import { sendBrevoEmail, generateStudentBookingEmail, generateInstructorBookingEmail, generateGoogleCalendarUrl } from '@/lib/email';

export const runtime = 'edge';

export async function POST(request: Request) {
    console.log("Email API: Request received");

    try {
        const body = await request.json();
        const { name, email, service, date, time, instructor, emailType = 'student' } = body;

        if (!name || !email || !service || !date || !time) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://selamdrivingschool.com';
        const dashboardUrl = `${appUrl}/student/dashboard`;

        // Generate Google Calendar URL if date/time provided
        let googleCalendarUrl = '';
        if (date && time) {
            try {
                // Combine date and time to create a Date object
                const start = new Date(`${date} ${time}`);
                if (!isNaN(start.getTime())) {
                    googleCalendarUrl = generateGoogleCalendarUrl({
                        text: `Selam Driving School: ${service}`,
                        details: `Appointment for ${name}. Service: ${service}`,
                        location: '10111 Colesville Rd Suite 103, Silver Spring, MD 20901',
                        startDate: start,
                        durationMinutes: 120 // Default to 2 hours
                    });
                }
            } catch (e) {
                console.error("Failed to generate calendar URL in API:", e);
            }
        }

        if (emailType === 'instructor') {
            await sendBrevoEmail({
                to: [{ email: 'beamlaky9@gmail.com', name: 'Instructor' }],
                subject: 'New Booking Alert - Selam Driving School',
                htmlContent: generateInstructorBookingEmail({ name, email, service, date, time, instructor, dashboardUrl: '#', googleCalendarUrl })
            });
        } else {
            await sendBrevoEmail({
                to: [{ email, name }],
                subject: 'Booking Confirmation - Selam Driving School',
                htmlContent: generateStudentBookingEmail({ name, email, service, date, time, instructor, dashboardUrl, googleCalendarUrl })
            });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Email API Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            message: error.message
        }, { status: 500 });
    }
}
