"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AuthCallbackFallbackPage() {
  useEffect(() => {
    const { search, hash } = window.location;
    const searchParams = new URLSearchParams(search);
    const hasCode = searchParams.has("code");

    if (hasCode) {
      window.location.replace(`/api/auth/callback${search}`);
      return;
    }

    // Handle hash-based magic-link errors/tokens through the student magic page.
    window.location.replace(`/student/magic${search}${hash}`);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex items-center gap-3 text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Preparing sign-in...</span>
      </div>
    </div>
  );
}
