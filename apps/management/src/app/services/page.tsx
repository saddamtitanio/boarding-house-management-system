"use client";

import { useEffect, useState } from "react";
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
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"services" | "requests">("requests");
  const [services, setServices] = useState<Service[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
      toast.error("Failed to load services data.");
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
        toast.success("Service created successfully.");
        fetchData();
      } else {
        const data = await res.json();
        toast.error("Failed to create service: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      toast.error("Error creating service: " + err.message);
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
        toast.success("Service updated successfully.");
        fetchData();
      } else {
        const data = await res.json();
        toast.error("Failed to update service: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      toast.error("Error updating service: " + err.message);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Service deleted successfully.");
        fetchData();
      } else {
        const data = await res.json();
        toast.error("Failed to delete service: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      toast.error("Error deleting service: " + err.message);
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
        toast.success("Request updated successfully.");
        fetchData();
      } else {
        const data = await res.json();
        toast.error("Action failed: " + (data.error || "Please check permission guidelines"));
      }
    } catch (err: any) {
      toast.error("Error updating request: " + err.message);
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

  const filteredRequests = requests.filter((req) => {
    const tenantName = `${req.tenant?.first_name || ""} ${req.tenant?.last_name || ""}`.toLowerCase();
    const serviceName = (req.service?.name || "").toLowerCase();
    const matchesSearch =
      tenantName.includes(searchTerm.toLowerCase()) ||
      serviceName.includes(searchTerm.toLowerCase()) ||
      (req.id || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner message="Loading service management…" />;
  }

  return (
    <div className="min-h-screen bg-[#F5E6D3] p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#2C1A0E]">Services Management</h1>
        <p className="text-sm text-[#8B6F5E] mt-1">Review tenant requests, assign staff, and manage catalog</p>
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
          Active Request Queue
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === "services"
              ? "border-[#553D2B] text-[#553D2B]"
              : "border-transparent text-[#8B6F5E] hover:text-[#553D2B]"
          }`}
        >
          Service Catalog
        </button>
      </div>

      {activeTab === "requests" && (
        <div className="grid grid-cols-1 gap-6 items-stretch">
        {/* Requests Queue Section */}
        <div>
          <KosanCard className="flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold text-[#2C1A0E]">Active Request Queue</h2>
              <div className="w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-3 py-2 text-sm text-[#2C1A0E] focus:outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <KosanSearchBar
                placeholder="Search requests by tenant or service name..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>

            <div className="space-y-4">
              {filteredRequests.length === 0 ? (
                <p className="text-sm text-[#8B6F5E] text-center py-6">
                  No service requests match the filter criteria.
                </p>
              ) : (
                filteredRequests.map((req) => {
                  const statusConf = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                  const dateStr = new Date(req.requested_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl bg-[#EFE3D0] border border-[#C8A96E]/20 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="p-1 rounded bg-[#DFC9A8] text-[#553D2B]">
                              {SERVICE_ICONS[req.service?.name] || <Wrench size={16} />}
                            </span>
                            <h3 className="font-bold text-[#2C1A0E] text-base">
                              {req.service?.name || "Other Service"}
                            </h3>
                          </div>
                          <p className="text-xs text-[#8B6F5E] mt-1">Requested {dateStr}</p>
                        </div>
                        <KosanBadge variant={statusConf.color}>
                          <span className="flex items-center gap-1">
                            {statusConf.icon}
                            {statusConf.label}
                          </span>
                        </KosanBadge>
                      </div>

                      {req.tenant && (
                        <div className="p-2.5 rounded-lg bg-[#F5E6D3]/40 text-sm space-y-1 text-[#2C1A0E]">
                          <p className="font-semibold">
                            Tenant: {req.tenant.first_name} {req.tenant.last_name || ""}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[#8B6F5E]">
                            <Phone size={12} />
                            <span>{req.tenant.phone || "No phone added"}</span>
                          </div>
                        </div>
                      )}

                      {/* Display Request Notes if present */}
                      {req.id && (
                        <div className="text-xs text-[#8B6F5E] bg-[#F5E6D3]/20 p-2 rounded">
                          <p className="font-semibold text-[#553D2B]">Tenant Note:</p>
                          <p className="mt-0.5">{(req as any).note || "No notes provided"}</p>
                        </div>
                      )}

                      {/* Assignee Section */}
                      <div className="flex flex-col gap-3 pt-2 border-t border-[#C8A96E]/15">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <User size={14} className="text-[#8B6F5E]" />
                          <span className="text-xs text-[#8B6F5E]">Assigned worker:</span>
                          {req.status === "approved" ? (
                            <select
                              value={req.assigned_to?.id || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateRequest(req.id, { assigned_to: val === "" ? null : val });
                              }}
                              className="w-full sm:w-auto bg-[#DFC9A8] border border-[#C8A96E]/30 rounded-lg px-2 py-1 text-xs text-[#2C1A0E] focus:outline-none cursor-pointer"
                            >
                              <option value="">Unassigned</option>
                              {staff.map((member) => (
                                <option key={member.id} value={member.id}>
                                  {member.first_name} {member.last_name} ({member.role?.name})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs font-medium text-[#8B6F5E] bg-[#DFC9A8]/40 border border-[#C8A96E]/20 rounded-lg px-2 py-1">
                              {req.assigned_to
                                ? `${req.assigned_to.first_name} ${req.assigned_to.last_name || ""}`
                                : "Assignment available after approval"}
                            </span>
                          )}
                        </div>

                        {/* Status Transition Action Buttons */}
                        <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
                          {req.status === "pending" && (
                            <>
                              <KosanButton
                                variant="primary"
                                size="sm"
                                className="w-full h-10"
                                onClick={() => handleUpdateRequest(req.id, { status: "approved" })}
                              >
                                Approve
                              </KosanButton>
                              <KosanButton
                                variant="secondary"
                                size="sm"
                                className="w-full"
                                onClick={() => handleUpdateRequest(req.id, { status: "cancelled" })}
                              >
                                Cancel
                              </KosanButton>
                            </>
                          )}
                          {req.status === "approved" && (
                            <>
                              <KosanButton
                                variant="primary"
                                size="sm"
                                className="w-full h-10"
                                onClick={() => handleUpdateRequest(req.id, { status: "in_progress" })}
                              >
                                Start Work
                              </KosanButton>
                              <KosanButton
                                variant="secondary"
                                size="sm"
                                className="w-full"
                                onClick={() => handleUpdateRequest(req.id, { status: "cancelled" })}
                              >
                                Cancel
                              </KosanButton>
                            </>
                          )}
                          {req.status === "in_progress" && (
                            <>
                              <KosanButton
                                variant="gold"
                                size="sm"
                                className="w-full h-10"
                                onClick={() => handleUpdateRequest(req.id, { status: "completed" })}
                              >
                                Complete
                              </KosanButton>
                              <KosanButton
                                variant="secondary"
                                size="sm"
                                className="w-full h-12"
                                onClick={() => handleUpdateRequest(req.id, { status: "cancelled" })}
                              >
                                Cancel
                              </KosanButton>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </KosanCard>
        </div>
        </div>
      )}

      {activeTab === "services" && (
        <div>
          <KosanCard className="flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-[#2C1A0E]">Service Catalog</h2>
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
                Add Service
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
                        {SERVICE_ICONS[svc.name] || <Wrench size={16} />}
                        <span>{svc.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-[#8B6F5E]">
                        {svc.duration_h > 0 ? `~${svc.duration_h} hrs` : "Flexible"}
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
                      {svc.price === 0 ? "Flexible Quote" : `Rp ${svc.price.toLocaleString("id-ID")}`}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(svc)}
                        className="p-1.5 rounded hover:bg-[#DFC9A8]/50 text-[#8B6F5E] hover:text-[#553D2B]"
                        title="Edit service details"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteService(svc.id)}
                        className="p-1.5 rounded hover:bg-red-100 text-red-500 hover:text-red-700"
                        title="Delete service"
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
            <h2 className="text-xl font-bold text-[#2C1A0E] mb-4">Add Catalog Service</h2>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              <KosanInput
                label="Service Name"
                placeholder="e.g., Plumbing"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />

              <KosanInput
                label="Description"
                placeholder="Describe scope of service work..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />

              <KosanInput
                label="Price (Rp)"
                placeholder="e.g., 75000"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                leftIcon={<span className="text-[#8B6F5E]">Rp</span>}
                required
              />

              <KosanInput
                label="Duration (Hours)"
                placeholder="e.g., 2"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-3 mt-6">
              <KosanButton variant="secondary" fullWidth onClick={() => setIsAddOpen(false)}>
                Cancel
              </KosanButton>
              <KosanButton variant="primary" fullWidth onClick={handleCreateService}>
                Save Service
              </KosanButton>
            </div>
          </div>
        </div>
      )}

      {/* Edit Catalog Service Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#EFE3D0] rounded-2xl p-6 w-full max-w-md border border-[#C8A96E]/30 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[#2C1A0E] mb-4">Edit Catalog Service</h2>

            <div className="space-y-4">
              <KosanInput
                label="Service Name"
                placeholder="e.g., Plumbing"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />

              <KosanInput
                label="Description"
                placeholder="Describe scope of service work..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />

              <KosanInput
                label="Price (Rp)"
                placeholder="e.g., 75000"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                leftIcon={<span className="text-[#8B6F5E]">Rp</span>}
                required
              />

              <KosanInput
                label="Duration (Hours)"
                placeholder="e.g., 2"
                value={formDuration}
                onChange={(e) => setFormDuration(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-3 mt-6">
              <KosanButton variant="secondary" fullWidth onClick={() => setIsEditOpen(false)}>
                Cancel
              </KosanButton>
              <KosanButton variant="primary" fullWidth onClick={handleUpdateService}>
                Update Details
              </KosanButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
