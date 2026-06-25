"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ClipboardList,
  CheckCircle,
  BadgeCheck,
  XCircle,
  Clock,
  User,
  BedDouble,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  Hash,
  ChevronRight,
  AlignLeft,
  ArrowLeft,
} from "lucide-react";
import {
  KosanButton,
  KosanBadge,
  KosanCard,
  KosanSearchBar,
  useToast,
  LoadingSpinner,
} from "@sbhms/ui";

type BookingStatus = "pending" | "approved" | "rejected" | "cancelled" | "completed" | "expired";

interface BookingRoom   { id: string; name: string; floor: number; price: number; status: string; }
interface BookingTenant { id: string; first_name: string; last_name: string; phone: string; }
interface Booking {
  id: string; start_date: string; end_date: string; status: BookingStatus;
  created_at: string; decision_reason: string | null;
  room: BookingRoom; tenant: BookingTenant;
}

const formatDate    = (s: string) => new Date(s).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
const formatRupiah  = (n: number) => `Rp ${n.toLocaleString("id-ID")}/mo`;

const STATUS_CFG: Record<BookingStatus, { label: string; variant: "orange" | "success" | "danger"; icon: React.ReactNode }> = {
  pending:   { label: "Pending",   variant: "orange",  icon: <Clock size={11} /> },
  approved:  { label: "Approved",  variant: "success", icon: <CheckCircle size={11} /> },
  rejected:  { label: "Rejected",  variant: "danger",  icon: <XCircle size={11} /> },
  cancelled: { label: "Cancelled", variant: "danger",  icon: <XCircle size={11} /> },
  completed: { label: "Completed", variant: "success", icon: <CheckCircle size={11} /> },
  expired:   { label: "Expired",   variant: "danger",  icon: <Clock size={11} /> },
};

