
"use client"

import { ServicePriceDisplay } from "@/components/shared/service-price-display"
import { ServicePricingCards } from "@/components/sections/service-pricing-cards"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import * as motion from "framer-motion/client"
import { useSearchParams } from "next/navigation"
import { useState } from "react"


export default function DrivingPracticePackagesContent() {
    const searchParams = useSearchParams()
    const initialLocation = searchParams.get("location") === "bethesda" ? "bethesda" : "silver-spring"
    const [location, setLocation] = useState<"silver-spring" | "bethesda">(initialLocation)

    const getSlug = (baseSlug: string) => {
        return location === "bethesda" ? `${baseSlug}-bethesda` : baseSlug
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Simple Header */}
            <section className="relative bg-white pt-16 pb-12 md:pt-20 md:pb-14 text-center overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-4xl md:text-6xl font-black text-black mb-6 uppercase tracking-tight"
                    >
                        Driving Practice <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FDB813] to-yellow-600">Packages</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium mb-8"
                    >
                        Private lessons tailored to your skill level, focusing on confidence and safety.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex justify-center"
                    >
                        {/* Location Toggle removed as location is pre-selected */}
                    </motion.div>
                </div>
            </section>

            {/* Pricing Cards */}
            <div className="-mt-8 md:-mt-12 relative z-10">
                <ServicePricingCards
                    title=""
                    plans={[
                        {
                            title: "Driver's Practice (1 Hour)",
                            features: [
                                "Single 1-hour private driving lesson",
                                "Ideal for specific skill practice",
                                "Quick assessment of driving abilities",
                                "Instruction in dual-control vehicle"
                            ],
                            price: <ServicePriceDisplay type="service" identifier={getSlug("driving-practice-1hr")} fallbackPrice={location === 'bethesda' ? "75" : "65"} />,
                            image: "/driving-school-student-in-car-with-license.jpg",
                            slug: getSlug("driving-practice-1hr"),
                            href: "/booking?plan=driving-practice-1hr"
                        },
                        {
                            title: "Driver's Practice (2 Hour)",
                            features: [
                                "Comprehensive 2-hour private lesson",
                                "Refresher for experienced drivers",
                                "Practice specific road maneuvers",
                                "Perfect for road test preparation"
                            ],
                            price: <ServicePriceDisplay type="service" identifier={getSlug("driving-practice-2hr")} fallbackPrice={location === 'bethesda' ? "130" : "120"} />,
                            image: "/road-practice.jpg",

                            slug: getSlug("driving-practice-2hr"),
                            popular: true,
                            isAppRoute: false,
                            href: "/booking?plan=driving-practice-2hr"
                        },
                        {
                            title: "Driver's Practice (10 Hours)",
                            features: [
                                "Five 2-hour comprehensive lessons",
                                "Master highway driving techniques",
                                "City & defensive driving mastery",
                                "Parallel parking instruction",
                                "Scheduling priority included"
                            ],
                            price: <ServicePriceDisplay type="service" identifier={getSlug("driving-practice-10hr")} fallbackPrice={location === 'bethesda' ? "600" : "550"} />,
                            image: "/person-driving-car-instructor-lesson.jpg",
                            slug: getSlug("driving-practice-10hr")
                        }
                    ]}
                />
            </div>

            {/* Back Link */}
            <div className="container mx-auto px-4 pb-20 text-center">
                <Button variant="link" asChild className="text-gray-500 hover:text-black rounded-xl">
                    <Link href="/services/driving-practice">← Back to Overview</Link>
                </Button>
            </div>
        </div>
    )
}
