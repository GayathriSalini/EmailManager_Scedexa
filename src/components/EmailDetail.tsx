"use client";

import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Star,
  Archive,
  Trash2,
  Reply,
  Forward,
  Paperclip,
  Download,
} from "lucide-react";

interface Email {
  _id: string;
  from: string;
  fromName?: string;
  to: string | string[];
  cc?: string[];
  subject: string;
  body: string;
  html?: string;
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

interface EmailDetailProps {
  email: Email;
  type: "inbox" | "sent";
  onBack: () => void;
  onReply?: () => void;
  onForward?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onToggleStar?: () => void;
}

export default function EmailDetail({
  email,
  type,
  onBack,
  onReply,
  onForward,
  onArchive,
  onDelete,
  onToggleStar,
}: EmailDetailProps) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 rounded hover:bg-[var(--secondary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium">Back</span>
        </div>
        <div className="flex items-center gap-1">
          {type === "inbox" && onToggleStar && (
            <button
              onClick={onToggleStar}
              className="p-1.5 rounded hover:bg-[var(--secondary)] transition-colors"
            >
              <Star
                className={`w-4 h-4 ${email.isStarred ? "fill-[var(--warning)] text-[var(--warning)]" : ""}`}
              />
            </button>
          )}
          {onArchive && (
            <button
              onClick={onArchive}
              className="p-1.5 rounded hover:bg-[var(--secondary)] transition-colors"
            >
              <Archive className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded hover:bg-[var(--secondary)] text-[var(--destructive)] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-xl font-semibold mb-4">{email.subject}</h1>

        {/* Sender Info */}
        <div className="flex items-start gap-3 mb-6 pb-6 border-b border-[var(--border)]">
          <span
            className="w-10 h-10 rounded flex items-center justify-center text-white font-medium flex-shrink-0"
            style={{ backgroundColor: "#525252" }}
          >
            {(email.fromName || email.from)[0].toUpperCase()}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-medium">
                {email.fromName || email.from.split("@")[0]}
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">
                {formatDate(
                  email.receivedAt || email.sentAt || new Date().toISOString(),
                )}
              </span>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              {email.from}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              To: {Array.isArray(email.to) ? email.to.join(", ") : email.to}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="prose prose-sm max-w-none">
          {email.html ? (
            <div dangerouslySetInnerHTML={{ __html: email.html }} />
          ) : (
            <div className="whitespace-pre-wrap text-sm">{email.body}</div>
          )}
        </div>

        {/* Attachments */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[var(--border)]">
            <p className="text-sm font-medium mb-3">
              {email.attachments.length} attachment
              {email.attachments.length > 1 ? "s" : ""}
            </p>
            <div className="space-y-2">
              {email.attachments.map((att, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-[var(--border)] rounded-md"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
                    <span className="text-sm truncate">{att.filename}</span>
                    {att.size && (
                      <span className="text-xs text-[var(--muted-foreground)]">
                        ({formatSize(att.size)})
                      </span>
                    )}
                  </div>
                  {att.url && (
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded hover:bg-[var(--secondary)] transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {(onReply || onForward) && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--border)]">
          {onReply && (
            <button
              onClick={onReply}
              className="btn btn-secondary text-sm py-1.5"
            >
              <Reply className="w-4 h-4" />
              Reply
            </button>
          )}
          {onForward && (
            <button
              onClick={onForward}
              className="btn btn-secondary text-sm py-1.5"
            >
              <Forward className="w-4 h-4" />
              Forward
            </button>
          )}
        </div>
      )}
    </div>
  );
}
