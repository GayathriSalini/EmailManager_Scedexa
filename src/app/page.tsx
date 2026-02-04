"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Plus, Inbox, Send, Clock } from "lucide-react";

interface EmailAccount {
  _id: string;
  name: string;
  email: string;
  color: string;
  isActive: boolean;
}

interface Stats {
  totalAccounts: number;
  totalSent: number;
  totalReceived: number;
  totalScheduled: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalAccounts: 0,
    totalSent: 0,
    totalReceived: 0,
    totalScheduled: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accountsRes, scheduledRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/emails/schedule?status=pending"),
      ]);

      const accountsData = await accountsRes.json();
      const scheduledData = await scheduledRes.json();

      if (accountsData.success) {
        setAccounts(accountsData.data);
        setStats((prev) => ({
          ...prev,
          totalAccounts: accountsData.data.length,
        }));
      }

      if (scheduledData.success) {
        setStats((prev) => ({
          ...prev,
          totalScheduled: scheduledData.data.pagination.total,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl animate-fade-in">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-semibold mb-1">Overview</h1>
        <p className="text-[var(--muted-foreground)] text-sm">
          Manage your email accounts
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="p-3 md:p-4 border border-[var(--border)] rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span className="text-xs md:text-sm text-[var(--muted-foreground)]">
              Accounts
            </span>
          </div>
          <p className="text-xl md:text-2xl font-semibold">
            {stats.totalAccounts}
          </p>
        </div>

        <div className="p-3 md:p-4 border border-[var(--border)] rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Inbox className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span className="text-xs md:text-sm text-[var(--muted-foreground)]">
              Received
            </span>
          </div>
          <p className="text-xl md:text-2xl font-semibold">
            {stats.totalReceived}
          </p>
        </div>

        <div className="p-3 md:p-4 border border-[var(--border)] rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Send className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span className="text-xs md:text-sm text-[var(--muted-foreground)]">
              Sent
            </span>
          </div>
          <p className="text-xl md:text-2xl font-semibold">{stats.totalSent}</p>
        </div>

        <div className="p-3 md:p-4 border border-[var(--border)] rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />
            <span className="text-xs md:text-sm text-[var(--muted-foreground)]">
              Scheduled
            </span>
          </div>
          <p className="text-xl md:text-2xl font-semibold">
            {stats.totalScheduled}
          </p>
        </div>
      </div>

      {/* Accounts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">Accounts</h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-4 border border-[var(--border)] rounded-lg animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[var(--secondary)] rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[var(--secondary)] rounded w-24" />
                    <div className="h-3 bg-[var(--secondary)] rounded w-40" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="border border-dashed border-[var(--border)] rounded-lg p-6 md:p-8 text-center">
            <Mail className="w-8 h-8 text-[var(--muted-foreground)] mx-auto mb-3" />
            <p className="text-[var(--muted-foreground)] mb-3">
              No accounts yet
            </p>
            <button className="btn btn-primary">
              <Plus className="w-4 h-4" />
              Add Account
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map((account) => (
              <div
                key={account._id}
                onClick={() => router.push(`/accounts/${account._id}/inbox`)}
                className="p-3 md:p-4 border border-[var(--border)] rounded-lg hover:border-[var(--muted-foreground)] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                    style={{ backgroundColor: account.color }}
                  >
                    {account.name[0].toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{account.name}</p>
                    <p className="text-sm text-[var(--muted-foreground)] truncate">
                      {account.email}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
