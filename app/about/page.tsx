"use client"

import { CheckCircle2, Shield, Clock, Car, Award, Users, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"

export default function AboutPage() {

    const staggerContainer = {
        initial: {},
        whileInView: { transition: { staggerChildren: 0.1 } },
        viewport: { once: true }
    }

    const itemFade = {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: "easeOut" }
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Premium Hero Section */}
            <section className="relative pt-20 pb-20 lg:pt-32 lg:pb-32 bg-white overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        {/* Text Content */}
                        <div className="lg:w-1/2 relative z-10 text-left">
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            >
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="h-1 w-12 bg-[#FDB813]"></div>
                                    <span className="text-xs font-black tracking-[0.3em] text-gray-400 uppercase">Est. 2020</span>
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 tracking-tighter uppercase leading-[0.9]">
                                    Driven by <br />
                                    <span className="text-[#FDB813]">Excellence.</span>
                                </h1>
                                <p className="text-lg md:text-xl text-gray-500 mb-10 leading-relaxed font-medium max-w-xl">
                                    We go beyond basic driving rules to build lifelong habits of safe, confident, and responsible road mastery for every student.
                                </p>
                                <div className="flex flex-wrap gap-4">
                                    <Button size="lg" className="bg-gray-900 hover:bg-[#FDB813] text-white hover:text-black font-black uppercase tracking-widest text-xs h-14 px-8 rounded-none transition-all shadow-xl" asChild>
                                        <Link href="/services">Explore Our Programs</Link>
                                    </Button>
                                    <Button variant="outline" size="lg" className="border-gray-200 text-gray-900 font-black uppercase tracking-widest text-xs h-14 px-8 rounded-none hover:bg-gray-50 transition-all" asChild>
                                        <Link href="/contact">Get in Touch</Link>
                                    </Button>
                                </div>
                            </motion.div>
                        </div>

                        {/* Image Content */}
                        <div className="lg:w-1/2 w-full relative">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="relative z-10"
                            >
                                <div className="relative aspect-[4/5] md:aspect-[16/10] lg:aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl border-[0.5rem] border-white ring-1 ring-gray-100">
                                    <img
                                        src="/images/about-hero.png"
                                        alt="Modern Driving Instruction"
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                </div>

                                {/* Floating Stats Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5, duration: 0.8 }}
                                    className="absolute -bottom-8 -left-8 md:bottom-8 md:-left-12 bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 z-20 hidden sm:block"
                                >
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <div className="text-4xl font-black text-[#FDB813]">98%</div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Pass Rate</div>
                                        </div>
                                        <div className="w-px h-12 bg-gray-100"></div>
                                        <div>
                                            <div className="text-4xl font-black text-gray-900">1k+</div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Graduates</div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Background Accents */}
                                <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-50 rounded-full blur-3xl -z-10"></div>
                                <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-10"></div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Intro & Mission */}
            <section className="py-24 bg-white relative">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            className="text-center mb-24"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "circOut" }}
                        >
                            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-8 uppercase tracking-tight">More Than Just a <span className="text-blue-600">Driving School</span></h2>
                            <p className="text-lg md:text-xl text-gray-500 leading-relaxed max-w-3xl mx-auto font-medium">
                                Selam Driving School is a premier driving institution dedicated to creating safe, confident, and responsible drivers. We don't just teach you how to pass a test; we teach you how to thrive on modern roads.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: "circOut" }}
                                className="space-y-8"
                            >
                                <div className="space-y-4">
                                    <div className="h-1 text-blue-600 w-12 bg-blue-600"></div>
                                    <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                                        Our Mission
                                    </h3>
                                </div>
                                <p className="text-gray-500 text-lg leading-relaxed font-medium">
                                    To provide the highest quality driving education in Maryland, prioritizing safety, patience, and student success above all else. We strive to make the roads safer for everyone, one student at a time.
                                </p>
                                <motion.div
                                    className="grid grid-cols-1 gap-4"
                                    variants={staggerContainer}
                                    initial="initial"
                                    whileInView="whileInView"
                                    viewport={{ once: true }}
                                >
                                    {[
                                        "State Certified & MVA Approved",
                                        "Flexible 7-Day Scheduling",
                                        "Modern Dual-Control Safety Vehicles",
                                        "98% Student Pass Rate"
                                    ].map((item, i) => (
                                        <motion.div
                                            key={i}
                                            variants={itemFade}
                                            className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl hover:bg-white hover:shadow-md transition-all duration-300 border border-transparent hover:border-gray-100"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-[#FDB813]/10 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-5 h-5 text-[#FDB813]" />
                                            </div>
                                            <span className="font-bold text-gray-700 text-sm uppercase tracking-wide">{item}</span>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: "circOut" }}
                                className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-40 h-40 bg-[#FDB813]/5 rounded-bl-full -mr-12 -mt-12"></div>
                                <h3 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-tight">Founded in 2020</h3>
                                <div className="space-y-8 relative z-10">
                                    <p className="text-gray-500 leading-relaxed font-medium">
                                        What started as a small passion project by a group of veteran instructors has grown into one of Maryland's most trusted driving schools.
                                    </p>
                                    <p className="text-gray-500 leading-relaxed font-medium">
                                        Over the last few years, we have helped over 1,000 students obtain their licenses. Our growth is fueled by our reputation for patience and our commitment to treating every student like family.
                                    </p>
                                    <div className="pt-8 border-t border-gray-100 flex items-center gap-12">
                                        <motion.div whileHover={{ scale: 1.05 }}>
                                            <div className="text-5xl font-black text-[#FDB813]">5+</div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Years Exp.</div>
                                        </motion.div>
                                        <motion.div whileHover={{ scale: 1.05 }}>
                                            <div className="text-5xl font-black text-[#FDB813]">1k+</div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Students</div>
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="py-32 bg-gray-50/50 border-y border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-white to-transparent"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        className="text-center mb-20"
                    >
                        <h2 className="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tight">Why Students <span className="text-[#FDB813]">Choose Us</span></h2>
                        <div className="w-24 h-1.5 bg-[#FDB813] mx-auto mt-6 rounded-full"></div>
                    </motion.div>

                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto"
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="whileInView"
                        viewport={{ once: true }}
                    >
                        {[
                            { icon: Users, title: "Patient Instructors", desc: "We specialize in nervous beginners. Our instructors are calm, supportive, and never yell." },
                            { icon: Car, title: "Safety First", desc: "Training in modern, dual-control vehicles that are inspected regularly for your safety." },
                            { icon: Clock, title: "Flexible Hours", desc: "We work around your schedule. Mornings, evenings, and weekends are all available." },
                            { icon: MapPin, title: "Local Experts", desc: "We know the local test routes and traffic patterns inside out to help you pass." }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                variants={itemFade}
                                className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group"
                            >
                                <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#FDB813] transition-colors duration-500">
                                    <item.icon className="w-8 h-8 text-[#FDB813] group-hover:text-white transition-colors duration-500" />
                                </div>
                                <h3 className="text-xl font-black mb-4 uppercase tracking-tight text-gray-900">{item.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed font-medium group-hover:text-gray-600 transition-colors">{item.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* CTA */}
            <motion.section
                className="py-32 bg-white"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1 }}
                viewport={{ once: true }}
            >
                <div className="container mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        className="space-y-12"
                    >
                        <div className="space-y-6">
                            <h2 className="text-4xl md:text-7xl font-black text-gray-900 mb-6 uppercase tracking-tighter leading-none">
                                Join the Selam <br />
                                <span className="text-blue-600 italic">Driving Family</span>
                            </h2>
                            <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto font-medium">
                                Start your journey towards becoming a safe and confident driver today.
                            </p>
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button size="lg" className="bg-gray-900 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-lg px-12 py-8 rounded-xl shadow-2xl transition-all h-auto" asChild>
                                <Link href="/booking">Book Your First Lesson</Link>
                            </Button>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.section>
        </div>
    )
}
