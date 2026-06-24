"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/src/contexts/LanguageContext";
import {
  Wrench,
  Zap,
  Droplets,
  Sparkles,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  User,
  Phone,
  Check,
  X,
  Loader2,
} from "lucide-react";
import {
  KosanCard,
  KosanButton,
  KosanSearchBar,
  KosanBadge,
  KosanInput,
  useToast,
  LoadingSpinner,
} from "@sbhms/ui";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role?: {
    name: string;
  };
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_h: number;
}

interface ServiceRequest {
  id: string;
  status: "pending" | "approved" | "in_progress" | "completed" | "cancelled";
  requested_at: string;
  tenant: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
  assigned_to: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  service: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    duration_h: number;
  };
  payments?: {
    id: string;
    status: string;
    type: string;
  }[];
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  Plumbing: <Droplets size={20} />,
  Electrical: <Zap size={20} />,
  Cleaning: <Sparkles size={20} />,
  Other: <HelpCircle size={20} />,
};

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "gold" as const, icon: <Clock size={12} /> },
  approved: { label: "Approved", color: "default" as const, icon: <Check size={12} /> },
  in_progress: { label: "In Progress", color: "default" as const, icon: <Loader2 className="animate-spin" size={12} /> },
  completed: { label: "Completed", color: "success" as const, icon: <CheckCircle2 size={12} /> },
  cancelled: { label: "Cancelled", color: "danger" as const, icon: <X size={12} /> },
};

