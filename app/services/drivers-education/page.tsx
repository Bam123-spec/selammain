"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2, BookOpen, Car, GraduationCap, ArrowRight, Clock, MapPin, ChevronDown } from "lucide-react"
import { motion, Variants } from "framer-motion"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"

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

export default function DriversEducationPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const location = searchParams.get('location')
    const isBethesda = location === 'bethesda'
    const silverSpringHref = "/services/drivers-education-packages?location=silver-spring"
    const bethesdaHref = "/services/drivers-education-packages?location=bethesda"

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
                            <span className="text-xs font-black tracking-[0.2em] text-gray-500 uppercase">MVA Licensed & Certified</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tighter uppercase leading-none">
                            {isBethesda ? "Bethesda " : ""}Driver's <span className="text-[#FDB813]">Education</span>
                        </h1>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-12 items-start">
                        {/* Text Content */}
                        <div className="lg:w-1/2 pt-2">
                            <p className="text-xl md:text-2xl text-gray-700 font-bold mb-6 leading-tight">
                                {isBethesda ? "Premium " : ""}Complete 36-Hour Maryland MVA Requirement
                            </p>
                            <div className="space-y-4 text-gray-600 text-lg mb-10 leading-relaxed">
                                <p>
                                    {isBethesda
                                        ? "Our premium MVA-certified Driver's Education course for Bethesda students provides elite training. We combine comprehensive classroom instruction with practical behind-the-wheel experience."
                                        : "Our MVA-certified Driver's Education course provides essential training for new drivers. We combine comprehensive classroom instruction with practical behind-the-wheel experience to ensure you're ready for the road."
                                    }
                                </p>
                                <ul className="space-y-3 mt-6">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 shrink-0" />
                                        <span><strong>30 Hours Classroom:</strong> Interactive theory and safety lessons.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 shrink-0" />
                                        <span><strong>6 Hours Driving:</strong> Private 1-on-1 behind-the-wheel lessons.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 shrink-0" />
                                        <span><strong>Certification:</strong> Electronic completion record for the MVA.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="bg-[#FDB813] hover:bg-[#e5a700] text-black font-black text-sm uppercase tracking-widest min-w-[260px] h-14 rounded-none shadow-lg relative justify-center">
                                            <span>ENROLL</span>
                                            <ChevronDown className="w-4 h-4 absolute right-6" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-[260px] p-2">
                                        <DropdownMenuItem className="p-3 cursor-pointer" onSelect={() => goToPackages(silverSpringHref)}>
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
                                        <DropdownMenuItem className="p-3 cursor-pointer" onSelect={() => goToPackages(bethesdaHref)}>
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
                                <div className="flex items-center gap-3 px-6 py-3 border-2 border-gray-100 bg-gray-50/50 text-gray-900 font-bold text-sm">
                                    <Clock className="w-5 h-5 text-[#FDB813]" />
                                    MORNING & EVENING CLASSES
                                </div>
                            </div>
                        </div>

                        {/* Image Content */}
                        <div className="lg:w-1/2 w-full lg:-mt-24">
                            <div className="relative group border-[0.5rem] border-gray-50 shadow-2xl overflow-hidden">
                                <img
                                    src="/professional-driving-instructor-teaching.jpg"
                                    alt="Classroom Instruction"
                                    className="w-full aspect-[4/3] object-cover"
                                />

                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Promo Code Disclaimer */}
            <section className="py-12 bg-white">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
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
                        <h2 className="text-3xl font-black text-gray-900 mb-4">The Complete Package</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">Everything required by Maryland law to get your Provisional License.</p>
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
                                icon: <BookOpen className="w-10 h-10" />,
                                title: "30 Hours Classroom",
                                desc: "Comprehensive theory instruction covering traffic laws, signs, and safe driving habits. Available in-person or via Zoom."
                            },
                            {
                                icon: <Car className="w-10 h-10" />,
                                title: "6 Hours Behind-the-Wheel",
                                desc: "Private, one-on-one driving lessons with a certified instructor to practice what you've learned in class."
                            },
                            {
                                icon: <GraduationCap className="w-10 h-10" />,
                                title: "MVA Certification",
                                desc: "We electronically transfer your completion record directly to the MVA so you can schedule your skills test."
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
                        Your Roadmap to a License
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
                            { step: "01", title: "Enroll Online", desc: "Choose a 2-week morning or evening class schedule that fits your life." },
                            { step: "02", title: "Attend Classes", desc: "Complete the 30-hour theory portion. Learn the rules of the road." },
                            { step: "03", title: "Drive & Certify", desc: "Finish your 6 driving hours. We certify you with the MVA instantly." }
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
                                <Button className="bg-black hover:bg-gray-800 text-white font-bold text-lg px-16 py-6 rounded-none transition-all hover:scale-110 hover:shadow-2xl gap-2">
                                    Enroll <ArrowRight className="w-5 h-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="w-[280px] p-2">
                                <DropdownMenuItem className="p-3 cursor-pointer" onSelect={() => goToPackages(silverSpringHref)}>
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
                                <DropdownMenuItem className="p-3 cursor-pointer" onSelect={() => goToPackages(bethesdaHref)}>
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
