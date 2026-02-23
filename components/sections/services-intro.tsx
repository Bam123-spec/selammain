"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { PremiumCarAnimation } from "@/components/ui/premium-car-animation"
import { ServicePriceDisplay } from "@/components/shared/service-price-display"

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2
        }
    }
}

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: "easeOut" as const
        }
    },
    hover: {
        y: -5,
        transition: {
            duration: 0.2,
            ease: "easeInOut" as const
        }
    }
}

// Helper component to avoid duplication
const CardContent = ({ service }: { service: any }) => (
    <>
        {/* Card Image */}
        <div className="relative h-40 md:h-48 w-full overflow-hidden">
            <Image
                src={service.image}
                alt={service.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
        </div>

        {/* Card Content */}
        <div className="p-6 flex flex-col flex-grow">
            <h3 className="text-gray-900 font-bold text-lg mb-2 uppercase tracking-wider group-hover:text-[#FDB813] transition-colors">
                {service.title}
            </h3>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed line-clamp-2 flex-grow">
                {service.description}
            </p>

            <div className="flex flex-col gap-3 mt-auto">
                <Button className="w-full bg-[#FDB813] hover:bg-[#e5a700] text-black font-bold text-sm uppercase tracking-widest transform transition-transform duration-300 hover:scale-105" asChild>
                    <Link href={service.enrollLink}>ENROLL</Link>
                </Button>
                <Button variant="outline" className="w-full border-gray-200 text-gray-900 hover:bg-gray-50 font-bold text-sm uppercase tracking-widest" asChild>
                    <Link href={service.link}>LEARN MORE</Link>
                </Button>
            </div>
        </div>
    </>
)

export function ServicesIntro() {

    return (
        <section id="services" className="relative z-20 mt-0 lg:-mt-40 pb-16 bg-white rounded-none overflow-hidden shadow-none lg:shadow-none">
            {/* Decorative Road Signs */}
            <div className="absolute top-20 -left-4 w-24 h-24 opacity-10 pointer-events-none hidden xl:block rotate-12">
                <Image
                    src="/icon-traffic-light-sign.png"
                    alt="Traffic Light"
                    fill
                    className="object-contain"
                />
            </div>
            <div className="absolute bottom-20 -right-4 w-36 h-36 opacity-10 pointer-events-none hidden xl:block -rotate-12">
                <Image
                    src="/icon-stop-sign.png"
                    alt="Stop Sign"
                    fill
                    className="object-contain"
                />
            </div>
            <div className="absolute top-32 -right-4 w-28 h-28 opacity-10 pointer-events-none hidden xl:block rotate-6">
                <Image
                    src="/icon-winding-road-sign.png"
                    alt="Winding Road"
                    fill
                    className="object-contain"
                />
            </div>


            {/* Background Animation Layer - Moved after signs to be on top */}
            {/* <PremiumCarAnimation /> - Removed as per request */}

            <div className="container mx-auto px-4 pt-4 md:pt-10 relative z-10 border-none outline-none">
                <div className="text-center mb-6 md:mb-16 border-none outline-none">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="border-none outline-none"
                    >
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 tracking-tight border-none outline-none">
                            OUR <span className="text-[#FDB813]">SERVICES</span>
                        </h2>
                        <div className="h-1 w-16 md:w-24 bg-[#FDB813] mx-auto rounded-full border-none outline-none"></div>
                    </motion.div>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
                >
                    {[
                        {
                            title: "Driver's Education",
                            description: "Complete 36-hour MVA-certified course for new drivers. Includes classroom and behind-the-wheel training.",
                            price: "Starting at $390",
                            type: "class",
                            identifier: "DE",
                            prefix: "Starting at ",
                            priceFallback: "390",
                            image: "/drivers-ed-home.jpg",
                            link: "/services/drivers-education",
                            enrollLink: "/services/drivers-education-packages"
                        },
                        {
                            title: "Driving Practice",
                            description: "Private behind-the-wheel training to master your driving skills. Perfect for nervous drivers.",
                            price: "Starting at $65",
                            type: "service",
                            identifier: "refresher",
                            prefix: "Starting at ",
                            priceFallback: "65",
                            image: "/road-practice.jpg",
                            link: "/services/driving-practice",
                            enrollLink: "/services/driving-practice-packages"
                        },
                        {
                            title: "Driving Improvement Program",
                            description: "MVA-approved Driver Improvement Program (DIP) for point reduction and court requirements.",
                            price: "$100",
                            type: "class",
                            identifier: "DIP",
                            prefix: "",
                            priceFallback: "100",
                            image: "/person-driving-car-instructor-lesson.jpg",
                            link: "/services/dip",
                            enrollLink: "/services/dip"
                        },
                        {
                            title: "3-Hour Roadway Safety (RSEP)",
                            description: "Required alcohol and drug education program for international license conversion.",
                            price: "$100",
                            type: "class",
                            identifier: "RSEP",
                            prefix: "",
                            priceFallback: "100",
                            image: "/icon-traffic-light-sign.png",
                            link: "/services/rsep",
                            enrollLink: "/services/rsep-packages"
                        },
                        {
                            title: "Road Test Service",
                            description: "Use our car and instructor for your MVA road test. Includes warm-up lesson and transportation.",
                            price: "Starting at $120",
                            type: "service",
                            identifier: "road-test-escort",
                            prefix: "Starting at ",
                            priceFallback: "120",
                            image: "/bas-peperzak-tyhpK_QelPo-unsplash.jpg",
                            link: "/services/road-test",
                            enrollLink: "/services/road-test-packages"
                        }
                    ].map((service, index) => {
                        return (
                            <motion.div
                                key={index}
                                variants={cardVariants}
                                whileHover="hover"
                                className="group relative bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden hover:border-[#FDB813]/50 transition-all duration-300 hover:shadow-xl hover:shadow-[#FDB813]/10 flex flex-col h-full"
                            >
                                {/* Card Image */}
                                <div className="relative h-48 md:h-56 w-full overflow-hidden bg-gray-100">
                                    <Image
                                        src={service.image}
                                        alt={service.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>

                                    {/* Price Badge */}
                                    <div className="absolute top-4 right-4 bg-[#FDB813] text-black font-black text-xs py-1 px-3 rounded-full uppercase tracking-wider shadow-md">
                                        {service.identifier === "refresher" ? (
                                            <span>{service.price}</span>
                                        ) : (
                                            <ServicePriceDisplay
                                                type={service.type as any}
                                                identifier={service.identifier}
                                                fallbackPrice={service.priceFallback}
                                                prefix={service.prefix}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="p-6 flex flex-col flex-grow relative">
                                    <h3 className="text-gray-900 font-black text-lg mb-3 uppercase tracking-tight group-hover:text-[#FDB813] transition-colors leading-tight">
                                        {service.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-6 leading-relaxed line-clamp-3 flex-grow font-medium">
                                        {service.description}
                                    </p>

                                    <div className="flex flex-col gap-3 mt-auto">
                                        <Button className="w-full bg-[#FDB813] hover:bg-[#e5a700] text-black font-black text-sm uppercase tracking-widest transform transition-all duration-300 hover:scale-[1.02] shadow-md rounded-xl" asChild>
                                            <Link href={service.enrollLink}>ENROLL</Link>
                                        </Button>
                                        <Button variant="outline" className="w-full border-2 border-gray-100 text-gray-900 hover:bg-gray-50 hover:border-gray-200 font-bold text-sm uppercase tracking-widest rounded-xl" asChild>
                                            <Link href={service.link}>LEARN MORE</Link>
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </motion.div>
            </div>
        </section>
    )
}
