
const LOGO_URL = process.env.EMAIL_LOGO_URL ||
    'https://fiyhiarkugmakobbqxam.supabase.co/storage/v1/object/public/email-assets/selam-logo.png';

export interface EmailPayload {
    to: { email: string; name?: string }[];
    subject: string;
    htmlContent: string;
    sender?: { email: string; name: string };
}

async function postBrevoEmail(apiKey: string, body: Record<string, unknown>) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown upstream error' }));
        throw new Error(JSON.stringify(errorData));
    }

    return response.json();
}

export async function sendBrevoEmail(payload: EmailPayload) {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail =
        process.env.BREVO_SENDER_EMAIL ||
        process.env.NEXT_PUBLIC_SENDER_EMAIL ||
        'selamdrivingschool@gmail.com';
    const fallbackSenderEmail =
        process.env.BREVO_FALLBACK_SENDER_EMAIL ||
        'selamdrivingschool@gmail.com';
    const senderName = process.env.BREVO_SENDER_NAME || "Selam Driving School";

    if (!apiKey) {
        throw new Error("Missing BREVO_API_KEY");
    }

    const resolvedSender = payload.sender || {
        name: senderName,
        email: senderEmail
    };

    const requestBody = {
        sender: resolvedSender,
        to: payload.to,
        subject: payload.subject,
        htmlContent: payload.htmlContent
    };

    try {
        return await postBrevoEmail(apiKey, requestBody);
    } catch (error) {
        const canRetryWithFallback =
            !payload.sender &&
            fallbackSenderEmail &&
            fallbackSenderEmail !== resolvedSender.email;

        if (!canRetryWithFallback) {
            throw error;
        }

        console.warn("Brevo send failed with configured sender, retrying with fallback sender.");
        return postBrevoEmail(apiKey, {
            ...requestBody,
            sender: {
                name: senderName,
                email: fallbackSenderEmail
            }
        });
    }
}

interface BookingEmailParams {
    name: string;
    email: string;
    service: string;
    date: string;
    time: string;
    instructor?: string;
    dashboardUrl: string;
    googleCalendarUrl?: string;
    phone?: string;
    endDate?: string;
}

export function generateGoogleCalendarUrl(params: {
    text: string;
    details: string;
    location: string;
    startDate: Date;
    durationMinutes: number;
}) {
    const formatGoogleDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const start = formatGoogleDate(params.startDate);
    const end = formatGoogleDate(new Date(params.startDate.getTime() + params.durationMinutes * 60000));

    const baseUrl = 'https://www.google.com/calendar/render?action=TEMPLATE';
    const url = new URL(baseUrl);
    url.searchParams.set('text', params.text);
    url.searchParams.set('dates', `${start}/${end}`);
    url.searchParams.set('details', params.details);
    url.searchParams.set('location', params.location);

    return url.toString();
}

export function generateStudentBookingEmail({ name, service, date, time, instructor, dashboardUrl, googleCalendarUrl, phone }: BookingEmailParams) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmed - Selam Driving School</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f4f7f9;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f7f9; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin: 0 20px;">
                    <!-- Header with Logo -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px;">
                            <img src="${LOGO_URL}" alt="Selam Driving School" style="max-width: 140px; height: auto;">
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <h1 style="font-size: 28px; font-weight: 800; color: #111; margin: 0 0 16px; text-align: center;">Booking Confirmed! ✅</h1>
                            <p style="font-size: 16px; color: #666; margin: 0 0 32px; text-align: center;">Hi <strong>${name}</strong>, your driving session has been successfully scheduled. We look forward to seeing you!</p>
                            
                            <!-- Detail Card -->
                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 32px; margin-bottom: 32px;">
                                <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                    <tr>
                                        <td style="padding-bottom: 20px;">
                                            <p style="text-transform: uppercase; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; margin: 0 0 4px;">Service</p>
                                            <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0;">${service}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-bottom: 20px;">
                                            <p style="text-transform: uppercase; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; margin: 0 0 4px;">Date & Time</p>
                                            <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0;">${date} at ${time}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-bottom: 20px;">
                                            <p style="text-transform: uppercase; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; margin: 0 0 4px;">Instructor</p>
                                            <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0;">${instructor || 'Assigned Instructor'}</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-bottom: 20px;">
                                            <p style="text-transform: uppercase; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; margin: 0 0 4px;">Location</p>
                                            <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0;">Silver Spring, MD</p>
                                        </td>
                                    </tr>
                                    ${phone ? `
                                    <tr>
                                        <td>
                                            <p style="text-transform: uppercase; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; margin: 0 0 4px;">Phone</p>
                                            <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0;">${phone}</p>
                                        </td>
                                    </tr>
                                    ` : ''}
                                </table>
                            </div>

                            <!-- CTA Button -->
                            <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="center" style="padding-bottom: 16px;">
                                        <a href="${dashboardUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; text-decoration: none; padding: 18px 40px; border-radius: 14px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">Manage Booking / Reschedule</a>
                                    </td>
                                </tr>
                                ${googleCalendarUrl ? `
                                <tr>
                                    <td align="center">
                                        <a href="${googleCalendarUrl}" style="display: inline-block; background-color: #ffffff; color: #2563eb; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; text-decoration: none; padding: 12px 24px; border: 2px solid #e2e8f0; border-radius: 12px;">🗓️ Add to Google Calendar</a>
                                    </td>
                                </tr>
                                ` : ''}
                            </table>

                            <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                                <p style="font-size: 14px; color: #94a3b8; margin: 0;">Questions? Email us at <a href="mailto:selamdrivingschool@gmail.com" style="color: #2563eb; text-decoration: none; font-weight: 600;">selamdrivingschool@gmail.com</a></p>
                            </div>
                        </td>
                    </tr>
                </table>
                
                <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px;">&copy; ${new Date().getFullYear()} Selam Driving School. All rights reserved.</p>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
}

