"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { KosanBadge, KosanButton, KosanCard, LoadingSpinner, useToast } from "@sbhms/ui";
import type { PaymentStatus } from "@/src/types/payments";

const StatusBadge = ({ status }: { status: PaymentStatus }) => {
  const badgeVariants: Record<PaymentStatus, "success" | "gold" | "info" | "danger" | "default"> = {
    completed: "success",
    pending: "gold",
    processing: "info",
    failed: "danger",
    refunded: "danger",
  };
  const labels: Record<PaymentStatus, string> = {
    completed: "Completed",
    pending: "Pending",
    processing: "Processing",
    failed: "Failed",
    refunded: "Refunded",
  };
  return <KosanBadge variant={badgeVariants[status] || "default"}>{labels[status] || status}</KosanBadge>;
};

export default function PaymentHistoryPage() {
  const toast = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const paymentsRes = await fetch("/api/payments");
      const paymentsJson = await paymentsRes.json();

      if (paymentsJson.success && Array.isArray(paymentsJson.data)) {
        const mapped = paymentsJson.data.map((p: any) => {
          const rawStatus = p.status === "paid" ? "completed" : p.status;
          const roomName =
            p.type === "service"
              ? `Service: ${p.service_request?.service?.name || "Service Request"}`
              : p.booking?.room?.name || "Unknown Room";

          return {
            id: p.id,
            room: roomName,
            customer: p.booking?.tenant
              ? `${p.booking.tenant.first_name} ${p.booking.tenant.last_name || ""}`.trim()
              : p.service_request?.tenant
                ? `${p.service_request.tenant.first_name} ${p.service_request.tenant.last_name || ""}`.trim()
                : "Tenant",
            formattedAmount: `Rp ${Number(p.amount).toLocaleString("id-ID")}`,
            status: rawStatus,
            created_at: p.created_at,
            type: p.type || "booking",
          };
        });
        setPayments(mapped);
      }
    } catch (error) {
      console.error("Failed to load payment history:", error);
      toast.error("Failed to load payment history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const isPayable = (status: PaymentStatus) =>
    status === "pending" || status === "failed" || status === "processing";

  if (loading) return <LoadingSpinner message="Loading payment history…" />;

  return (
    <div className="min-h-screen bg-[#F5E6D3] p-6 flex flex-col">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-[#2C1A0E]">Payment History</h1>
        <Link href="/payments">
          <KosanButton variant="secondary" size="sm" leftIcon={<ArrowLeft size={14} />}>
            Back
          </KosanButton>
        </Link>
      </div>

      <KosanCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#DFC9A8]/45 border-b border-[#C8A96E]/25">
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#553D2B]">ID</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#553D2B]">Room</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#553D2B]">Customer</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#553D2B]">Amount</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#553D2B]">Status</th>
                <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#553D2B] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C8A96E]/10">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-[#DFC9A8]/20 transition-all">
                  <td className="px-6 py-4 text-sm font-bold text-[#553D2B]">{p.id}</td>
                  <td className="px-6 py-4 text-sm text-[#2C1A0E]">{p.room}</td>
                  <td className="px-6 py-4 text-sm text-[#2C1A0E]">{p.customer}</td>
                  <td className="px-6 py-4 text-sm font-bold text-[#2C1A0E]">{p.formattedAmount}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      {p.status === "completed" && (
                        <Link href="/payments">
                          <KosanButton variant="secondary" size="sm" leftIcon={<FileText size={14} />}>
                            Invoice
                          </KosanButton>
                        </Link>
                      )}
                      {isPayable(p.status) && (
                        <Link href="/payments">
                          <KosanButton variant="primary" size="sm">
                            Pay Now
                          </KosanButton>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-[#8B6F5E]">
                    No payment history entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </KosanCard>
    </div>
  );
}