export default function ServicesPage() {
  const { language, t } = useTranslation();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"services" | "requests">("requests");
  const [services, setServices] = useState<Service[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [queueTab, setQueueTab] = useState<"pending" | "active" | "closed">("pending");

  // Catalog Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDuration, setFormDuration] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [servicesRes, requestsRes, usersRes] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/services/request"),
        fetch("/api/users"),
      ]);

      const servicesData = await servicesRes.json();
      const requestsData = await requestsRes.json();
      const usersData = await usersRes.json();

      if (Array.isArray(servicesData)) {
        setServices(servicesData);
      } else if (servicesData.success) {
        setServices(servicesData.data || []);
      }

      if (Array.isArray(requestsData)) {
        setRequests(requestsData);
      } else if (requestsData.success) {
        setRequests(requestsData.data || []);
      } else {
        setRequests(requestsData || []);
      }

      if (usersData.success && Array.isArray(usersData.data)) {
        const staffUsers = usersData.data.filter(
          (u: Profile) => u.role?.name === "admin" || u.role?.name === "employee"
        );
        setStaff(staffUsers);
      }
    } catch (error) {
      console.error("Error fetching services data:", error);
      toast.error(t("services.toast_load_failed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateService = async () => {
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDesc || null,
          price: parseFloat(formPrice) || 0,
          duration_h: parseInt(formDuration) || 1,
        }),
      });

      if (res.ok) {
        setIsAddOpen(false);
        setFormName("");
        setFormDesc("");
        setFormPrice("");
        setFormDuration("");
        toast.success(t("services.toast_create_success"));
        fetchData();
      } else {
        const data = await res.json();
        toast.error(t("services.toast_create_failed") + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      toast.error(t("services.toast_create_error") + err.message);
    }
  };

  const handleUpdateService = async () => {
    if (!currentService) return;
    try {
      const res = await fetch(`/api/services/${currentService.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDesc || null,
          price: parseFloat(formPrice) || 0,
          duration_h: parseInt(formDuration) || 1,
        }),
      });

      if (res.ok) {
        setIsEditOpen(false);
        setCurrentService(null);
        setFormName("");
        setFormDesc("");
        setFormPrice("");
        setFormDuration("");
        toast.success(t("services.toast_update_success"));
        fetchData();
      } else {
        const data = await res.json();
        toast.error(t("services.toast_update_failed") + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      toast.error(t("services.toast_update_error") + err.message);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm(t("services.confirm_delete"))) return;
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(t("services.toast_delete_success"));
        fetchData();
      } else {
        const data = await res.json();
        toast.error(t("services.toast_delete_failed") + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      toast.error(t("services.toast_delete_error") + err.message);
    }
  };

  const handleUpdateRequest = async (id: string, updates: { status?: string; assigned_to?: string | null }) => {
    try {
      const res = await fetch(`/api/services/request/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        toast.success(t("services.toast_request_success"));
        fetchData();
      } else {
        const data = await res.json();
        toast.error(t("services.toast_request_failed") + (data.error || "Please check permission guidelines"));
      }
    } catch (err: any) {
      toast.error(t("services.toast_request_error") + err.message);
    }
  };

  const openEditModal = (service: Service) => {
    setCurrentService(service);
    setFormName(service.name);
    setFormDesc(service.description || "");
    setFormPrice(service.price.toString());
    setFormDuration(service.duration_h.toString());
    setIsEditOpen(true);
  };

  const getRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("services.time.just_now");
    if (mins < 60) return `${mins}${t("services.time.m_ago")}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}${t("services.time.h_ago")}`;
    const days = Math.floor(hrs / 24);
    return `${days}${t("services.time.d_ago")}`;
  };

  const getFilteredAndSorted = (list: ServiceRequest[], statuses: string[], sortAsc: boolean) => {
    return list
      .filter((req) => {
        if (!statuses.includes(req.status)) return false;
        
        const tenantName = `${req.tenant?.first_name || ""} ${req.tenant?.last_name || ""}`.toLowerCase();
        const serviceName = (req.service?.name || "").toLowerCase();
        const matchesSearch =
          tenantName.includes(searchTerm.toLowerCase()) ||
          serviceName.includes(searchTerm.toLowerCase()) ||
          (req.id || "").toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
      })
      .sort((a, b) => {
        const timeA = new Date(a.requested_at).getTime();
        const timeB = new Date(b.requested_at).getTime();
        return sortAsc ? timeA - timeB : timeB - timeA;
      });
  };

  const pendingRequests = getFilteredAndSorted(requests, ["pending"], true);
  const activeRequests = getFilteredAndSorted(requests, ["approved", "in_progress"], true);
  const closedRequests = getFilteredAndSorted(requests, ["completed", "cancelled"], false);

  const renderRequestCard = (req: ServiceRequest) => {
    const statusConf = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
    const isPaid = req.payments && req.payments.some((p: any) => p.type === "service" && p.status === "paid");
    const isUnpaidApproved = req.status === "approved" && !isPaid;
    const dateStr = new Date(req.requested_at).toLocaleDateString(language === "id" ? "id-ID" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div
        key={req.id}
        className="p-4 rounded-xl bg-[#EFE3D0] border border-[#C8A96E]/20 space-y-3 shadow-sm hover:shadow transition duration-200"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-[#2C1A0E] text-sm">
                {req.service?.name || "Other Service"}
              </h3>
              {req.status === "pending" && (
                <span className="text-[9px] font-semibold bg-[#DFC9A8] text-[#553D2B] px-1.5 py-0.5 rounded-full select-none" title="Queue waiting duration">
                  {getRelativeTime(req.requested_at)}
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#8B6F5E] mt-0.5">{t("services.card.requested")} {dateStr}</p>
          </div>
          <KosanBadge variant={statusConf.color}>
            <span className="flex items-center gap-1 text-[10px]">
              {statusConf.icon}
              {t("services.status." + req.status)}
            </span>
          </KosanBadge>
        </div>

        {req.tenant && (
          <div className="p-2.5 rounded-xl bg-[#1A0E0A] border border-[#C8A96E]/15 text-xs space-y-1.5 text-[#DFC9A8]">
            <p className="font-semibold">
              {t("financial.tenant")}: {req.tenant.first_name} {req.tenant.last_name || ""}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-[#DFC9A8]/75">
              <Phone size={10} />
              <a href={`tel:${req.tenant.phone}`} className="hover:underline text-[#DFC9A8]">
                {req.tenant.phone || "No phone added"}
              </a>
            </div>
          </div>
        )}

        {/* Display Request Notes if present */}
        {(req as any).note && (
          <div className="text-[11px] text-[#DFC9A8]/85 bg-[#1A0E0A] p-2.5 rounded-xl border border-[#C8A96E]/15">
            <p className="font-semibold text-[#DFC9A8]">{t("services.card.tenant_note")}</p>
            <p className="mt-1">{(req as any).note}</p>
          </div>
        )}

        {/* Assignee & Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2 border-t border-[#C8A96E]/15">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 text-[11px] text-[#8B6F5E]">
              <User size={12} />
              <span>{t("services.card.worker")}</span>
            </div>
            {req.status === "approved" ? (
              <select
                value={req.assigned_to?.id || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  handleUpdateRequest(req.id, { assigned_to: val === "" ? null : val });
                }}
                className="bg-[#DFC9A8] border border-[#C8A96E]/30 rounded-lg px-1.5 py-0.5 text-[11px] text-[#2C1A0E] focus:outline-none cursor-pointer"
              >
                <option value="">{t("services.card.worker_unassigned")}</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.first_name} {member.last_name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[11px] font-medium text-[#8B6F5E] bg-[#DFC9A8]/30 border border-[#C8A96E]/15 rounded-lg px-2 py-0.5">
                {req.assigned_to
                  ? `${req.assigned_to.first_name} ${req.assigned_to.last_name || ""}`
                  : req.status === "pending"
                  ? t("services.card.worker_assigned_after")
                  : t("services.card.worker_unassigned")}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className={`flex ${isUnpaidApproved ? "flex-col gap-1.5" : "gap-2"}`}>
            {req.status === "pending" && (
              <>
                <KosanButton
                  variant="primary"
                  size="sm"
                  className="flex-1 text-xs py-1.5"
                  onClick={() => handleUpdateRequest(req.id, { status: "approved" })}
                >
                  {t("services.card.approve")}
                </KosanButton>
                <KosanButton
                  variant="secondary"
                  size="sm"
                  className="flex-1 text-xs py-1.5"
                  onClick={() => handleUpdateRequest(req.id, { status: "cancelled" })}
                >
                  {t("services.card.reject")}
                </KosanButton>
              </>
            )}
            {req.status === "approved" && (
              <>
                {isUnpaidApproved ? (
                  <div className="w-full text-[11px] text-amber-200 bg-[#2A1E08] p-2 rounded border border-amber-700/30 flex items-center gap-1.5 font-medium select-none">
                    <AlertCircle size={13} className="text-amber-400 shrink-0" />
                    <span>{t("services.card.unpaid_warning")}</span>
                  </div>
                ) : (
                  <KosanButton
                    variant="primary"
                    size="sm"
                    className="flex-1 text-xs py-1.5"
                    onClick={() => handleUpdateRequest(req.id, { status: "in_progress" })}
                  >
                    {t("services.card.start_work")}
                  </KosanButton>
                )}
                <KosanButton
                  variant="secondary"
                  size="sm"
                  className={`${isUnpaidApproved ? "w-full" : "flex-1"} text-xs py-1.5`}
                  onClick={() => handleUpdateRequest(req.id, { status: "cancelled" })}
                >
                  {t("services.card.cancel")}
                </KosanButton>
              </>
            )}
            {req.status === "in_progress" && (
              <>
                <KosanButton
                  variant="gold"
                  size="sm"
                  className="flex-1 text-xs py-1.5"
                  onClick={() => handleUpdateRequest(req.id, { status: "completed" })}
                >
                  {t("services.card.complete")}
                </KosanButton>
                <KosanButton
                  variant="secondary"
                  size="sm"
                  className="flex-1 text-xs py-1.5"
                  onClick={() => handleUpdateRequest(req.id, { status: "cancelled" })}
                >
                  {t("services.card.cancel")}
                </KosanButton>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner message={t("services.loading")} />;
  }

  return (
    <div className="min-h-screen bg-[#1A0E0A] py-6 text-[#F5E6D3]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#F5E6D3]">{t("services.title")}</h1>
        <p className="text-sm text-[#DFC9A8] mt-1">{t("services.subtitle")}</p>
      </div>

      <div className="flex border-b border-[#C8A96E]/20 mb-6 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === "requests"
              ? "border-[#553D2B] text-[#553D2B]"
              : "border-transparent text-[#8B6F5E] hover:text-[#553D2B]"
          }`}
        >
          {t("services.tab.requests")}
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === "services"
              ? "border-[#553D2B] text-[#553D2B]"
              : "border-transparent text-[#8B6F5E] hover:text-[#553D2B]"
          }`}
        >
          {t("services.tab.services")}
        </button>
      </div>

      {activeTab === "requests" && (
        <div className="flex flex-col">
          {/* Search bar at the top */}
          <div className="mb-4">
            <KosanSearchBar
              placeholder={t("services.search_placeholder")}
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>

          {/* Mobile Lane Switcher */}
          <div className="flex lg:hidden bg-[#EFE3D0] p-1 rounded-xl mb-4 gap-1 border border-[#C8A96E]/20">
            <button
              onClick={() => setQueueTab("pending")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                queueTab === "pending"
                  ? "bg-[#553D2B] text-[#f5ede0]"
                  : "text-[#8B6F5E] hover:text-[#553D2B]"
              }`}
            >
              {t("services.lane.pending_label")} ({pendingRequests.length})
            </button>
            <button
              onClick={() => setQueueTab("active")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                queueTab === "active"
                  ? "bg-[#553D2B] text-[#f5ede0]"
                  : "text-[#8B6F5E] hover:text-[#553D2B]"
              }`}
            >
              {t("services.lane.active_label")} ({activeRequests.length})
            </button>
            <button
              onClick={() => setQueueTab("closed")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                queueTab === "closed"
                  ? "bg-[#553D2B] text-[#f5ede0]"
                  : "text-[#8B6F5E] hover:text-[#553D2B]"
              }`}
            >
              {t("services.lane.closed_label")} ({closedRequests.length})
            </button>
          </div>

          {/* 3-Column Kanban Board Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Lane 1: Pending */}
            <div className={`flex flex-col gap-4 ${queueTab === "pending" ? "block" : "hidden"} lg:block`}>
              <div className="p-3 bg-[#EFE3D0] rounded-xl border border-[#C8A96E]/20 flex items-center justify-between border-t-4 border-t-[#c8a96e] shadow-sm">
                <span className="font-bold text-[#2C1A0E] text-sm">{t("services.lane.pending")}</span>
                <KosanBadge variant="gold">{pendingRequests.length}</KosanBadge>
              </div>
              <div className="space-y-4">
                {pendingRequests.length === 0 ? (
                  <p className="text-xs text-[#8B6F5E] text-center py-8 bg-white/5 rounded-xl border border-dashed border-[#C8A96E]/20">
                    {t("services.empty.pending")}
                  </p>
                ) : (
                  pendingRequests.map((req) => renderRequestCard(req))
                )}
              </div>
            </div>

            {/* Lane 2: Active */}
            <div className={`flex flex-col gap-4 ${queueTab === "active" ? "block" : "hidden"} lg:block`}>
              <div className="p-3 bg-[#EFE3D0] rounded-xl border border-[#C8A96E]/20 flex items-center justify-between border-t-4 border-t-[#553D2B] shadow-sm">
                <span className="font-bold text-[#2C1A0E] text-sm">{t("services.lane.active")}</span>
                <KosanBadge variant="default">{activeRequests.length}</KosanBadge>
              </div>
              <div className="space-y-4">
                {activeRequests.length === 0 ? (
                  <p className="text-xs text-[#8B6F5E] text-center py-8 bg-white/5 rounded-xl border border-dashed border-[#C8A96E]/20">
                    {t("services.empty.active")}
                  </p>
                ) : (
                  activeRequests.map((req) => renderRequestCard(req))
                )}
              </div>
            </div>

            {/* Lane 3: Closed */}
            <div className={`flex flex-col gap-4 ${queueTab === "closed" ? "block" : "hidden"} lg:block`}>
              <div className="p-3 bg-[#EFE3D0] rounded-xl border border-[#C8A96E]/20 flex items-center justify-between border-t-4 border-t-[#8B6F5E]/40 shadow-sm">
                <span className="font-bold text-[#2C1A0E] text-sm">{t("services.lane.closed")}</span>
                <KosanBadge variant="success">{closedRequests.length}</KosanBadge>
              </div>
              <div className="space-y-4">
                {closedRequests.length === 0 ? (
                  <p className="text-xs text-[#8B6F5E] text-center py-8 bg-white/5 rounded-xl border border-dashed border-[#C8A96E]/20">
                    {t("services.empty.closed")}
                  </p>
                ) : (
                  closedRequests.map((req) => renderRequestCard(req))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "services" && (
        <div>
          <KosanCard className="flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-[#2C1A0E]">{t("services.tab.services")}</h2>
              <KosanButton
                variant="primary"
                size="sm"
                leftIcon={<Plus size={14} />}
                className="w-full sm:w-auto"
                onClick={() => {
                  setFormName("");
                  setFormDesc("");
                  setFormPrice("");
                  setFormDuration("");
                  setIsAddOpen(true);
                }}
              >
                {t("services.add_service")}
              </KosanButton>
            </div>

            <div className="space-y-4">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className="p-3.5 rounded-xl bg-[#EFE3D0] border border-[#C8A96E]/20 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-[#2C1A0E]">
                        <span>{svc.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-[#8B6F5E]">
                        {svc.duration_h > 0 ? `~${svc.duration_h} ${t("services.modal.duration").toLowerCase().includes("jam") ? "Jam" : "hrs"}` : t("services.flexible")}
                      </span>
                    </div>
                    {svc.description && (
                      <p className="text-xs text-[#8B6F5E] mt-1.5 line-clamp-2">
                        {svc.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#C8A96E]/10">
                    <span className="text-sm font-bold text-[#553D2B]">
                      {svc.price === 0 ? t("services.flexible_quote") : `Rp ${svc.price.toLocaleString("id-ID")}`}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(svc)}
                        className="p-1.5 rounded hover:bg-[#DFC9A8]/50 text-[#8B6F5E] hover:text-[#553D2B]"
                        title={t("services.tooltip.edit")}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteService(svc.id)}
                        className="p-1.5 rounded hover:bg-red-100 text-red-500 hover:text-red-700"
                        title={t("services.tooltip.delete")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </KosanCard>
        </div>
      )}

      {/* Add Catalog Service Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#EFE3D0] rounded-2xl p-6 w-full max-w-md border border-[#C8A96E]/30 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[#2C1A0E] mb-4">{t("services.modal.title_add")}</h2>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              <KosanInput
                label={t("services.modal.name")}
                placeholder="e.g., Plumbing"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />

              <KosanInput
                label={t("services.modal.description")}
                placeholder={t("services.modal.description_placeholder")}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />

              <KosanInput
                label={t("services.modal.price")}
                placeholder="e.g., 75000"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                leftIcon={<span className="text-[#8B6F5E]">Rp</span>}
                required
              />

              <KosanInput
                label={t("services.modal.duration")}
                placeholder="e.g., 2"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-3 mt-6">
              <KosanButton variant="secondary" fullWidth onClick={() => setIsAddOpen(false)}>
                {t("services.modal.cancel")}
              </KosanButton>
              <KosanButton variant="primary" fullWidth onClick={handleCreateService}>
                {t("services.modal.save")}
              </KosanButton>
            </div>
          </div>
        </div>
      )}

      {/* Edit Catalog Service Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#EFE3D0] rounded-2xl p-6 w-full max-w-md border border-[#C8A96E]/30 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[#2C1A0E] mb-4">{t("services.modal.title_edit")}</h2>

            <div className="space-y-4">
              <KosanInput
                label={t("services.modal.name")}
                placeholder="e.g., Plumbing"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />

              <KosanInput
                label={t("services.modal.description")}
                placeholder={t("services.modal.description_placeholder")}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />

              <KosanInput
                label={t("services.modal.price")}
                placeholder="e.g., 75000"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                leftIcon={<span className="text-[#8B6F5E]">Rp</span>}
                required
              />

              <KosanInput
                label={t("services.modal.duration")}
                placeholder="e.g., 2"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-3 mt-6">
              <KosanButton variant="secondary" fullWidth onClick={() => setIsEditOpen(false)}>
                {t("services.modal.cancel")}
              </KosanButton>
              <KosanButton variant="primary" fullWidth onClick={handleUpdateService}>
                {t("services.modal.update")}
              </KosanButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
