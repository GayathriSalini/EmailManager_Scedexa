"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, Clock, X, ArrowLeft } from "lucide-react";

interface EmailAccount {
  _id: string;
  name: string;
  email: string;
  color: string;
}

export default function ComposeForm() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const recipientRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async (retryCount = 0) => {
    try {
      const res = await fetch("/api/accounts");

      // Handle unauthorized
      if (res.status === 401) {
        return;
      }

      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setAccounts(data.data);
        setSelectedAccount(data.data[0]._id);
      } else if (retryCount < 2) {
        // Retry after a short delay
        setTimeout(() => fetchAccounts(retryCount + 1), 500);
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
      if (retryCount < 2) {
        setTimeout(() => fetchAccounts(retryCount + 1), 500);
      }
    }
  };

  const addRecipient = () => {
    const email = recipientInput.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (!recipients.includes(email)) {
        setRecipients([...recipients, email]);
      }
      setRecipientInput("");
    }
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addRecipient();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedAccount) {
      setError("Please select an account");
      return;
    }
    if (recipients.length === 0) {
      setError("Please add at least one recipient");
      return;
    }
    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }

    setLoading(true);

    try {
      const account = accounts.find((a) => a._id === selectedAccount);

      if (isScheduled) {
        if (!scheduledDate || !scheduledTime) {
          setError("Please select date and time");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/emails/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: selectedAccount,
            from: account?.email,
            recipients,
            subject,
            body,
            scheduledAt: new Date(
              `${scheduledDate}T${scheduledTime}`,
            ).toISOString(),
          }),
        });

        const data = await res.json();
        if (data.success) {
          setSuccess("Email scheduled");
          setTimeout(() => router.push("/scheduled"), 1000);
        } else {
          setError(data.error || "Failed to schedule");
        }
      } else {
        const res = await fetch("/api/emails/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId: selectedAccount,
            from: account?.email,
            to: recipients,
            subject,
            body,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setSuccess("Email sent");
          setTimeout(() => router.push("/"), 1000);
        } else {
          setError(data.error || "Failed to send");
        }
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded hover:bg-[var(--secondary)] md:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold">New Message</h1>
        </div>
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded hover:bg-[var(--secondary)] hidden md:block"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-6 py-4 space-y-4">
            {/* From */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <label className="text-sm text-[var(--muted-foreground)] md:w-16">
                From
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="input flex-1"
              >
                {accounts.map((account) => (
                  <option key={account._id} value={account._id}>
                    {account.name} &lt;{account.email}&gt;
                  </option>
                ))}
              </select>
            </div>

            {/* To */}
            <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-4">
              <label className="text-sm text-[var(--muted-foreground)] md:w-16 md:pt-2">
                To
              </label>
              <div className="flex-1">
                <div className="flex flex-wrap gap-1.5 p-2 border border-[var(--border)] rounded-md min-h-[42px]">
                  {recipients.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--secondary)] text-sm rounded"
                    >
                      <span className="truncate max-w-[150px] md:max-w-none">
                        {email}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRecipient(email)}
                        className="hover:text-[var(--destructive)] flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={recipientRef}
                    type="email"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={addRecipient}
                    placeholder={
                      recipients.length === 0 ? "Add recipients" : ""
                    }
                    className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Subject */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <label className="text-sm text-[var(--muted-foreground)] md:w-16">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="input flex-1"
              />
            </div>

            {/* Schedule Toggle */}
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <span className="hidden md:block md:w-16"></span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border)]"
                />
                <span className="text-sm">Schedule for later</span>
              </label>
            </div>

            {isScheduled && (
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <span className="hidden md:block md:w-16"></span>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="input"
                  />
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
            )}

            {/* Body */}
            <div className="pt-4 border-t border-[var(--border)]">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message..."
                rows={10}
                className="w-full resize-none outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 md:px-6 py-4 border-t border-[var(--border)]">
          {error && (
            <p className="text-sm text-[var(--destructive)] mb-3">{error}</p>
          )}
          {success && (
            <p className="text-sm text-[var(--success)] mb-3">{success}</p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1 sm:flex-none"
            >
              {loading ? (
                "Sending..."
              ) : isScheduled ? (
                <>
                  <Clock className="w-4 h-4" />
                  Schedule
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary hidden sm:flex"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
