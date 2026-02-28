"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, Car, Shield, UserCheck, ArrowRight, Star, MapPin, ChevronDown } from "lucide-react"
import { motion, Variants } from "framer-motion"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Animation Variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
}

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 120, damping: 20 }
    }
}

const floatAnimation = {
    y: [0, -15, 0],
    transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut" as const
    }
}

export default function DrivingPracticePage() {
    const router = useRouter()
    const silverSpringHref = "/services/driving-practice-packages?location=silver-spring"
    const bethesdaHref = "/services/driving-practice-packages?location=bethesda"

    useEffect(() => {
        router.prefetch(silverSpringHref)
        router.prefetch(bethesdaHref)
    }, [router, silverSpringHref, bethesdaHref])

    const goToPackages = (href: string) => {
        router.push(href)
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Section 1: Hero */}
            <section className="pt-20 pb-12 lg:pt-24 lg:pb-20 bg-white">
                <div className="container mx-auto px-4">
                    {/* Simplified Header */}
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-1 w-10 bg-[#FDB813]"></div>
                            <span className="text-xs font-black tracking-[0.2em] text-gray-500 uppercase">Dual Control Safety Vehicles</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tighter uppercase leading-none">
                            <span className="text-gray-900">Driving </span>
                            <span className="text-[#FDB813]">Practice</span>
                        </h1>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-12 items-start">
                        {/* Text Content */}
                        <div className="lg:w-1/2 pt-2">
                            <p className="text-xl md:text-2xl text-gray-700 font-bold mb-6 leading-tight">
                                One-on-One Personalized Instruction
                            </p>
                            <div className="space-y-4 text-gray-600 text-lg mb-10 leading-relaxed">
                                <p>
                                    Master the road with confidence. Our private lessons are tailored to your specific needs, whether you're a new learner, a nervous driver, or someone looking to refresh their skills.
                                </p>
                                <ul className="space-y-3 mt-6">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 shrink-0" />
                                        <span><strong>Personalized Plan:</strong> Lessons tailored to your specific goals and skills.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 shrink-0" />
                                        <span><strong>Safety First:</strong> Lessons in modern, dual-braked safety vehicles.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 shrink-0" />
                                        <span><strong>Certified Experts:</strong> Training from patient, MVA-licensed instructors.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="bg-[#FDB813] hover:bg-[#e5a700] text-black font-black text-sm uppercase tracking-widest min-w-[260px] h-14 rounded-none shadow-lg relative justify-center">
                                            <span>ENROLL</span>
                                            <ChevronDown className="w-4 h-4 absolute right-6" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-[260px] p-2">
                                        <DropdownMenuItem
                                            className="p-3 cursor-pointer"
                                            onMouseEnter={() => router.prefetch(silverSpringHref)}
                                            onFocus={() => router.prefetch(silverSpringHref)}
                                            onSelect={() => goToPackages(silverSpringHref)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                                    <MapPin className="w-4 h-4 text-red-600" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold text-gray-900">Silver Spring</span>
                                                    <span className="text-xs text-gray-500 truncate block">10111 Colesville Rd Suite 103</span>
                                                </div>
                                            </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="p-3 cursor-pointer"
                                            onMouseEnter={() => router.prefetch(bethesdaHref)}
                                            onFocus={() => router.prefetch(bethesdaHref)}
                                            onSelect={() => goToPackages(bethesdaHref)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                                    <MapPin className="w-4 h-4 text-red-600" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900">Bethesda</span>
                                                    <span className="text-xs text-gray-500">Suite 105</span>
                                                </div>
                                            </div>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <div className="flex items-center gap-3 px-6 py-3 border-2 border-gray-100 bg-gray-50/50 text-gray-900 font-bold text-sm h-14">
                                    <Shield className="w-5 h-5 text-[#FDB813]" />
                                    FULLY INSURED & BONDED
                                </div>
                            </div>
                        </div>

                        {/* Image Content */}
                        <div className="lg:w-1/2 w-full lg:-mt-24">
                            <div className="relative group border-[0.5rem] border-gray-50 shadow-2xl overflow-hidden">
                                <img
                                    src="/road-practice.jpg"
                                    alt="Private Driving Lesson"
                                    className="w-full aspect-[4/3] object-cover"
                                />
                                <div className="absolute -bottom-4 right-8 bg-gray-900 text-white p-5 shadow-2xl border-t-4 border-[#FDB813] hidden md:block group-hover:translate-y-[-8px] transition-transform duration-500">
                                    <div className="flex items-center gap-5">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1 mb-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className="w-4 h-4 text-[#FDB813] fill-[#FDB813]" />
                                                ))}
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Google Verified</p>
                                        </div>
                                        <div className="h-10 w-[1px] bg-gray-700"></div>
                                        <div className="flex flex-col">
                                            <p className="text-2xl font-black text-white leading-none">5.0</p>
                                            <p className="text-[10px] font-bold text-[#FDB813] uppercase tracking-wider mt-1">Rating</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 2: Benefits */}
            <section className="py-20 bg-gray-50 border-y border-gray-100">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl font-black text-gray-900 mb-4">Why Train With Us?</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">We don't just teach you to pass the test. We teach you to survive the road.</p>
                    </motion.div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
                    >
                        {[
                            {
                                icon: <UserCheck className="w-10 h-10" />,
                                title: "Patient Instructors",
                                desc: "Our certified instructors specialize in nervous drivers. We build your confidence step-by-step at your own pace."
                            },
                            {
                                icon: <Car className="w-10 h-10" />,
                                title: "Dual-Control Safety",
                                desc: "Learn in our modern fleet equipped with passenger-side brakes. You are always safe while you learn."
                            },
                            {
                                icon: <CheckCircle2 className="w-10 h-10" />,
                                title: "Any Skill Level",
                                desc: "From parking lot basics to highway merging and parallel parking. We customize the lesson to your needs."
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                variants={itemVariants}
                                whileHover={{ y: -10, transition: { duration: 0.2 } }}
                                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-xl transition-shadow duration-300"
                            >
                                <div className="mx-auto w-20 h-20 bg-[#FDB813]/10 rounded-full flex items-center justify-center text-[#FDB813] mb-6">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Section 3: Process */}
            <section className="py-24 bg-white overflow-hidden">
                <div className="container mx-auto px-4 text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl font-black text-gray-900 mb-16"
                    >
                        Start Driving Today
                    </motion.h2>

                    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gray-100 -z-10 overflow-hidden">
                            <motion.div
                                initial={{ width: "0%" }}
                                whileInView={{ width: "100%" }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                className="h-full bg-[#FDB813]"
                            />
                        </div>

                        {[
                            { step: "01", title: "Book Online", desc: "Select a 2-hour practice slot that fits your schedule. Weekend slots available." },
                            { step: "02", title: "Warm-Up Drive", desc: "Start each lesson with a safety check and quick warm-up in a dual-controlled car." },
                            { step: "03", title: "Master Skills", desc: "Spend 2 hours driving. Debrief with feedback and improvement plan." }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.5 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.4, type: "spring", bounce: 0.5 }}
                                className="relative bg-white p-4"
                            >
                                <div className="w-24 h-24 mx-auto bg-white border-8 border-gray-50 rounded-full flex items-center justify-center text-xl font-black text-[#FDB813] shadow-lg mb-6 z-10 relative group-hover:scale-110 transition-transform">
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                                <p className="text-gray-500 text-sm px-4">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1.2 }}
                        className="mt-16"
                    >
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="bg-black hover:bg-gray-800 text-white font-bold text-lg px-16 py-6 rounded-xl transition-all hover:scale-110 hover:shadow-2xl gap-2">
                                    Enroll <ArrowRight className="w-5 h-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="w-[280px] p-2">
                                <DropdownMenuItem
                                    className="p-3 cursor-pointer"
                                    onMouseEnter={() => router.prefetch(silverSpringHref)}
                                    onFocus={() => router.prefetch(silverSpringHref)}
                                    onSelect={() => goToPackages(silverSpringHref)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                            <MapPin className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 text-base">Silver Spring</span>
                                            <span className="text-xs text-gray-500">Standard Pricing</span>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="p-3 cursor-pointer"
                                    onMouseEnter={() => router.prefetch(bethesdaHref)}
                                    onFocus={() => router.prefetch(bethesdaHref)}
                                    onSelect={() => goToPackages(bethesdaHref)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                            <MapPin className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 text-base">Bethesda</span>
                                            <span className="text-xs text-gray-500">Premium Pricing</span>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </motion.div>
                </div>
            </section>
        </div>
    )
}
