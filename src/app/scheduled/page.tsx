"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, RefreshCw, Trash2, Users, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Account {
  _id: string;
  name: string;
  email: string;
  color: string;
}

interface ScheduledEmail {
  _id: string;
  accountId: Account;
  from: string;
  recipients: string[];
  subject: string;
  body: string;
  scheduledAt: string;
  status: "pending" | "sent" | "cancelled" | "failed";
  createdAt: string;
}

export default function ScheduledPage() {
  const router = useRouter();
  const [emails, setEmails] = useState<ScheduledEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<
    "pending" | "sent" | "cancelled" | "all"
  >("pending");

  useEffect(() => {
    fetchEmails();
  }, [filter]);

  const fetchEmails = async () => {
    try {
      const res = await fetch(`/api/emails/schedule?status=${filter}`);
      const data = await res.json();
      if (data.success) {
        setEmails(data.data.emails);
      }
    } catch (error) {
      console.error("Failed to fetch scheduled emails:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEmails();
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this scheduled email?")) return;

    try {
      const res = await fetch(`/api/emails/scheduled/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setEmails(
          emails.map((e) =>
            e._id === id ? { ...e, status: "cancelled" as const } : e,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to cancel email:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="badge badge-warning text-xs">Pending</span>;
      case "sent":
        return <span className="badge badge-success text-xs">Sent</span>;
      case "cancelled":
        return (
          <span className="badge badge-destructive text-xs">Cancelled</span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-[var(--border)]">
        <div>
          <h1 className="font-semibold">Scheduled</h1>
          <p className="text-xs md:text-sm text-[var(--muted-foreground)]">
            {emails.length} emails
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 md:p-2 rounded hover:bg-[var(--secondary)] transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={() => router.push("/compose?mode=schedule")}
            className="btn btn-primary text-xs md:text-sm py-1.5 md:py-2"
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule</span>
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 px-4 md:px-6 py-2 md:py-3 border-b border-[var(--border)] overflow-x-auto">
        {(["pending", "sent", "cancelled", "all"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-2 md:px-3 py-1 md:py-1.5 rounded text-xs md:text-sm capitalize transition-colors whitespace-nowrap ${
              filter === status
                ? "bg-[var(--primary)] text-white"
                : "hover:bg-[var(--secondary)]"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 md:p-6 space-y-3 md:space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3 md:p-4 border border-[var(--border)] rounded-lg animate-pulse"
              >
                <div className="h-4 bg-[var(--secondary)] rounded w-1/3 mb-2" />
                <div className="h-3 bg-[var(--secondary)] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Clock className="w-8 h-8 text-[var(--muted-foreground)] mb-3" />
            <p className="text-sm text-[var(--muted-foreground)]">
              No scheduled emails
            </p>
          </div>
        ) : (
          <div className="p-4 md:p-6 space-y-2 md:space-y-3">
            {emails.map((email) => (
              <div
                key={email._id}
                className="p-3 md:p-4 border border-[var(--border)] rounded-lg hover:border-[var(--muted-foreground)] transition-colors"
              >
                <div className="flex items-start justify-between gap-3 md:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium truncate text-sm md:text-base">
                        {email.subject}
                      </span>
                      {getStatusBadge(email.status)}
                    </div>
                    <p className="text-xs md:text-sm text-[var(--muted-foreground)] mb-2 truncate">
                      From: {email.accountId?.name || "Unknown"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 md:w-3.5 h-3 md:h-3.5" />
                        {email.recipients.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 md:w-3.5 h-3 md:h-3.5" />
                        {formatDate(email.scheduledAt)}
                      </span>
                    </div>
                  </div>

                  {email.status === "pending" && (
                    <button
                      onClick={() => handleCancel(email._id)}
                      className="p-1.5 rounded hover:bg-[var(--secondary)] text-[var(--destructive)] transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
