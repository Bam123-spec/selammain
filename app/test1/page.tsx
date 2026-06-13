import type { Metadata } from "next";
import { TestCheckoutForm } from "./test-checkout-form";

export const metadata: Metadata = {
    title: "Test Email",
    robots: {
        index: false,
        follow: false,
    },
};

export default function Test1Page() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-12">
                <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="flex flex-col justify-center">
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">
                            Internal Test
                        </p>
                        <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-900">
                            Email Test
                        </h1>
                        <p className="mt-4 max-w-xl text-base leading-7 text-gray-600">
                            Use this page to send a real message through the current email path.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <TestCheckoutForm />
                    </div>
                </div>
            </div>
        </div>
    );
}
