"use client"

import { motion } from "framer-motion"
import { useState } from "react"

export function PremiumCarAnimation() {
    const [isPaused, setIsPaused] = useState(false)
    const [isFast, setIsFast] = useState(false)

    return (
        <div
            className="absolute top-0 left-0 w-full h-full overflow-hidden z-0"
            onMouseDown={() => setIsFast(true)}
            onMouseUp={() => setIsFast(false)}
            onMouseLeave={() => setIsFast(false)}
            onTouchStart={() => setIsFast(true)}
            onTouchEnd={() => setIsFast(false)}
        >
            {/* Ambient Background Elements - Abstract City/Hills */}
            <div className="absolute bottom-0 left-0 w-full h-64 opacity-5 pointer-events-none">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 320">
                    <path fill="#111" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
            </div>

            {/* The Road */}
            <div className="hidden md:block absolute top-16 md:top-40 left-0 w-full pointer-events-none">
                {/* Road Surface */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50"></div>

                {/* Static Lane Markers */}
                <div className="absolute top-0 left-0 w-full h-px flex justify-between px-4 overflow-hidden">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="w-16 h-0.5 bg-gray-300 rounded-full shrink-0"></div>
                    ))}
                </div>
            </div>

            {/* Wind Effect (Visible when fast) */}
            {isFast && (
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute h-0.5 bg-gray-400/40 rounded-full"
                            style={{
                                top: 80 + Math.random() * 120,
                                left: "100%",
                                width: 50 + Math.random() * 150
                            }}
                            animate={{ x: ["0vw", "-150vw"] }}
                            transition={{
                                duration: 0.3 + Math.random() * 0.4,
                                repeat: Infinity,
                                ease: "linear",
                                delay: Math.random() * 0.2
                            }}
                        />
                    ))}
                </div>
            )}

            {/* The Car Container */}
            <div
                className="hidden md:block absolute top-20 w-64 h-32 cursor-pointer z-10 scale-60 origin-left md:scale-100"
                style={{
                    left: '100%', // Start just outside the right edge
                    animation: `driveAcross ${isFast ? 4 : 8}s linear infinite`,
                    animationPlayState: isPaused ? 'paused' : 'running'
                }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes driveAcross {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(calc(-100vw - 400px)); }
                    }
                `}} />

                <div className="w-full h-full relative">
                    {/* Car Body Group - Adds Suspension Bounce */}
                    <motion.div
                        animate={{ y: isPaused ? 0 : [0, -1.5, 0] }}
                        transition={{ repeat: Infinity, duration: isFast ? 0.2 : 0.6, ease: "easeInOut" }}
                        className="relative w-full h-full"
                    >
                        {/* Exhaust Smoke */}
                        <div className="absolute top-[35px] left-[150px] z-[-1]">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute rounded-full bg-gray-300"
                                    initial={{ opacity: 0, scale: 0.2, x: 0, y: 0 }}
                                    animate={{
                                        opacity: [0, 0.6, 0],
                                        scale: [0.2, 2.5],
                                        x: [0, 60 + Math.random() * 30],
                                        y: [0, -15 - Math.random() * 15]
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 1.2,
                                        ease: "easeOut",
                                        delay: i * 0.15,
                                        repeatDelay: Math.random() * 0.2
                                    }}
                                    style={{ width: 6, height: 6 }}
                                />
                            ))}
                        </div>

                        {/* Speed Lines (Wind) - Attached to car */}
                        {!isPaused && (
                            <motion.div
                                className="absolute -right-16 top-0 flex flex-col gap-2"
                                animate={{ opacity: [0, 1, 0], x: [0, -40, 0] }}
                                transition={{ repeat: Infinity, duration: isFast ? 0.3 : 0.6 }}
                            >
                                <div className="w-16 h-0.5 bg-white/40 rounded-full"></div>
                                <div className="w-10 h-0.5 bg-white/20 rounded-full ml-8"></div>
                                <div className="w-12 h-0.5 bg-white/30 rounded-full ml-2"></div>
                            </motion.div>
                        )}

                        {/* SVG Car - Enhanced */}
                        <svg viewBox="0 0 200 80" className="w-full h-full drop-shadow-2xl">
                            <defs>
                                <linearGradient id="carBody" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#111" />
                                    <stop offset="40%" stopColor="#333" />
                                    <stop offset="100%" stopColor="#111" />
                                </linearGradient>
                                <linearGradient id="window" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#2c3e50" stopOpacity="0.9" />
                                    <stop offset="100%" stopColor="#000" stopOpacity="0.95" />
                                </linearGradient>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Main Chassis */}
                            <path d="M10,45 L145,45 Q155,45 155,35 L150,25 Q145,10 115,10 L60,10 Q30,10 20,25 L10,30 Q0,35 0,45 Z" fill="url(#carBody)" />

                            {/* Roof/Windows */}
                            <path d="M35,28 L55,14 L110,14 L125,28 Z" fill="url(#window)" stroke="#444" strokeWidth="0.5" />

                            {/* Side Stripe (Brand Color) */}
                            <path d="M10,38 L150,38" stroke="#FDB813" strokeWidth="3" strokeLinecap="round" />

                            {/* Headlight - Xenon Blue/White */}
                            <path d="M8,32 L15,36 L8,38 Z" fill="#e0f7fa" filter="url(#glow)" />

                            {/* Taillight - LED Red */}
                            <path d="M150,32 L145,36 L150,38 Z" fill="#ff0000" filter="url(#glow)" />

                            {/* Door Handle */}
                            <rect x="75" y="34" width="10" height="2" rx="1" fill="#555" />
                        </svg>

                        {/* Wheels - Animated Rotation */}
                        <div className="absolute top-[38px] left-[30px]">
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ repeat: Infinity, duration: isPaused ? 0 : (isFast ? 0.2 : 0.5), ease: "linear" }}
                            >
                                <svg width="38" height="38" viewBox="0 0 40 40">
                                    <circle cx="20" cy="20" r="18" fill="#1a1a1a" stroke="#000" strokeWidth="2" />
                                    <circle cx="20" cy="20" r="12" fill="#333" stroke="#555" strokeWidth="1" />
                                    <circle cx="20" cy="20" r="4" fill="#111" />
                                    {/* Rims */}
                                    <path d="M20,2 L20,38 M2,20 L38,20 M7,7 L33,33 M7,33 L33,7" stroke="#666" strokeWidth="2" />
                                    <circle cx="20" cy="20" r="18" stroke="#FDB813" strokeWidth="1" fill="none" strokeDasharray="4 4" />
                                </svg>
                            </motion.div>
                        </div>

                        {/* Rear Wheel */}
                        <div className="absolute top-[38px] left-[120px]">
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ repeat: Infinity, duration: isPaused ? 0 : (isFast ? 0.2 : 0.5), ease: "linear" }}
                            >
                                <svg width="38" height="38" viewBox="0 0 40 40">
                                    <circle cx="20" cy="20" r="18" fill="#1a1a1a" stroke="#000" strokeWidth="2" />
                                    <circle cx="20" cy="20" r="12" fill="#333" stroke="#555" strokeWidth="1" />
                                    <circle cx="20" cy="20" r="4" fill="#111" />
                                    {/* Rims */}
                                    <path d="M20,2 L20,38 M2,20 L38,20 M7,7 L33,33 M7,33 L33,7" stroke="#666" strokeWidth="2" />
                                    <circle cx="20" cy="20" r="18" stroke="#FDB813" strokeWidth="1" fill="none" strokeDasharray="4 4" />
                                </svg>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
