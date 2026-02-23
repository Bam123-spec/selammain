"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Phone } from "lucide-react"

// Static Hero - No state needed
export function Hero() {
    return (
        <section className="relative min-h-[100dvh] lg:min-h-[85vh] min-h-[500px] lg:min-h-[600px] flex items-center justify-center overflow-hidden bg-[#0A0A0A]">
            {/* Background Image (Optimized POV) */}
            <div className="absolute inset-0 w-full h-full">
                <div className="absolute inset-0 bg-black/40 z-10"></div>
                {/* Vignette Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] z-10"></div>
                <Image
                    src="/person-driving-car-instructor-lesson.jpg"
                    alt="Driving Lesson POV"
                    fill
                    priority
                    className="object-cover"
                />
            </div>

            {/* Hero Content */}
            <div className="relative z-20 w-full px-4 pt-24 pb-8 md:pb-40 text-center max-w-5xl flex flex-col items-center">
                <div className="opacity-0 animate-[fadeInUp_1s_ease-out_0.8s_forwards] w-full">
                    <div className="hidden md:flex items-center justify-center gap-2 mb-6">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <svg key={star} className="w-5 h-5 md:w-6 md:h-6 text-[#FDB813] fill-current" viewBox="0 0 24 24">
                                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                </svg>
                            ))}
                        </div>
                        <span className="text-white font-bold text-lg md:text-xl">5.0</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-[1.1] tracking-tight drop-shadow-lg max-w-3xl mx-auto uppercase">
                        Welcome to <br /> Selam Driving <span className="text-[#FDB813]">School</span>
                    </h1>
                    <p className="text-[#FDB813] text-sm md:text-base lg:text-lg font-bold mb-2 tracking-widest uppercase drop-shadow-md">
                        Get Driving Lessons for Skills
                    </p>
                </div>
                <div className="opacity-0 animate-[fadeInUp_1s_ease-out_1.2s_forwards] flex flex-col sm:flex-row gap-4 justify-center w-full items-center mt-8 md:mt-8">
                    <Button className="bg-[#FDB813] hover:bg-[#e5a700] text-black font-black text-sm md:text-base w-[85%] sm:w-auto h-11 md:h-12 px-6 md:px-8 rounded-none shadow-xl hover:shadow-[0_0_20px_rgba(253,184,19,0.4)] transition-all duration-300 hover:-translate-y-1" asChild>
                        <Link href="#services">
                            BOOK NOW
                        </Link>
                    </Button>
                    <Button variant="outline" className="bg-white/5 hover:bg-white/10 text-white border-white/20 hover:border-[#FDB813] font-black text-sm md:text-base w-[85%] sm:w-auto h-11 md:h-12 px-6 md:px-8 rounded-none backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 group" asChild>
                        <a href="tel:3017556986" className="flex items-center justify-center gap-2">
                            <Phone className="w-4 h-4 text-[#FDB813] group-hover:scale-110 transition-transform" />
                            301-755-6986
                        </a>
                    </Button>
                    <Button variant="outline" className="bg-white/5 hover:bg-white/10 text-white border-white/20 hover:border-[#FDB813] font-black text-sm md:text-base w-[85%] sm:w-auto h-11 md:h-12 px-6 md:px-8 rounded-none backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 group" asChild>
                        <a href="tel:3016798840" className="flex items-center justify-center gap-2">
                            <Phone className="w-4 h-4 text-[#FDB813] group-hover:scale-110 transition-transform" />
                            301-679-8840
                        </a>
                    </Button>
                </div>
            </div>



        </section >
    )
}
