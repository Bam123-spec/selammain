
"use client"

import { ServicePriceDisplay } from "@/components/shared/service-price-display"
import { ServicePricingCards } from "@/components/sections/service-pricing-cards"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import * as motion from "framer-motion/client"
import { useSearchParams } from "next/navigation"
import { useState } from "react"


export default function RoadTestPackagesContent() {
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
                        MVA Road Test <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FDB813] to-yellow-600">Packages</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-medium mb-8"
                    >
                        Choose the right package for your road test needs. All packages include a fully insured vehicle and certified instructor.
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
                            title: "Road Test MVA Escort",
                            description: "Ensure a smooth and stress-free road test experience with our professional MVA Road Test Escort Service.",
                            features: [
                                "MVA-Compliant Car Provided",
                                "Certified Instructor Escort",
                                "Full Insurance Coverage",
                                "Registration & Paperwork Help"
                            ],
                            price: <ServicePriceDisplay type="service" identifier={getSlug("road-test-escort")} fallbackPrice={location === 'bethesda' ? "140" : "120"} />,
                            image: "/roadtest.jpg",
                            slug: getSlug("road-test-escort")
                        },
                        {
                            title: "Road Test MVA + 1hr Practice",
                            description: "Prepare for your MVA road test with our 1-Hour Driving Lesson designed to boost your confidence.",
                            features: [
                                "Use of MVA-Compliant Car",
                                "1-Hour Warm-up Practice",
                                "Review Parallel Parking",
                                "Pre-Test Confidence Boost"
                            ],
                            price: <ServicePriceDisplay type="service" identifier={getSlug("road-test-1hr")} fallbackPrice={location === 'bethesda' ? "220" : "200"} />,
                            image: "/driving-school-student-in-car-with-license.jpg",
                            slug: getSlug("road-test-1hr"),
                            popular: true
                        },
                        {
                            title: "Road Test MVA + 2hr Practice",
                            description: "Prepare for your MVA road test with our 2-Hour Driving Lesson designed to boost your confidence.",
                            features: [
                                "Use of MVA-Compliant Car",
                                "2-Hour Intensive Practice",
                                "Detailed Skills Review",
                                "Mock Test Scenarios"
                            ],
                            price: <ServicePriceDisplay type="service" identifier={getSlug("road-test-2hr")} fallbackPrice={location === 'bethesda' ? "285" : "265"} />,
                            image: "/bas-peperzak-tyhpK_QelPo-unsplash.jpg",
                            slug: getSlug("road-test-2hr")
                        }
                    ]}
                />
            </div>

            {/* Back Link */}
            <div className="container mx-auto px-4 pb-20 text-center">
                <Button variant="link" asChild className="text-gray-500 hover:text-black rounded-xl">
                    <Link href="/services/road-test">← Back to Overview</Link>
                </Button>
            </div>
        </div>
    )
}
