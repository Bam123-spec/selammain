"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import {
    User,
    Mail,
    Phone,
    Lock,
    Shield,
    CheckCircle2,
    AlertCircle,
    Camera,
    Loader2,
    ChevronRight,
    Home,
    LogOut,
    Upload
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCurrentStudent } from "@/hooks/useStudentPortal"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function StudentSettingsPage() {
    const { student, loading } = useCurrentStudent()
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [passwordOpen, setPasswordOpen] = useState(false)
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [passwords, setPasswords] = useState({
        new: "",
        confirm: ""
    })
    // Local avatar state to update immediately on upload
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

    // Sync avatarUrl with student data when loaded
    useState(() => {
        if (student?.avatar_url) setAvatarUrl(student.avatar_url)
    })

    const handleLogout = async () => {
        await supabase.auth.signOut()
        toast.success("Logged out successfully")
        router.push("/")
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click()
    }

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.')
            }

            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const fileName = `${student?.id}/${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) {
                // If bucket missing, try to create it via our temp API (fallback)
                // This is a rough fallback, ideally caught earlier
                if (uploadError.message.includes("Bucket not found")) {
                    await fetch('/api/setup/storage'); // Try to trigger setup
                    // Retry upload once? simplified for now just error
                }
                throw uploadError
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // 3. Update Profile Logic
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', student?.id)

            if (updateError) throw updateError

            // 4. Update Auth Metadata (so Header updates immediately)
            await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            })

            setAvatarUrl(publicUrl)
            toast.success('Profile picture updated!')

        } catch (error: any) {
            console.error('Error uploading avatar:', error)
            toast.error(error.message || 'Error uploading image')
        } finally {
            setUploading(false)
        }
    }

    const handleUpdatePassword = async () => {
        if (passwords.new !== passwords.confirm) {
            toast.error("Passwords do not match")
            return
        }
        if (passwords.new.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }

        try {
            setPasswordLoading(true)
            const { error } = await supabase.auth.updateUser({ password: passwords.new })

            if (error) throw error

            toast.success("Password updated successfully")
            setPasswordOpen(false)
            setPasswords({ new: "", confirm: "" })
        } catch (error: any) {
            toast.error(error.message || "Failed to update password")
        } finally {
            setPasswordLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    // Display URL: Local state > Student DB > Default Placeholders
    const displayAvatar = avatarUrl || student?.avatar_url;

    return (
        <div className="min-h-screen bg-gray-50/50">

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
                {/* Clean Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Account Settings</h1>
                    <p className="text-gray-500 mt-1">Manage your profile, security, and account preferences.</p>
                </div>

                <div className="grid gap-10">
                    {/* Profile Section */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" /> Personal Identity
                            </h2>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="flex items-center gap-8">
                                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                                    <div className={`h-24 w-24 rounded-2xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200 group-hover:border-blue-400 transition-colors overflow-hidden ${uploading ? 'opacity-50' : ''}`}>
                                        {displayAvatar ? (
                                            <img src={displayAvatar} alt="Profile" className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="w-10 h-10 text-gray-300" />
                                        )}
                                        {uploading && <Loader2 className="absolute w-8 h-8 animate-spin text-blue-500" />}
                                    </div>
                                    <button className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors" disabled={uploading}>
                                        <Camera className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        disabled={uploading}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-gray-900">{student?.full_name || "Student Name"}</h3>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-100 font-bold px-2.5 py-0.5 rounded-lg text-[10px] uppercase tracking-wider">
                                            Student Driver
                                        </Badge>
                                        <span className="text-gray-300">•</span>
                                        <span className="text-xs text-gray-500 font-medium">Joined {student?.created_at ? new Date(student.created_at).toLocaleDateString() : 'Recently'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Full Legal Name</Label>
                                    <Input value={student?.full_name || ""} disabled className="bg-gray-50 border-gray-200 text-gray-500 font-medium h-12 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Contact Email</Label>
                                    <Input value={student?.email || ""} disabled className="bg-gray-50 border-gray-200 text-gray-500 font-medium h-12 rounded-xl" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-gray-400" /> Security & Access
                            </h2>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">Change Password</p>
                                        <p className="text-sm text-gray-500">Update your account credentials</p>
                                    </div>
                                </div>

                                <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="rounded-xl px-6 h-11 font-bold border-gray-200 text-gray-700 bg-white shadow-sm hover:bg-gray-50">
                                            Update Security
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Change Password</DialogTitle>
                                            <DialogDescription>
                                                Enter your new password below. Make sure it's secure.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="new-password">New Password</Label>
                                                <Input
                                                    id="new-password"
                                                    type="password"
                                                    value={passwords.new}
                                                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                                <Input
                                                    id="confirm-password"
                                                    type="password"
                                                    value={passwords.confirm}
                                                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setPasswordOpen(false)}>Cancel</Button>
                                            <Button onClick={handleUpdatePassword} disabled={passwordLoading}>
                                                {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Update Password
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="flex items-start gap-4 p-4 border border-blue-100 bg-blue-50/30 rounded-2xl">
                                <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-blue-900">Profile Verification</p>
                                    <p className="text-sm text-blue-700/80">Certain legal information (name/email) is locked once verified. Contact support for changes.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-center py-6">
                        <p className="text-xs text-gray-400 font-medium">© 2026 Selam Driving School. Professional Training Excellence.</p>
                    </div>
                </div>
            </main>
        </div>
    )
}
