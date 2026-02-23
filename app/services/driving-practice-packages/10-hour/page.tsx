import { Button } from "@/components/ui/button"
import { Check, Star, Car, Shield, Calendar, CreditCard } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { TenHourPurchaseButton } from "@/components/sections/ten-hour-purchase-button"

export const metadata = {
    title: '10-Hour Driving Package | Selam Driving School',
    description: 'Master driving with our comprehensive 10-hour package. Includes highway driving, detailed instruction, and scheduling priority.',
}

export default function TenHourPackagePage() {
    return (
        <main className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 bg-black text-white overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/bas-peperzak-tyhpK_QelPo-unsplash.jpg"
                        alt="Driving Lesson"
                        fill
                        className="object-cover opacity-40"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <div className="inline-flex items-center gap-2 bg-[#FDB813] text-black px-4 py-1.5 rounded-full font-black text-xs tracking-widest uppercase mb-4">
                            <Star className="w-4 h-4" />
                            Most Popular Choice
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight leading-none">
                            10-Hour <span className="text-[#FDB813]">Mastery</span> Package
                        </h1>
                        <p className="text-xl text-gray-300 font-medium max-w-2xl mx-auto leading-relaxed">
                            Go beyond the basics. Our comprehensive curriculum ensures you aren't just passing the test—you're becoming a confident, defensive driver for life.
                        </p>
                    </div>
                </div>
            </section>

            {/* Content Grid */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-16 max-w-6xl mx-auto">

                        {/* Left Column: Details */}
                        <div className="space-y-12">
                            <div className="space-y-6">
                                <h2 className="text-3xl font-black text-black uppercase tracking-tight">Why Choose This Package?</h2>
                                <p className="text-gray-600 leading-relaxed text-lg">
                                    The 10-hour package allows our instructors to take you through a diversified driving curriculum. Unlike single lessons, we can track your progress systematically, covering distinct environments like highways, heavy traffic, and complex parking maneuvers.
                                </p>
                            </div>

                            <div className="space-y-8">
                                <h3 className="text-xl font-black text-black uppercase tracking-tight flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-[#FDB813]" />
                                    What You'll Master
                                </h3>
                                <ul className="grid gap-4">
                                    {[
                                        "Highway Application (merging, lane changing)",
                                        "Defensive Driving in Heavy Traffic",
                                        "Complex Intersections & Right-of-Way",
                                        "All Parking Maneuvers (Parallel, Perpendicular)",
                                        "Mock Road Test Preparation"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                            <div className="mt-1 bg-black text-white rounded-full p-1 shrink-0">
                                                <Check className="w-3 h-3" strokeWidth={3} />
                                            </div>
                                            <span className="font-bold text-gray-900">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Right Column: Pricing & Action */}
                        <div className="lg:pl-12">
                            <div className="sticky top-32 space-y-8">
                                <div className="bg-white rounded-[2.5rem] p-8 border-2 border-black shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] space-y-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#FDB813] opacity-10 rounded-full blur-3xl -mr-16 -mt-16" />

                                    <div className="space-y-2 text-center border-b border-gray-100 pb-8">
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Investment</p>
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="text-6xl font-black text-black tracking-tighter">$550</span>
                                        </div>
                                        <p className="text-green-600 font-bold text-sm bg-green-50 inline-block px-3 py-1 rounded-lg">
                                            Save $50 vs Single Lessons
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 text-sm font-bold text-gray-600">
                                            <Calendar className="w-5 h-5 text-black" />
                                            <span>5 Sessions (2 Hours Each)</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm font-bold text-gray-600">
                                            <Car className="w-5 h-5 text-black" />
                                            <span>Same Instructor Guarantee</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm font-bold text-gray-600">
                                            <CreditCard className="w-5 h-5 text-black" />
                                            <span>Secure Stripe Payment</span>
                                        </div>
                                    </div>

                                    <TenHourPurchaseButton />

                                    <p className="text-center text-xs text-gray-400 font-medium">
                                        By purchasing, you agree to our cancellation policy.
                                    </p>
                                </div>

                                <div className="bg-gray-50 rounded-3xl p-6 text-center space-y-2">
                                    <h4 className="font-bold text-black uppercase text-sm">Have Questions?</h4>
                                    <p className="text-sm text-gray-500">Contact us at (240) 277-2287</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>
        </main>
    )
}
