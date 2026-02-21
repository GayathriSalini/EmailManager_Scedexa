"use client";

import { formatDate, truncate } from "@/lib/utils";
import { Mail, Star, Paperclip } from "lucide-react";
import EmailAvatar from "@/components/EmailAvatar";

interface Email {
  _id: string;
  from: string;
  fromName?: string;
  to: string | string[];
  subject: string;
  body: string;
  receivedAt?: string;
  sentAt?: string;
  isRead?: boolean;
  isStarred?: boolean;
  attachments?: {
    filename: string;
    contentType?: string;
    size?: number;
    url?: string;
  }[];
}

interface EmailListProps {
  emails: Email[];
  type: "inbox" | "sent";
  selectedId?: string;
  onSelect: (email: Email) => void;
  onToggleStar?: (id: string) => void;
  loading?: boolean;
}

export default function EmailList({
  emails,
  type,
  selectedId,
  onSelect,
  onToggleStar,
  loading,
}: EmailListProps) {
  if (loading) {
    return (
      <div className="divide-y divide-[var(--border)]">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-[var(--secondary)] rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--secondary)] rounded w-32" />
                <div className="h-3 bg-[var(--secondary)] rounded w-48" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Mail className="w-8 h-8 text-[var(--muted-foreground)] mb-3" />
        <p className="text-sm text-[var(--muted-foreground)]">
          {type === "inbox" ? "No emails received" : "No emails sent"}
        </p>
      </div>
    );
  }

  const getDisplayName = (email: Email) => {
    if (type === "inbox") {
      return email.fromName || email.from.split("@")[0];
    }
    const to = Array.isArray(email.to) ? email.to[0] : email.to;
    return to.split("@")[0];
  };

  const getDisplayEmail = (email: Email) => {
    if (type === "inbox") {
      return email.from;
    }
    return Array.isArray(email.to) ? email.to.join(", ") : email.to;
  };

  return (
    <div className="divide-y divide-[var(--border)]">
      {emails.map((email) => (
        <div
          key={email._id}
          onClick={() => onSelect(email)}
          className={`flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-[var(--secondary)] ${
            selectedId === email._id ? "bg-[var(--secondary)]" : ""
          } ${!email.isRead && type === "inbox" ? "bg-blue-50 border-l-[3px] border-l-blue-500" : ""}`}
        >
          {/* Avatar */}
          <EmailAvatar
            email={getDisplayEmail(email)}
            name={getDisplayName(email)}
            size="md"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span
                className={`text-sm truncate ${!email.isRead && type === "inbox" ? "font-semibold" : ""}`}
              >
                {getDisplayName(email)}
              </span>
              <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0">
                {formatDate(
                  email.receivedAt || email.sentAt || new Date().toISOString(),
                )}
              </span>
            </div>
            <p
              className={`text-sm truncate mb-0.5 ${!email.isRead && type === "inbox" ? "font-medium" : "text-[var(--muted-foreground)]"}`}
            >
              {email.subject}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] truncate">
              {truncate(email.body.replace(/<[^>]*>/g, ""), 60)}
            </p>
          </div>

          {/* Indicators */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {email.attachments && email.attachments.length > 0 && (
              <Paperclip className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
            )}
            {type === "inbox" && onToggleStar && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar(email._id);
                }}
                className="p-1 rounded hover:bg-[var(--muted)] transition-colors"
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    email.isStarred
                      ? "fill-[var(--warning)] text-[var(--warning)]"
                      : "text-[var(--muted-foreground)]"
                  }`}
                />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
