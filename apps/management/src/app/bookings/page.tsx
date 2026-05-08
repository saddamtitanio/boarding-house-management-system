"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  CheckCircle,
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
} from "@sbhms/ui";

type BookingStatus = "pending" | "approved" | "rejected";

interface BookingRoom   { id: number; name: string; floor: number; price: number; status: string; }
interface BookingTenant { id: number; first_name: string; last_name: string; phone: string; }
interface Booking {
  id: number; start_date: string; end_date: string; status: BookingStatus;
  created_at: string; decision_reason: string | null;
  room: BookingRoom; tenant: BookingTenant;
}

const BOOKINGS: Booking[] = [
  { id: 1, start_date: "2026-06-01", end_date: "2027-06-01", status: "pending",  created_at: "2026-05-05T10:23:00Z", decision_reason: null,                              room: { id: 2, name: "Room 104", floor: 1, price: 1500000, status: "vacant"   }, tenant: { id: 10, first_name: "Fatih",  last_name: "Rabbani", phone: "+62 812 3456 7890" } },
  { id: 2, start_date: "2026-06-15", end_date: "2027-06-15", status: "pending",  created_at: "2026-05-06T08:11:00Z", decision_reason: null,                              room: { id: 5, name: "Room 201", floor: 2, price: 1500000, status: "vacant"   }, tenant: { id: 11, first_name: "Budi",   last_name: "Santoso", phone: "+62 813 9988 7712" } },
  { id: 3, start_date: "2026-07-01", end_date: "2027-07-01", status: "approved", created_at: "2026-05-04T14:05:00Z", decision_reason: "Documents verified, payment confirmed.", room: { id: 6, name: "Room 302", floor: 3, price: 2000000, status: "vacant"   }, tenant: { id: 12, first_name: "Citra",  last_name: "Dewi",    phone: "+62 821 5566 4433" } },
  { id: 4, start_date: "2026-06-01", end_date: "2026-12-01", status: "rejected", created_at: "2026-05-03T09:40:00Z", decision_reason: "Tenant failed ID verification.",    room: { id: 8, name: "Room 305", floor: 3, price: 2000000, status: "occupied" }, tenant: { id: 13, first_name: "Dimas",  last_name: "Prayoga", phone: "+62 857 1234 5678" } },
];

const formatDate    = (s: string) => new Date(s).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
const formatRupiah  = (n: number) => `Rp ${n.toLocaleString("id-ID")}/mo`;

const STATUS_CFG: Record<BookingStatus, { label: string; variant: "orange" | "success" | "danger"; icon: React.ReactNode }> = {
  pending:  { label: "Pending",  variant: "orange",  icon: <Clock size={11} /> },
  approved: { label: "Approved", variant: "success", icon: <CheckCircle size={11} /> },
  rejected: { label: "Rejected", variant: "danger",  icon: <XCircle size={11} /> },
};

function StatusTracker({ status }: { status: BookingStatus }) {
  const isRejected = status === "rejected";
  const steps = isRejected
    ? [{ key: "pending", label: "Submitted", icon: <Clock size={14} /> }, { key: "rejected", label: "Rejected", icon: <XCircle size={14} /> }]
    : [{ key: "pending", label: "Submitted", icon: <Clock size={14} /> }, { key: "approved", label: "Approved", icon: <CheckCircle size={14} /> }];

  const activeKeys = isRejected ? ["pending", "rejected"] : status === "approved" ? ["pending", "approved"] : ["pending"];

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const active  = activeKeys.includes(step.key);
        const isLast  = i === steps.length - 1;
        const dotColor = active
          ? step.key === "rejected" ? "bg-[#C0444A] border-[#C0444A] text-white"
          : step.key === "approved" ? "bg-[#5E9B72] border-[#5E9B72] text-white"
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
    <div className="flex items-center justify-between py-2.5 border-b border-[#C8A96E]/20 last:border-none">
      <div className="flex items-center gap-2 text-[#8B6F5E] text-sm">{icon}{label}</div>
      <span className={`text-sm font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

function BookingRow({ booking, isSelected, onClick }: { booking: Booking; isSelected: boolean; onClick: () => void }) {
  const cfg      = STATUS_CFG[booking.status];
  const fullName = `${booking.tenant.first_name} ${booking.tenant.last_name}`;
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
  onAccept: (id: number) => void;
  onReject: (id: number, reason: string) => void;
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
  const fullName = `${booking.tenant.first_name} ${booking.tenant.last_name}`;
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
            Submitted {formatDate(booking.created_at)} · ID #{booking.id}
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
        <InfoRow icon={<User size={14} />}  label="Full Name" value={fullName} />
        <InfoRow icon={<Hash size={14} />}  label="Tenant ID" value={`#${booking.tenant.id}`} />
        <InfoRow icon={<Phone size={14} />} label="Phone"     value={booking.tenant.phone} />
      </KosanCard>

      {/* Room */}
      <KosanCard padding="md">
        <p className="text-[10px] font-bold text-[#8B6F5E] uppercase tracking-widest mb-1">Room Information</p>
        <InfoRow icon={<BedDouble size={14} />} label="Room"        value={booking.room.name} />
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
          booking.status === "approved"
            ? "bg-[#5E9B72]/10 border-[#5E9B72]/30 text-[#3d6b4f]"
            : "bg-[#C0444A]/10 border-[#C0444A]/30 text-[#9a2f34]"
        }`}>
          {booking.status === "approved"
            ? "✓ This booking has been approved."
            : `✕ This booking was rejected${booking.decision_reason ? `: "${booking.decision_reason}"` : "."}`}
        </div>
      )}
    </div>
  );
}


export default function BookingsPage() {
  const router = useRouter();

  const [bookings,       setBookings]      = useState<Booking[]>(BOOKINGS);
  const [selectedId,     setSelectedId]    = useState<number | null>(null);
  const [search,         setSearch]        = useState("");
  const [statusFilter,   setStatusFilter]  = useState<BookingStatus | "all">("all");
  
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const selectedBooking = bookings.find((b) => b.id === selectedId) ?? null;

  const filtered = bookings.filter((b) => {
    const name = `${b.tenant.first_name} ${b.tenant.last_name}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || b.room.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  const handleSelect = (id: number) => {
    setSelectedId(id);
    setMobileShowDetail(true);
  };

  const handleAccept = (id: number) =>
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "approved" as BookingStatus, decision_reason: "Approved by management." } : b));

  const handleReject = (id: number, reason: string) =>
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "rejected" as BookingStatus, decision_reason: reason || null } : b));

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
        <KosanButton
          variant="secondary" size="sm"
          leftIcon={<ClipboardList size={14} />}
          onClick={() => router.push("/bookings/log")}
        >
          Booking Log
        </KosanButton>
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
              {filtered.length === 0 ? (
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