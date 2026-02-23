"use client"

import { MapPin, Phone, Mail, Clock, ArrowRight, MessageSquare, ExternalLink } from "lucide-react"
import { ContactForm } from "@/components/forms/contact-form"
import { motion, Variants } from "framer-motion"
import { Button } from "@/components/ui/button"

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
}

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "circOut" }
    }
}

export default function ContactPage() {
    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Main Content */}
            <section className="py-32 bg-white relative">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row gap-20">
                        {/* Info Column */}
                        <div className="lg:w-2/5">
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                className="space-y-12"
                            >
                                <motion.div variants={itemVariants}>
                                    <h2 className="text-4xl font-black text-gray-900 mb-8 tracking-tight">Contact Information</h2>
                                    <p className="text-gray-500 font-medium leading-relaxed mb-10">
                                        Choose your preferred way to reach us. Whether it&apos;s a call, an email, or a visit, we&apos;re ready to help.
                                    </p>
                                </motion.div>

                                <div className="space-y-10">
                                    <motion.div variants={itemVariants} className="group flex gap-6">
                                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-[#FDB813] group-hover:text-black transition-all duration-300 group-hover:rotate-6">
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs mb-2">Our Location</h4>
                                            <p className="text-gray-500 font-bold">
                                                10111 Colesville Rd Suite 103, <br />
                                                Silver Spring, MD 20901
                                            </p>
                                        </div>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="group flex gap-6">
                                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-[#FDB813] group-hover:text-black transition-all duration-300 group-hover:rotate-6">
                                            <Phone className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs mb-2">Speak to us</h4>
                                            <a href="tel:3017556986" className="text-2xl font-black text-gray-900 hover:text-[#FDB813] transition-colors tracking-tight">
                                                (301) 755-6986
                                            </a>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Mon - Sat: 9:00 AM - 6:00 PM</p>
                                        </div>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="group flex gap-6">
                                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-[#FDB813] group-hover:text-black transition-all duration-300 group-hover:rotate-6">
                                            <Mail className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs mb-2">Email Inquiries</h4>
                                            <a href="mailto:selamdrivingschool@gmail.com" className="text-lg font-bold text-gray-500 hover:text-black transition-colors">
                                                selamdrivingschool@gmail.com
                                            </a>
                                        </div>
                                    </motion.div>
                                </div>

                                <motion.div variants={itemVariants} className="pt-10 border-t border-gray-100 italic text-gray-400 text-sm font-medium">
                                    &ldquo;Professional instruction tailored to your success. Reach out today and let&apos;s start your journey.&rdquo;
                                </motion.div>
                            </motion.div>
                        </div>

                        {/* Form Column */}
                        <div className="lg:w-3/5">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="bg-white p-10 md:p-14 rounded-[3rem] border border-gray-100 shadow-2xl relative overflow-hidden"
                            >
                                {/* Decorative elements for form card */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FDB813]/5 rounded-bl-[5rem]" />
                                <div className="absolute bottom-0 left-0 w-16 h-16 bg-gray-50 rounded-tr-[3rem]" />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-10">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center text-white rotate-3 shadow-lg">
                                            <MessageSquare className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-3xl font-black text-gray-900 tracking-tight">Send a Message</h3>
                                    </div>
                                    <ContactForm />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Map Section */}
            <section className="bg-gray-50 pt-10 pb-24">
                <div className="container mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="w-full h-[500px] rounded-[3rem] overflow-hidden shadow-2xl border border-gray-200 relative group"
                    >
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3100.28!2d-77.0147!3d39.0211!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89b7c88b7762699f%3A0xf639ce107a6e1234!2s10111%20Colesville%20Rd%20Suite%20103%2C%20Silver%20Spring%2C%20MD%2020901!5e0!3m2!1sen!2sus!4v1716383400000!5m2!1sen!2sus"
                            width="100%"
                            height="100%"
                            style={{ border: 0, filter: 'grayscale(0.1) contrast(1.1) brightness(1.05)' }}
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>

                        <div className="absolute top-8 left-8 bg-white/95 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-xl max-w-sm hidden md:block group-hover:scale-105 transition-transform duration-500">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-[#FDB813] rounded-2xl flex items-center justify-center text-black">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-lg font-black text-gray-900">Silver Spring Office</div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Main Branch</div>
                                </div>
                            </div>
                            <Button className="w-full bg-black hover:bg-[#FDB813] text-white hover:text-black font-black uppercase tracking-widest text-[10px] rounded-xl h-12" asChild>
                                <a href="https://maps.google.com/?q=10111 Colesville Rd Suite 103, Silver Spring, MD 20901" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                                    Get Directions
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    )
}
