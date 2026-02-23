"use client"

export const runtime = "edge"

import { useState } from "react"
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
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

import { requestPasswordReset } from "@/app/actions/auth"

const formSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
})

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const result = await requestPasswordReset(values.email)

            if (!result.success) {
                throw new Error(result.error || "Could not send reset link")
            }

            setIsSubmitted(true)
            toast.success("Reset link sent!", {
                description: "Check your email for the password reset link.",
            })
        } catch (error: any) {
            toast.error("Error", {
                description: error.message || "Could not send reset link. Please try again.",
            })
        } finally {
            setIsLoading(false)
        }
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 text-center">
                    <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">Check your email</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        We've sent a password reset link to <span className="font-semibold text-gray-900">{form.getValues('email')}</span>.
                    </p>
                    <div className="mt-8">
                        <Link href="/student/login">
                            <Button className="w-full font-bold h-12 text-base">
                                Back to login
                            </Button>
                        </Link>
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
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900">Forgot password?</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
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

                        <Button
                            type="submit"
                            className="w-full font-bold h-12 text-base"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending link...
                                </>
                            ) : (
                                "Send reset link"
                            )}
                        </Button>

                        <div className="text-center">
                            <Link href="/student/login" className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to login
                            </Link>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}
