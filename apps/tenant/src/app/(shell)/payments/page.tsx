"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Banknote,
  CheckCircle2,
  XCircle,
  Download,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  ArrowLeft,
  FileText,
  Calendar,
  Building2,
  Hash,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Script from "next/script";
import type { PaymentStatus } from "@/src/types/payments";
import { KosanCard, KosanBadge, KosanButton, KosanInput, LoadingSpinner, useToast } from "@sbhms/ui";

const PAYMENT_METHODS = [
  { id: "midtrans", label: "Online Payment (Midtrans)", type: "card" as const },
  { id: "cash", label: "Cash (On-site)", type: "cash" as const },
];


const StatusBadge = ({ status }: { status: PaymentStatus }) => {
  const badgeVariants: Record<PaymentStatus, "success" | "gold" | "info" | "danger" | "default"> = {
    completed: "success",
    pending:   "gold",
    processing: "info",
    failed:    "danger",
    refunded:  "danger",
    expired:   "danger",
    cancelled: "danger",
  };
  const labels: Record<PaymentStatus, string> = {
    completed: "Completed",
    pending: "Pending",
    processing: "Processing",
    failed: "Failed",
    refunded: "Refunded",
    expired: "Expired",
    cancelled: "Cancelled",
  };
  return (
    <KosanBadge variant={badgeVariants[status] || "default"}>
      {labels[status] || status}
    </KosanBadge>
  );
};

