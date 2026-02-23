"use client"

import Image from "next/image"
import { CheckCircle2 } from "lucide-react"

export function WhyChooseUs() {
    const features = [
        {
            title: "Best Safety Measures",
            description:
                "Your safety is our top priority with state-of-the-art dual-control vehicles and comprehensive insurance coverage.",
        },
        {
            title: "Expert Instructors",
            description:
                "Learn from certified professionals with years of experience in teaching defensive driving techniques.",
        },
        {
            title: "Flexible Scheduling",
            description:
                "Book lessons at your convenience with our 24/7 online booking system and flexible time slots.",
        },
    ]

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    {/* Left Column - Image */}
                    <div className="w-full lg:w-1/2 relative">
                        <div className="relative h-[400px] lg:h-[500px] w-full rounded-2xl overflow-hidden shadow-2xl">
                            <Image
                                src="/assets/why-choose-us.png"
                                alt="Driving Instructor teaching student"
                                fill
                                className="object-cover"
                            />
                        </div>
                        {/* Decorative Element */}
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#FDB813] rounded-full -z-10"></div>
                        <div className="absolute -top-6 -left-6 w-32 h-32 border-4 border-[#FDB813] rounded-full -z-10"></div>
                    </div>

                    {/* Right Column - Content */}
                    <div className="w-full lg:w-1/2">
                        <h2 className="text-3xl md:text-5xl font-bold text-black mb-6 tracking-tight">
                            Why Choose <span className="text-[#FDB813]">Selam</span>?
                        </h2>
                        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                            We don't just teach you how to drive; we teach you how to survive on the road. Experience the difference with our premium education standards.
                        </p>

                        <div className="space-y-8">
                            {features.map((feature, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        <CheckCircle2 className="w-6 h-6 text-[#FDB813]" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-black mb-2">{feature.title}</h3>
                                        <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
