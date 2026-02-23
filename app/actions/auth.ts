"use server"

import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendBrevoEmail } from '@/lib/email'

export async function adminSignUp({
    email,
    password,
    fullName
}: {
    email: string
    password: string
    fullName: string
}) {
    console.log('--- adminSignUp starting ---')
    console.log(`Email: ${email}, Name: ${fullName}`)

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://selamdrivingschool.com').replace(/\/$/, '')

    try {
        console.log('Signup: Attempting to create user in Supabase Auth...')
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName, // Use full_name to match schema perfectly
                name: fullName, // Keep name for backward compatibility
                role: 'student'
            }
        })

        if (error) {
            console.error('Signup: Supabase admin.createUser failure:', error)
            throw error
        }

        console.log('Signup: Auth user created successfully:', data.user?.id)

        // Robustness: Verify profile exists, creating it manually if trigger failed
        if (data.user?.id) {
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('id', data.user.id)
                .single()

            if (!profile) {
                console.warn('Signup: Profile missing (trigger issue?), attempting manual creation...')
                const { error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .insert({
                        id: data.user.id,
                        email: email,
                        full_name: fullName,
                        role: 'student'
                    })

                if (profileError) {
                    console.error('Signup: Manual profile creation failed:', profileError)
                    // Continue, but warn. Linking might fail.
                } else {
                    console.log('Signup: Manual profile created.')
                }
            }
        }

        // 1. Build student magic link for one-click portal access
        let portalAccessLink = `${appUrl}/student/login?next=/student/dashboard`
        try {
            const redirectTo = `${appUrl}/student/magic?next=${encodeURIComponent('/student/dashboard')}&email=${encodeURIComponent(email)}`
            const { data: magicLinkData, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email,
                options: {
                    redirectTo,
                },
            })

            if (!magicLinkError && magicLinkData?.properties?.action_link) {
                portalAccessLink = magicLinkData.properties.action_link
            } else {
                console.error('Signup: Failed to generate magic link, using login fallback:', magicLinkError)
            }
        } catch (magicLinkException) {
            console.error('Signup: Magic link exception, using login fallback:', magicLinkException)
        }

        // 2. Send Welcome Email
        console.log('Signup: Preparing welcome email...')
        try {
            await sendBrevoEmail({
                to: [{ email, name: fullName }],
                subject: "Welcome to Selam Driving School! 🚗",
                htmlContent: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <img src="${appUrl}/selam-logo.png" alt="Selam Driving School Logo" style="max-width: 150px; height: auto;">
                        </div>
                        <h1>Welcome to Selam Driving School!</h1>
                        <p>Hi ${fullName},</p>
                        <p>Your account has been successfully created. We're excited to help you on your journey to becoming a safe and confident driver.</p>
                        <p>Use the secure button below to open your student portal instantly:</p>
                        <p><a href="${portalAccessLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Open Student Portal</a></p>
                        <p style="font-size: 12px; color: #64748b; word-break: break-all;">If the button doesn't work, use this link: <a href="${portalAccessLink}">${portalAccessLink}</a></p>
                        <p>Inside your portal, you can:</p>
                        <ul>
                            <li>Book driving lessons</li>
                            <li>Track your progress</li>
                            <li>View your schedule</li>
                        </ul>
                        <p>If you have any questions, feel free to reply to this email.</p>
                        <p>Best regards,<br>Selam Driving School Team</p>
                    </div>
                `
            })
            console.log('Welcome email sent successfully')
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError)
            // Don't fail the signup if email fails, but log it
        }

        const userId = data.user?.id

        if (userId) {
            console.log('Signup: Linking existing enrollments/bookings...')
            // 2. Link Existing Enrollments (Guest Checkouts)
            const { error: enrollmentError } = await supabaseAdmin
                .from('enrollments')
                .update({ user_id: userId, student_id: userId })
                .eq('email', email)
                .is('user_id', null)

            if (enrollmentError) {
                console.error('Signup: Error linking enrollments (email column):', enrollmentError)
            } else {
                console.log('Signup: Linked existing enrollments for user via email column')
            }

            // 2b. Link Existing Enrollments (fallback for JSONB customer_details)
            const { error: jsonEnrollmentError } = await supabaseAdmin
                .from('enrollments')
                .update({ user_id: userId, student_id: userId })
                .eq('customer_details->>email', email)
                .is('user_id', null)

            if (jsonEnrollmentError) {
                console.error('Signup: Error linking enrollments (JSONB):', jsonEnrollmentError)
            } else {
                console.log('Signup: Linked existing enrollments for user via JSONB email')
            }

            // 3. Link Existing Bookings (Guest Bookings)
            const { error: bookingError } = await supabaseAdmin
                .from('bookings')
                .update({ user_id: userId })
                .eq('student_email', email)
                .is('user_id', null)

            if (bookingError) {
                console.error('Signup: Error linking bookings:', bookingError)
            } else {
                console.log('Signup: Linked existing bookings for user')
            }
        }

        return { success: true, user: data.user }
    } catch (error: any) {
        console.error('Signup exception caught:', error)
        return { success: false, error: error.message }
    }
}

export async function requestPasswordReset(email: string) {
    console.log('--- requestPasswordReset starting ---')
    console.log(`Email: ${email}`)

    const origin = (process.env.NEXT_PUBLIC_APP_URL || 'https://selamdrivingschool.com').replace(/\/$/, '')

    try {
        // Generate recovery link using admin API
        console.log('Reset Password: Generating recovery link for:', email)

        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: `${origin}/student/reset-password`
            }
        })

        if (error) {
            console.error('Reset Password: Link generation error:', error)
            // Don't reveal if user exists or not (security best practice)
            if (error.status === 404 || error.message.includes('User not found')) {
                return { success: true }
            }
            throw error
        }

        // Extract the recovery link - this contains all the tokens
        // The link goes to Supabase's /auth/v1/verify endpoint which then redirects to our app
        const resetLink = data.properties.action_link
        console.log('Reset Password: Link generated successfully')

        // Send Reset Email via Brevo
        try {
            await sendBrevoEmail({
                to: [{ email }],
                subject: "Reset Your Password - Selam Driving School 🚗",
                htmlContent: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                        <div style="text-align: center; margin-bottom: 24px;">
                            <img src="${origin}/selam-logo.png" alt="Selam Driving School Logo" style="max-width: 150px; height: auto;">
                        </div>
                        <h1 style="color: #111; font-size: 24px; font-weight: 800; margin-bottom: 16px;">Password Reset Request</h1>
                        <p>Hello,</p>
                        <p>We received a request to reset the password for your Selam Driving School account. Click the button below to set a new password:</p>
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);">Reset Password</a>
                        </div>
                        <p style="font-size: 14px; color: #666;">If you didn't request a password reset, you can safely ignore this email. This link will expire in 24 hours.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
                        <p style="font-size: 12px; color: #999; text-align: center;">&copy; ${new Date().getFullYear()} Selam Driving School. All rights reserved.</p>
                    </div>
                `
            })
            console.log('Reset Password: Email sent successfully via Brevo')
        } catch (emailError) {
            console.error('Reset Password: Email delivery failure:', emailError)
            throw new Error("Failed to send reset email. Please try again later.")
        }

        return { success: true }
    } catch (error: any) {
        console.error('Reset Password: Exception caught:', error)
        return { success: false, error: error.message }
    }
}
