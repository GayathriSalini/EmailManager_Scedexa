"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { RefreshCw, Search, MessageSquare, ChevronRight } from "lucide-react";
import { formatDate, truncate } from "@/lib/utils";

interface Thread {
  threadId: string;
  subject: string;
  lastMessage: string;
  lastDate: string;
  sentCount: number;
  receivedCount: number;
  unreadCount: number;
  participants: string[];
}

interface Account {
  _id: string;
  name: string;
  email: string;
  color: string;
}

export default function ThreadsPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;

  const [account, setAccount] = useState<Account | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAccount();
    fetchThreads();
  }, [accountId]);

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

  const fetchThreads = async () => {
    try {
      const res = await fetch(`/api/accounts/${accountId}/threads`);
      const data = await res.json();
      if (data.success) {
        setThreads(data.data.threads);
      }
    } catch (error) {
      console.error("Failed to fetch threads:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchThreads();
  };

  const filteredThreads = threads.filter(
    (thread) =>
      thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.participants.some((p) =>
        p.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {account && (
            <span
              className="w-7 h-7 md:w-8 md:h-8 rounded flex items-center justify-center text-white text-xs md:text-sm font-medium flex-shrink-0"
              style={{ backgroundColor: account.color }}
            >
              {account.name[0].toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1 md:gap-2">
              <MessageSquare className="w-3.5 md:w-4 h-3.5 md:h-4" />
              <h1 className="font-semibold text-sm md:text-base">Threads</h1>
            </div>
            <p className="text-xs md:text-sm text-[var(--muted-foreground)] truncate">
              {threads.length} conversations
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1.5 md:p-2 rounded hover:bg-[var(--secondary)] transition-colors flex-shrink-0"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 md:px-6 py-2 md:py-3 border-b border-[var(--border)]">
        <div className="input-wrapper">
          <Search className="input-icon w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search threads..."
            className="input input-with-icon text-sm"
          />
        </div>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="divide-y divide-[var(--border)]">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="h-4 bg-[var(--secondary)] rounded w-1/3 mb-2" />
                <div className="h-3 bg-[var(--secondary)] rounded w-2/3 mb-2" />
                <div className="h-3 bg-[var(--secondary)] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="w-8 h-8 text-[var(--muted-foreground)] mb-3" />
            <p className="text-sm text-[var(--muted-foreground)]">
              No threads found
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filteredThreads.map((thread) => (
              <div
                key={thread.threadId}
                onClick={() =>
                  router.push(
                    `/accounts/${accountId}/threads/${encodeURIComponent(thread.threadId)}`,
                  )
                }
                className={`flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-[var(--secondary)] ${
                  thread.unreadCount > 0 ? "bg-blue-50" : ""
                }`}
              >
                {/* Icon */}
                <div className="w-8 h-8 rounded bg-[var(--secondary)] flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-[var(--muted-foreground)]" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span
                      className={`text-sm truncate ${thread.unreadCount > 0 ? "font-semibold" : ""}`}
                    >
                      {thread.subject}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)] flex-shrink-0">
                      {formatDate(thread.lastDate)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] truncate mb-1">
                    {thread.participants.slice(0, 3).join(", ")}
                    {thread.participants.length > 3 &&
                      ` +${thread.participants.length - 3}`}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] truncate">
                    {truncate(thread.lastMessage.replace(/<[^>]*>/g, ""), 60)}
                  </p>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {thread.sentCount + thread.receivedCount}
                  </span>
                  {thread.unreadCount > 0 && (
                    <span className="badge badge-primary text-xs">
                      {thread.unreadCount}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
