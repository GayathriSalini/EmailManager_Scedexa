"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Mail } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Redirect logged-in users away from login page
    if (!isLoading && user && pathname === "/login") {
      router.push("/");
    }
  }, [user, isLoading, router, pathname]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--primary)] rounded-xl mb-3">
            <Mail className="w-6 h-6 text-[var(--primary-foreground)]" />
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow login page to render
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // The middleware handles redirects for unauthenticated users
  // But we still show loading if no user yet (edge case during redirect)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[var(--primary)] rounded-xl mb-3">
            <Mail className="w-6 h-6 text-[var(--primary-foreground)]" />
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
