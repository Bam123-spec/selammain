"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BlogCard } from "@/components/cards/blog-card"
import { blogPosts } from "@/lib/blog-data"

const categories = ["All", "Road Test Guides", "Tips & Tricks", "MVA Updates", "Safety", "Education"]

export default function BlogPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("All")

    // Filter posts based on search and category
    const filteredPosts = blogPosts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === "All" || post.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category)
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Hero Banner */}
            <section className="relative py-24 md:py-32 bg-[#111111] overflow-hidden">
                <div className="absolute inset-0 bg-[url('/road-practice.jpg')] opacity-20 bg-cover bg-center"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/90"></div>

                <div className="container relative z-10 mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                        Driving Tips & <span className="text-[#FDB813]">News</span>
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                        Expert driving tips, Maryland road test guidance, safety advice, and MVA updates.
                    </p>
                </div>
            </section>

            {/* Search & Filter */}
            <section className="py-10 bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            {categories.map(category => (
                                <Badge
                                    key={category}
                                    variant={selectedCategory === category ? "default" : "outline"}
                                    className={`cursor-pointer px-4 py-2 text-sm transition-all ${selectedCategory === category
                                        ? "bg-[#FDB813] text-black hover:bg-[#e5a700] border-transparent"
                                        : "border-gray-200 text-gray-600 hover:border-[#FDB813] hover:text-black"
                                        }`}
                                    onClick={() => handleCategoryChange(category)}
                                >
                                    {category}
                                </Badge>
                            ))}
                        </div>
                        <div className="relative w-full md:w-auto min-w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search articles..."
                                className="pl-10 border-gray-200 focus:border-[#FDB813] focus:ring-[#FDB813]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Blog Grid */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    {filteredPosts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                            {filteredPosts.map((post) => (
                                <BlogCard
                                    key={post.slug}
                                    {...post}
                                    slug={post.slug} // Pass raw slug, BlogCard handles the prefix
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-xl text-gray-500 mb-4">No articles found matching your criteria.</p>
                            <Button
                                variant="link"
                                onClick={() => {
                                    setSearchTerm("")
                                    setSelectedCategory("All")
                                }}
                                className="text-[#FDB813] font-bold text-lg"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