export function generateInstructorBookingEmail({ name, email, service, date, time, instructor, googleCalendarUrl, phone }: BookingEmailParams) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>New Booking Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="${LOGO_URL}" alt="Selam Driving School Logo" style="max-width: 150px; height: auto;">
        </div>
        <h1 style="color: #111;">You have a new booking 📅</h1>
        <p>Hi there,</p>
        <p>A new lesson/class has been scheduled. Here are the details:</p>
        
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Student:</strong> ${name}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            ${phone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${phone}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Service:</strong> ${service}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
            ${instructor ? `<p style="margin: 5px 0;"><strong>Instructor:</strong> ${instructor}</p>` : ''}
        </div>

        <p>Please check your dashboard for more details.</p>
        
        ${googleCalendarUrl ? `
        <div style="margin-top: 30px; text-align: center;">
            <a href="${googleCalendarUrl}" style="display: inline-block; background-color: #4285F4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                📅 Add to Google Calendar
            </a>
        </div>
        ` : ''}
    </div>
</body>
</html>
    `;
}

export function generateDriversEdBookingEmail({
    name,
    service,
    date,
    time,
    endDate,
    dashboardUrl,
    phone,
    googleCalendarUrl
}: BookingEmailParams) {
    const dateDisplay = endDate ? `${date} - ${endDate}` : date
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Driver's Ed Booking Confirmed</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111; margin: 0; padding: 0; background-color: #f4f7f9;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f7f9; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" style="max-width: 620px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); margin: 0 20px;">
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px;">
                            <img src="${LOGO_URL}" alt="Selam Driving School" style="max-width: 140px; height: auto;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <h1 style="font-size: 28px; font-weight: 800; color: #0f172a; margin: 0 0 12px; text-align: center;">Driver's Education Confirmed ✅</h1>
                            <p style="font-size: 16px; color: #475569; margin: 0 0 28px; text-align: center;">Hi <strong>${name}</strong>, you're enrolled in Driver's Education. Below are your class details and next steps.</p>

                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 28px; margin-bottom: 24px;">
                                <p style="text-transform: uppercase; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; margin: 0 0 6px;">Program</p>
                                <p style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 16px;">${service}</p>
                                <p style="text-transform: uppercase; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; margin: 0 0 6px;">Course Dates</p>
                                <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 16px;">${dateDisplay}</p>
                                <p style="text-transform: uppercase; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; margin: 0 0 6px;">Class Time</p>
                                <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 16px;">${time}</p>
                                <p style="text-transform: uppercase; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; margin: 0 0 6px;">Location</p>
                                <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0;">Silver Spring, MD</p>
                                ${phone ? `<p style="margin: 16px 0 0; font-size: 14px; color: #475569;"><strong>Phone on file:</strong> ${phone}</p>` : ''}
                            </div>

                            <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 16px; padding: 18px 20px; margin-bottom: 24px;">
                                <p style="margin: 0 0 8px; font-weight: 700; color: #9a3412; text-transform: uppercase; font-size: 12px; letter-spacing: 0.08em;">Next Steps</p>
                                <ul style="margin: 0; padding-left: 18px; color: #7c2d12; font-size: 14px; line-height: 1.6;">
                                    <li>Arrive 15 minutes early on your first day.</li>
                                    <li>Bring your learner's permit or photo ID.</li>
                                    <li>Check your email for updates or scheduling changes.</li>
                                </ul>
                            </div>

                            <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="center" style="padding-bottom: 14px;">
                                        <a href="${dashboardUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; text-decoration: none; padding: 16px 36px; border-radius: 14px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">Manage Booking / Reschedule</a>
                                    </td>
                                </tr>
                                ${googleCalendarUrl ? `
                                <tr>
                                    <td align="center">
                                        <a href="${googleCalendarUrl}" style="display: inline-block; background-color: #ffffff; color: #2563eb; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; text-decoration: none; padding: 12px 24px; border: 2px solid #e2e8f0; border-radius: 12px;">🗓️ Add to Google Calendar</a>
                                    </td>
                                </tr>
                                ` : ''}
                            </table>

                            <div style="margin-top: 36px; padding-top: 28px; border-top: 1px solid #e2e8f0; text-align: center;">
                                <p style="font-size: 14px; color: #94a3b8; margin: 0;">Questions? Email us at <a href="mailto:selamdrivingschool@gmail.com" style="color: #2563eb; text-decoration: none; font-weight: 600;">selamdrivingschool@gmail.com</a></p>
                            </div>
                        </td>
                    </tr>
                </table>
                <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 28px;">&copy; ${new Date().getFullYear()} Selam Driving School. All rights reserved.</p>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
}

export function generateRsepDipBookingEmail({
    name,
    service,
    date,
    time,
    endDate,
    dashboardUrl,
    phone,
    googleCalendarUrl
}: BookingEmailParams) {
    const dateDisplay = endDate ? `${date} - ${endDate}` : date
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${service} Booking Confirmed</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111; margin: 0; padding: 0; background-color: #f4f7f9;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f7f9; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" style="max-width: 620px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); margin: 0 20px;">
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px;">
                            <img src="${LOGO_URL}" alt="Selam Driving School" style="max-width: 140px; height: auto;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <h1 style="font-size: 28px; font-weight: 800; color: #0f172a; margin: 0 0 12px; text-align: center;">Booking Confirmed ✅</h1>
                            <p style="font-size: 16px; color: #475569; margin: 0 0 24px; text-align: center;">Hi <strong>${name}</strong>, your ${service} session is confirmed.</p>

                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 28px; margin-bottom: 22px;">
                                <p style="text-transform: uppercase; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; margin: 0 0 6px;">Session</p>
                                <p style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 16px;">${service}</p>
                                <p style="text-transform: uppercase; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; margin: 0 0 6px;">Date</p>
                                <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 16px;">${dateDisplay}</p>
                                <p style="text-transform: uppercase; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; margin: 0 0 6px;">Time</p>
                                <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 16px;">${time}</p>
                                <p style="text-transform: uppercase; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; margin: 0 0 6px;">Location</p>
                                <p style="font-size: 16px; font-weight: 600; color: #0f172a; margin: 0;">Silver Spring, MD</p>
                                ${phone ? `<p style="margin: 16px 0 0; font-size: 14px; color: #475569;"><strong>Phone on file:</strong> ${phone}</p>` : ''}
                            </div>

                            <div style="background-color: #ecfeff; border: 1px solid #a5f3fc; border-radius: 16px; padding: 18px 20px; margin-bottom: 22px;">
                                <p style="margin: 0 0 8px; font-weight: 700; color: #0e7490; text-transform: uppercase; font-size: 12px; letter-spacing: 0.08em;">Before You Arrive</p>
                                <ul style="margin: 0; padding-left: 18px; color: #0f4c5c; font-size: 14px; line-height: 1.6;">
                                    <li>Arrive 15 minutes early to check in.</li>
                                    <li>Bring a valid photo ID or learner's permit.</li>
                                    <li>Check your email for any updates or materials.</li>
                                </ul>
                            </div>

                            <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="center" style="padding-bottom: 14px;">
                                        <a href="${dashboardUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; text-decoration: none; padding: 16px 36px; border-radius: 14px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">Manage Booking / Reschedule</a>
                                    </td>
                                </tr>
                                ${googleCalendarUrl ? `
                                <tr>
                                    <td align="center">
                                        <a href="${googleCalendarUrl}" style="display: inline-block; background-color: #ffffff; color: #2563eb; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; text-decoration: none; padding: 12px 24px; border: 2px solid #e2e8f0; border-radius: 12px;">🗓️ Add to Google Calendar</a>
                                    </td>
                                </tr>
                                ` : ''}
                            </table>

                            <div style="margin-top: 36px; padding-top: 28px; border-top: 1px solid #e2e8f0; text-align: center;">
                                <p style="font-size: 14px; color: #94a3b8; margin: 0;">Questions? Email us at <a href="mailto:selamdrivingschool@gmail.com" style="color: #2563eb; text-decoration: none; font-weight: 600;">selamdrivingschool@gmail.com</a></p>
                            </div>
                        </td>
                    </tr>
                </table>
                <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 28px;">&copy; ${new Date().getFullYear()} Selam Driving School. All rights reserved.</p>
            </td>
        </tr>
    </table>
</body>
</html>
  `;
}

