"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface EmailAvatarProps {
  email: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

// Generate a consistent color from an email address
function emailToColor(email: string): string {
  const colors = [
    "#e11d48",
    "#db2777",
    "#c026d3",
    "#9333ea",
    "#7c3aed",
    "#4f46e5",
    "#2563eb",
    "#0284c7",
    "#0891b2",
    "#0d9488",
    "#059669",
    "#16a34a",
    "#65a30d",
    "#ca8a04",
    "#ea580c",
    "#dc2626",
  ];
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const sizeClasses = {
  sm: "w-7 h-7 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-sm",
};

export default function EmailAvatar({
  email,
  name,
  size = "md",
  color,
  className,
}: EmailAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const cleanEmail = email.toLowerCase().trim();
  const displayName = name || email.split("@")[0];
  const initial = displayName[0]?.toUpperCase() || "?";
  const bgColor = color || emailToColor(cleanEmail);

  // Use unavatar.io — it aggregates Gravatar, Google, GitHub, etc.
  const avatarUrl = `https://unavatar.io/${cleanEmail}?fallback=false`;

  return (
    <span
      className={cn(
        "rounded-full flex items-center justify-center font-medium flex-shrink-0 relative overflow-hidden",
        sizeClasses[size],
        className,
      )}
      style={{ backgroundColor: bgColor, color: "#fff" }}
    >
      {!imgError ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className="absolute inset-0 w-full h-full object-cover rounded-full"
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        initial
      )}
    </span>
  );
}
