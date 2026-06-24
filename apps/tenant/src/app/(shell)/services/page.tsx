"use client";

import { useState, useEffect } from "react";
import {
  Wrench,
  Zap,
  Droplets,
  Sparkles,
  HelpCircle,
  Clock,
  ChevronRight,
  CheckCircle2,
  X,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import type { Service, ServiceRequest, ServiceRequestStatus } from "@/src/types/services";
import { KosanCard, KosanButton, KosanBadge, useToast } from "@sbhms/ui";
import { LoadingSpinner } from "@sbhms/ui";
import { useLeaseContext } from "@/src/contexts/LeaseContext";

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  Plumbing: <Droplets size={20} />,
  Electrical: <Zap size={20} />,
  Cleaning: <Sparkles size={20} />,
  Other: <HelpCircle size={20} />,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(price: number) {
  if (price === 0) return "Quote on request";
  return `Rp ${price.toLocaleString("id-ID")}`;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: "gold" | "default" | "success" | "danger" | "info"; icon: React.ReactNode }
> = {
  pending: { label: "Pending", color: "gold", icon: <Clock size={11} /> },
  approved: { label: "Approved", color: "info", icon: <Check size={11} /> },
  in_progress: {
    label: "In Progress",
    color: "default",
    icon: <Loader2 className="animate-spin" size={11} />,
  },
  completed: { label: "Completed", color: "success", icon: <CheckCircle2 size={11} /> },
  cancelled: { label: "Cancelled", color: "danger", icon: <X size={11} /> },
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <KosanBadge variant={cfg.color}>
      <span className="flex items-center gap-1">
        {cfg.icon}
        {cfg.label}
      </span>
    </KosanBadge>
  );
};

