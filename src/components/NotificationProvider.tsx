"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { useAuth } from "@/components/AuthProvider";
import { X, Mail, Bell, BellOff, ExternalLink } from "lucide-react";
import Link from "next/link";

interface UnreadEmail {
  _id: string;
  from: string;
  fromName?: string;
  subject: string;
  receivedAt: string;
  accountId: string;
}

interface Toast {
  id: string;
  from: string;
  subject: string;
  timestamp: number;
}

interface NotificationContextType {
  totalUnread: number;
  recentUnread: UnreadEmail[];
  notificationsEnabled: boolean;
  requestPermission: () => Promise<void>;
  /** Increments every time new emails are detected — subscribe to trigger refresh */
  refreshSignal: number;
}

const NotificationContext = createContext<NotificationContextType>({
  totalUnread: 0,
  recentUnread: [],
  notificationsEnabled: false,
  requestPermission: async () => {},
  refreshSignal: 0,
});

export function useNotifications() {
  return useContext(NotificationContext);
}

const POLL_INTERVAL = 15000; // 15 seconds
const TOAST_DURATION = 5000; // 5 seconds

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);
  const [recentUnread, setRecentUnread] = useState<UnreadEmail[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const seenEmailIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if browser notifications are supported and enabled
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
  }, []);

  const showBrowserNotification = useCallback(
    (from: string, subject: string) => {
      if (
        typeof window === "undefined" ||
        !("Notification" in window) ||
        Notification.permission !== "granted"
      )
        return;

      try {
        const notification = new Notification("New Email", {
          body: `From: ${from}\n${subject}`,
          icon: "/favicon.ico",
          tag: `email-${Date.now()}`,
          silent: false,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        // Auto-close after 8 seconds
        setTimeout(() => notification.close(), 8000);
      } catch {
        // Notification failed silently
      }
    },
    [],
  );

  const addToast = useCallback((from: string, subject: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [
      ...prev,
      { id, from, subject, timestamp: Date.now() },
    ]);

    // Auto-remove toast
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const checkUnread = useCallback(async () => {
    if (!user) return;

    try {
      const res = await fetch("/api/notifications/unread");
      if (!res.ok) return;

      const data = await res.json();
      if (!data.success) return;

      const { totalUnread: newTotal, recentUnread } = data.data as {
        totalUnread: number;
        recentUnread: UnreadEmail[];
      };

      setTotalUnread(newTotal);
      setRecentUnread(recentUnread);

      // On first load, just record existing IDs — don't notify
      if (isFirstLoad.current) {
        recentUnread.forEach((email: UnreadEmail) =>
          seenEmailIds.current.add(email._id),
        );
        isFirstLoad.current = false;
        return;
      }

      // Find new emails we haven't seen
      const newEmails = recentUnread.filter(
        (email: UnreadEmail) => !seenEmailIds.current.has(email._id),
      );

      // Notify for each new email and bump refresh signal
      if (newEmails.length > 0) {
        setRefreshSignal((prev) => prev + 1);
      }

      newEmails.forEach((email: UnreadEmail) => {
        seenEmailIds.current.add(email._id);
        const displayName = email.fromName || email.from;
        showBrowserNotification(displayName, email.subject);
        addToast(displayName, email.subject);
      });
    } catch {
      // Silently fail — will retry on next poll
    }
  }, [user, showBrowserNotification, addToast]);

  // Start polling when user is authenticated
  useEffect(() => {
    if (!user) {
      isFirstLoad.current = true;
      seenEmailIds.current.clear();
      setTotalUnread(0);
      setRecentUnread([]);
      return;
    }

    // Initial check
    checkUnread();

    // Set up polling
    intervalRef.current = setInterval(checkUnread, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, checkUnread]);

  // Auto-request notification permission after user logs in
  useEffect(() => {
    if (
      user &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      // Wait a moment before asking
      const timer = setTimeout(() => {
        requestPermission();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, requestPermission]);

  return (
    <NotificationContext.Provider
      value={{
        totalUnread,
        recentUnread,
        notificationsEnabled,
        requestPermission,
        refreshSignal,
      }}
    >
      {children}

      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto bg-white border border-[var(--border)] rounded-lg shadow-lg p-4 animate-fade-in flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">New Email</p>
                <p className="text-xs text-[var(--muted-foreground)] truncate">
                  From: {toast.from}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] truncate">
                  {toast.subject}
                </p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded hover:bg-[var(--secondary)] transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
              </button>
            </div>
          ))}
        </div>
      )}
    </NotificationContext.Provider>
  );
}

// Bell button with dropdown for sidebar/header
export function NotificationBell() {
  const { totalUnread, recentUnread, notificationsEnabled, requestPermission } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          if (!notificationsEnabled) {
            requestPermission();
          }
          setIsOpen(!isOpen);
        }}
        className="relative p-2 rounded hover:bg-[var(--secondary)] transition-colors"
        title={
          notificationsEnabled
            ? `${totalUnread} unread emails`
            : "Enable notifications"
        }
      >
        {notificationsEnabled ? (
          <Bell className="w-4 h-4" />
        ) : (
          <BellOff className="w-4 h-4 text-[var(--muted-foreground)]" />
        )}
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white border border-[var(--border)] rounded-lg shadow-lg z-50 animate-fade-in overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <span className="text-sm font-semibold">Notifications</span>
            {!notificationsEnabled && (
              <button
                onClick={requestPermission}
                className="text-xs text-blue-600 hover:underline"
              >
                Enable browser alerts
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {recentUnread.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-6 h-6 text-[var(--muted-foreground)] mx-auto mb-2" />
                <p className="text-sm text-[var(--muted-foreground)]">
                  No unread emails
                </p>
              </div>
            ) : (
              recentUnread.map((email) => (
                <Link
                  key={email._id}
                  href={`/accounts/${email.accountId}/inbox?emailId=${email._id}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--secondary)] transition-colors border-b border-[var(--border)] last:border-b-0"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">
                        {email.fromName || email.from.split("@")[0]}
                      </span>
                      <span className="text-[10px] text-[var(--muted-foreground)] flex-shrink-0">
                        {formatTime(email.receivedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] truncate">
                      {email.subject}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>

          {totalUnread > 5 && (
            <div className="px-4 py-2 border-t border-[var(--border)] text-center">
              <span className="text-xs text-[var(--muted-foreground)]">
                +{totalUnread - 5} more unread
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
