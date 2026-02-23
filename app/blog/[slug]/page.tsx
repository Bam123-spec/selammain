import { blogPosts } from "@/lib/blog-data"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, User, ChevronLeft, CheckCircle2, Quote } from "lucide-react"

// Generate static params for all blog posts
export async function generateStaticParams() {
    return blogPosts.map((post) => ({
        slug: post.slug,
    }))
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
    const post = blogPosts.find((p) => p.slug === params.slug)

    if (!post) {
        notFound()
    }

    return (
        <article className="min-h-screen bg-white">
            {/* Hero Section */}
            <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden bg-black">
                <div className="absolute inset-0 opacity-40">
                    <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                <div className="container relative h-full mx-auto px-4 flex flex-col justify-end pb-16 md:pb-24">
                    <Link
                        href="/blog"
                        className="inline-flex items-center text-gray-300 hover:text-white mb-8 transition-colors group"
                    >
                        <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Articles
                    </Link>

                    <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-[#FDB813] mb-4">
                        <span className="bg-[#FDB813]/10 px-3 py-1 rounded-full border border-[#FDB813]/20">
                            {post.category}
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight max-w-4xl">
                        {post.title}
                    </h1>

                    <div className="flex items-center gap-6 text-gray-300 text-sm md:text-base">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-[#FDB813]" />
                            {post.author}
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#FDB813]" />
                            {post.date}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-4 py-16 md:py-24">
                <div className="max-w-3xl mx-auto">
                    {/* Intro */}
                    <p className="text-xl md:text-2xl text-gray-600 leading-relaxed mb-12 font-medium border-l-4 border-[#FDB813] pl-6">
                        {post.content.intro}
                    </p>

                    {/* Main Content Sections */}
                    <div className="space-y-12 mb-16">
                        {post.content.sections.map((section, index) => (
                            <div key={index}>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                                    {section.heading}
                                </h2>
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    {section.content}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Key Takeaways / Bullets */}
                    <div className="bg-gray-50 rounded-3xl p-8 md:p-10 mb-16 border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Key Takeaways</h3>
                        <ul className="space-y-4">
                            {post.content.bullets.map((bullet, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <CheckCircle2 className="w-6 h-6 text-[#FDB813] shrink-0 mt-0.5" />
                                    <span className="text-gray-700 text-lg">{bullet}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Instructor Quote */}
                    <div className="relative mb-16">
                        <Quote className="absolute -top-4 -left-4 w-12 h-12 text-[#FDB813]/20 rotate-180" />
                        <blockquote className="text-2xl md:text-3xl font-bold text-center text-gray-900 italic leading-relaxed px-8">
                            "{post.content.quote}"
                        </blockquote>
                    </div>

                    {/* CTA Box */}
                    <div className="bg-[#111111] rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('/icon-traffic-light-sign.png')] opacity-5 bg-center bg-no-repeat bg-contain" />
                        <div className="relative z-10">
                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                                Ready to hit the road?
                            </h3>
                            <p className="text-gray-400 mb-8 text-lg max-w-xl mx-auto">
                                {post.content.cta}
                            </p>
                            <Button
                                asChild
                                size="lg"
                                className="bg-[#FDB813] hover:bg-[#e5a700] text-black font-bold text-lg px-8 py-6 rounded-full"
                            >
                                <Link href="/booking">Book a Lesson Now</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    )
}