function StatusTracker({ status }: { status: BookingStatus }) {
  const isFailure = status === "rejected" || status === "cancelled" || status === "expired";
  
  let steps = [
    { key: "pending", label: "Submitted", icon: <Clock size={14} /> }
  ];

  if (isFailure) {
    let failureLabel = "Rejected";
    let icon = <XCircle size={14} />;
    if (status === "cancelled") {
      failureLabel = "Cancelled";
    } else if (status === "expired") {
      failureLabel = "Expired";
      icon = <Clock size={14} />;
    }
    steps.push({ key: status, label: failureLabel, icon });
  } else {
    steps.push({ key: "approved", label: "Approved", icon: <CheckCircle size={14} /> });
    if (status === "completed") {
      steps.push({ key: "completed", label: "Completed", icon: <BadgeCheck size={14} /> });
    }
  }

  const activeKeys = ["pending"];
  if (status === "approved" || status === "completed") {
    activeKeys.push("approved");
  }
  if (status === "completed") {
    activeKeys.push("completed");
  }
  if (isFailure) {
    activeKeys.push(status);
  }

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const active  = activeKeys.includes(step.key);
        const isLast  = i === steps.length - 1;
        const isFailStep = step.key === "rejected" || step.key === "cancelled" || step.key === "expired";
        
        const dotColor = active
          ? isFailStep ? "bg-[#C0444A] border-[#C0444A] text-white"
          : step.key === "approved" || step.key === "completed" ? "bg-[#5E9B72] border-[#5E9B72] text-white"
          :                           "bg-[#553D2B] border-[#553D2B] text-white"
          : "bg-[#EFE3D0] border-[#C8A96E]/40 text-[#8B6F5E]";
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${dotColor}`}>
                {step.icon}
              </div>
              <span className={`text-[10px] font-semibold whitespace-nowrap ${active ? "text-[#2C1A0E]" : "text-[#8B6F5E]"}`}>{step.label}</span>
            </div>
            {!isLast && <div className={`flex-1 h-0.5 mx-1 mb-4 rounded ${active ? "bg-[#C8A96E]" : "bg-[#C8A96E]/25"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function InfoRow({ icon, label, value, valueClass = "text-[#2C1A0E]" }: {
  icon: React.ReactNode; label: string; value: React.ReactNode; valueClass?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 py-2.5 border-b border-[#C8A96E]/20 last:border-none">
      <div className="flex items-center gap-2 text-[#8B6F5E] text-xs sm:text-sm shrink-0">
        {icon}
        <span>{label}</span>
      </div>
      <span className={`text-sm font-semibold text-left sm:text-right break-all ${valueClass} mt-0.5 sm:mt-0`}>
        {value}
      </span>
    </div>
  );
}

function BookingRow({ booking, isSelected, onClick }: { booking: Booking; isSelected: boolean; onClick: () => void }) {
  const cfg = STATUS_CFG[booking.status];
  const fullName = `${booking.tenant.first_name} ${booking.tenant.last_name ?? ''}`;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-150
        ${isSelected ? "bg-[#553D2B] text-[#F5E6D3]" : "bg-[#EFE3D0] hover:bg-[#E0CEB5] text-[#2C1A0E]"}`}
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className={`text-xs font-bold truncate ${isSelected ? "text-[#C8A96E]" : "text-[#8B6F5E]"}`}>
          {booking.room.name}
        </span>
        <span className="text-sm font-semibold truncate">{fullName}</span>
        <span className={`text-[10px] ${isSelected ? "text-[#F5E6D3]/60" : "text-[#8B6F5E]"}`}>
          {formatDate(booking.created_at)}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <KosanBadge variant={cfg.variant}>{cfg.label}</KosanBadge>
        <ChevronRight size={14} className={isSelected ? "text-[#C8A96E]" : "text-[#8B6F5E]"} />
      </div>
    </button>
  );
}

function RegistrationForm({
  booking,
  onAccept,
  onReject,
  onBack,       
  showBackButton,
}: {
  booking: Booking | null;
  onAccept: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onBack?: () => void;
  showBackButton?: boolean;
}) {
  const [rejectReason,    setRejectReason]    = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  if (!booking) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-24">
        <ClipboardList size={40} className="text-[#8B6F5E]" />
        <p className="text-[#8B6F5E] font-medium text-sm text-center px-4">
          Select a booking request to view its details
        </p>
      </div>
    );
  }

  const cfg      = STATUS_CFG[booking.status];
  const fullName = `${booking.tenant.first_name} ${booking.tenant.last_name ?? ''}`;
  const isPending = booking.status === "pending";

  const durationMonths = Math.round(
    (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Mobile back button */}
      {showBackButton && onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-[#8B6F5E] hover:text-[#553D2B] transition-colors lg:hidden"
        >
          <ArrowLeft size={16} /> Back to list
        </button>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-[#2C1A0E] tracking-tight uppercase">
            Registration Form
          </h2>
          <p className="text-xs text-[#8B6F5E] mt-0.5">
            Submitted {formatDate(booking.created_at)} · ID #{booking.id.slice(0, 8)}
          </p>
        </div>
        <KosanBadge variant={cfg.variant}>{cfg.icon} {cfg.label}</KosanBadge>
      </div>

      {/* Status Tracker */}
      <KosanCard padding="sm">
        <p className="text-[10px] font-bold text-[#8B6F5E] uppercase tracking-widest mb-3">Booking Status</p>
        <StatusTracker status={booking.status} />
        {booking.decision_reason && (
          <p className="mt-2 text-xs text-[#8B6F5E] italic border-t border-[#C8A96E]/20 pt-2">
            Note: {booking.decision_reason}
          </p>
        )}
      </KosanCard>

      {/* Tenant */}
      <KosanCard padding="md">
        <p className="text-[10px] font-bold text-[#8B6F5E] uppercase tracking-widest mb-1">Tenant Information</p>
        <InfoRow
          icon={<User size={14} />}
          label="Full Name"
          value={
            <Link href={`/tenants/${booking.tenant.id}`} className="hover:underline hover:text-[#C8A96E] transition-colors">
              {fullName}
            </Link>
          }
        />
        <InfoRow icon={<Hash size={14} />}  label="Tenant ID" value={`#${booking.tenant.id.slice(0, 8)}`} />
        <InfoRow icon={<Phone size={14} />} label="Phone"     value={booking.tenant.phone} />
      </KosanCard>

      {/* Room */}
      <KosanCard padding="md">
        <p className="text-[10px] font-bold text-[#8B6F5E] uppercase tracking-widest mb-1">Room Information</p>
        <InfoRow
          icon={<BedDouble size={14} />}
          label="Room"
          value={
            booking.room?.id ? (
              <Link href={`/rooms/${booking.room.id}`} className="hover:underline hover:text-[#C8A96E] transition-colors">
                {booking.room.name}
              </Link>
            ) : (
              booking.room?.name || "-"
            )
          }
        />
        <InfoRow icon={<MapPin size={14} />}    label="Floor"       value={`Floor ${booking.room.floor}`} />
        <InfoRow icon={<DollarSign size={14} />}label="Monthly Rent"value={formatRupiah(booking.room.price)} />
        <InfoRow
          icon={<AlignLeft size={14} />}
          label="Room Status"
          value={booking.room.status.charAt(0).toUpperCase() + booking.room.status.slice(1)}
          valueClass={booking.room.status === "occupied" ? "text-[#C0444A] font-bold" : "text-[#5E9B72] font-bold"}
        />
      </KosanCard>

      {/* Lease Duration */}
      <KosanCard padding="md">
        <p className="text-[10px] font-bold text-[#8B6F5E] uppercase tracking-widest mb-1">Lease Duration</p>
        <InfoRow icon={<Calendar size={14} />} label="Move-in Date"  value={formatDate(booking.start_date)} />
        <InfoRow icon={<Calendar size={14} />} label="Move-out Date" value={formatDate(booking.end_date)} />
        <InfoRow icon={<Clock size={14} />}    label="Duration"      value={`${durationMonths} month${durationMonths !== 1 ? "s" : ""}`} />
      </KosanCard>

      {/* Actions */}
      {isPending && (
        <div className="flex flex-col gap-3">
          {showRejectInput ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-[#2C1A0E]">
                  Reason for rejection <span className="text-[#C0444A]">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Explain why you're rejecting this booking..."
                  className="w-full bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-4 py-3 text-sm text-[#2C1A0E] resize-none focus:outline-none focus:border-[#553D2B] focus:ring-2 focus:ring-[#553D2B]/20 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <KosanButton variant="secondary" size="sm" fullWidth onClick={() => setShowRejectInput(false)}>Cancel</KosanButton>
                <KosanButton
                  variant="danger" size="sm" fullWidth
                  onClick={() => { onReject(booking.id, rejectReason); setShowRejectInput(false); setRejectReason(""); }}
                >
                  Confirm Reject
                </KosanButton>
              </div>
            </>
          ) : (
            <div className="flex gap-3">
              <KosanButton variant="primary" size="lg" fullWidth leftIcon={<CheckCircle size={16} />} onClick={() => onAccept(booking.id)}>
                Accept
              </KosanButton>
              <KosanButton variant="danger" size="lg" fullWidth leftIcon={<XCircle size={16} />} onClick={() => setShowRejectInput(true)}>
                Reject
              </KosanButton>
            </div>
          )}
        </div>
      )}

      {!isPending && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium border ${
          booking.status === "approved" || booking.status === "completed"
            ? "bg-[#5E9B72]/10 border-[#5E9B72]/30 text-[#3d6b4f]"
            : "bg-[#C0444A]/10 border-[#C0444A]/30 text-[#9a2f34]"
        }`}>
          {booking.status === "approved"
            ? "✓ This booking has been approved."
            : booking.status === "completed"
            ? "✓ This booking has been completed."
            : `✕ This booking was ${booking.status}${booking.decision_reason ? `: "${booking.decision_reason}"` : "."}`}
        </div>
      )}
    </div>
  );
}


export default function BookingsPage() {
  const router = useRouter();
  const toast = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter]  = useState<BookingStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bookings");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setBookings(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      if (id && bookings.length > 0) {
        setSelectedId(id);
        setMobileShowDetail(true);
      }
    }
  }, [bookings]);

  const selectedBooking = bookings.find((b) => b.id === selectedId) ?? null;

  const filtered = bookings.filter((b) => {
    const name = `${b.tenant.first_name} ${b.tenant.last_name}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || b.room.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileShowDetail(true);
  };

  const handleAccept = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Booking request approved successfully.");
        await fetchBookings();
      } else {
        toast.error(json.error || "Failed to approve booking request");
      }
    } catch (err) {
      console.error("Error approving booking:", err);
      toast.error("Error approving booking");
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", decision_reason: reason })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Booking request rejected successfully.");
        await fetchBookings();
      } else {
        toast.error(json.error || "Failed to reject booking request");
      }
    } catch (err) {
      console.error("Error rejecting booking:", err);
      toast.error("Error rejecting booking");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5E6D3] px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#2C1A0E] tracking-tight">Bookings</h1>
          {pendingCount > 0 && (
            <p className="text-sm text-[#E07B39] font-semibold mt-1">
              {pendingCount} pending request{pendingCount !== 1 ? "s" : ""} need your attention
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-stretch">

        {/*Booking list*/}
        <div className={`flex flex-col gap-3 ${mobileShowDetail ? "hidden lg:flex" : "flex"}`}>

          <KosanSearchBar placeholder="Search tenant or room..." value={search} onChange={setSearch} />

          {/* Status filter tabs */}
          <div className="flex gap-2">
            {(["all", "pending", "approved", "rejected"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all
                  ${statusFilter === s ? "bg-[#553D2B] text-[#F5E6D3]" : "bg-[#EFE3D0] text-[#8B6F5E] hover:bg-[#DFC9A8]"}`}
              >
                {s}
              </button>
            ))}
          </div>
          
          <KosanCard padding="sm" className="flex flex-col flex-1 overflow-hidden">
            <p className="text-[10px] font-bold text-[#8B6F5E] uppercase tracking-widest px-2 mb-2 flex-shrink-0">
              Booking Requests
            </p>

            <div className="flex flex-col gap-2 overflow-y-auto flex-1">
              {loading ? (
                <div className="py-6">
                  <LoadingSpinner message="Loading bookings..." />
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-sm text-[#8B6F5E] text-center py-10">No bookings found</p>
              ) : (
                filtered.map((b) => (
                  <BookingRow
                    key={b.id}
                    booking={b}
                    isSelected={selectedId === b.id}
                    onClick={() => handleSelect(b.id)}
                  />
                ))
              )}
            </div>
          </KosanCard>
        </div>

        
        <div className={`${!mobileShowDetail ? "hidden lg:block" : "block"}`}>
          <KosanCard padding="md" className="h-full overflow-y-auto">
            <RegistrationForm
              booking={selectedBooking}
              onAccept={handleAccept}
              onReject={handleReject}
              onBack={() => setMobileShowDetail(false)}
              showBackButton={mobileShowDetail}
            />
          </KosanCard>
        </div>

      </div>
    </div>
  );
}