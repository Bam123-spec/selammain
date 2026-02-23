import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const runtime = 'edge';

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const cookieStore = await cookies()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.error('Course Page: Missing Supabase environment variables')
        return (
            <div className="container mx-auto py-20 px-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Service Unavailable</h1>
                <p>We are currently experiencing technical difficulties. Please try again later.</p>
            </div>
        )
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const { data: course } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .single()

    if (!course) {
        notFound()
    }

    return (
        <div className="container mx-auto py-20 px-4">
            <div className="max-w-4xl mx-auto">
                <Link href="/services" className="text-primary hover:underline mb-8 inline-block">
                    ← Back to Services
                </Link>

                <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
                <div className="flex gap-4 mb-8 text-muted-foreground">
                    <span>⏱ {course.duration_hours} Hours</span>
                    <span>💰 ${course.price}</span>
                </div>

                <div className="prose max-w-none mb-12">
                    <p className="text-xl leading-relaxed">{course.description}</p>
                </div>

                <div className="bg-muted p-8 rounded-xl">
                    <h2 className="text-2xl font-bold mb-4">Ready to start?</h2>
                    <p className="mb-6">Book your first lesson now.</p>
                    <Link
                        href={`/booking?plan=${course.slug}`}
                        className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        Book Now
                    </Link>
                </div>
            </div>
        </div>
    )
}
