"use client";

import { Mail, Inbox, Send, Clock } from "lucide-react";

interface AccountCardProps {
  id: string;
  name: string;
  email: string;
  color: string;
  inboxCount?: number;
  sentCount?: number;
  scheduledCount?: number;
  onClick?: () => void;
}

export default function AccountCard({
  name,
  email,
  color,
  inboxCount = 0,
  sentCount = 0,
  scheduledCount = 0,
  onClick,
}: AccountCardProps) {
  return (
    <div onClick={onClick} className="card card-hover cursor-pointer group">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg transition-transform group-hover:scale-110"
          style={{ backgroundColor: color }}
        >
          {name[0].toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg mb-1 group-hover:text-[var(--primary)] transition-colors">
            {name}
          </h3>
          <p className="text-sm text-[var(--muted-foreground)] truncate">
            {email}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[var(--primary)]/10">
            <Inbox className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div>
            <p className="text-lg font-semibold">{inboxCount}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Inbox</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[var(--success)]/10">
            <Send className="w-4 h-4 text-[var(--success)]" />
          </div>
          <div>
            <p className="text-lg font-semibold">{sentCount}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Sent</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[var(--warning)]/10">
            <Clock className="w-4 h-4 text-[var(--warning)]" />
          </div>
          <div>
            <p className="text-lg font-semibold">{scheduledCount}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Scheduled</p>
          </div>
        </div>
      </div>
    </div>
  );
}
