"use client"

import * as React from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Send } from "lucide-react"

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Name must be at least 2 characters.",
    }),
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
    phone: z.string().min(10, {
        message: "Please enter a valid phone number.",
    }),
    message: z.string().min(10, {
        message: "Message must be at least 10 characters.",
    }),
})

export function ContactForm() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            message: "",
        },
    })

    const [isLoading, setIsLoading] = React.useState(false)

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            })

            if (!response.ok) {
                throw new Error('Failed to send message')
            }

            toast.success("Message sent successfully!", {
                description: "We'll get back to you as soon as possible.",
            })
            form.reset()
        } catch (error) {
            toast.error("Something went wrong.", {
                description: "Please try again later or call us directly.",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-1">Full Name <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="John Doe"
                                        className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-[#FDB813]/20 transition-all font-bold placeholder:text-gray-300"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage className="font-bold text-[10px] uppercase text-red-500" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-1">Email Address <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="john@example.com"
                                        className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-[#FDB813]/20 transition-all font-bold placeholder:text-gray-300"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage className="font-bold text-[10px] uppercase text-red-500" />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-1">Phone Number <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="(555) 123-4567"
                                    className="h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-[#FDB813]/20 transition-all font-bold placeholder:text-gray-300"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="font-bold text-[10px] uppercase text-red-500" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-1">Your Message <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Tell us about your driving goals..."
                                    className="min-h-[160px] rounded-[2rem] border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-[#FDB813]/20 transition-all font-bold placeholder:text-gray-300 p-6 resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="font-bold text-[10px] uppercase text-red-500" />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    className="w-full h-16 rounded-xl bg-black hover:bg-[#FDB813] text-white hover:text-black font-black uppercase tracking-[0.2em] text-xs transition-all relative overflow-hidden group shadow-xl hover:shadow-[#FDB813]/20 active:scale-[0.98]"
                    size="lg"
                >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        Send Secure Message
                        <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </span>
                    <motion.div
                        className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"
                    />
                </Button>

                <p className="text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-6">
                    Typically replies within 24 hours
                </p>
            </form>
        </Form>
    )
}
