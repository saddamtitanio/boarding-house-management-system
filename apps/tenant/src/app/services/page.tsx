"use client";

import { useState, useEffect } from "react";
import {
  Wrench, Zap, Droplets, Sparkles, HelpCircle,
  Clock, ChevronRight, CheckCircle2, X, Loader2,
} from "lucide-react";
import type { Service, ServiceRequest, ServiceRequestStatus } from "@/src/types/services";
import "./services.css";

//current tenant 
const CURRENT_TENANT_ID = "tenant-001";

// mock services 
const MOCK_SERVICES: Service[] = [
  { id: "svc-001", name: "Plumbing",     description: "Pipe leaks, drain blockages, faucet repairs and water pressure issues.", price: 75000,  duration_h: 2 },
  { id: "svc-002", name: "Electrical",   description: "Wiring, socket repairs, circuit breaker issues and light fixtures.",       price: 90000,  duration_h: 2 },
  { id: "svc-003", name: "Cleaning",     description: "Deep cleaning of your room including bathroom and common areas.",          price: 50000,  duration_h: 3 },
  { id: "svc-004", name: "Other",        description: "Have a specific need? Describe it and we'll get back to you.",             price: 0,      duration_h: 0 },
];

//  mock requests  
const MOCK_REQUESTS: ServiceRequest[] = [
  { id: "req-001", tenant_id: CURRENT_TENANT_ID, service_id: "svc-001", status: "completed",   requested_at: "2026-03-10T09:00:00Z", assigned_to: "staff-001", updated_at: "2026-03-11T14:00:00Z" },
  { id: "req-002", tenant_id: CURRENT_TENANT_ID, service_id: "svc-003", status: "in_progress", requested_at: "2026-04-20T11:30:00Z", assigned_to: "staff-002", updated_at: "2026-04-20T13:00:00Z" },
  { id: "req-003", tenant_id: CURRENT_TENANT_ID, service_id: "svc-002", status: "pending",     requested_at: "2026-05-08T08:15:00Z", assigned_to: null,         updated_at: "2026-05-08T08:15:00Z", note: "Socket in bedroom sparks when I plug in my charger." },
];

