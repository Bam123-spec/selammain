"use client"

import { useEffect, useState } from "react"
import { Car, Shield, BookOpen, RefreshCw, Users, ArrowRight, GraduationCap, AlertTriangle, MapPin, Phone, Clock as ClockIcon, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion, Variants, AnimatePresence } from "framer-motion"

const services = [
    {
        id: "drivers-ed",
        icon: GraduationCap,
        title: "Driver's Education",
        description: "The complete MVA-certified 36-hour course required for all new drivers in MD. Theory + Behind-the-Wheel.",
        href: "/services/drivers-education",
        bookHref: "/services/drivers-education-schedule",
        tag: "Safety First"
    },
    {
        id: "practice",
        icon: Users,
        title: "Driving Practice",
        description: "Private, one-on-one lessons for learners or licensed drivers who want to refresh their skills.",
        href: "/services/driving-practice",
        bookHref: "/services/driving-practice-packages",
        tag: "Mastery"
    },
    {
        id: "road-test",
        icon: BookOpen,
        title: "Road Test Packages",
        description: "Rent our fully insured, MVA-compliant vehicle for your test. Includes specialized instructor escort.",
        href: "/services/road-test-packages",
        bookHref: "/services/road-test-packages",
        tag: "License Day"
    },
    {
        id: "rsep",
        icon: AlertTriangle,
        title: "3-Hour Drug & Alcohol",
        description: "Required (RSEP) course for international license holders converting to Maryland licenses.",
        href: "/services/rsep",
        bookHref: "/services/rsep-schedule",
        tag: "Certification"
    },
    {
        id: "dip",
        icon: RefreshCw,
        title: "Driving Improvement",
        description: "MVA-assigned (DIP) program for points reduction or court-ordered rehabilitative training.",
        href: "/services/dip",
        bookHref: "/services/dip",
        tag: "Compliance"
    }
]

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
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 100, damping: 15 }
    }
}

const floatAnimation = {
    y: [0, -10, 0],
    transition: {
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut" as const
    }
}

