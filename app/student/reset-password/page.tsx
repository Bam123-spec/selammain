"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Lock, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

const formSchema = z.object({
    password: z.string().min(8, {
        message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

export default function ResetPasswordPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    // Manually process recovery tokens from URL hash
    useEffect(() => {
        const processRecovery = async () => {
            const hashParams = new URLSearchParams(window.location.hash.substring(1))
            const accessToken = hashParams.get('access_token')
            const refreshToken = hashParams.get('refresh_token')
            const tokenType = hashParams.get('type')

            console.log('Recovery tokens:', { hasAccess: !!accessToken, hasRefresh: !!refreshToken, type: tokenType })

            if (accessToken && refreshToken && tokenType === 'recovery') {
                console.log('Setting session from URL hash...')
                const { data, error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                })

                if (error) {
                    console.error('Error setting session:', error)
                    toast.error("Invalid or expired session", {
                        description: "Please request a new password reset link.",
                    })
                } else {
                    console.log('Session set successfully!')
                // Clear the hash from the URL for security
                window.history.replaceState(null, '', window.location.pathname + window.location.search)
                }
            } else {
                // Check if we already have a session
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) {
                    console.error("No active session found")
                    toast.error("Invalid or expired session", {
                        description: "Please request a new password reset link.",
                    })
                } else {
                    console.log("Existing session found")
                }
            }
        }

        processRecovery()
    }, [router])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({
                password: values.password
            })

            if (error) {
                throw error
            }

            setIsSuccess(true)
            toast.success("Password updated successfully!", {
                description: "You can now log in with your new password.",
            })

            const next = searchParams.get('next') || "/student/dashboard"
            // Redirect after 2 seconds
            setTimeout(() => {
                router.push(next)
            }, 2000)
        } catch (error: any) {
            toast.error("Failed to update password", {
                description: error.message,
            })
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 text-center">
                    <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">
                        Password Updated!
                    </h2>
                    <p className="text-gray-600">
                        Redirecting you to the login page...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">
                        Set New Password
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Enter your new password below
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Enter new password"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Confirm new password"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? "Updating..." : "Update Password"}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    )
}
