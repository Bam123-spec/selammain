"use client"

import { ChevronRight } from "lucide-react"
import Image from "next/image"
import { motion } from "framer-motion"

export function FeaturesDark() {
    const features = [
        {
            title: "Approved Institute",
            description: "How all this mistaken denouncing pleasure praising pain was give you great explorer.",
        },
        {
            title: "Experienced & Trusted",
            description: "In a free hour, when our power of choice is and when nothing well prevents.",
        },
        {
            title: "Modern Techniques",
            description: "The claims of duty or the obligations of business it will frequently occur that pleasures.",
        },
        {
            title: "Trained Instructors",
            description: "Desires to obtain pain of itself because occur occasionally work circumstances.",
        },
    ]

    return (
        <section className="relative bg-[#111111] overflow-hidden py-20 lg:py-28">
            {/* Background Layer & Shapes */}
            <div className="absolute inset-0 z-0">
                {/* Decorative Shape 1 (Top Right) */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#1A1A1A] rounded-bl-full opacity-50 transform translate-x-1/3 -translate-y-1/3" />

                {/* Animated Dashes (Center/Right) */}
                <motion.div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0"
                    animate={{ x: [-20, 20, -20] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                >
                    <Image
                        src="/assets/shape-dashes.png"
                        alt=""
                        width={100}
                        height={20}
                        className="opacity-80"
                    />
                </motion.div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">

                    {/* Left Content - Title & Description */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="w-full lg:w-5/12 relative"
                    >
                        {/* Zig Zag Decoration */}
                        <div className="mb-8 relative">
                            <Image
                                src="/assets/shape-zigzag.png"
                                alt=""
                                width={60}
                                height={80}
                                className="object-contain"
                            />
                        </div>

                        <div className="mb-8">
                            <span className="text-[#FDB813] font-bold tracking-wider uppercase text-sm mb-2 block">Why Choose Us</span>
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                                Here to help you<br />
                                become a <span className="text-[#FDB813]">great driver</span>
                            </h2>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Idea of denouncing pleasure and praising pain was born and will give you a complete account of the system expound the actual teachings of great explorer of the truth the master-builder.
                            </p>
                        </div>
                    </motion.div>

                    {/* Right Content - Feature Grid */}
                    <div className="w-full lg:w-7/12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="group relative"
                                >
                                    <div className="bg-[#1C1C1C] p-8 rounded-xl border border-white/5 hover:border-[#FDB813]/30 transition-all duration-300 hover:-translate-y-1 h-full">
                                        {/* Icon List Decoration */}
                                        <div className="flex gap-1 mb-6">
                                            <ChevronRight className="w-4 h-4 text-[#FDB813]" />
                                            <ChevronRight className="w-4 h-4 text-[#FDB813]/60" />
                                            <ChevronRight className="w-4 h-4 text-[#FDB813]/30" />
                                        </div>

                                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#FDB813] transition-colors">
                                            {feature.title}
                                        </h3>
                                        <p className="text-gray-400 leading-relaxed text-sm">
                                            {feature.description}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
