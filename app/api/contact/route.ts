
import { NextResponse } from 'next/server';
import { sendBrevoEmail } from '@/lib/email';

export const runtime = 'edge';
const CONTACT_INBOX_EMAIL = 'beamlaky9@gmail.com';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, message, source, requestType } = body;

        console.log("Contact API: Received submission", { name, email });

        if (!name || !email || !phone || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const normalizedSource = typeof source === "string" ? source.toLowerCase() : "";
        const normalizedRequestType = typeof requestType === "string" ? requestType.toLowerCase() : "";
        const isSameDayCallback =
            normalizedRequestType === "same_day_callback" ||
            (normalizedSource === "chatbot" && String(message).toLowerCase().includes("same-day callback"));

        const subject = isSameDayCallback
            ? `Urgent 🚨 Same-day callback request from ${name}`
            : `New Contact Form Submission from ${name}`;

        const htmlContent = isSameDayCallback
            ? `
                <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto;">
                    <h2 style="margin: 0 0 12px; color: #b91c1c;">Urgent 🚨 Same-day callback requested</h2>
                    <p style="margin: 0 0 16px;">A student requested a same-day callback from the chatbot. Please call them as soon as possible today.</p>
                    <div style="background: #fff7ed; border: 1px solid #fdba74; border-radius: 10px; padding: 14px; margin-bottom: 16px;">
                        <p style="margin: 0 0 6px;"><strong>Name:</strong> ${name}</p>
                        <p style="margin: 0 0 6px;"><strong>Email:</strong> ${email}</p>
                        <p style="margin: 0;"><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                    </div>
                    <p style="margin: 0 0 8px;"><strong>Message from student:</strong></p>
                    <p style="white-space: pre-wrap; background: #f9fafb; border: 1px solid #e5e7eb; padding: 14px; border-radius: 8px;">${message}</p>
                </div>
            `
            : `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>New Contact Message</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                    <hr />
                    <p><strong>Message:</strong></p>
                    <p style="white-space: pre-wrap; background: #f9f9f9; padding: 15px; border-radius: 5px;">${message}</p>
                </div>
            `;

        // Send email to admin
        await sendBrevoEmail({
            to: [{ email: CONTACT_INBOX_EMAIL, name: 'Selam Admin' }],
            subject,
            htmlContent,
        });

        // Optional: Send auto-reply to user? (Skipping for now unless requested)

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Contact API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
