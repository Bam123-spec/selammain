"use client"
export const runtime = 'edge';

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
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
import { Lock, Mail, Loader2, Eye, EyeOff, User } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

const formSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    password: z.string().min(1, {
        message: "Password is required.",
    }),
})

export default function StudentLoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        const processMagicLink = async () => {
            const hashParams = new URLSearchParams(window.location.hash.substring(1))
            const accessToken = hashParams.get("access_token")
            const refreshToken = hashParams.get("refresh_token")

            if (accessToken && refreshToken) {
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                })

                if (error) {
                    console.error("Magic link session error:", error)
                    toast.error("Magic link expired or invalid.")
                    return
                }

                window.history.replaceState(null, "", window.location.pathname + window.location.search)
                const searchParams = new URLSearchParams(window.location.search)
                const next = searchParams.get("next") || "/student/dashboard"
                router.replace(next)
            }
        }

        processMagicLink()
    }, [router])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })



    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: values.email,
                password: values.password,
            })

            if (error) {
                throw error
            }

            if (data.user) {
                toast.success("Login successful!", {
                    description: "Welcome back to your student portal.",
                })

                // Get redirect path from URL
                const searchParams = new URLSearchParams(window.location.search)
                const next = searchParams.get('next')
                const isSignupSuccess = searchParams.get('signup') === 'success'

                // Force a hard refresh of the auth state for components listening
                router.refresh()

                let redirectPath = next || "/student/dashboard"
                if (isSignupSuccess && !next) {
                    redirectPath = "/student/dashboard?signup=success"
                }

                router.push(redirectPath)
            }
        } catch (error: any) {
            let errorMessage = error.message || "Invalid email or password."

            // Improve generic Supabase error message
            if (errorMessage === "Invalid login credentials") {
                errorMessage = "Incorrect email or password. Please try again."
            }

            toast.error("Login failed", {
                description: errorMessage,
            })

            // Also set form error to make it visible on the input
            form.setError("password", {
                type: "manual",
                message: errorMessage
            })
            form.setFocus("password")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <User className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        Student Portal
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Sign in to manage your lessons and track progress
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email address</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                <Input className="pl-10" placeholder="student@example.com" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    className="pl-10 pr-10"
                                                    placeholder="••••••••"
                                                    autoComplete="current-password"
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-5 w-5" />
                                                    ) : (
                                                        <Eye className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <Link href="/student/forgot-password" title="Go to forgot password page" className="font-medium text-primary hover:text-primary/80">
                                    Forgot your password?
                                </Link>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full font-bold h-12 text-base rounded-xl"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign in"
                            )}
                        </Button>


                    </form>
                </Form>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{" "}
                        <Link href="/student/signup" className="font-medium text-primary hover:text-primary/80">
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
