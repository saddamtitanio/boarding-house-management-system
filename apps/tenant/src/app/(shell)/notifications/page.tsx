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
import { KosanCard, KosanButton, KosanBadge, LoadingSpinner, useToast } from "@sbhms/ui";

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

const TYPE_FILTERS = [
  { id: "all", label: "All" },
  { id: "booking", label: "Booking" },
  { id: "service", label: "Service" },
  { id: "payment", label: "Payment" },
  { id: "message", label: "Message" },
  { id: "system", label: "System" },
];

export default function NotificationsPage() {
  const toast = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");

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
      toast.error("Failed to load notifications.");
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
        toast.success("Notification marked as read.");
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
      toast.error("Failed to mark notification as read.");
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
        toast.success("All notifications marked as read.");
      }
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      toast.error("Failed to mark all notifications as read.");
    }
  };

  const filteredNotifications = notifications.filter((notif) =>
    typeFilter === "all" ? true : notif.type === typeFilter
  );

  return (
    <div className="min-h-screen bg-[#F5E6D3] p-4 sm:p-6 flex flex-col">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2C1A0E]">Notifications</h1>
          <p className="text-sm text-[#8B6F5E] mt-1 font-medium">
            Stay updated with your room status, services, and payments.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="overflow-x-auto min-w-0">
            <div className="flex items-center gap-2 min-w-max">
              {TYPE_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setTypeFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    typeFilter === filter.id
                      ? "bg-[#553D2B] text-white border-[#553D2B]"
                      : "bg-[#EFE3D0] text-[#8B6F5E] border-[#C8A96E]/40 hover:border-[#553D2B]/40"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          {notifications.some(n => !n.is_read) && (
            <KosanButton
              variant="secondary"
              size="sm"
              className="self-start sm:self-auto w-auto"
              onClick={handleMarkAllAsRead}
              leftIcon={<CheckCircle2 size={16} />}
            >
              Mark all as read
            </KosanButton>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading notifications…" />
      ) : (
        <KosanCard className="flex-1 flex flex-col p-0 overflow-hidden max-w-4xl w-full mx-auto">
          <div className="border-b border-[#C8A96E]/20 px-4 sm:px-6 py-4 flex justify-between items-center bg-[#DFC9A8]/15">
            <p className="text-xs font-bold uppercase tracking-wider text-[#553D2B]">
              Inbox ({filteredNotifications.filter(n => !n.is_read).length} unread)
            </p>
          </div>

          <div className="divide-y divide-[#C8A96E]/10 overflow-y-auto">
            {filteredNotifications.map((notif) => {
              const icon = NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.default;
              return (
                <div
                  key={notif.id}
                  className={`px-4 sm:px-6 py-4 flex items-start gap-3 sm:gap-4 transition-all hover:bg-[#DFC9A8]/15 ${
                    notif.is_read ? "opacity-75" : "bg-[#DFC9A8]/30 font-medium"
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-[#EFE3D0] border border-[#C8A96E]/25 flex-shrink-0 self-start">
                    {icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#2C1A0E] leading-relaxed break-words">
                      {notif.content}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-[#8B6F5E] flex-shrink-0" />
                        <span className="text-xs text-[#8B6F5E]">
                          {formatDate(notif.created_at)}
                        </span>
                        {!notif.is_read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#C8A96E] flex-shrink-0" />
                        )}
                      </div>
                      {!notif.is_read && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="text-xs font-black text-[#C8A96E] hover:text-[#DFC9A8] transition-colors cursor-pointer hover:underline"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredNotifications.length === 0 && (
              <div className="text-center py-12 flex flex-col items-center justify-center text-[#8B6F5E]">
                <Bell size={40} className="text-[#C8A96E]/50 mb-3" />
                <p className="text-sm font-semibold">No notifications found.</p>
                <p className="text-xs text-[#8B6F5E]/75 mt-0.5">Try changing the type filter.</p>
              </div>
            )}
          </div>
        </KosanCard>
      )}
    </div>
  );
}
