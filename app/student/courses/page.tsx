"use client"

import { useStudentDashboardData, useCurrentStudent } from "@/hooks/useStudentPortal"
import { GraduationCap, Loader2, Calendar, CheckCircle2, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"

export default function StudentCoursesPage() {
    const { enrollments, loading: dataLoading } = useStudentDashboardData()
    const { student, loading: studentLoading } = useCurrentStudent()
    const loading = dataLoading || studentLoading

    const hasDriversEd = enrollments.some(e => {
        const cls = Array.isArray(e.classes) ? e.classes[0] : e.classes;
        const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
        return cls?.class_type === 'DE' || course?.type === 'drivers_ed';
    });
    const hasPassedDriversEd = enrollments.some(e => {
        const cls = Array.isArray(e.classes) ? e.classes[0] : e.classes;
        const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
        const isDE = cls?.class_type === 'DE' || course?.type === 'drivers_ed';
        return isDE && (e.status === 'completed' || e.btw_credits_granted);
    });
    const isEligibleForBTW = enrollments.some(e => {
        const cls = Array.isArray(e.classes) ? e.classes[0] : e.classes;
        const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
        const isDE = cls?.class_type === 'DE' || course?.type === 'drivers_ed';
        const numericGrade = Number((e as any).grade ?? (e as any).final_grade);
        return isDE && (e.status === 'completed' || (!Number.isNaN(numericGrade) && numericGrade >= 80) || e.btw_credits_granted);
    });
    const showBtw = (student?.btw_access_enabled || isEligibleForBTW) && hasDriversEd;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2 uppercase">My <span className="text-blue-600">Courses</span></h1>
                    <p className="text-gray-500 text-lg font-medium">Manage your active enrollments and track your progress.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {(() => {
                        const filteredEnrollments = enrollments.filter(e => {
                            const course = Array.isArray(e.courses) ? e.courses[0] : e.courses;
                            const cls = Array.isArray(e.classes) ? e.classes[0] : e.classes;
                            const serviceType = (e as any).customer_details?.service_type;

                            const isDIP = serviceType === 'DIP_PACKAGE' || cls?.class_type === 'DIP' || cls?.name?.includes('Driving Improvement');
                            const isRSEP = serviceType === 'RSEP_PACKAGE' || cls?.class_type === 'RSEP' || cls?.name?.includes('RSEP');
                            const isDE = cls?.class_type === 'DE' || course?.type === 'drivers_ed';

                            return isDE || isDIP || isRSEP;
                        });

                        return filteredEnrollments.length > 0 ? (
                            filteredEnrollments.map((enrollment) => (
                                <div key={enrollment.id} className="bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden group flex flex-col h-full">
                                    {/* Course Status Header */}
                                    <div className="p-8 pb-4 flex justify-between items-start">
                                        <div className="bg-blue-50 p-4 rounded-2xl group-hover:bg-blue-600 transition-colors duration-500">
                                            <GraduationCap className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors duration-500" />
                                        </div>
                                        <Badge className={`${enrollment.status === 'active' || enrollment.status === 'enrolled' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'} border-none font-black uppercase tracking-widest text-[10px] px-3 py-1`}>
                                            {enrollment.status?.replace('_', ' ')}
                                        </Badge>
                                    </div>

                                    <div className="p-8 pt-4 flex-grow">
                                        {(() => {
                                            const course = Array.isArray(enrollment.courses) ? enrollment.courses[0] : enrollment.courses;
                                            const cls = Array.isArray(enrollment.classes) ? enrollment.classes[0] : enrollment.classes;
                                            return (
                                                <>
                                                    <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                                                        {cls?.name || course?.title || "Driving Course"}
                                                    </h3>
                                                    <p className="text-gray-500 text-sm mb-6 line-clamp-2 font-medium">
                                                        {course?.description || (cls?.class_type === 'DE' ? "Complete MVA-certified 36-hour Driver's Education course." : "Master the road with our professional certified driving curriculum.")}
                                                    </p>
                                                </>
                                            );
                                        })()}

                                        <div className="space-y-4 pt-4 border-t border-gray-50">
                                            <div className="flex items-center gap-3 text-sm">
                                                <Calendar className="w-5 h-5 text-gray-400" />
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Enrolled On</p>
                                                    <p className="font-bold text-gray-700">{format(new Date(enrollment.enrolled_at), "MMMM dd, yyyy")}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 text-sm">
                                                <CheckCircle2 className={`w-5 h-5 ${enrollment.certification_status === 'Approved' ? 'text-emerald-500' : 'text-amber-500'}`} />
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Certification</p>
                                                    <p className={`font-bold capitalize ${enrollment.certification_status === 'Approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                        {enrollment.certification_status || "Pending"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 text-sm">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black ${Number(enrollment.grade) >= 80 || enrollment.btw_credits_granted ? 'bg-emerald-50 text-emerald-600' :
                                                    (enrollment.grade || enrollment.final_grade) ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'
                                                    }`}>
                                                    {enrollment.grade ? `${enrollment.grade}%` : (enrollment.final_grade ? `${enrollment.final_grade}%` : '--')}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Final Result</p>
                                                    <p className={`font-bold ${Number(enrollment.grade) >= 80 || enrollment.btw_credits_granted ? 'text-emerald-700' : 'text-gray-700'}`}>
                                                        {Number(enrollment.grade) >= 80 || enrollment.btw_credits_granted ? 'Approved for BTW' : (enrollment.status === 'completed' ? 'Completed' : 'Study in Progress')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 pt-0 mt-auto">
                                        <Button className="w-full bg-gray-900 group-hover:bg-blue-600 text-white font-black uppercase tracking-widest py-6 rounded-none transition-all duration-300 transform group-hover:-translate-y-1 shadow-md hover:shadow-xl group-hover:shadow-blue-600/20 mb-3" asChild>
                                            <Link href={`/student/history?id=${enrollment.id}`}>Progress & Attendance</Link>
                                        </Button>
                                        {showBtw && (
                                            <Button variant="outline" className="w-full border-2 border-gray-100 text-gray-400 font-black uppercase tracking-widest py-6 rounded-none transition-all duration-300 hover:border-blue-600 hover:text-blue-600" asChild>
                                                <Link href="/student/behind-the-wheel">Book BTW Sessions</Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full h-[400px] border-2 border-dashed border-gray-200 rounded-[3rem] flex flex-col items-center justify-center text-center p-10 bg-white/50">
                                <div className="bg-gray-100 p-6 rounded-full mb-6">
                                    <AlertCircle className="w-12 h-12 text-gray-400" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">No Courses Found</h3>
                                <p className="text-gray-500 max-w-sm mb-10 font-medium">You haven't registered for any courses yet. Start your journey today!</p>
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest px-10 h-14 rounded-none shadow-lg shadow-blue-600/20" asChild>
                                    <Link href="/services/drivers-education-packages">Join A Class</Link>
                                </Button>
                            </div>
                        )
                    })()}
                </div>
            </div>
        </div>
    )
}
