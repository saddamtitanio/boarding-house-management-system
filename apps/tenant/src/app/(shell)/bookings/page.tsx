"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Home,
  DollarSign,
  AlertCircle,
  XCircle,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import {
  KosanCard,
  KosanBadge,
  KosanButton,
  KosanSearchBar,
  useToast
} from "@sbhms/ui";

interface Room {
  id: string;
  name: string;
  floor: number;
  price: number;
}

interface Booking {
  id: string;
  start_date: string;
  end_date: string;
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed" | "expired";
  decision_reason: string | null;
  created_at: string;
  room: Room;
}

export default function TenantBookingsPage() {
  const toast = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bookings");
      const resData = await res.json();
      if (resData.success) {
        setBookings(resData.data || []);
      }
    } catch (err) {
      console.error("Error loading tenant bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking request?")) return;

    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success("Booking request cancelled successfully.");
        fetchBookings();
      } else {
        toast.error("Cancellation failed: " + (resData.error || "Unknown error"));
      }
    } catch (err: any) {
      toast.error("Error cancelling booking: " + err.message);
    }
  };

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString("id-ID")}/mo`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: Booking["status"]) => {
    switch (status) {
      case "approved":
        return <KosanBadge variant="success">Approved</KosanBadge>;
      case "completed":
        return <KosanBadge variant="success">Completed</KosanBadge>;
      case "rejected":
        return <KosanBadge variant="danger">Rejected</KosanBadge>;
      case "cancelled":
        return <KosanBadge variant="default">Cancelled</KosanBadge>;
      case "expired":
        return <KosanBadge variant="danger">Expired</KosanBadge>;
      default:
        return <KosanBadge variant="gold">Pending</KosanBadge>;
    }
  };

  console.log("Bookings data:", bookings);
  const filteredBookings = bookings.filter((b) => {
    const roomName = b.room?.name?.toLowerCase() || "";
    const matchesSearch = roomName.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#F5E6D3] p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#2C1A0E]">My Bookings</h1>
        <p className="text-sm text-[#8B6F5E] mt-1">
          Track status and details of your room applications
        </p>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <KosanSearchBar
            placeholder="Search bookings by room number..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {["all", "pending", "approved", "completed", "expired", "rejected", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === status
                  ? "bg-[#553D2B] text-white border-[#553D2B]"
                  : "bg-[#EFE3D0] text-[#8B6F5E] border-[#C8A96E]/40 hover:bg-[#DFC9A8]"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-lg font-semibold text-[#8B6F5E]">Loading bookings...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookings.map((b) => (
            <KosanCard key={b.id} className="flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-[#2C1A0E]">
                    <Link href={`/bookings/${b.id}`} className="hover:text-[#C8A96E] transition-colors">
                      {b.room ? `${b.room.name}` : "Unknown Room"}
                    </Link>
                  </h3>
                  <p className="text-xs text-[#8B6F5E] mt-0.5">
                    Floor {b.room?.floor ?? "Unknown"}
                  </p>
                </div>
                {getStatusBadge(b.status)}
              </div>

              <div className="space-y-3 mb-5 border-t border-[#C8A96E]/20 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-sm">
                  <div className="flex items-center gap-2 text-[#8B6F5E] text-xs sm:text-sm">
                    <Calendar size={14} />
                    <span>Duration</span>
                  </div>
                  <span className="font-semibold text-[#2C1A0E] text-xs sm:text-sm text-left sm:text-right mt-0.5 sm:mt-0">
                    {formatDate(b.start_date)} - {formatDate(b.end_date)}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-sm">
                  <div className="flex items-center gap-2 text-[#8B6F5E] text-xs sm:text-sm">
                    <DollarSign size={14} />
                    <span>Rent Price</span>
                  </div>
                  <span className="font-semibold text-[#2C1A0E] text-xs sm:text-sm text-left sm:text-right mt-0.5 sm:mt-0">
                    {b.room ? formatPrice(Number(b.room.price)) : "-"}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-sm">
                  <div className="flex items-center gap-2 text-[#8B6F5E] text-xs sm:text-sm">
                    <Clock size={14} />
                    <span>Applied on</span>
                  </div>
                  <span className="font-semibold text-[#2C1A0E] text-xs sm:text-sm text-left sm:text-right mt-0.5 sm:mt-0">
                    {formatDate(b.created_at)}
                  </span>
                </div>

                {b.decision_reason && (
                  <div className="mt-3 p-3 bg-[#1A0E0A] rounded-xl border border-[#C8A96E]/20 text-xs">
                    <p className="font-bold text-[#C8A96E] mb-1">
                      Reason / Message
                    </p>
                    <p className="text-[#DFC9A8] italic">{b.decision_reason}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-auto pt-2">
                <Link href={`/bookings/${b.id}`} className="flex-1">
                  <KosanButton variant="secondary" fullWidth>
                    View Details
                  </KosanButton>
                </Link>
                {b.status === "pending" && (
                  <KosanButton
                    variant="danger"
                    onClick={() => handleCancel(b.id)}
                  >
                    Cancel
                  </KosanButton>
                )}
              </div>
            </KosanCard>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredBookings.length === 0 && (
        <div className="text-center py-12 rounded-2xl border border-dashed border-[#C8A96E]/30">
          <Calendar size={48} className="mx-auto text-[#8B6F5E] mb-4" />
          <p className="text-[#8B6F5E]">No bookings found for this filter</p>
          <Link href="/room">
            <KosanButton variant="primary" size="sm" className="mt-4">
              Browse Available Rooms
            </KosanButton>
          </Link>
        </div>
      )}
    </div>
  );
}