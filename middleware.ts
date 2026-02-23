import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
    // Verifying middleware active
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

        // Protected routes
        if (request.nextUrl.pathname.startsWith("/student") &&
            !request.nextUrl.pathname.startsWith("/student/login") &&
            !request.nextUrl.pathname.startsWith("/student/signup") &&
            !request.nextUrl.pathname.startsWith("/student/forgot-password") &&
            !request.nextUrl.pathname.startsWith("/student/reset-password")) {
            if (!user) {
                return NextResponse.redirect(new URL("/student/login", request.url));
            }
        }

        // Auth routes (redirect if already logged in)
        if (request.nextUrl.pathname.startsWith("/student/login") ||
            request.nextUrl.pathname.startsWith("/student/signup")) {
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
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
