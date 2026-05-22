"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  DollarSign,
  Calendar,
  MessageSquare,
  Wrench,
  Info,
  Clock
} from "lucide-react";
import { KosanCard, KosanButton, KosanBadge } from "@sbhms/ui";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  booking: <Calendar size={18} className="text-[#8B6F5E]" />,
  service: <Wrench size={18} className="text-[#8B6F5E]" />,
  payment: <DollarSign size={18} className="text-[#8B6F5E]" />,
  message: <MessageSquare size={18} className="text-[#8B6F5E]" />,
  system: <Info size={18} className="text-[#8B6F5E]" />,
  default: <Bell size={18} className="text-[#8B6F5E]" />
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setNotifications(json.data);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
        );
        // Dispatch custom event to trigger sidebar count refresh
        window.dispatchEvent(new Event("pathnamechange"));
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true })
      });
      const json = await res.json();
      if (json.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        window.dispatchEvent(new Event("pathnamechange"));
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5E6D3] p-6 flex flex-col">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2C1A0E]">Notifications</h1>
          <p className="text-sm text-[#8B6F5E] mt-1 font-medium">
            Stay updated with your room status, services, and payments.
          </p>
        </div>
        
        {notifications.some(n => !n.is_read) && (
          <KosanButton
            variant="secondary"
            size="sm"
            onClick={handleMarkAllAsRead}
            leftIcon={<CheckCircle2 size={16} />}
          >
            Mark all as read
          </KosanButton>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-12">
          <p className="text-lg font-semibold text-[#8B6F5E]">Loading notifications...</p>
        </div>
      ) : (
        <KosanCard className="flex-1 flex flex-col p-0 overflow-hidden max-w-4xl w-full mx-auto">
          <div className="border-b border-[#C8A96E]/20 px-6 py-4 flex justify-between items-center bg-[#DFC9A8]/15">
            <p className="text-xs font-bold uppercase tracking-wider text-[#553D2B]">
              Inbox ({notifications.filter(n => !n.is_read).length} unread)
            </p>
          </div>

          <div className="divide-y divide-[#C8A96E]/10 overflow-y-auto">
            {notifications.map((notif) => {
              const icon = NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.default;
              return (
                <div
                  key={notif.id}
                  className={`px-6 py-4 flex items-start gap-4 transition-all hover:bg-[#DFC9A8]/15 ${
                    notif.is_read ? "opacity-75" : "bg-[#DFC9A8]/30 font-medium"
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-[#EFE3D0] border border-[#C8A96E]/25 flex-shrink-0">
                    {icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#2C1A0E] leading-relaxed break-words">
                      {notif.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock size={12} className="text-[#8B6F5E]" />
                      <span className="text-xs text-[#8B6F5E]">
                        {formatDate(notif.created_at)}
                      </span>
                      {!notif.is_read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#C8A96E]" />
                      )}
                    </div>
                  </div>

                  {!notif.is_read && (
                    <KosanButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="text-xs text-[#8B6F5E] hover:text-[#2C1A0E]"
                    >
                      Mark Read
                    </KosanButton>
                  )}
                </div>
              );
            })}

            {notifications.length === 0 && (
              <div className="text-center py-12 flex flex-col items-center justify-center text-[#8B6F5E]">
                <Bell size={40} className="text-[#C8A96E]/50 mb-3" />
                <p className="text-sm font-semibold">All caught up!</p>
                <p className="text-xs text-[#8B6F5E]/75 mt-0.5">You have no notifications yet.</p>
              </div>
            )}
          </div>
        </KosanCard>
      )}
    </div>
  );
}
