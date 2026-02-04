"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Paperclip,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ThreadEmail {
  _id: string;
  type: "sent" | "received";
  from: string;
  fromName?: string;
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  date: string;
  messageId?: string;
  attachments?: {
    filename: string;
    size?: number;
  }[];
}

interface Account {
  _id: string;
  name: string;
  email: string;
  color: string;
}

export default function ThreadViewPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;
  const threadId = decodeURIComponent(params.threadId as string);

  const [account, setAccount] = useState<Account | null>(null);
  const [emails, setEmails] = useState<ThreadEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAccount();
    fetchThread();
  }, [accountId, threadId]);

  useEffect(() => {
    // Auto-expand the last email and scroll to bottom
    if (emails.length > 0) {
      setExpandedEmails(new Set([emails[emails.length - 1]._id]));
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [emails.length]);

  const fetchAccount = async () => {
    try {
      const res = await fetch(`/api/accounts/${accountId}`);
      const data = await res.json();
      if (data.success) {
        setAccount(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch account:", error);
    }
  };

  const fetchThread = async () => {
    try {
      const res = await fetch(
        `/api/accounts/${accountId}/threads/${encodeURIComponent(threadId)}`,
      );
      const data = await res.json();
      if (data.success) {
        setEmails(data.data.emails);
      }
    } catch (error) {
      console.error("Failed to fetch thread:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEmail = (id: string) => {
    const newExpanded = new Set(expandedEmails);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedEmails(newExpanded);
  };

  const handleReply = async () => {
    if (!replyBody.trim() || !emails.length) return;

    setSending(true);
    try {
      const lastEmail = emails[emails.length - 1];
      const replyTo =
        lastEmail.type === "received"
          ? lastEmail.from
          : Array.isArray(lastEmail.to)
            ? lastEmail.to[0]
            : lastEmail.to;

      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          to: [replyTo],
          subject: `Re: ${emails[0].subject.replace(/^Re:\s*/i, "")}`,
          body: replyBody,
          replyToEmailId: lastEmail._id,
          inReplyTo: lastEmail.messageId,
          threadId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReplyBody("");
        fetchThread(); // Refresh thread
      }
    } catch (error) {
      console.error("Failed to send reply:", error);
    } finally {
      setSending(false);
    }
  };

  const getEmailSender = (email: ThreadEmail) => {
    if (email.type === "sent") {
      return account?.name || "You";
    }
    return email.fromName || email.from.split("@")[0];
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 border-b border-[var(--border)]">
        <button
          onClick={() => router.push(`/accounts/${accountId}/threads`)}
          className="p-1.5 rounded hover:bg-[var(--secondary)] transition-colors"
        >
          <ArrowLeft className="w-4 md:w-5 h-4 md:h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm md:text-base truncate">
            {emails[0]?.subject || threadId}
          </h1>
          <p className="text-xs text-[var(--muted-foreground)]">
            {emails.length} message{emails.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Thread Content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 border border-[var(--border)] rounded-lg animate-pulse"
              >
                <div className="h-4 bg-[var(--secondary)] rounded w-1/4 mb-2" />
                <div className="h-3 bg-[var(--secondary)] rounded w-full mb-1" />
                <div className="h-3 bg-[var(--secondary)] rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          emails.map((email, index) => {
            const isExpanded = expandedEmails.has(email._id);
            const isSent = email.type === "sent";

            return (
              <div
                key={email._id}
                className={`border rounded-lg overflow-hidden ${
                  isSent
                    ? "border-blue-200 bg-blue-50/50"
                    : "border-[var(--border)]"
                }`}
              >
                {/* Email Header */}
                <button
                  onClick={() => toggleEmail(email._id)}
                  className="w-full flex items-center gap-2 md:gap-3 p-3 hover:bg-[var(--secondary)] transition-colors text-left"
                >
                  <span
                    className="w-7 h-7 md:w-8 md:h-8 rounded flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                    style={{
                      backgroundColor: isSent
                        ? account?.color || "#2563eb"
                        : "#525252",
                    }}
                  >
                    {getEmailSender(email)[0].toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">
                        {getEmailSender(email)}
                        {isSent && (
                          <span className="text-xs text-[var(--muted-foreground)] ml-1">
                            (You)
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0">
                        {formatDate(email.date)}
                      </span>
                    </div>
                    {!isExpanded && (
                      <p className="text-xs text-[var(--muted-foreground)] truncate">
                        {email.body.replace(/<[^>]*>/g, "").substring(0, 80)}
                      </p>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
                  )}
                </button>

                {/* Email Body */}
                {isExpanded && (
                  <div className="px-3 pb-3 md:px-4 md:pb-4">
                    <div className="pl-9 md:pl-11">
                      <p className="text-xs text-[var(--muted-foreground)] mb-2">
                        To:{" "}
                        {Array.isArray(email.to)
                          ? email.to.join(", ")
                          : email.to}
                      </p>
                      <div className="prose prose-sm max-w-none text-sm">
                        {email.html ? (
                          <div
                            dangerouslySetInnerHTML={{ __html: email.html }}
                          />
                        ) : (
                          <div className="whitespace-pre-wrap">
                            {email.body}
                          </div>
                        )}
                      </div>
                      {email.attachments && email.attachments.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {email.attachments.map((att, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--secondary)] rounded text-xs"
                            >
                              <Paperclip className="w-3 h-3" />
                              {att.filename}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply Box */}
      <div className="border-t border-[var(--border)] p-3 md:p-4">
        <div className="flex gap-2">
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Type your reply..."
            rows={2}
            className="input flex-1 resize-none text-sm"
          />
          <button
            onClick={handleReply}
            disabled={!replyBody.trim() || sending}
            className="btn btn-primary self-end"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
