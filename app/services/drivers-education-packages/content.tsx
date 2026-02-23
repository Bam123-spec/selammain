"use client"

import { ServicePriceDisplay } from "@/components/shared/service-price-display"
import { ServicePricingCards } from "@/components/sections/service-pricing-cards"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import * as motion from "framer-motion/client"
import { useSearchParams } from "next/navigation"
import { useState } from "react"


export default function DriversEducationPackagesContent() {
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
                        {location === 'bethesda' ? "Bethesda Driver's Ed" : "Driver's Education"} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FDB813] to-yellow-600">Packages</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium mb-8"
                    >
                        {location === 'bethesda'
                            ? "Premium driving instruction specifically tailored for our Bethesda students."
                            : "Comprehensive theory and practical training to get you on the road safely."
                        }
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
                    sharpButtons={true}
                    plans={[
                        {
                            title: `2 Week Theory Class (Morning)${location === 'bethesda' ? ' - Bethesda' : ''}`,
                            features: [
                                "9:00 AM - 12:15 PM",
                                "Online and In-Person",
                                "A 2 week course offered Monday through Friday.",
                                "Graduates receive 6 hours of free Behind the Wheel Training"
                            ],
                            price: <ServicePriceDisplay type="service" identifier={getSlug("drivers-ed-morning")} fallbackPrice={location === 'bethesda' ? "450" : "390"} />,
                            image: "/person-driving-car-instructor-lesson.jpg",
                            slug: getSlug("drivers-ed-morning"),
                            href: `/services/drivers-education-schedule?classification=Morning${location === 'bethesda' ? '&location=bethesda' : ''}`
                        },
                        {
                            title: `2 Week Theory Class (Evening)${location === 'bethesda' ? ' - Bethesda' : ''}`,
                            features: [
                                "6:00 PM - 9:15 PM",
                                "Online and In-Person",
                                "A 2 week course offered Monday through Friday.",
                                "Graduates receive 6 hours of free Behind the Wheel Training"
                            ],
                            price: <ServicePriceDisplay type="service" identifier={getSlug("drivers-ed-evening")} fallbackPrice={location === 'bethesda' ? "450" : "390"} />,
                            image: "/professional-driving-instructor-teaching.jpg",
                            slug: getSlug("drivers-ed-evening"),
                            popular: true,
                            href: `/services/drivers-education-schedule?classification=Evening${location === 'bethesda' ? '&location=bethesda' : ''}`
                        },
                        {
                            title: `5 Week Theory Class (Weekend)${location === 'bethesda' ? ' - Bethesda' : ''}`,
                            features: [
                                "4:00 PM - 7:15 PM",
                                "Online and In-Person",
                                "A 5 week course offered Saturday and Sunday.",
                                "Graduates receive 6 hours of free Behind the Wheel Training"
                            ],
                            price: <ServicePriceDisplay type="service" identifier={getSlug("drivers-ed-weekend")} fallbackPrice={location === 'bethesda' ? "450" : "450"} />,
                            image: "/road-practice.jpg",
                            slug: getSlug("drivers-ed-weekend"),
                            href: `/services/drivers-education-schedule?classification=Weekend${location === 'bethesda' ? '&location=bethesda' : ''}`
                        }
                    ]}
                />
            </div>

            {/* Promo Code Disclaimer */}
            <section className="container mx-auto px-4 mt-8 mb-8 relative z-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black text-blue-900 uppercase text-sm tracking-wider mb-2">
                                    🎁 Bonus Included
                                </h3>
                                <p className="text-gray-700 font-medium leading-relaxed">
                                    <strong>DISCLAIMER:</strong> Use the promo code given at the end of the two week course to register for your <strong className="text-blue-700">free 3 sessions</strong> of the 2-hour Driving Practice.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Back Link */}
            <div className="container mx-auto px-4 pb-20 text-center">
                <Button variant="link" asChild className="text-gray-500 hover:text-black rounded-none">
                    <Link href="/services/drivers-education">← Back to Overview</Link>
                </Button>
            </div>
        </div>
    )
}
