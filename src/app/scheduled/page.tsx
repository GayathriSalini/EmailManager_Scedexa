"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, RefreshCw, Edit, Trash2, Users, Calendar } from "lucide-react";
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
        return <span className="badge badge-warning">Pending</span>;
      case "sent":
        return <span className="badge badge-success">Sent</span>;
      case "cancelled":
        return <span className="badge badge-destructive">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div>
          <h1 className="font-semibold">Scheduled</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {emails.length} emails
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded hover:bg-[var(--secondary)] transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
          <button
            onClick={() => router.push("/compose?mode=schedule")}
            className="btn btn-primary text-sm"
          >
            <Clock className="w-4 h-4" />
            Schedule
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 px-6 py-3 border-b border-[var(--border)]">
        {(["pending", "sent", "cancelled", "all"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded text-sm capitalize transition-colors ${
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
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 border border-[var(--border)] rounded-lg animate-pulse"
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
          <div className="p-6 space-y-3">
            {emails.map((email) => (
              <div
                key={email._id}
                className="p-4 border border-[var(--border)] rounded-lg hover:border-[var(--muted-foreground)] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">
                        {email.subject}
                      </span>
                      {getStatusBadge(email.status)}
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)] mb-2">
                      From: {email.accountId?.name || "Unknown"}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {email.recipients.length} recipients
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(email.scheduledAt)}
                      </span>
                    </div>
                  </div>

                  {email.status === "pending" && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCancel(email._id)}
                        className="p-1.5 rounded hover:bg-[var(--secondary)] text-[var(--destructive)] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