export default function ServicesPage() {
  const toast = useToast();
  const { hasActiveLease, isLoading: leaseLoading } = useLeaseContext();
  const [services, setServices] = useState<Service[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"catalog" | "history">("catalog");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancelRequest = async (id: string) => {
    if (cancellingId) return;
    try {
      setCancellingId(id);
      const res = await fetch(`/api/services/request/${id}`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Request cancelled successfully.");
        await fetchData();
      } else {
        toast.error(data.error || "Failed to cancel request");
      }
    } catch (err: any) {
      toast.error("Error cancelling request: " + err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [servicesRes, requestsRes] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/services/request"),
      ]);

      const servicesJson = await servicesRes.json();
      const requestsJson = await requestsRes.json();

      if (Array.isArray(servicesJson)) {
        setServices(servicesJson);
      } else if (servicesJson.success) {
        setServices(servicesJson.data || []);
      }

      if (Array.isArray(requestsJson)) {
        setRequests(requestsJson);
      } else if (requestsJson.success) {
        setRequests(requestsJson.data || []);
      } else {
        setRequests(requestsJson || []);
      }
    } catch (error) {
      console.error("Failed to load services data:", error);
      toast.error("Failed to load services. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch on mount
  // No-op block for local toast effect

  const handleOpenModal = (service: Service) => {
    setSelectedService(service);
    setNote("");
  };

  const handleCloseModal = () => {
    setSelectedService(null);
    setNote("");
  };

  const handleSubmit = async () => {
    if (!selectedService || submitting) return;
    if (selectedService.name === "Other" && !note.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/services/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: selectedService.id,
          note: note.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        handleCloseModal();
        toast.success("Request submitted successfully!");
        await fetchData();
      } else {
        toast.error("Failed to submit request: " + (json.error || "Unknown error"));
      }
    } catch (err: any) {
      toast.error("Error submitting request: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isOther = selectedService?.name === "Other";
  const canSubmit = selectedService && (!isOther || note.trim().length > 0) && !submitting;

  if (loading && services.length === 0) {
    return <LoadingSpinner message="Loading services…" />;
  }

  return (
    <div className="min-h-screen bg-[#F5E6D3] p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#2C1A0E]">Services Queue</h1>
        <p className="text-sm text-[#8B6F5E] mt-1">Request maintenance, cleaning, or other assistance</p>
      </div>

      <div className="flex border-b border-[#C8A96E]/20 mb-6 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === "catalog"
              ? "border-[#553D2B] text-[#553D2B]"
              : "border-transparent text-[#8B6F5E] hover:text-[#553D2B]"
          }`}
        >
          Available Services
        </button>
        {hasActiveLease && (
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === "history"
                ? "border-[#553D2B] text-[#553D2B]"
                : "border-transparent text-[#8B6F5E] hover:text-[#553D2B]"
            }`}
          >
            Service Queue History
          </button>
        )}
      </div>

      {!hasActiveLease && !leaseLoading && (
        <div className="mb-4 flex items-center gap-2 bg-[#C8A96E]/10 border border-[#C8A96E]/30 rounded-xl px-4 py-3 text-sm text-[#8B6F5E]">
          <AlertCircle size={16} className="text-[#C8A96E] flex-shrink-0" />
          <span>You need an active lease to request services. Browse available services below.</span>
        </div>
      )}

      {activeTab === "catalog" && (
        <div>
          <KosanCard>
            <p className="text-xs font-bold uppercase tracking-wider text-[#553D2B] mb-4">
              Available Services
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((service) => {
                const isOtherCategory = service.name === "Other";
                return (
                  <button
                    key={service.id}
                    className={`flex flex-col justify-between p-4 rounded-xl border text-left transition-all ${
                      !hasActiveLease
                        ? "bg-[#EFE3D0]/50 border-[#C8A96E]/10 opacity-70 cursor-not-allowed"
                        : isOtherCategory
                        ? "bg-[#EFE3D0]/30 border-dashed border-[#C8A96E]/50 hover:bg-[#D6B98A]/45 hover:border-[#B88B3E] cursor-pointer hover:translate-y-[-2px]"
                        : "bg-[#EFE3D0] border-[#C8A96E]/20 hover:bg-[#D6B98A]/60 hover:border-[#B88B3E]/40 cursor-pointer hover:translate-y-[-2px]"
                    }`}
                    onClick={() => hasActiveLease && handleOpenModal(service)}
                    disabled={!hasActiveLease}
                  >
                    <div className="w-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-[#2C1A0E]">
                          <span className="text-sm sm:text-base">{service.name}</span>
                        </div>
                        {service.duration_h > 0 && (
                          <span className="text-xs text-[#8B6F5E] flex items-center gap-1 font-medium">
                            <Clock size={12} /> ~{service.duration_h}h
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8B6F5E] mt-3 leading-relaxed">
                        {service.description || "No description provided."}
                      </p>
                    </div>

                    <div className="mt-4 pt-2 border-t border-[#C8A96E]/10 w-full flex justify-between items-center text-xs">
                      <span className="font-bold text-[#553D2B]">
                        {formatPrice(service.price)}
                      </span>
                      <span className="text-[#C8A96E] font-semibold flex items-center gap-0.5">
                        Request <ChevronRight size={12} />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </KosanCard>
        </div>
      )}

      {activeTab === "history" && (
        <div>
          <KosanCard className="flex flex-col">
            <p className="text-xs font-bold uppercase tracking-wider text-[#553D2B] mb-4">
              My Requests Queue
            </p>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {requests.length === 0 ? (
                <div className="text-center py-12 text-[#8B6F5E] flex flex-col items-center justify-center">
                  <Wrench size={28} className="text-[#C8A96E]/40 mb-3" />
                  <p className="text-sm">You haven't made any service requests yet.</p>
                </div>
              ) : (
                requests.map((req) => {
                  const statusConf = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                  const dateStr = formatDate(req.requested_at);
                  const lastUpdateStr = formatDate(req.updated_at || req.requested_at);

                  return (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl bg-[#EFE3D0] border border-[#C8A96E]/20 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded bg-[#DFC9A8] text-[#553D2B] inline-flex items-center justify-center">
                            {SERVICE_ICONS[req.service?.name] || <Wrench size={14} />}
                          </span>
                          <span className="font-bold text-sm text-[#2C1A0E]">
                            {req.service?.name || "Other"}
                          </span>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>

                      <div className="space-y-1 text-xs text-[#8B6F5E] pt-2 border-t border-[#C8A96E]/10">
                        <div className="flex justify-between">
                          <span>Request ID:</span>
                          <span className="font-bold text-[#553D2B]">#{req.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Requested:</span>
                          <span className="font-medium text-[#2C1A0E]">{dateStr}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Update:</span>
                          <span className="font-medium text-[#2C1A0E]">{lastUpdateStr}</span>
                        </div>
                      </div>

                      {req.note && (
                        <div className="text-[11px] text-[#DFC9A8] bg-[#1A0E0A] p-2.5 rounded-lg border border-[#C8A96E]/20">
                          <p className="font-bold text-[#C8A96E] mb-0.5">My Note:</p>
                          <p className="italic text-[#EFE3D0]">"{req.note}"</p>
                        </div>
                      )}

                      {req.status === "pending" && (
                        <div className="flex justify-end pt-2 border-t border-[#C8A96E]/10">
                          <KosanButton
                            variant="secondary"
                            size="sm"
                            onClick={() => handleCancelRequest(req.id)}
                            disabled={cancellingId === req.id}
                            className="bg-[#C0444A]/10 text-[#C0444A] border-[#C0444A]/20 hover:bg-[#C0444A]/20"
                          >
                            {cancellingId === req.id ? "Cancelling..." : "Cancel Request"}
                          </KosanButton>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </KosanCard>
        </div>
      )}

      {/* Request modal */}
      {selectedService && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-[#EFE3D0] rounded-2xl p-6 w-full max-w-md border border-[#C8A96E]/30 relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <p className="font-bold text-xl text-[#2C1A0E]">Request Service</p>
              <button
                className="text-[#8B6F5E] hover:text-[#2C1A0E] p-1.5 rounded-xl hover:bg-[#DFC9A8]/40 transition-all cursor-pointer"
                onClick={handleCloseModal}
              >
                <X size={18} />
              </button>
            </div>

            {/* service summary */}
            <div className="flex items-center gap-3 p-3 bg-[#DFC9A8]/30 rounded-xl mb-4 border border-[#C8A96E]/20">
              <div className="p-2 bg-[#553D2B] text-white rounded-lg inline-flex items-center justify-center">
                {SERVICE_ICONS[selectedService.name] || <Wrench size={20} />}
              </div>
              <div>
                <p className="font-bold text-sm text-[#2C1A0E]">{selectedService.name}</p>
                <p className="text-xs text-[#8B6F5E] mt-0.5">
                  {formatPrice(selectedService.price)}
                  {selectedService.duration_h > 0 && ` · ~${selectedService.duration_h}h`}
                </p>
              </div>
            </div>

            {/* note field */}
            <p className="text-xs font-semibold text-[#2C1A0E] mb-2 block uppercase tracking-wider">
              {isOther ? "Describe your request *" : "Additional note (optional)"}
            </p>
            <textarea
              className="w-full bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-4 py-3 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#553D2B] h-24 mb-4 resize-none placeholder-[#8B6F5E]/60 transition-all"
              placeholder={
                isOther
                  ? "Please describe what you need in detail..."
                  : "Any additional details for the team..."
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              autoFocus={isOther}
            />

            <div className="flex gap-3">
              <KosanButton variant="secondary" fullWidth onClick={handleCloseModal}>
                Cancel
              </KosanButton>
              <KosanButton
                variant="primary"
                fullWidth
                loading={submitting}
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                Submit Request
              </KosanButton>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
