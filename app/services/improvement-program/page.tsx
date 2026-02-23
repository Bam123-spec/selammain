"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { RefreshCw, FileCheck, Gavel, Check } from "lucide-react"
import { useSearchParams } from "next/navigation"

export default function ImprovementProgramPage() {
    const searchParams = useSearchParams()
    const location = searchParams.get('location')
    const isBethesda = location === 'bethesda'

    const registerUrl = isBethesda ? "/services/improvement-program-packages?location=bethesda" : "/services/improvement-program-packages"

    return (
        <div className="min-h-screen bg-white">
            {/* SECTION 1: TRANSACTIONAL HEADER */}
            <section className="pt-24 pb-12 md:pt-32 md:pb-16 bg-white text-center px-4">
                <div className="container mx-auto max-w-4xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDB813]/10 border border-[#FDB813]/20 mb-6">
                        <span className="w-2 h-2 rounded-full bg-[#FDB813] animate-pulse"></span>
                        <span className="text-xs font-bold text-[#FDB813] tracking-widest uppercase">MVA Approved</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
                        {isBethesda ? "Bethesda " : ""}Driving Improvement <br className="hidden md:block" />
                        Program (DIP)
                    </h1>
                    <div className="flex flex-col items-center justify-center gap-2 mb-8">
                        <div className="text-6xl font-black text-[#FDB813] tracking-tight">$120</div>
                        <p className="text-gray-500 font-medium text-lg">Includes certificate + all required course materials.</p>
                    </div>
                    <Button asChild size="lg" className="rounded-none px-12 py-8 text-xl font-bold bg-black text-white hover:bg-gray-800 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 w-full md:w-auto">
                        <Link href={registerUrl}>Register Now</Link>
                    </Button>
                </div>
            </section>

            {/* SECTION 2: TRUST CARDS */}
            <section className="py-12 bg-gray-50 border-y border-gray-100">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center md:text-left">
                            <div className="w-12 h-12 bg-[#FDB813]/10 rounded-2xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                                <Gavel className="w-6 h-6 text-[#FDB813]" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Court & MVA Required</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">Satisfies requirements for drivers referred by the MVA or court system.</p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center md:text-left">
                            <div className="w-12 h-12 bg-[#FDB813]/10 rounded-2xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                                <RefreshCw className="w-6 h-6 text-[#FDB813]" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Rehabilitate Driving</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">Correct bad habits and learn advanced defensive driving techniques.</p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center md:text-left">
                            <div className="w-12 h-12 bg-[#FDB813]/10 rounded-2xl flex items-center justify-center mb-4 mx-auto md:mx-0">
                                <FileCheck className="w-6 h-6 text-[#FDB813]" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Fast Certification</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">Electronic transmission of completion records to MVA within 24 hours.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECTION 3: WHAT'S INCLUDED */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4 max-w-3xl text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-10">What's Included</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        {[
                            "MVA & Court Approved",
                            "Point Reduction",
                            "Defensive Driving Skills",
                            "Same-Day Processing",
                            "Electronic Reporting",
                            "Official Certificate"
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="w-6 h-6 rounded-full bg-[#FDB813]/20 flex items-center justify-center shrink-0">
                                    <Check className="w-3.5 h-3.5 text-[#FDB813] stroke-[3]" />
                                </div>
                                <span className="font-bold text-gray-700">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 4: CALL TO ACTION */}
            <section className="py-20 bg-gray-50 border-t border-gray-100">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Get Back on Track</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto mb-10">
                        Don't let points affect your license. Sign up for our next Driving Improvement Program session.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button className="bg-[#FDB813] hover:bg-[#e5a700] text-black font-bold text-lg px-10 py-6 rounded-none shadow-lg hover:shadow-xl transition-all" asChild>
                            <Link href={registerUrl}>Register Now</Link>
                        </Button>
                        <Button variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-100 font-bold text-lg px-10 py-6 rounded-none" asChild>
                            <Link href="/contact">Contact Us</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    )
}
