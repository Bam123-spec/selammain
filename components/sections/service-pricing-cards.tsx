"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronRight, Check, Loader2 } from "lucide-react"
import * as motion from "framer-motion/client"
import { useState } from "react"
import { toast } from "sonner"

interface Plan {
    title: string
    description?: string
    features?: string[]
    price: React.ReactNode
    image: string
    slug: string
    popular?: boolean
    href?: string
    time?: string
    isAppRoute?: boolean
}

interface ServicePricingCardsProps {
    title: string
    plans: Plan[]
    sharpButtons?: boolean
}

export function ServicePricingCards({ title, plans, sharpButtons }: ServicePricingCardsProps) {
    return (
        <section className="py-12 bg-white">
            <div className="container mx-auto px-4">
                {title && <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{title}</h2>}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto items-start">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`group flex flex-col rounded-[2rem] overflow-hidden transition-all duration-300 bg-white border relative
                                ${plan.popular
                                    ? 'shadow-[0_20px_50px_-10px_rgba(253,184,19,0.5)] scale-105 border-[#FDB813] z-10 md:-mt-4'
                                    : 'shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border-gray-100 hover:shadow-[0_20px_40px_-10px_rgba(253,184,19,0.2)] md:hover:-translate-y-2'
                                }
                            `}
                        >
                            {/* Most Popular Badge */}
                            {plan.popular && (
                                <div className="absolute top-0 right-0 bg-black text-[#FDB813] text-xs font-bold px-4 py-2 rounded-bl-xl z-20 uppercase tracking-wider">
                                    Most Popular
                                </div>
                            )}

                            {/* Image Section */}
                            <div className="relative h-48 w-full bg-gray-200 overflow-hidden">
                                <Image
                                    src={plan.image}
                                    alt={plan.title}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
                            </div>

                            {/* Content Section */}
                            <div className={`flex flex-col flex-1 p-6 md:p-8 transition-colors duration-300 
                                ${plan.popular ? 'bg-[#FDB813]' : 'bg-white group-hover:bg-[#fffcf5]'}
                            `}>
                                <h3 className="text-xl font-black text-black mb-3 uppercase tracking-tight">{plan.title}</h3>

                                <div className="mb-8 flex-1">
                                    {plan.features ? (
                                        <ul className="space-y-4">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-start text-sm font-medium text-gray-900/90">
                                                    <div className={`mr-3 mt-0.5 p-1 rounded-full ${plan.popular ? 'bg-black/10' : 'bg-green-100'}`}>
                                                        <Check className={`w-3 h-3 ${plan.popular ? 'text-black' : 'text-green-600'}`} strokeWidth={3} />
                                                    </div>
                                                    <span className="leading-tight">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-900/80 leading-relaxed font-medium">
                                            {plan.description}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-auto">
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-3xl font-black text-black">{plan.price}</span>
                                        {plan.time && <span className="text-sm font-bold text-black/60 ml-1">/ {plan.time}</span>}
                                    </div>
                                    <Button
                                        asChild
                                        className={`w-full font-bold h-12 ${sharpButtons ? 'rounded-none' : 'rounded-xl'} shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]
                                            ${plan.popular
                                                ? 'bg-black text-white hover:bg-gray-900'
                                                : 'bg-[#FDB813] text-black hover:bg-[#e6a600]'
                                            }
                                        `}
                                    >
                                        <Link href={plan.slug === 'driving-practice-10hr' ? '/services/driving-practice-packages/10-hour' : (plan.isAppRoute ? plan.slug : (plan.href ?? `/booking?plan=${plan.slug}`))}>
                                            {plan.slug === 'driving-practice-10hr' ? 'LEARN MORE' : 'BOOK NOW'}
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
