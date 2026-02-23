"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, PlayCircle } from "lucide-react"
import Link from "next/link"
import { QuizSection } from "@/components/course/quiz-section"

export default function UpcomingCoursePage() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Header */}
            <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Button variant="ghost" className="text-white hover:text-[#FDB813] hover:bg-white/10 gap-2" asChild>
                        <Link href="/student/dashboard">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>
                    <div className="font-bold text-lg tracking-wide">
                        <span className="text-[#FDB813]">Module 1:</span> Defensive Driving
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center">
                <div className="w-full max-w-5xl space-y-6">

                    {/* Video Container */}
                    <div className="relative aspect-video w-full bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                        <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                            <iframe
                                src="https://player.mediadelivery.net/embed/571172/4453854e-d79c-4949-8ffc-22ccc1ed90b0?autoplay=true&loop=false&muted=false&preload=true&responsive=true"
                                loading="lazy"
                                style={{ border: 0, position: 'absolute', top: 0, height: '100%', width: '100%' }}
                                allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                                allowFullScreen={true}
                            ></iframe>
                        </div>
                    </div>

                    {/* Video Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                        <div className="md:col-span-2 space-y-4">
                            <h1 className="text-3xl font-bold">Introduction to Defensive Driving</h1>
                            <p className="text-gray-400 leading-relaxed">
                                In this lesson, we cover the fundamental principles of defensive driving. You'll learn how to anticipate potential hazards, maintain a safe following distance, and react quickly to changing road conditions. This is a crucial step in becoming a safe and confident driver.
                            </p>
                            <div className="flex items-center gap-4 pt-4">
                                <Button className="bg-[#FDB813] text-black hover:bg-[#e5a700] font-bold">
                                    Mark as Complete
                                </Button>
                                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                                    Download Resources
                                </Button>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-6 border border-white/10 h-fit">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <PlayCircle className="h-5 w-5 text-[#FDB813]" />
                                Course Content
                            </h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center justify-between p-2 rounded bg-white/10 border-l-2 border-[#FDB813]">
                                    <div className="flex flex-col">
                                        <span className="font-medium">1. Opening Banter</span>
                                        <span className="text-xs text-gray-400">Signature Taunts</span>
                                    </div>
                                    <span className="text-xs text-[#FDB813]">00:00</span>
                                </li>
                                <li className="flex items-center justify-between p-2 rounded hover:bg-white/5 text-gray-400 cursor-pointer transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-medium">2. Money & Fame</span>
                                        <span className="text-xs text-gray-500">Business Talk</span>
                                    </div>
                                    <span className="text-xs">00:38</span>
                                </li>
                                <li className="flex items-center justify-between p-2 rounded hover:bg-white/5 text-gray-400 cursor-pointer transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-medium">3. Injuries</span>
                                        <span className="text-xs text-gray-500">Fight Readiness</span>
                                    </div>
                                    <span className="text-xs">01:14</span>
                                </li>
                                <li className="flex items-center justify-between p-2 rounded hover:bg-white/5 text-gray-400 cursor-pointer transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-medium">4. Opponents</span>
                                        <span className="text-xs text-gray-500">Knockout Power</span>
                                    </div>
                                    <span className="text-xs">01:30</span>
                                </li>
                                <li className="flex items-center justify-between p-2 rounded hover:bg-white/5 text-gray-400 cursor-pointer transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-medium">5. Trash Talk</span>
                                        <span className="text-xs text-gray-500">Personal Insults</span>
                                    </div>
                                    <span className="text-xs">01:52</span>
                                </li>
                                <li className="flex items-center justify-between p-2 rounded hover:bg-white/5 text-gray-400 cursor-pointer transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-medium">6. Q&A</span>
                                        <span className="text-xs text-gray-500">Rivalries & Dreams</span>
                                    </div>
                                    <span className="text-xs">02:48</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Quiz Section */}
                    <QuizSection />

                </div>
            </main>
        </div>
    )
}
