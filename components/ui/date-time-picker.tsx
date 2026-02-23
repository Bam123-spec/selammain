"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface DateTimePickerProps {
    onSelect?: (date: Date, time: string) => void
    onDateChange?: (date: Date) => void
    availableTimes?: string[]
    minDate?: Date
    isLoading?: boolean
    selectedTime?: string | null
    selectedDate?: Date | null
}

const DEFAULT_TIMES = ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM"]

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export function DateTimePicker({
    onSelect,
    onDateChange,
    isLoading = false,
    availableTimes = DEFAULT_TIMES,
    minDate = new Date(),
    selectedTime: propSelectedTime,
    selectedDate: propSelectedDate,
}: DateTimePickerProps) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [currentMonth, setCurrentMonth] = useState(propSelectedDate ? propSelectedDate.getMonth() : today.getMonth())
    const [currentYear, setCurrentYear] = useState(propSelectedDate ? propSelectedDate.getFullYear() : today.getFullYear())

    // Use controlled props if available, otherwise internal state
    const [internalSelectedDate, setInternalSelectedDate] = useState<Date | null>(propSelectedDate || null)
    const [internalSelectedTime, setInternalSelectedTime] = useState<string | null>(propSelectedTime || null)

    const selectedDate = propSelectedDate !== undefined ? propSelectedDate : internalSelectedDate
    const selectedTime = propSelectedTime !== undefined ? propSelectedTime : internalSelectedTime

    // Sync internal state when props change (optional, but good for hybrid)
    // Actually, simple derived state is better.
    // However, we need to call callbacks to update parent.

    const calendarDays = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1)
        const lastDay = new Date(currentYear, currentMonth + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDay = firstDay.getDay()
        const days: (number | null)[] = []
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate()

        for (let i = startingDay - 1; i >= 0; i--) {
            days.push(-(prevMonthLastDay - i))
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i)
        }
        const remainingDays = 42 - days.length
        for (let i = 1; i <= remainingDays; i++) {
            days.push(null)
        }
        return days
    }, [currentMonth, currentYear])

    const navigateMonth = (direction: "prev" | "next") => {
        if (direction === "prev") {
            if (currentMonth === 0) {
                setCurrentMonth(11)
                setCurrentYear(currentYear - 1)
            } else {
                setCurrentMonth(currentMonth - 1)
            }
        } else {
            if (currentMonth === 11) {
                setCurrentMonth(0)
                setCurrentYear(currentYear + 1)
            } else {
                setCurrentMonth(currentMonth + 1)
            }
        }
    }

    const isDateDisabled = (day: number) => {
        const date = new Date(currentYear, currentMonth, day)
        date.setHours(0, 0, 0, 0)
        const min = new Date(minDate)
        min.setHours(0, 0, 0, 0)
        return date < min
    }

    const isToday = (day: number) => {
        return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()
    }

    const isSelected = (day: number) => {
        if (!selectedDate) return false
        return day === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear()
    }

    const handleDateSelect = (day: number) => {
        if (isDateDisabled(day)) return
        const date = new Date(currentYear, currentMonth, day)

        setInternalSelectedDate(date) // Update internal
        setInternalSelectedTime(null)

        onDateChange?.(date)
    }

    const formatSelectedDate = () => {
        if (!selectedDate) return ""
        const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][selectedDate.getDay()]
        return `${dayName}, ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}`
    }

    return (
        <div className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
                {/* Calendar Section */}
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <button
                            type="button"
                            onClick={() => navigateMonth("prev")}
                            className="p-2 hover:bg-gray-100 rounded-full transition-all active:scale-90 text-gray-400 hover:text-gray-900"
                            aria-label="Previous month"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-lg font-bold text-gray-900 tracking-tight">
                            {MONTHS[currentMonth]} {currentYear}
                        </span>
                        <button
                            type="button"
                            onClick={() => navigateMonth("next")}
                            className="p-2 hover:bg-gray-100 rounded-full transition-all active:scale-90 text-gray-400 hover:text-gray-900"
                            aria-label="Next month"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-y-4 gap-x-2 mb-4">
                        {DAYS.map((day) => (
                            <div key={day} className="h-8 flex items-center justify-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                {day}
                            </div>
                        ))}
                    </div>

                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={`${currentMonth}-${currentYear}`}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-7 gap-y-4 gap-x-2"
                        >
                            {calendarDays.map((day, index) => {
                                if (day === null) return <div key={`empty-${index}`} className="h-10 w-10" />
                                if (day < 0) return <div key={`prev-${index}`} className="h-10 w-10" />

                                const disabled = isDateDisabled(day)
                                const selected = isSelected(day)
                                const todayDate = isToday(day)

                                return (
                                    <button
                                        key={`day-${day}`}
                                        type="button"
                                        onClick={() => handleDateSelect(day)}
                                        disabled={disabled}
                                        className={cn(
                                            "h-10 w-10 flex items-center justify-center text-sm rounded-full transition-all relative group font-medium",
                                            disabled && "text-gray-300 cursor-not-allowed",
                                            !disabled && !selected && "hover:bg-gray-100 text-gray-700 cursor-pointer",
                                            selected && "bg-black text-white font-bold shadow-md",
                                            todayDate && !selected && "text-[#FDB813] font-bold"
                                        )}
                                    >
                                        {day}
                                        {todayDate && !selected && (
                                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#FDB813] rounded-full" />
                                        )}
                                    </button>
                                )
                            })}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Time Slots Section */}
                <div className="flex flex-col">
                    <div className="mb-6 pb-4 border-b border-gray-100">
                        <h4 className="text-xl font-bold text-gray-900 truncate">
                            {selectedDate ? `Availability for ${format(selectedDate, "EEEE, MMMM d")}` : "Select a date to view times"}
                        </h4>
                    </div>

                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            {selectedDate ? (
                                isLoading ? (
                                    <motion.div
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="grid grid-cols-2 gap-4"
                                    >
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                            <div key={i} className="h-12 rounded-full bg-gray-100 animate-pulse" />
                                        ))}
                                    </motion.div>
                                ) : (
                                    availableTimes.length > 0 ? (
                                        <motion.div
                                            key="slots"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="grid grid-cols-2 gap-4"
                                        >
                                            {availableTimes.map((time, i) => {
                                                const isSelectedTime = selectedTime === time;
                                                return (
                                                    <motion.button
                                                        key={time}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: i * 0.02 }}
                                                        type="button"
                                                        onClick={() => {
                                                            setInternalSelectedTime(time)
                                                            onSelect?.(selectedDate, time)
                                                        }}
                                                        className={cn(
                                                            "h-12 flex items-center justify-center text-sm font-semibold rounded-full border-2 transition-all active:scale-95",
                                                            isSelectedTime
                                                                ? "bg-black border-black text-white shadow-md"
                                                                : "bg-white border-gray-200 hover:border-black text-gray-600 hover:text-black"
                                                        )}
                                                    >
                                                        {time}
                                                    </motion.button>
                                                )
                                            })}
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="no-slots"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex flex-col items-center justify-center h-[200px] text-center"
                                        >
                                            <p className="text-sm font-medium text-gray-500">No availability for this date.</p>
                                        </motion.div>
                                    )
                                )
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center h-[200px] text-center text-gray-400"
                                >
                                    <Calendar className="w-8 h-8 mb-3 opacity-20" />
                                    <p className="text-sm">Select a date to view available times</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    )
}
