"use client"

import { Phone, Car, GraduationCap, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import NextImage from "next/image"

export function Introduction() {
    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="container mx-auto px-6">
                <div className="flex flex-col lg:flex-row gap-16 items-center">

                    {/* Left Content */}
                    <div className="flex-1 space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="h-1 w-12 bg-[#FDB813]"></div>
                                <span className="text-gray-500 font-medium uppercase tracking-wider text-sm">Our Introduction</span>
                            </div>

                            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                                Schedule Your Driving Lessons with Us
                            </h2>

                            <p className="text-[#FDB813] text-xl font-medium leading-relaxed">
                                Master the road with confidence. Our expert instructors provide personalized training tailored to your needs.
                            </p>

                            <p className="text-gray-600 leading-relaxed">
                                We offer a comprehensive curriculum designed to take you from a beginner to a licensed driver. With flexible scheduling, modern vehicles, and a focus on defensive driving, your success is our priority.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-[#FDB813] flex items-center justify-center shrink-0 shadow-lg shadow-[#FDB813]/20">
                                    <Car className="h-8 w-8 text-white" />
                                </div>
                                <span className="font-bold text-gray-900 text-lg">Modern Fleet Vehicles</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-[#FDB813] flex items-center justify-center shrink-0 shadow-lg shadow-[#FDB813]/20">
                                    <GraduationCap className="h-8 w-8 text-white" />
                                </div>
                                <span className="font-bold text-gray-900 text-lg">Certified Instructors</span>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-8">
                            <div>
                                <span className="text-gray-500 block mb-1 text-sm">Have Questions?</span>
                                <div className="flex items-center gap-2 text-2xl font-bold text-gray-900 hover:text-[#FDB813] transition-colors cursor-pointer">
                                    <Phone className="h-6 w-6 text-[#FDB813]" />
                                    <span>301-755-6986</span>
                                </div>
                            </div>
                            <Button className="bg-[#FDB813] hover:bg-[#e5a700] text-black font-bold px-8 py-6 rounded-xl text-lg shadow-xl hover:shadow-2xl hover:shadow-[#FDB813]/20 transition-all duration-300" asChild>
                                <Link href="/booking">Book Now</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Right Image */}
                    <div className="flex-1 relative w-full">
                        <div className="relative rounded-[2rem] overflow-hidden shadow-2xl h-[600px]">
                            <NextImage
                                src="/person-driving-car-instructor-lesson.jpg"
                                alt="Driving Lesson"
                                fill
                                priority
                                className="object-cover hover:scale-105 transition-transform duration-700"
                            />

                            {/* Floating Card */}
                            <div className="absolute bottom-8 left-8 bg-white p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] max-w-xs animate-[fadeInUp_1s_ease-out_0.5s_forwards] z-10">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="h-12 w-12 rounded-xl bg-gray-100 overflow-hidden relative">
                                        <NextImage src="/placeholder-user.jpg" alt="Student" fill className="object-cover" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">8,800+</div>
                                        <div className="text-xs text-gray-500 uppercase tracking-wider">Licenses Issued</div>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Join our community of safe drivers. We've helped thousands achieve their driving goals.
                                </p>
                            </div>
                        </div>

                        {/* Decorative Elements */}
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#FDB813] rounded-full flex items-center justify-center shadow-xl animate-[bounce_3s_infinite]">
                            <ArrowRight className="h-10 w-10 text-white -rotate-45" />
                        </div>
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-[#FDB813]/10 rounded-full blur-3xl -z-10"></div>
                        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#FDB813]/10 rounded-full blur-3xl -z-10"></div>
                    </div>

                </div>
            </div>
        </section>
    )
}