// helpers 
const SERVICE_ICONS: Record<string, React.ReactNode> = {
  "svc-001": <Droplets size={20} />,
  "svc-002": <Zap size={20} />,
  "svc-003": <Sparkles size={20} />,
  "svc-004": <HelpCircle size={20} />,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function formatPrice(price: number) {
  if (price === 0) return "Quote on request";
  return `Rp ${price.toLocaleString("id-ID")}`;
}

const STATUS_CONFIG: Record<ServiceRequestStatus, { label: string; className: string; icon: React.ReactNode }> = {
  pending:     { label: "Pending",     className: "badge-pending",     icon: <Clock size={11} /> },
  in_progress: { label: "In Progress", className: "badge-in_progress", icon: <Loader2 size={11} /> },
  completed:   { label: "Completed",   className: "badge-completed",   icon: <CheckCircle2 size={11} /> },
};

const StatusBadge = ({ status }: { status: ServiceRequestStatus }) => {
  const { label, className, icon } = STATUS_CONFIG[status];
  return <span className={`badge ${className}`}>{icon}{label}</span>;
};

// main
export default function ServicesPage() {
  const [services]                  = useState<Service[]>(MOCK_SERVICES);
  const [requests, setRequests]     = useState<ServiceRequest[]>(MOCK_REQUESTS);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [note, setNote]             = useState("");
  const [showToast, setShowToast]   = useState(false);

  // auto-hide toast
  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(t);
  }, [showToast]);

  const handleOpenModal = (service: Service) => {
    setSelectedService(service);
    setNote("");
  };

  const handleCloseModal = () => {
    setSelectedService(null);
    setNote("");
  };

  const handleSubmit = () => {
    if (!selectedService) return;
    if (selectedService.name === "Other" && !note.trim()) return;

    // TODO: POST /api/service-requests { service_id, note? }
    const newRequest: ServiceRequest = {
      id: `req-${Date.now()}`,
      tenant_id: CURRENT_TENANT_ID,
      service_id: selectedService.id,
      status: "pending",
      requested_at: new Date().toISOString(),
      assigned_to: null,
      updated_at: new Date().toISOString(),
      note: note.trim() || undefined,
    };

    setRequests(prev => [newRequest, ...prev]);
    handleCloseModal();
    setShowToast(true);
  };

  const isOther = selectedService?.name === "Other";
  const canSubmit = selectedService && (!isOther || note.trim().length > 0);

  return (
    <div className="services-page">

      {/* ── Header ── */}
      <div className="page-title-row">
        <h1 className="page-title">Services</h1>
      </div>

      {/* ── Service catalogue ── */}
      <section className="card-section">
        <p className="section-label">Available Services</p>
        <div className="service-grid">
          {services.map(service => (
            <div
              key={service.id}
              className={`service-card ${service.name === "Other" ? "other-card" : ""}`}
              onClick={() => handleOpenModal(service)}
            >
              <div className={`service-icon ${service.name === "Other" ? "other-icon" : ""}`}>
                {SERVICE_ICONS[service.id] ?? <Wrench size={20} />}
              </div>
              <p className="service-name">{service.name}</p>
              <p className="service-desc">{service.description}</p>
              <div className="service-meta">
                <span className="service-price">{formatPrice(service.price)}</span>
                {service.duration_h > 0 && (
                  <span className="service-duration">
                    <Clock size={11} /> ~{service.duration_h}h
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Request history ── */}
      <section className="card-section">
        <p className="section-label">My Requests</p>
        {requests.length === 0 ? (
          <p className="empty-state">You haven't made any service requests yet.</p>
        ) : (
          <div className="table-wrapper">
            <table className="req-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Service</th>
                  <th>Note</th>
                  <th>Requested</th>
                  <th>Last Update</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => {
                  const service = services.find(s => s.id === req.service_id);
                  return (
                    <tr key={req.id}>
                      <td className="td-id">{req.id.slice(0, 8)}</td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {SERVICE_ICONS[req.service_id] ?? <Wrench size={14} />}
                          {service?.name ?? "—"}
                        </span>
                      </td>
                      <td style={{ maxWidth: "200px", fontSize: "12px", color: "#a0886a" }}>
                        {req.note ?? "—"}
                      </td>
                      <td>{formatDate(req.requested_at)}</td>
                      <td>{formatDate(req.updated_at)}</td>
                      <td><StatusBadge status={req.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Request modal ── */}
      {selectedService && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>

            <div className="modal-header">
              <p className="modal-title">Request Service</p>
              <button className="modal-close" onClick={handleCloseModal}>
                <X size={18} />
              </button>
            </div>

            {/* service summary */}
            <div className="modal-service-summary">
              <div className={`modal-service-icon ${isOther ? "other-icon" : ""}`}
                   style={isOther ? { background: "#c8a96e", color: "#3d2b1f" } : {}}>
                {SERVICE_ICONS[selectedService.id] ?? <Wrench size={20} />}
              </div>
              <div>
                <p className="modal-service-name">{selectedService.name}</p>
                <p className="modal-service-meta">
                  {formatPrice(selectedService.price)}
                  {selectedService.duration_h > 0 && ` · ~${selectedService.duration_h}h`}
                </p>
              </div>
            </div>

            {/* note field — required for "Other", optional otherwise */}
            <p className="modal-label">
              {isOther ? "Describe your request *" : "Additional note (optional)"}
            </p>
            <textarea
              className="modal-textarea"
              placeholder={
                isOther
                  ? "Please describe what you need in detail..."
                  : "Any additional details for the team..."
              }
              value={note}
              onChange={e => setNote(e.target.value)}
              autoFocus={isOther}
            />

            <div className="modal-actions">
              <button className="btn-outline" onClick={handleCloseModal}>Cancel</button>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                Submit Request <ChevronRight size={15} />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {showToast && (
        <div className="toast">
          <CheckCircle2 size={18} /> Request submitted successfully!
        </div>
      )}

    </div>
  );
}
