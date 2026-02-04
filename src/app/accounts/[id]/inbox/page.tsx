"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { RefreshCw, Search } from "lucide-react";
import EmailList from "@/components/EmailList";
import EmailDetail from "@/components/EmailDetail";

interface Email {
  _id: string;
  from: string;
  fromName?: string;
  to: string | string[];
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

interface Account {
  _id: string;
  name: string;
  email: string;
  color: string;
}

export default function InboxPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;

  const [account, setAccount] = useState<Account | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchAccount();
    fetchEmails();
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

  const fetchEmails = async () => {
    try {
      const res = await fetch(`/api/accounts/${accountId}/inbox`);
      const data = await res.json();
      if (data.success) {
        setEmails(data.data.emails);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch emails:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEmails();
  };

  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      setEmails(
        emails.map((e) => (e._id === email._id ? { ...e, isRead: true } : e)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleToggleStar = (id: string) => {
    setEmails(
      emails.map((e) => (e._id === id ? { ...e, isStarred: !e.isStarred } : e)),
    );
  };

  const filteredEmails = emails.filter(
    (email) =>
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (selectedEmail) {
    return (
      <EmailDetail
        email={selectedEmail}
        type="inbox"
        onBack={() => setSelectedEmail(null)}
        onToggleStar={() => handleToggleStar(selectedEmail._id)}
        onReply={() =>
          router.push(
            `/compose?to=${selectedEmail.from}&subject=Re: ${selectedEmail.subject}`,
          )
        }
        onForward={() =>
          router.push(`/compose?subject=Fwd: ${selectedEmail.subject}`)
        }
        onArchive={() => setSelectedEmail(null)}
        onDelete={() => setSelectedEmail(null)}
      />
    );
  }

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
            <h1 className="font-semibold text-sm md:text-base">Inbox</h1>
            <p className="text-xs md:text-sm text-[var(--muted-foreground)] truncate">
              {account?.email}
            </p>
          </div>
          {unreadCount > 0 && (
            <span className="badge badge-primary text-xs">{unreadCount}</span>
          )}
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="input pl-9 text-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <EmailList
          emails={filteredEmails}
          type="inbox"
          selectedId={selectedEmail?._id}
          onSelect={handleSelectEmail}
          onToggleStar={handleToggleStar}
          loading={loading}
        />
      </div>
    </div>
  );
}
