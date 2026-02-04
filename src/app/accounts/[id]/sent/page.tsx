"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { RefreshCw, Search, Send } from "lucide-react";
import EmailList from "@/components/EmailList";
import EmailDetail from "@/components/EmailDetail";

interface Email {
  _id: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  html?: string;
  sentAt?: string;
}

interface Account {
  _id: string;
  name: string;
  email: string;
  color: string;
}

export default function SentPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;

  const [account, setAccount] = useState<Account | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
      const res = await fetch(`/api/accounts/${accountId}/sent`);
      const data = await res.json();
      if (data.success) {
        setEmails(data.data.emails);
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

  const filteredEmails = emails.filter(
    (email) =>
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.to.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  if (selectedEmail) {
    return (
      <EmailDetail
        email={{ ...selectedEmail, from: account?.email || "" }}
        type="sent"
        onBack={() => setSelectedEmail(null)}
        onForward={() =>
          router.push(`/compose?subject=Fwd: ${selectedEmail.subject}`)
        }
      />
    );
  }

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          {account && (
            <span
              className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: account.color }}
            >
              {account.name[0].toUpperCase()}
            </span>
          )}
          <div>
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              <h1 className="font-semibold">Sent</h1>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              {account?.email}
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded hover:bg-[var(--secondary)] transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Search */}
      <div className="px-6 py-3 border-b border-[var(--border)]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="input pl-9"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <EmailList
          emails={filteredEmails.map((e) => ({
            ...e,
            from: account?.email || "",
          }))}
          type="sent"
          selectedId={selectedEmail?._id}
          onSelect={(email) => {
            const original = emails.find((e) => e._id === email._id);
            if (original) setSelectedEmail(original);
          }}
          loading={loading}
        />
      </div>
    </div>
  );
}
