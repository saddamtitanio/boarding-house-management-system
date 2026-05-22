"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Layers,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  AlertTriangle,
  CreditCard,
  User,
  Info
} from "lucide-react";
import {
  KosanCard,
  KosanButton,
  KosanBadge,
  KosanSectionHeader,
  useToast
} from "@sbhms/ui";

interface Room {
  id: string;
  name: string;
  floor: number;
  price: number;
  status: string;
}

interface Payment {
  id: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "expired" | "refunded" | "cancelled";
  type: string;
  expires_at: string;
  created_at: string;
}

interface Booking {
  id: string;
  start_date: string;
  end_date: string;
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed" | "expired";
  decision_reason: string | null;
  created_at: string;
  room: Room;
  payments: Payment[];
}

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/bookings/${id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setBooking(json.data);
      } else {
        setError(json.error || "Booking not found");
      }
    } catch (err) {
      console.error("Failed to load booking details", err);
      setError("Network error loading booking details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookingDetails();
  }, [id]);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking request?")) return;

    try {
      setCancelling(true);
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success("Booking request cancelled successfully.");
        loadBookingDetails();
      } else {
        toast.error("Cancellation failed: " + (resData.error || "Unknown error"));
      }
    } catch (err: any) {
      toast.error("Error cancelling booking: " + err.message);
    } finally {
      setCancelling(false);
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5E6D3] p-6 flex items-center justify-center">
        <p className="text-lg font-semibold text-[#8B6F5E]">Loading booking details...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#F5E6D3] p-6 flex flex-col items-center justify-center gap-4">
        <div className="p-4 rounded-xl bg-[#C0444A]/10 text-[#9a2f34] flex items-center gap-2">
          <AlertCircle size={20} />
          <p className="font-semibold">{error || "Booking not found"}</p>
        </div>
        <KosanButton variant="secondary" onClick={() => router.push("/bookings")}>
          <ArrowLeft size={16} /> Back to Bookings
        </KosanButton>
      </div>
    );
  }

  const room = booking.room;
  const bookingPayment = booking.payments?.find(p => p.type === "booking");
  const isFailure = booking.status === "rejected" || booking.status === "cancelled" || booking.status === "expired";

  return (
    <div className="min-h-screen bg-[#F5E6D3] p-6">
      {/* Back Button */}
      <div className="mb-6">
        <KosanButton
          variant="ghost"
          onClick={() => router.push("/bookings")}
          className="flex items-center gap-1.5 pl-0 text-[#8B6F5E] hover:text-[#2C1A0E]"
        >
          <ArrowLeft size={16} /> Back to Bookings
        </KosanButton>
      </div>

      {/* Main Title bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2C1A0E]">
            Booking: {room?.name || "Unknown Room"}
          </h1>
          <p className="text-xs text-[#8B6F5E] mt-1">
            Booking ID: <span className="font-mono">{booking.id}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(booking.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left/Main content section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Overview Card */}
          <KosanCard>
            <KosanSectionHeader title="Application Details" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="text-[#C8A96E] mt-0.5 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-xs text-[#8B6F5E] font-semibold uppercase tracking-wider">
                      Lease Period
                    </p>
                    <p className="text-sm font-bold text-[#2C1A0E] mt-0.5">
                      {formatDate(booking.start_date)} – {formatDate(booking.end_date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="text-[#C8A96E] mt-0.5 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-xs text-[#8B6F5E] font-semibold uppercase tracking-wider">
                      Monthly Rent Price
                    </p>
                    <p className="text-sm font-bold text-[#2C1A0E] mt-0.5">
                      {room ? formatPrice(Number(room.price)) : "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="text-[#C8A96E] mt-0.5 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-xs text-[#8B6F5E] font-semibold uppercase tracking-wider">
                      Submitted On
                    </p>
                    <p className="text-sm font-bold text-[#2C1A0E] mt-0.5">
                      {formatDateTime(booking.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Layers className="text-[#C8A96E] mt-0.5 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-xs text-[#8B6F5E] font-semibold uppercase tracking-wider">
                      Room Location
                    </p>
                    <p className="text-sm font-bold text-[#2C1A0E] mt-0.5">
                      Floor {room?.floor ?? "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {booking.decision_reason && (
              <div className="mt-6 p-4 bg-[#DFC9A8]/30 rounded-xl border border-[#C8A96E]/20">
                <div className="flex items-center gap-2 mb-1.5">
                  <Info size={16} className="text-[#553D2B]" />
                  <h4 className="font-bold text-xs uppercase text-[#2C1A0E]">
                    Management Message
                  </h4>
                </div>
                <p className="text-sm text-[#2C1A0E]/85 leading-relaxed">
                  {booking.decision_reason}
                </p>
              </div>
            )}
          </KosanCard>

          {/* Room details info card */}
          <KosanCard>
            <KosanSectionHeader title="Unit Information" />
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm py-2 border-b border-[#C8A96E]/15">
                <span className="text-[#8B6F5E]">Room Number</span>
                <span className="font-bold text-[#2C1A0E]">{room?.name || "-"}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-2 border-b border-[#C8A96E]/15">
                <span className="text-[#8B6F5E]">Floor</span>
                <span className="font-bold text-[#2C1A0E]">{room?.floor ?? "-"}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-2 border-b border-[#C8A96E]/15">
                <span className="text-[#8B6F5E]">Base Price</span>
                <span className="font-bold text-[#2C1A0E]">
                  {room ? formatPrice(Number(room.price)) : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm py-2 border-b border-[#C8A96E]/15">
                <span className="text-[#8B6F5E]">Room Status</span>
                <span className="bg-[#553D2B]/10 text-[#553D2B] px-2 py-0.5 rounded-full text-xs font-bold uppercase">
                  {room?.status || "-"}
                </span>
              </div>
            </div>
          </KosanCard>

          {/* Action button: Cancel booking */}
          {booking.status === "pending" && (
            <div className="flex justify-end">
              <KosanButton
                variant="danger"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling Request..." : "Cancel Reservation Request"}
              </KosanButton>
            </div>
          )}
        </div>

        {/* Right side: Status Timeline & Payment Info */}
        <div className="space-y-6">
          {/* Status Stepper Timeline */}
          <KosanCard className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#C8A96E]" />
            <KosanSectionHeader title="Application Status" />

            <div className="mt-6 relative pl-6 border-l-2 border-[#C8A96E]/30 ml-3 space-y-6">
              {/* Step 1: Submitted */}
              <div className="relative">
                <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-[#C8A96E] bg-[#5E9B72] flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-[#2C1A0E] uppercase tracking-wider">
                    Application Submitted
                  </h4>
                  <p className="text-[10px] text-[#8B6F5E] mt-0.5">
                    {formatDateTime(booking.created_at)}
                  </p>
                </div>
              </div>

              {/* Step 2: Decision (Approved/Rejected/Cancelled) */}
              <div className="relative">
                <span className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-[#C8A96E] flex items-center justify-center ${
                  booking.status === "pending" 
                    ? "bg-[#EFE3D0]" 
                    : isFailure 
                      ? "bg-[#C0444A]" 
                      : "bg-[#5E9B72]"
                }`}>
                  {booking.status !== "pending" && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-[#2C1A0E] uppercase tracking-wider">
                    {booking.status === "pending" 
                      ? "Under Review" 
                      : booking.status === "approved" || booking.status === "completed" 
                        ? "Approved by Management" 
                        : booking.status === "rejected" 
                          ? "Rejected" 
                          : booking.status === "expired"
                            ? "Booking Expired"
                            : "Cancelled by Tenant"}
                  </h4>
                  <p className="text-[10px] text-[#8B6F5E] mt-0.5">
                    {booking.status === "pending" ? "Awaiting manager approval" : "Decision logged"}
                  </p>
                </div>
              </div>

              {/* Step 3: Payment (if approved/completed/expired) */}
              {(!isFailure || booking.status === "expired") && (
                <div className="relative">
                  <span className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-[#C8A96E] flex items-center justify-center ${
                    booking.status === "pending" 
                      ? "bg-[#EFE3D0]" 
                      : bookingPayment?.status === "paid" || booking.status === "completed"
                        ? "bg-[#5E9B72]" 
                        : bookingPayment?.status === "expired" || booking.status === "expired"
                          ? "bg-[#C0444A]"
                          : "bg-[#E07B39]"
                  }`}>
                    {(bookingPayment?.status === "paid" || booking.status === "completed" || bookingPayment?.status === "expired" || booking.status === "expired") && (
                      <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#2C1A0E] uppercase tracking-wider">
                      {booking.status === "completed" 
                        ? "Lease Active / Finished" 
                        : bookingPayment?.status === "paid" 
                          ? "Payment Confirmed" 
                          : bookingPayment?.status === "expired" || booking.status === "expired"
                            ? "Payment Expired"
                            : "Deposit Payment"}
                    </h4>
                    <p className="text-[10px] text-[#8B6F5E] mt-0.5">
                      {bookingPayment?.status === "paid" || booking.status === "completed"
                        ? "Deposit paid. Booking is finalized." 
                        : bookingPayment?.status === "pending"
                          ? "Requires deposit payment within 24 hours of approval"
                          : bookingPayment?.status === "expired" || booking.status === "expired"
                            ? "Deposit was not paid in time"
                            : "Awaiting approval to enable payment"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </KosanCard>

          {/* Payment & Invoice Action Box */}
          {bookingPayment && (
            <KosanCard className="border border-[#C8A96E]/20 bg-[#DFC9A8]/20">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="text-[#553D2B]" size={20} />
                <h4 className="font-bold text-sm text-[#2C1A0E]">
                  Deposit Payment
                </h4>
              </div>

              <div className="space-y-3 text-xs mb-4">
                <div className="flex justify-between">
                  <span className="text-[#8B6F5E]">Amount Due:</span>
                  <span className="font-bold text-[#2C1A0E]">{formatPrice(bookingPayment.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8B6F5E]">Payment Status:</span>
                  <span className={`font-bold capitalize ${
                    bookingPayment.status === "paid" 
                      ? "text-[#3d6b4f]" 
                      : bookingPayment.status === "pending" 
                        ? "text-[#92400E]" 
                        : "text-[#9a2f34]"
                  }`}>
                    {bookingPayment.status}
                  </span>
                </div>
                {bookingPayment.status === "pending" && (
                  <div className="flex justify-between">
                    <span className="text-[#8B6F5E]">Expires At:</span>
                    <span className="font-bold text-[#2C1A0E]">{formatDateTime(bookingPayment.expires_at)}</span>
                  </div>
                )}
              </div>

              {bookingPayment.status === "pending" && (
                <Link href="/payments" className="block w-full">
                  <KosanButton variant="gold" fullWidth>
                    Proceed to Payment
                  </KosanButton>
                </Link>
              )}
            </KosanCard>
          )}
        </div>
      </div>
    </div>
  );
}