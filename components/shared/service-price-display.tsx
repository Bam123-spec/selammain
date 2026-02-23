"use client"

import { useEffect, useState } from "react"
import { getClasses } from "@/app/actions/classes"
import { getServiceBySlug } from "@/app/actions/services"

interface ServicePriceDisplayProps {
    type?: 'class' | 'service'
    identifier: string // classType for 'class', slug for 'service'
    fallbackPrice: string
    className?: string
    prefix?: string
}

export function ServicePriceDisplay({ type = 'class', identifier, fallbackPrice, className, prefix = "" }: ServicePriceDisplayProps) {
    const [price, setPrice] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPrice = async () => {
            try {
                if (type === 'class') {
                    // Fetch just 1 class to get the price
                    const data = await getClasses(identifier, '', 1)

                    if (data && data.length > 0 && data[0].price) {
                        setPrice(String(data[0].price))
                    }
                } else {
                    // Fetch service by slug
                    const data = await getServiceBySlug(identifier)

                    if (data && data.price) {
                        setPrice(String(data.price))
                    }
                }
            } catch (error) {
                console.error(`Error fetching price for ${identifier}:`, error)
            } finally {
                setLoading(false)
            }
        }

        fetchPrice()
    }, [type, identifier])

    if (loading) {
        return <span className={`opacity-50 animate-pulse ${className}`}>...</span>
    }

    // Format price to remove .00 if it's a whole number for cleaner look
    const val = price ? parseFloat(price).toString() : fallbackPrice

    return (
        <span className={className}>{prefix}${val}</span>
    )
}
