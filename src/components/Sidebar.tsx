"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mail,
  Inbox,
  Send,
  Clock,
  Plus,
  Settings,
  ChevronRight,
  X,
  Menu,
} from "lucide-react";
import { useState, useEffect } from "react";

interface EmailAccount {
  _id: string;
  name: string;
  email: string;
  color: string;
  isActive: boolean;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: "",
    email: "",
    color: "#000000",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      if (data.success) {
        setAccounts(data.data);
        if (data.data.length > 0 && !expandedAccount) {
          setExpandedAccount(data.data[0]._id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAccount),
      });
      const data = await res.json();
      if (data.success) {
        setAccounts([data.data, ...accounts]);
        setShowAddModal(false);
        setNewAccount({ name: "", email: "", color: "#000000" });
      }
    } catch (error) {
      console.error("Failed to add account:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const colorOptions = [
    "#000000",
    "#525252",
    "#dc2626",
    "#ea580c",
    "#ca8a04",
    "#16a34a",
    "#0891b2",
    "#2563eb",
  ];

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-[var(--border)] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          <span className="font-semibold text-lg">Mail</span>
        </Link>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="p-1.5 rounded hover:bg-[var(--secondary)] md:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Compose Button */}
      <div className="p-4">
        <Link
          href="/compose"
          className="btn btn-primary w-full justify-center py-2.5"
        >
          <Plus className="w-4 h-4" />
          Compose
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3">
        {/* Quick Links */}
        <div className="mb-4">
          <Link
            href="/scheduled"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              pathname === "/scheduled"
                ? "bg-[var(--secondary)] font-medium"
                : "hover:bg-[var(--secondary)] text-[var(--muted-foreground)]"
            }`}
          >
            <Clock className="w-4 h-4" />
            Scheduled
          </Link>
        </div>

        {/* Accounts */}
        <div className="mb-2 flex items-center justify-between px-3">
          <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
            Accounts
          </span>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-1 rounded hover:bg-[var(--secondary)] transition-colors"
            title="Add Account"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          </button>
        </div>

        {loading ? (
          <div className="px-3 py-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-9 bg-[var(--secondary)] rounded animate-pulse"
              />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              No accounts
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-sm text-[var(--foreground)] hover:underline mt-1"
            >
              Add account
            </button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {accounts.map((account) => (
              <div key={account._id}>
                <button
                  onClick={() =>
                    setExpandedAccount(
                      expandedAccount === account._id ? null : account._id,
                    )
                  }
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                    expandedAccount === account._id
                      ? "bg-[var(--secondary)]"
                      : "hover:bg-[var(--secondary)]"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: account.color }}
                  />
                  <span className="flex-1 text-left truncate">
                    {account.name}
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-[var(--muted-foreground)] transition-transform ${
                      expandedAccount === account._id ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {expandedAccount === account._id && (
                  <div className="ml-5 mt-0.5 space-y-0.5">
                    <Link
                      href={`/accounts/${account._id}/inbox`}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                        pathname === `/accounts/${account._id}/inbox`
                          ? "bg-[var(--secondary)] font-medium"
                          : "hover:bg-[var(--secondary)] text-[var(--muted-foreground)]"
                      }`}
                    >
                      <Inbox className="w-3.5 h-3.5" />
                      Inbox
                    </Link>
                    <Link
                      href={`/accounts/${account._id}/sent`}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                        pathname === `/accounts/${account._id}/sent`
                          ? "bg-[var(--secondary)] font-medium"
                          : "hover:bg-[var(--secondary)] text-[var(--muted-foreground)]"
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      Sent
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--border)]">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-[var(--muted-foreground)] hover:bg-[var(--secondary)] transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-1.5 rounded hover:bg-[var(--secondary)]"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          <span className="font-semibold">Mail</span>
        </Link>
        <Link
          href="/compose"
          className="p-1.5 rounded hover:bg-[var(--secondary)]"
        >
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-72 md:w-64 h-screen bg-white border-r border-[var(--border)]
          flex flex-col transform transition-transform duration-200 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-[var(--border)] p-6 w-full max-w-sm shadow-lg animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">Add Account</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded hover:bg-[var(--secondary)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g., Outreach"
                  value={newAccount.name}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="outreach@domain.com"
                  value={newAccount.email}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, email: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewAccount({ ...newAccount, color })}
                      className={`w-6 h-6 rounded-full transition-all ${
                        newAccount.color === color
                          ? "ring-2 ring-offset-2 ring-[var(--ring)]"
                          : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary flex-1"
                >
                  {isSubmitting ? "Adding..." : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