interface GraduationEmailParams {
    name: string;
    phoneNumber: string;
    websiteUrl: string;
}

export function generateGraduationEmail({ name, phoneNumber, websiteUrl }: GraduationEmailParams) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Congratulations Graduate! - Selam Driving School</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f4f7f9;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f7f9; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin: 0 20px;">
                    <!-- Header with Logo -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px;">
                            <img src="${LOGO_URL}" alt="Selam Driving School" style="max-width: 140px; height: auto;">
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <h1 style="font-size: 28px; font-weight: 800; color: #111; margin: 0 0 16px; text-align: center;">Congratulations, ${name}! 🎉</h1>
                            <p style="font-size: 16px; color: #666; margin: 0 0 24px; text-align: center;">
                                Congratulations on completing your 36 hours of driver’s education with Selam Driving School! You’re one step closer to earning your driver’s license, and we’re proud of the progress you’ve made.
                            </p>
                            
                            <hr style="border: none; border-top: 1px solid #edf2f7; margin: 32px 0;">

                            <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
                                <h3 style="margin: 0 0 12px; font-size: 18px; color: #0f172a;">What's Next?</h3>
                                
                                <p style="margin: 0 0 16px; font-size: 15px; color: #475569;">
                                    <strong>Want more practice?</strong><br> If you’d like more practice behind the wheel, you can schedule extra driving sessions with one of our instructors at any time.
                                </p>
                                
                                <p style="margin: 0; font-size: 15px; color: #475569;">
                                    <strong>Ready for the test?</strong><br> If you feel confident and ready, you may book your official MVA Road Test and take the final step toward getting your license.
                                </p>
                            </div>

                            <p style="font-size: 15px; color: #666; margin: 0 0 32px; text-align: center;">
                                If you have any questions or need help scheduling, we’re always happy to help.
                            </p>

                            <p style="font-size: 14px; color: #94a3b8; text-align: center; margin: 0;">
                                Best regards,<br>
                                <strong>Selam Driving School</strong><br>
                                ${phoneNumber} | ${websiteUrl}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 24px 40px; text-align: center;">
                            <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                                © ${new Date().getFullYear()} Selam Driving School. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