export default function ServicesPage() {
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 100; // Account for sticky nav
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">

            {/* Quick Access Bar (Always Visible below hero start) */}
            <div className="bg-[#111] dark text-white py-3 overflow-x-auto whitespace-nowrap scrollbar-hide border-b border-white/5">
                <div className="container mx-auto px-4 flex items-center gap-8 md:justify-center">
                    {services.map((s) => (
                        <Link
                            key={s.id}
                            href={s.href}
                            className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-[#FDB813] transition-colors flex items-center gap-2"
                        >
                            <span className="w-1 h-1 rounded-full bg-[#FDB813]" />
                            {s.title}
                        </Link>
                    ))}
                    <Link
                        href="#location"
                        onClick={(e) => {
                            e.preventDefault();
                            scrollToSection('location');
                        }}
                        className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-[#FDB813] transition-colors flex items-center gap-2"
                    >
                        <span className="w-1 h-1 rounded-full bg-white" />
                        Location
                    </Link>
                </div>
            </div>

            {/* core programs start */}

            {/* Section 2: Services Grid */}
            <section id="programs" className="py-24 bg-gray-50 border-y border-gray-100">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6">Our Core Programs</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed font-medium">
                            Choose from our specialized curricula designed to meet MVA requirements and ensure your road safety.
                        </p>
                    </motion.div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {services.map((service, index) => (
                            <motion.div
                                key={service.id}
                                variants={itemVariants}
                                whileHover={{ y: -10 }}
                                id={service.id}
                                className="group bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col items-start relative overflow-hidden"
                            >
                                {/* Decorative background number */}
                                <span className="absolute top-4 right-8 text-[120px] font-black text-gray-500/5 select-none transition-transform group-hover:scale-110 duration-500">
                                    0{index + 1}
                                </span>

                                <div className="mb-8 flex items-center justify-between w-full relative z-10">
                                    <div className="w-16 h-16 bg-[#FDB813]/10 rounded-2xl flex items-center justify-center text-[#FDB813] transition-all duration-300 group-hover:bg-[#FDB813] group-hover:text-black group-hover:rotate-6">
                                        <service.icon className="w-8 h-8" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FDB813] bg-[#FDB813]/5 px-3 py-1 rounded-full border border-[#FDB813]/10">
                                        {service.tag}
                                    </span>
                                </div>

                                <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-[#FDB813] transition-colors relative z-10">{service.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-1 relative z-10 font-medium">
                                    {service.description}
                                </p>

                                <div className="flex flex-col w-full gap-3 relative z-10">
                                    <Button className="w-full h-12 rounded-xl bg-gray-900 hover:bg-[#FDB813] text-white hover:text-black font-black uppercase tracking-widest text-[10px] transition-all" asChild>
                                        <Link href={service.bookHref}>Book Initial Session</Link>
                                    </Button>
                                    <Button variant="ghost" className="w-full h-10 rounded-xl text-gray-400 hover:text-black font-bold text-xs group/btn" asChild>
                                        <Link href={service.href} className="flex items-center justify-center gap-2">
                                            Course Details
                                            <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-1" />
                                        </Link>
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Section 3: Branch Location & Map */}
            <section id="location" className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row gap-16 items-stretch">
                        <div className="lg:w-1/3 flex flex-col justify-center">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                            >
                                <span className="text-xs font-black uppercase tracking-[0.3em] text-[#FDB813] mb-4 block">Visit Our Office</span>
                                <h2 className="text-4xl font-black text-gray-900 mb-8 leading-tight">Conveniently Located in Silver Spring</h2>

                                <div className="space-y-8">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 mb-1">Our Address</h4>
                                            <p className="text-sm text-gray-500 leading-relaxed font-medium">
                                                10111 Colesville Rd Suite 103, <br />
                                                Silver Spring, MD 20901
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <ClockIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 mb-1">Office Hours</h4>
                                            <div className="text-sm text-gray-500 leading-relaxed font-medium">
                                                <div className="flex justify-between w-48">
                                                    <span>Mon - Fri:</span>
                                                    <span>9:00 AM - 6:00 PM</span>
                                                </div>
                                                <div className="flex justify-between w-48">
                                                    <span>Saturday:</span>
                                                    <span>10:00 AM - 2:00 PM</span>
                                                </div>
                                                <div className="flex justify-between w-48 text-red-500/70">
                                                    <span>Sunday:</span>
                                                    <span>Closed</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium">
                                                Phone: (301) 755-6986 <br />
                                                Email: beamlaky9@gmail.com
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Button className="mt-12 bg-gray-900 hover:bg-[#FDB813] text-white hover:text-black font-black uppercase tracking-widest text-xs h-14 px-8 rounded-xl transition-all w-full md:w-auto" asChild>
                                    <a href="https://maps.google.com/?q=10111 Colesville Rd Suite 103, Silver Spring, MD 20901" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                        Open in Google Maps
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </Button>
                            </motion.div>
                        </div>

                        <div className="lg:w-2/3 min-h-[400px]">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="w-full h-full rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-2xl relative"
                            >
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3100.28!2d-77.0147!3d39.0211!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89b7c88b7762699f%3A0xf639ce107a6e1234!2s10111%20Colesville%20Rd%20Suite%20103%2C%20Silver%20Spring%2C%20MD%2020901!5e0!3m2!1sen!2sus!4v1716383400000!5m2!1sen!2sus"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, filter: 'grayscale(0.2) contrast(1.1)' }}
                                    allowFullScreen={true}
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>

                                {/* Custom Overlay for Premium Feel */}
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-white/50 shadow-lg pointer-events-none hidden md:block">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white">
                                            <Car className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-gray-900">Selam Driving School</div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Main Branch</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    )
}
