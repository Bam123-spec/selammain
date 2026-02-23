"use client"

import { motion } from "framer-motion"
import NextImage from "next/image"

export function CtaBanner() {
    return (
        <section className="py-12 bg-gradient-to-r from-[#FDB813] via-[#FCA311] to-[#F59E0B] overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">

                    {/* Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="text-center md:text-right"
                    >
                        <h2 className="text-xl md:text-2xl font-bold text-black mb-1">
                            Have any <span className="text-[#cc0000]">Questions</span>? Call us Today
                        </h2>
                        <a href="tel:301-755-6986" className="text-4xl md:text-6xl font-black text-black tracking-tight hover:opacity-80 transition-opacity font-[family-name:var(--font-open-sans)]">
                            301-755-6986
                        </a>
                    </motion.div>

                    {/* Icon - Diamond Warning Sign Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 12 }}
                        viewport={{ once: true }}
                        transition={{
                            duration: 0.8,
                            type: "spring",
                            bounce: 0.4
                        }}
                        whileHover={{ rotate: 0, scale: 1.1 }}
                        className="hidden md:block relative w-32 h-32 md:w-40 md:h-40 transform"
                    >
                        <NextImage
                            src="/assets/car-sign-icon.png"
                            alt="Driving School Warning Sign"
                            fill
                            className="object-contain drop-shadow-2xl"
                        />
                    </motion.div>

                </div>
            </div>
        </section>
    )
}
