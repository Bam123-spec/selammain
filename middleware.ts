import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const pathname = request.nextUrl.pathname;
    const publicStudentRoutes = [
        "/student/login",
        "/student/signup",
        "/student/forgot-password",
        "/student/reset-password",
        "/student/magic",
    ];

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.warn("Middleware: Missing Supabase environment variables. Skipping auth check.");
        return response;
    }

    try {
        const supabase = createServerClient(
            supabaseUrl,
            supabaseKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            request.cookies.set(name, value)
                        );
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        });
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        );
                    },
                },
            }
        );

        const {
            data: { user },
        } = await supabase.auth.getUser();

        const isPublicStudentRoute = publicStudentRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

        // Protected student routes
        if (!isPublicStudentRoute) {
            if (!user) {
                return NextResponse.redirect(new URL("/student/login", request.url));
            }
        }

        // Auth routes (redirect if already logged in)
        if (pathname.startsWith("/student/login") ||
            pathname.startsWith("/student/signup")) {
            if (user) {
                return NextResponse.redirect(new URL("/student/dashboard", request.url));
            }
        }
    } catch (error) {
        console.error("Middleware: Error initializing Supabase client:", error);
        // Allow request to proceed if Supabase fails, to avoid 500 error for the whole site
        return response;
    }

    return response;
}

export const config = {
    matcher: [
        "/student/:path*",
    ],
};
