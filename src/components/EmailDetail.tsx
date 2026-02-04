"use client";

import { useState } from "react";
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
  Send,
  X,
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
  messageId?: string;
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
  accountId: string;
  onBack: () => void;
  onReply?: () => void;
  onForward?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onToggleStar?: () => void;
  onReplySent?: () => void;
}

export default function EmailDetail({
  email,
  type,
  accountId,
  onBack,
  onReply,
  onForward,
  onArchive,
  onDelete,
  onToggleStar,
  onReplySent,
}: EmailDetailProps) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSendReply = async () => {
    if (!replyBody.trim()) return;

    setSending(true);
    setError("");

    try {
      // Get the recipient - if we received this email, reply to sender; if we sent it, reply to recipient
      const replyTo =
        type === "inbox"
          ? email.from
          : Array.isArray(email.to)
            ? email.to[0]
            : email.to;

      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          to: [replyTo],
          subject: `Re: ${email.subject.replace(/^Re:\s*/i, "")}`,
          body: replyBody,
          replyToEmailId: email._id,
          inReplyTo: email.messageId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReplyBody("");
        setShowReplyBox(false);
        onReplySent?.();
      } else {
        setError(data.error || "Failed to send reply");
      }
    } catch (err) {
      setError("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleReplyClick = () => {
    setShowReplyBox(true);
    // If there's also an external onReply handler (for navigation), we can skip it since we're using inline
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={onBack}
            className="p-1.5 rounded hover:bg-[var(--secondary)] transition-colors"
          >
            <ArrowLeft className="w-4 md:w-5 h-4 md:h-5" />
          </button>
          <span className="text-sm font-medium hidden md:block">Back</span>
        </div>
        <div className="flex items-center gap-0.5 md:gap-1">
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
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <h1 className="text-lg md:text-xl font-semibold mb-4">
          {email.subject}
        </h1>

        {/* Sender Info */}
        <div className="flex items-start gap-2 md:gap-3 mb-4 md:mb-6 pb-4 md:pb-6 border-b border-[var(--border)]">
          <span
            className="w-8 h-8 md:w-10 md:h-10 rounded flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
            style={{ backgroundColor: "#525252" }}
          >
            {(email.fromName || email.from)[0].toUpperCase()}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 mb-0.5">
              <span className="font-medium text-sm md:text-base truncate">
                {email.fromName || email.from.split("@")[0]}
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">
                {formatDate(
                  email.receivedAt || email.sentAt || new Date().toISOString(),
                )}
              </span>
            </div>
            <p className="text-xs md:text-sm text-[var(--muted-foreground)] truncate">
              {email.from}
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1 truncate">
              To: {Array.isArray(email.to) ? email.to.join(", ") : email.to}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="prose prose-sm max-w-none">
          {email.html ? (
            <div
              dangerouslySetInnerHTML={{ __html: email.html }}
              className="text-sm md:text-base"
            />
          ) : (
            <div className="whitespace-pre-wrap text-sm md:text-base">
              {email.body}
            </div>
          )}
        </div>

        {/* Attachments */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-[var(--border)]">
            <p className="text-sm font-medium mb-2 md:mb-3">
              {email.attachments.length} attachment
              {email.attachments.length > 1 ? "s" : ""}
            </p>
            <div className="space-y-2">
              {email.attachments.map((att, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 md:p-3 border border-[var(--border)] rounded-md"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
                    <span className="text-xs md:text-sm truncate">
                      {att.filename}
                    </span>
                    {att.size && (
                      <span className="text-xs text-[var(--muted-foreground)] hidden sm:inline">
                        ({formatSize(att.size)})
                      </span>
                    )}
                  </div>
                  {att.url && (
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded hover:bg-[var(--secondary)] transition-colors flex-shrink-0"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inline Reply Box (Gmail-style) */}
        {showReplyBox && (
          <div className="mt-6 pt-6 border-t border-[var(--border)]">
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              {/* Reply Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-[var(--secondary)]">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Reply className="w-4 h-4" />
                  Reply to {email.fromName || email.from.split("@")[0]}
                </span>
                <button
                  onClick={() => setShowReplyBox(false)}
                  className="p-1 rounded hover:bg-[var(--muted)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Reply Body */}
              <div className="p-4">
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Write your reply..."
                  rows={6}
                  className="w-full resize-none outline-none text-sm bg-transparent"
                  autoFocus
                />
              </div>

              {/* Reply Actions */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] bg-[var(--secondary)]">
                <div>
                  {error && (
                    <span className="text-xs text-[var(--destructive)]">
                      {error}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowReplyBox(false)}
                    className="btn btn-secondary text-xs py-1.5"
                    disabled={sending}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendReply}
                    disabled={!replyBody.trim() || sending}
                    className="btn btn-primary text-xs py-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions Footer */}
      {!showReplyBox && (
        <div className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 border-t border-[var(--border)]">
          <button
            onClick={handleReplyClick}
            className="btn btn-primary text-xs md:text-sm py-1.5 flex-1 md:flex-none"
          >
            <Reply className="w-4 h-4" />
            Reply
          </button>
          {onForward && (
            <button
              onClick={onForward}
              className="btn btn-secondary text-xs md:text-sm py-1.5 flex-1 md:flex-none"
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
