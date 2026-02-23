"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle2, Car, Shield, UserCheck, ArrowRight, MapPin, ChevronDown } from "lucide-react"
import { motion } from "framer-motion"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
}

const itemVariants = {
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

export default function RoadTestServicePage() {
    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Section 1: Hero */}
            <section className="pt-20 pb-12 lg:pt-24 lg:pb-20 bg-white">
                <div className="container mx-auto px-4">
                    {/* Simplified Header */}
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-1 w-10 bg-[#FDB813]"></div>
                            <span className="text-xs font-black tracking-[0.2em] text-gray-500 uppercase">MVA Certified & Insured</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tighter uppercase leading-none">
                            Road Test <span className="text-[#FDB813]">Service</span>
                        </h1>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-12 items-start">
                        {/* Text Content */}
                        <div className="lg:w-1/2 pt-2">
                            <p className="text-xl md:text-2xl text-gray-700 font-bold mb-6 leading-tight">
                                No Car? No Problem. Rent Ours for Your Test.
                            </p>
                            <div className="space-y-4 text-gray-600 text-lg mb-10 leading-relaxed">
                                <p>
                                    Get to your MVA appointment with confidence. We provide a fully insured, MVA-compliant vehicle and a certified instructor to escort you, ensuring a smooth and stress-free testing experience.
                                </p>
                                <ul className="space-y-3 mt-6">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 shrink-0" />
                                        <span><strong>Compliant Vehicle:</strong> Fully inspected cars that meet all MVA requirements.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 shrink-0" />
                                        <span><strong>Expert Escort:</strong> Licensed instructor support throughout the process.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 shrink-0" />
                                        <span><strong>Full Coverage:</strong> Complete insurance protection during your road skills test.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="bg-[#FDB813] hover:bg-[#e5a700] text-black font-black text-sm uppercase tracking-widest min-w-[260px] h-14 rounded-none shadow-lg relative justify-center">
                                            <span>BOOK</span>
                                            <ChevronDown className="w-4 h-4 absolute right-6" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-[260px] p-2">
                                        <DropdownMenuItem asChild className="p-3 cursor-pointer">
                                            <Link href="/services/road-test-packages?location=silver-spring" className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                                    <MapPin className="w-4 h-4 text-red-600" />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold text-gray-900">Silver Spring</span>
                                                    <span className="text-xs text-gray-500 truncate block">10111 Colesville Rd Suite 103</span>
                                                </div>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild className="p-3 cursor-pointer">
                                            <Link href="/services/road-test-packages?location=bethesda" className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                                    <MapPin className="w-4 h-4 text-red-600" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900">Bethesda</span>
                                                    <span className="text-xs text-gray-500">Suite 105</span>
                                                </div>
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <div className="flex items-center gap-3 px-6 py-3 border-2 border-gray-100 bg-gray-50/50 text-gray-900 font-bold text-sm">
                                    <Shield className="w-5 h-5 text-[#FDB813]" />
                                    100% INSURANCE COVERAGE
                                </div>
                            </div>
                        </div>

                        {/* Image Content */}
                        <div className="lg:w-1/2 w-full lg:-mt-24">
                            <div className="relative border-[0.5rem] border-gray-50 shadow-2xl">
                                <img
                                    src="/bas-peperzak-tyhpK_QelPo-unsplash.jpg"
                                    alt="Road Test Service"
                                    className="w-full aspect-[4/3] object-cover"
                                />

                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 2: The Essentials (Benefits) - REVERTED TO PREVIOUS VERSION */}
            <section className="py-20 bg-gray-50 border-y border-gray-100">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl font-black text-gray-900 mb-4">Everything You Need to Pass</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">We provide the requirements, so you can focus on the driving.</p>
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
                                icon: <Car className="w-10 h-10" />,
                                title: "MVA Compliant Car",
                                desc: "No check-engine lights or cracked windshields. Our cars pass MVA inspection 100% of the time."
                            },
                            {
                                icon: <UserCheck className="w-10 h-10" />,
                                title: "Certified Instructor",
                                desc: "Your personal escort handles the paperwork and provides a calming presence during the process."
                            },
                            {
                                icon: <Shield className="w-10 h-10" />,
                                title: "Full Insurance",
                                desc: "You are fully covered under our driving school's comprehensive insurance policy during the test."
                            }
                        ].map((item, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ type: "spring", stiffness: 120, damping: 20 }}
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

            {/* Section 3: Simple Process - REVERTED TO PREVIOUS VERSION */}
            <section className="py-24 bg-white overflow-hidden">
                <div className="container mx-auto px-4 text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl font-black text-gray-900 mb-16"
                    >
                        How It Works
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
                            { step: "01", title: "Book Online", desc: "Choose your test date and time. We'll confirm the slot instantly." },
                            { step: "02", title: "Warm-Up Session", desc: "Instructor arrives 1 hour early for a final practice before your appointment." },
                            { step: "03", title: "Take The Test", desc: "Use our car for the test. Get your license immediately after passing." }
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
                                    Book <ArrowRight className="w-5 h-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="w-[280px] p-2">
                                <DropdownMenuItem asChild className="p-3 cursor-pointer">
                                    <Link href="/services/road-test-packages?location=silver-spring" className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                            <MapPin className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 text-base">Silver Spring</span>
                                            <span className="text-xs text-gray-500">Standard Pricing</span>
                                        </div>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="p-3 cursor-pointer">
                                    <Link href="/services/road-test-packages?location=bethesda" className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                            <MapPin className="w-5 h-5 text-red-600" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900 text-base">Bethesda</span>
                                            <span className="text-xs text-gray-500">Premium Pricing</span>
                                        </div>
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </motion.div>
                </div>
            </section>
        </div>
    )
}
