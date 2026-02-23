"use client"

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { useState } from "react"
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
import { Lock, User, Mail, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { adminSignUp } from "@/app/actions/auth"
import { supabase } from "@/lib/supabaseClient"

const formSchema = z.object({
    fullName: z.string().min(2, {
        message: "Full name must be at least 2 characters.",
    }),
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    password: z.string().min(6, {
        message: "Password must be at least 6 characters.",
    }),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

export default function StudentSignupPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)

        console.log('Client: Signup form submitted:', { email: values.email, name: values.fullName })
        try {
            console.log('Client: Calling adminSignUp server action...')
            const result = await adminSignUp({
                email: values.email,
                password: values.password,
                fullName: values.fullName
            })
            console.log('Client: server action result:', result)

            if (!result.success) {
                throw new Error((result as any).error || "Signup failed")
            }

            if (result.user) {
                setIsSuccess(true)
                toast.success("Account created successfully!")
            }
        } catch (error: any) {
            toast.error("Signup failed", {
                description: error.message || "An error occurred during signup.",
            })
        } finally {
            setIsLoading(false)
        }
    }



    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary/30 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-border text-center">
                    <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>

                    <h2 className="text-3xl font-black text-gray-900 mb-2">
                        Check Your Email!
                    </h2>

                    <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                        We've sent a welcome confirmation to your inbox. <br />
                        Please check your email to access your student portal.
                    </p>

                    <div className="space-y-4">
                        <Button className="w-full h-12 text-lg font-bold rounded-xl" asChild>
                            <Link href="https://mail.google.com" target="_blank">
                                Go to Email (Gmail)
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full h-12 text-lg font-bold rounded-xl" asChild>
                            <Link href="/student/login">
                                Back to Login
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <User className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        Create Account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Join Selam Driving School today
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                <Input className="pl-10" placeholder="John Doe" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email address</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
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
                                                    autoComplete="new-password"
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
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                                <Input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    className="pl-10 pr-10"
                                                    placeholder="••••••••"
                                                    autoComplete="new-password"
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                                                >
                                                    {showConfirmPassword ? (
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

                        <Button
                            type="submit"
                            className="w-full font-bold h-12 text-base rounded-xl"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                "Sign Up"
                            )}
                        </Button>


                    </form>
                </Form>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        Already have an account?{" "}
                        <Link href="/student/login" className="font-medium text-primary hover:text-primary/80">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
