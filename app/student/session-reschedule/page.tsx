"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { Calendar, ChevronLeft, Clock, Info, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { supabase } from "@/lib/supabaseClient";

function formatTimeDisplay(timeStr: string) {
    try {
        return format(parseISO(timeStr), "h:mm a");
    } catch {
        return timeStr;
    }
}

function serviceLabelFromSession(session: any) {
    const key = (session?.plan_key || session?.service_slug || "").toLowerCase();
    if (key === "driving-practice-1hr") return "Driving Practice 1HR";
    if (key === "driving-practice-2hr") return "Driving Practice 2HR";
    if (key === "road-test-escort") return "Road Test Service";
    if (key === "road-test-1hr") return "Road Test Service + 1 Hour";
    if (key === "road-test-2hr") return "Road Test Service + 2 Hour";
    return "Driving Session";
}

export default function SessionReschedulePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");

    const [sessionRow, setSessionRow] = useState<any | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isRescheduling, setIsRescheduling] = useState(false);

    const loadAvailability = async (date: Date, row: any) => {
        const planKey = row?.plan_key || row?.service_slug;
        if (!planKey) {
            toast.error("This session cannot be rescheduled yet.");
            return;
        }

        setIsLoadingSlots(true);
        try {
            const dateStr = format(date, "yyyy-MM-dd");
            const response = await fetch(`/api/availability?plan_key=${encodeURIComponent(planKey)}&date=${dateStr}`, {
                cache: "no-store",
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error || "Failed to load available slots.");
            }
            setAvailableSlots(payload.slots || []);
        } catch (error: any) {
            setAvailableSlots([]);
            toast.error(error?.message || "Failed to load available slots.");
        } finally {
            setIsLoadingSlots(false);
        }
    };

    useEffect(() => {
        const loadSession = async () => {
            if (!sessionId) {
                toast.error("Missing session id.");
                router.replace("/student/dashboard");
                return;
            }

            try {
                const { data: authData } = await supabase.auth.getUser();
                const user = authData?.user;
                if (!user) {
                    router.replace("/student/login");
                    return;
                }

                const { data, error } = await supabase
                    .from("driving_sessions")
                    .select("*, instructors(full_name)")
                    .eq("id", sessionId)
                    .eq("student_id", user.id)
                    .single();

                if (error || !data) {
                    throw new Error("Session not found.");
                }

                setSessionRow(data);
                const currentStart = new Date(data.start_time);
                setSelectedDate(currentStart);
                await loadAvailability(currentStart, data);
            } catch (error: any) {
                toast.error(error?.message || "Could not load session.");
                router.replace("/student/dashboard");
            } finally {
                setIsLoadingSession(false);
            }
        };

        loadSession();
    }, [router, sessionId]);

    const handleDateChange = async (date: Date) => {
        setSelectedDate(date);
        setSelectedTime(null);
        if (sessionRow) {
            await loadAvailability(date, sessionRow);
        }
    };

    const handleReschedule = async () => {
        if (!sessionId || !selectedTime) {
            toast.error("Please select a new time.");
            return;
        }

        setIsRescheduling(true);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;
            if (!accessToken) {
                router.push("/student/login");
                return;
            }

            const response = await fetch("/api/reschedule-driving-session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    sessionId,
                    slot: selectedTime,
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error || "Reschedule failed.");
            }

            toast.success("Session rescheduled successfully. Confirmation email sent.");
            router.push("/student/dashboard?refresh=true");
        } catch (error: any) {
            toast.error(error?.message || "Reschedule failed.");
        } finally {
            setIsRescheduling(false);
        }
    };

    if (isLoadingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!sessionRow) return null;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <Button variant="ghost" size="sm" asChild className="p-0 h-auto hover:bg-transparent text-gray-400 hover:text-black">
                                <Link href="/student/dashboard">
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Back to Dashboard
                                </Link>
                            </Button>
                            <div className="h-4 w-[1px] bg-gray-200 mx-1" />
                            <span className="text-[10px] font-black text-[#FDB813] uppercase tracking-[0.2em]">Reschedule Session</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
                            {serviceLabelFromSession(sessionRow)} <span className="text-blue-600">Reschedule</span>
                        </h1>
                        <p className="text-gray-500 mt-2 text-lg">Choose a new available date and time.</p>
                    </div>
                    <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-nowrap">Timezone: Eastern (EST)</span>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 md:p-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-8">
                            <DateTimePicker
                                onDateChange={handleDateChange}
                                onSelect={(date, time) => {
                                    const slot = availableSlots.find((s) => formatTimeDisplay(s) === time);
                                    if (slot) setSelectedTime(slot);
                                }}
                                availableTimes={availableSlots.map((s) => formatTimeDisplay(s))}
                                minDate={new Date()}
                                isLoading={isLoadingSlots}
                                selectedDate={selectedDate}
                                selectedTime={selectedTime ? formatTimeDisplay(selectedTime) : null}
                            />
                        </div>

                        <div className="lg:col-span-4 space-y-4">
                            <div className="rounded-2xl border border-gray-100 p-5 bg-gray-50">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Current Session</p>
                                <p className="font-bold text-gray-900">{format(new Date(sessionRow.start_time), "MMMM dd, yyyy")}</p>
                                <p className="text-sm font-semibold text-gray-600">
                                    {format(new Date(sessionRow.start_time), "h:mm aa")} - {format(new Date(sessionRow.end_time), "h:mm aa")}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-gray-100 p-5 bg-white">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">New Session</p>
                                {selectedTime ? (
                                    <>
                                        <p className="font-bold text-gray-900">{format(parseISO(selectedTime), "MMMM dd, yyyy")}</p>
                                        <p className="text-sm font-semibold text-gray-600">{format(parseISO(selectedTime), "h:mm aa")}</p>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-500">Select a new available slot.</p>
                                )}
                            </div>

                            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-700 font-medium flex items-start gap-2">
                                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                                A confirmation email will be sent automatically once your reschedule is successful.
                            </div>

                            <Button
                                onClick={handleReschedule}
                                disabled={!selectedTime || isRescheduling}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-xl h-12"
                            >
                                {isRescheduling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
                                {isRescheduling ? "Rescheduling..." : "Confirm Reschedule"}
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