export default function PaymentsPage() {
  const [view, setView] = useState<"main" | "pay" | "success" | "failure" | "invoice">("main");
  const [selectedMethod, setMethod] = useState<string | null>(null);
  const [selectedPayment, setPayment] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [cardNum, setCardNum] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [accountNum, setAccountNum] = useState("");
  
  const [payments, setPayments] = useState<any[]>([]);
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewMonths, setRenewMonths] = useState("1");
  const [renewing, setRenewing] = useState(false);

  const daysLeft = activeBooking?.end_date
    ? Math.max(0, Math.ceil((new Date(activeBooking.end_date).getTime() - Date.now()) / 86400000))
    : 0;

  const toast = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch user profile
      const profileRes = await fetch("/api/profile");
      const profileJson = await profileRes.json();
      if (profileJson.success) {
        setProfile(profileJson.data);
      }

      // Fetch dashboard for active booking
      const dashboardRes = await fetch("/api/dashboard");
      const dashboardJson = await dashboardRes.json();
      if (dashboardJson.success) {
        setActiveBooking(dashboardJson.data.active_lease);
      }

      // Fetch payments history
      const paymentsRes = await fetch("/api/payments");
      const paymentsJson = await paymentsRes.json();
      if (paymentsJson.success && Array.isArray(paymentsJson.data)) {
        const mapped = paymentsJson.data.map((p: any) => {
          const rawStatus = p.status === "paid" ? "completed" : p.status;
          let roomName = "Unknown Room";
          if (p.type === "service") {
            roomName = `Service: ${p.service_request?.service?.name || "Service Request"}`;
          } else if (p.booking?.room?.name) {
            roomName = p.booking.room.name;
          }
          return {
            id: p.id,
            booking_id: p.booking_id,
            service_request_id: p.service_request_id,
            room: roomName,
            type: p.type || "booking",
            customer: p.booking?.tenant
              ? `${p.booking.tenant.first_name} ${p.booking.tenant.last_name || ""}`.trim()
              : (p.service_request?.tenant
                ? `${p.service_request.tenant.first_name} ${p.service_request.tenant.last_name || ""}`.trim()
                : "Tenant"),
            method: p.gateway_ref ? `Ref: ${p.gateway_ref}` : "Manual",
            amount: p.amount,
            formattedAmount: `Rp ${Number(p.amount).toLocaleString("id-ID")}`,
            date: p.created_at ? new Date(p.created_at).toLocaleDateString("en-GB") : "Pending",
            status: rawStatus,
            gateway_ref: p.gateway_ref || "",
            created_at: p.created_at,
          };
        });
        setPayments(mapped);
      }
    } catch (error) {
      console.error("Failed to load payments view data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRenewLease = async () => {
    try {
      setRenewing(true);

      const newEnd = new Date(activeBooking.end_date);
      newEnd.setMonth(newEnd.getMonth() + Number(renewMonths));

      const formattedEndDate = newEnd.toISOString().split("T")[0];

      const res = await fetch(`/api/bookings/${activeBooking.id}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ end_date: formattedEndDate }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        toast.error(json.error || "Failed to renew lease");
        return;
      }

      setShowRenewModal(false);

      toast.success(
        `Lease renewal request for ${renewMonths} month${renewMonths !== "1" ? "s" : ""} has been sent.`
      );

      // refresh data
      await loadData();

    } catch (err) {
      console.error("Error during renewal:", err);
      toast.error("Something went wrong while renewing lease.");
    } finally {
      setRenewing(false);
    }
  };
  const handlePay = async () => {
    if (!selectedPayment || !selectedMethod) return;

    try {
      setSubmitting(true);

      if (selectedMethod === "midtrans") {
        const res = await fetch("/api/payments/midtrans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payment_id: selectedPayment.id }),
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          toast.error(json.error || "Failed to initialize payment gateway");
          return;
        }

        const snapToken = json.data.snap_token;

        if (!(window as any).snap) {
          toast.error("Payment gateway library not loaded yet. Please try again.");
          return;
        }

        (window as any).snap.pay(snapToken, {
          onSuccess: async function(result: any) {
            toast.success("Payment completed successfully!");
            await loadData();
            setView("success");
          },
          onPending: async function(result: any) {
            toast.info("Payment is pending. Please complete your payment.");
            await loadData();
            setView("main");
          },
          onError: function(result: any) {
            toast.error("Payment failed. Please try again.");
            setView("failure");
          },
        });
      } else {
        // Cash payment fallback
        const refCode = `CASH-${Date.now().toString().slice(-6)}`;
        const updateRes = await fetch(`/api/payments/${selectedPayment.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "pending",
            gateway_ref: refCode,
          }),
        });

        const updateJson = await updateRes.json();

        if (!updateRes.ok || !updateJson.success) {
          setView("failure");
          return;
        }

        await loadData();
        setView("success");
      }
    } catch (err) {
      console.error("Error during payment processing:", err);
      setView("failure");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewInvoice = async (payment: any) => {
    try {
      setPayment(payment);
      setView("invoice");
      
      const res = await fetch(`/api/payments/${payment.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPayment({
          ...payment,
          invoice: json.data.invoice,
        });
      }
    } catch (error) {
      console.error("Failed to load invoice details:", error);
    }
  };

  const reset = () => {
    setView("main");
    setMethod(null);
    setCardNum("");
    setExpiry("");
    setCvv("");
    setAccountNum("");
  };

  if (loading) {
    return <LoadingSpinner message="Loading payments…" />;
  }
  const isPayable = (status: PaymentStatus) => status === "pending";
  const tenantFullName = profile
    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
    : "Tenant";

  /* invoice view */
  if (view === "invoice" && selectedPayment) {
    const invNum =
      selectedPayment.invoice?.invoice_number ||
      `KM-${selectedPayment.id.slice(0, 8).toUpperCase()}`;

    const invDate =
      selectedPayment.invoice?.generated_date
        ? new Date(selectedPayment.invoice.generated_date).toLocaleDateString("en-GB")
        : selectedPayment.date;

    return (
      <div className="min-h-screen bg-[#F5E6D3] p-6 flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <KosanButton
            variant="ghost"
            size="sm"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => setView("main")}
          >
            Back
          </KosanButton>

          <KosanButton
            variant="primary"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={() => window.print()}
          >
            PDF
          </KosanButton>
        </div>

        {/* CARD */}
        <KosanCard className="bg-[#EFE3D0] max-w-2xl mx-auto w-full p-6 sm:p-8">
          {/* TOP */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4 sm:items-start mb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-[#C8A96E]" />
                <h2 className="font-bold text-xl text-[#2C1A0E]">Kosan Mama</h2>
              </div>
              <p className="text-xs text-[#8B6F5E] mt-1.5 font-semibold">
                Invoice #{invNum}
              </p>
            </div>

            <StatusBadge status={selectedPayment.status} />
          </div>

          <div className="border-t border-[#C8A96E]/20 my-6" />

          {/* INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm mb-8">
            <div>
              <p className="text-xs text-[#8B6F5E] font-bold uppercase tracking-wider mb-1">Billed To</p>
              <p className="font-bold text-[#2C1A0E] text-base">
                {selectedPayment.customer}
              </p>
              <p className="text-xs text-[#8B6F5E] mt-0.5">
                {selectedPayment.room}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-xs text-[#8B6F5E] font-bold uppercase tracking-wider mb-1">Date Issued</p>
              <p className="font-bold text-[#2C1A0E] text-base">{invDate}</p>
            </div>
          </div>

          {/* ITEM */}
          <div className="bg-[#DFC9A8]/40 border border-[#C8A96E]/20 rounded-xl p-4 mb-6">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-[#2C1A0E]">
                {selectedPayment.type === "service" ? "Service Fee" : "Monthly Rent"}
              </span>
              <span className="text-[#2C1A0E]">
                {selectedPayment.formattedAmount}
              </span>
            </div>
            <p className="text-xs text-[#8B6F5E] mt-1">
              Description: {selectedPayment.room}
            </p>
          </div>

          {/* TOTAL */}
          <div className="flex justify-between font-bold text-[#2C1A0E] text-lg mb-6">
            <span>Total</span>
            <span>{selectedPayment.formattedAmount}</span>
          </div>

          <div className="border-t border-[#C8A96E]/20 my-6" />

          {/* FOOTER */}
          <div className="text-xs text-[#8B6F5E] flex justify-between flex-col sm:flex-row gap-2">
            <div>
              <p className="font-bold uppercase tracking-wider text-[10px]">Payment Reference</p>
              <p className="font-bold text-[#2C1A0E] mt-0.5 text-sm">
                {selectedPayment.gateway_ref || "None"}
              </p>
            </div>
          </div>
        </KosanCard>
      </div>
    );
  }

  /* ── success view ── */
  if (view === "success") {
    const paidAmount = selectedPayment?.amount || 0;
    return (
      <div className="min-h-screen bg-[#F5E6D3] p-6 flex items-center justify-center">
        <KosanCard className="w-full max-w-md text-center p-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#5E9B72]/20 text-[#3d6b4f] flex items-center justify-center mb-4">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-2xl font-bold text-[#2C1A0E] mb-2">Payment Logged!</h2>
          <p className="text-sm text-[#8B6F5E] mb-6">
            Your payment request of <strong>Rp {paidAmount.toLocaleString("id-ID")}</strong> has been registered.
          </p>
          <div className="w-full bg-[#EFE3D0] rounded-xl p-4 border border-[#C8A96E]/20 space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-[#8B6F5E] font-medium">Item</span>
              <span className="text-[#2C1A0E] font-bold">{selectedPayment?.room ?? "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8B6F5E] font-medium">Method</span>
              <span className="text-[#2C1A0E] font-bold">
                {PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.label ?? "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8B6F5E] font-medium">Date</span>
              <span className="text-[#2C1A0E] font-bold">{new Date().toLocaleDateString("en-GB")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8B6F5E] font-medium">Status</span>
              <span className="text-[#2C1A0E] font-bold">
                {selectedMethod === "midtrans" ? "Completed" : "Awaiting Verification"}
              </span>
            </div>
          </div>
          <KosanButton variant="primary" fullWidth onClick={reset}>
            Back to Payments
          </KosanButton>
        </KosanCard>
      </div>
    );
  }

  /* ── failure view ── */
  if (view === "failure") {
    return (
      <div className="min-h-screen bg-[#F5E6D3] p-6 flex items-center justify-center">
        <KosanCard className="w-full max-w-md text-center p-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#C0444A]/15 text-[#9a2f34] flex items-center justify-center mb-4">
            <XCircle size={36} />
          </div>
          <h2 className="text-2xl font-bold text-[#2C1A0E] mb-2">Payment Failed</h2>
          <p className="text-sm text-[#8B6F5E] mb-6">
            We couldn't process your payment. Please check details and try again.
          </p>
          <div className="w-full bg-[#EFE3D0] rounded-xl p-4 border border-[#C8A96E]/20 text-left space-y-2 mb-6">
            <p className="text-xs text-[#9a2f34] flex items-center gap-1.5 font-medium">
              <AlertCircle size={14} /> Insufficient funds or incorrect details
            </p>
            <p className="text-xs text-[#9a2f34] flex items-center gap-1.5 font-medium">
              <AlertCircle size={14} /> Connection issue with simulated payment gateway
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <KosanButton variant="secondary" fullWidth onClick={reset}>
              Cancel
            </KosanButton>
            <KosanButton variant="primary" fullWidth onClick={() => setView("pay")}>
              Try Again
            </KosanButton>
          </div>
        </KosanCard>
      </div>
    );
  }

  /* payment flow view */
  if (view === "pay") {
    if (!selectedPayment) {
      return (
        <div className="min-h-screen bg-[#F5E6D3] p-6 flex flex-col justify-center items-center">
          <KosanCard className="w-full max-w-md text-center p-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#C0444A]/15 text-[#9a2f34] flex items-center justify-center mb-4">
              <AlertCircle size={36} />
            </div>
            <h2 className="text-2xl font-bold text-[#2C1A0E] mb-2">No Payment Selected</h2>
            <p className="text-sm text-[#8B6F5E] mb-6">
              Please choose a pending payment from your history.
            </p>
            <KosanButton variant="primary" fullWidth onClick={reset}>
              Back to Payments
            </KosanButton>
          </KosanCard>
        </div>
      );
    }

    const paymentAmount = selectedPayment.amount || 0;
    return (
      <div className="min-h-screen bg-[#F5E6D3] p-6 flex flex-col">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <KosanButton variant="secondary" size="sm" onClick={reset} leftIcon={<ChevronLeft size={15} />}>
              Back
            </KosanButton>
            <h1 className="text-3xl font-bold text-[#2C1A0E]">Make a Payment</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
          {/* summary card */}
          <KosanCard className="bg-[#553D2B] text-[#F5E6D3] border-none md:col-span-2 p-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[#C8A96E] mb-4">Payment Summary</p>
            <div className="flex items-center gap-2 text-sm text-[#F5E6D3] mb-3">
              <Building2 size={15} className="text-[#C8A96E] flex-shrink-0" />
              <span className="text-black">{selectedPayment.room} — Kosan Mama</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#F5E6D3] mb-3">
              <Calendar size={15} className="text-[#C8A96E] flex-shrink-0" />
              <span className="text-black">Due: {selectedPayment.date || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#F5E6D3] mb-3">
              <Hash size={15} className="text-[#C8A96E] flex-shrink-0" />
              <span className="text-black">{selectedPayment.type === "service" ? "Service Fee" : "Monthly Rent"} Invoice</span>
            </div>
            <div className="border-t border-white/10 my-4" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-black/60">Total Due</span>
              <span className="text-xl font-bold text-[#C8A96E]">Rp {paymentAmount.toLocaleString("id-ID")}</span>
            </div>
          </KosanCard>

          {/* method selection */}
          <KosanCard className="md:col-span-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#2C1A0E] mb-4">Select Payment Method</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left cursor-pointer ${
                    selectedMethod === m.id
                      ? "bg-[#553D2B] text-white border-transparent"
                      : "bg-[#EFE3D0] text-[#2C1A0E] border-[#C8A96E]/20 hover:bg-[#DFC9A8]/40"
                  }`}
                  onClick={() => setMethod(m.id)}
                >
                  <span className={selectedMethod === m.id ? "text-[#C8A96E]" : "text-[#553D2B]"}>
                    {m.type === "card" && <CreditCard size={18} />}
                    {m.type === "cash" && <Banknote size={18} />}
                  </span>
                  <span className="font-semibold text-sm flex-1">{m.label}</span>
                  {selectedMethod === m.id && <CheckCircle2 size={16} className="text-[#C8A96E]" />}
                </button>
              ))}
            </div>

            {/* dynamic form */}
            {selectedMethod === "midtrans" && (
              <div className="flex gap-3 items-start bg-[#DFC9A8]/30 border border-[#C8A96E]/20 rounded-xl p-4 mb-6 text-sm text-[#2C1A0E]">
                <CreditCard size={20} className="text-[#C8A96E] flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-1">Pay Online Securely</p>
                  <p className="text-xs text-[#8B6F5E]">
                    You will be redirected to Midtrans secure payment gateway. Supports Credit Card, Virtual Accounts (BCA, Mandiri, BNI, etc.), GoPay, ShopeePay, and other methods.
                  </p>
                </div>
              </div>
            )}

            {selectedMethod === "cash" && (
              <div className="flex gap-3 items-start bg-[#DFC9A8]/30 border border-[#C8A96E]/20 rounded-xl p-4 mb-6 text-sm text-[#2C1A0E]">
                <Banknote size={20} className="text-[#C8A96E] flex-shrink-0" />
                <p>
                  Please complete the payment in person at the management office. Provide your name or reference number:{" "}
                  <strong>KM-TENANT-{Date.now().toString().slice(-4)}</strong>
                </p>
              </div>
            )}

            <KosanButton
              variant="primary"
              fullWidth
              disabled={!selectedMethod || submitting}
              loading={submitting}
              onClick={handlePay}
            >
              Confirm Payment — Rp {paymentAmount.toLocaleString("id-ID")}
            </KosanButton>
          </KosanCard>
        </div>
      </div>
    );
  }

  /* ── main view ── */
  return (
    <div className="min-h-screen bg-[#F5E6D3] p-6 flex flex-col">
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
      />
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-[#2C1A0E]">
          Payments
        </h1>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending', count: payments.filter(p => p.status === 'pending').length },
          { key: 'completed', label: 'Completed' },
          { key: 'expired', label: 'Expired' },
          { key: 'failed', label: 'Failed' },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === tab.key
                ? 'bg-[#553D2B] text-white'
                : 'bg-[#DFC9A8]/50 text-[#8B6F5E] hover:bg-[#DFC9A8]'
            }`}
          >
            {tab.label}
            {tab.count && tab.count > 0 ? (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                statusFilter === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-[#E07B39] text-white'
              }`}>
                {tab.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Card Wrapper for History */}
      {(() => {
        const filteredPayments = statusFilter === 'all'
          ? payments
          : payments.filter(p => p.status === statusFilter);

        return (
          <KosanCard className="overflow-hidden p-0 mb-6 flex flex-col">
            <div className="border-b border-[#C8A96E]/20 px-6 py-4 flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#553D2B]">
                Payment History
              </p>
              <Link href="/payments/history">
                <KosanButton
                  variant="secondary"
                  size="sm"
                  rightIcon={<ArrowRight size={14} />}
                >
                  View All
                </KosanButton>
              </Link>
            </div>

            {/* Desktop table */}
            <div className="overflow-x-auto hidden sm:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#DFC9A8]/45 border-b border-[#C8A96E]/25">
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#553D2B]">
                      Room
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#553D2B]">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#553D2B]">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#553D2B]">
                      Status
                    </th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#C8A96E]/10">
                  {filteredPayments.slice(0, 5).map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-[#DFC9A8]/20 transition-all"
                    >
                      <td className="px-6 py-4 text-sm text-[#2C1A0E]">
                        {p.room}
                      </td>

                      <td className="px-6 py-4 text-sm text-[#2C1A0E]">
                        {p.customer}
                      </td>

                      <td className="px-6 py-4 text-sm font-bold text-[#2C1A0E]">
                        {p.formattedAmount}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={p.status} />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-end">
                          {p.status === "completed" && (
                            <KosanButton
                              variant="secondary"
                              size="sm"
                              onClick={() => handleViewInvoice(p)}
                              leftIcon={<FileText size={14} />}
                            >
                              Invoice
                            </KosanButton>
                          )}

                          {isPayable(p.status) && (
                            <KosanButton
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setPayment(p);
                                setMethod(null);
                                setView("pay");
                              }}
                            >
                              Pay Now
                            </KosanButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-xs text-[#8B6F5E]">
                        No payment history entries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile card layout */}
            <div className="sm:hidden divide-y divide-[#C8A96E]/10">
              {filteredPayments.slice(0, 5).map((p) => (
                <div key={p.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#553D2B]">#{p.id.slice(0, 8).toUpperCase()}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-[#2C1A0E] font-medium break-words">{p.room}</span>
                    <span className="text-sm font-bold text-[#C8A96E] mt-0.5">{p.formattedAmount}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    {p.status === 'completed' && (
                      <KosanButton variant="secondary" size="sm" onClick={() => handleViewInvoice(p)} leftIcon={<FileText size={14} />}>
                        Invoice
                      </KosanButton>
                    )}
                    {isPayable(p.status) && (
                      <KosanButton variant="primary" size="sm" onClick={() => { setPayment(p); setMethod(null); setView('pay'); }}>
                        Pay Now
                      </KosanButton>
                    )}
                  </div>
                </div>
              ))}
              {filteredPayments.length === 0 && (
                <div className="text-center py-8 text-xs text-[#8B6F5E]">
                  No payment history entries found.
                </div>
              )}
            </div>
          </KosanCard>
        );
      })()}

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Lease Info Card */}
        <KosanCard>
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-[#553D2B]">
            Lease Details
          </p>
          {activeBooking ? (
            <>
            <div className="flex items-center gap-3 bg-[#EFE3D0] border border-[#C8A96E]/20 p-4 rounded-xl mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#553D2B] font-bold text-white text-lg flex-shrink-0">
                {tenantFullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-[#2C1A0E]">{tenantFullName}</p>
                <p className="text-xs text-[#8B6F5E] mt-0.5 font-medium">
                  {activeBooking?.room?.name || "No Room Allocated"}
                </p>
              </div>
            </div>
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between bg-[#EFE3D0] border border-[#C8A96E]/20 px-4 py-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-[#C8A96E]" />
                    <span className="text-xs text-[#8B6F5E] font-semibold">Start Date</span>
                  </div>
                  <span className="text-sm font-bold text-[#2C1A0E]">
                    {new Date(activeBooking.start_date).toLocaleDateString("en-GB")}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-[#EFE3D0] border border-[#C8A96E]/20 px-4 py-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-[#C8A96E]" />
                    <span className="text-xs text-[#8B6F5E] font-semibold">End Date</span>
                  </div>
                  <span className="text-sm font-bold text-[#2C1A0E]">
                    {new Date(activeBooking.end_date).toLocaleDateString("en-GB")}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-[#EFE3D0] border border-[#C8A96E]/20 px-4 py-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={14} className={daysLeft <= 7 ? "text-[#C0444A]" : "text-[#C8A96E]"} />
                    <span className="text-xs text-[#8B6F5E] font-semibold">Days Remaining</span>
                  </div>
                  <span className={`text-sm font-bold ${daysLeft <= 7 ? "text-[#C0444A]" : daysLeft <= 14 ? "text-[#C8A96E]" : "text-[#5E9B72]"}`}>
                    {daysLeft > 0 ? `${daysLeft} days` : "Expired"}
                  </span>
                </div>
              </div>
              <KosanButton
                variant="primary"
                fullWidth
                onClick={() => setShowRenewModal(true)}
              >
                Renew Lease
              </KosanButton>
            </>
          ) : (
            <p className="text-sm text-[#8B6F5E]">No active lease found.</p>
          )}
        </KosanCard>

        {/* Available Methods (unchanged) */}
        <KosanCard>
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-[#553D2B]">
            Available Methods
          </p>
          <div className="space-y-2.5">
            {PAYMENT_METHODS.map((m) => (
              <div key={m.id} className="flex items-center justify-between bg-[#EFE3D0] border border-[#C8A96E]/20 px-4 py-3 rounded-xl">
                <span className="text-sm font-semibold text-[#2C1A0E]">{m.label}</span>
                <span className="text-xs font-bold text-[#5E9B72]">Active</span>
              </div>
            ))}
          </div>
        </KosanCard>
      </div>
      {/* Renew Lease Modal */}
      {showRenewModal && activeBooking && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <KosanCard className="w-full max-w-sm p-6 flex flex-col gap-4">
            <h2 className="text-xl font-bold text-[#2C1A0E]">Renew Lease</h2>
            <p className="text-sm text-[#8B6F5E]">
              Current lease ends on{" "}
              <strong>{new Date(activeBooking.end_date).toLocaleDateString("en-GB")}</strong>.
              Select how many months to extend.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {["1", "3", "6"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setRenewMonths(m)}
                  className={`rounded-xl border py-3 text-sm font-bold transition-all ${
                    renewMonths === m
                      ? "bg-[#553D2B] text-white border-transparent"
                      : "bg-[#EFE3D0] text-[#2C1A0E] border-[#C8A96E]/20 hover:bg-[#DFC9A8]/40"
                  }`}
                >
                  {m} mo
                </button>
              ))}
            </div>
            {/* New end date preview */}
            <div className="bg-[#EFE3D0] border border-[#C8A96E]/20 rounded-xl px-4 py-3 text-sm">
              <span className="text-[#8B6F5E] font-semibold">New end date: </span>
              <span className="font-bold text-[#2C1A0E]">
                {(() => {
                  const d = new Date(activeBooking.end_date);
                  d.setMonth(d.getMonth() + Number(renewMonths));
                  return d.toLocaleDateString("en-GB");
                })()}
              </span>
            </div>
            <div className="flex gap-3">
              <KosanButton variant="secondary" fullWidth onClick={() => setShowRenewModal(false)}>
                Cancel
              </KosanButton>
              <KosanButton
                variant="primary"
                fullWidth
                loading={renewing}
                onClick={() => handleRenewLease()}
              >
                Renew
              </KosanButton>
            </div>
          </KosanCard>
        </div>
      )}
    </div>
  );
}