export function generateBtwCompletionEmail({ name, dashboardUrl }: { name: string, dashboardUrl: string }) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://selamdrivingschool.com';
    const practiceUrl = `${baseUrl}/booking?plan=driving-practice-2hr`;
    const roadTestUrl = `${baseUrl}/services/road-test-packages`;
    const tenHourUrl = `${baseUrl}/services/driving-practice-packages/10-hour`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Congratulations! - BTW Training Completed</title>
</head>
<body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #f4f7f9;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f7f9; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin: 0 20px;">
                    <!-- Header with Logo -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px;">
                            <img src="${LOGO_URL}" alt="Selam Driving School" style="max-width: 140px; height: auto;">
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <h1 style="font-size: 28px; font-weight: 800; color: #111; margin: 0 0 16px; text-align: center;">Congratulations, ${name}! 🎉</h1>
                            <p style="font-size: 16px; color: #666; margin: 0 0 32px; text-align: center;">You've officially completed your 36-hour Driver's Education program and all Behind-the-Wheel sessions with Selam Driving School. We're so proud of the progress you've made.</p>
                            
                            <!-- Message Card -->
                            <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 20px; padding: 32px; margin-bottom: 32px; text-align: center;">
                                <p style="font-size: 16px; font-weight: 600; color: #166534; margin: 0;">
                                    Ready for the next step? Choose a service below to keep building confidence, prepare for your road test, or get an extended package.
                                </p>
                            </div>

                            <!-- CTA Buttons -->
                            <table width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="center">
                                        <a href="${practiceUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; text-decoration: none; padding: 16px 28px; border-radius: 12px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);">Book 2‑Hour Extra Driving Practice</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 14px;">
                                        <a href="${roadTestUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; text-decoration: none; padding: 16px 28px; border-radius: 12px; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.25);">Book Road Test Service</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 14px;">
                                        <a href="${tenHourUrl}" style="display: inline-block; background-color: #f59e0b; color: #111827; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; text-decoration: none; padding: 16px 28px; border-radius: 12px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.25);">Get the 10‑Hour Driving Package</a>
                                    </td>
                                </tr>
                            </table>

                            <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                                <p style="font-size: 14px; color: #94a3b8; margin: 0;">Questions? Email us at <a href="mailto:selamdrivingschool@gmail.com" style="color: #2563eb; text-decoration: none; font-weight: 600;">selamdrivingschool@gmail.com</a></p>
                            </div>
                        </td>
                    </tr>
                </table>
                
                <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 32px;">&copy; ${new Date().getFullYear()} Selam Driving School. All rights reserved.</p>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}
