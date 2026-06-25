"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Home as HomeIcon,
  DollarSign,
  Wrench,
  QrCode,
  Calendar,
  UserCheck,
} from "lucide-react";
import {
  KosanCard,
  KosanStatCard,
  KosanSectionHeader,
  KosanButton,
  KosanBadge,
  useToast,
} from "@sbhms/ui";
import { LoadingSpinner } from "@sbhms/ui";
import { useTranslation } from "@/src/contexts/LanguageContext";

interface Booking {
  id: string;
  start_date: string;
  end_date: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  decision_reason?: string;
  room: {
    id: string;
    name: string;
    floor: number;
    price: number;
    status: string;
  } | null;
}

interface ActiveLease {
  id: string;
  start_date: string;
  end_date: string;
  status: "active" | "ended" | "cancelled";
  room: {
    id: string;
    name: string;
    floor: number;
    price: number;
    status: string;
  } | null;
}

interface ServiceRequest {
  id: string;
  status: "pending" | "approved" | "in_progress" | "completed" | "cancelled";
  requested_at: string;
  service: { name: string; price: number };
}

interface VisitorLog {
  id: string;
  visitor_name: string;
  check_in_at: string;
  check_out_at: string | null;
}

interface DashboardData {
  active_lease: ActiveLease | null;
  active_booking: Booking | null;
  unpaid_payments_count: number;
  unpaid_payments_amount: number;
  service_requests: ServiceRequest[];
  visitor_logs: VisitorLog[];
  lease_expiry_warning: string | null;
}

interface Profile {
  first_name: string;
  last_name?: string;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewMonths, setRenewMonths] = useState("1");
  const [renewing, setRenewing] = useState(false);
  const toast = useToast();
  const { t } = useTranslation();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      const [profileRes, dashRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/dashboard"),
      ]);

      const [profileJson, dashJson] = await Promise.all([
        profileRes.json(),
        dashRes.json(),
      ]);

      if (profileJson.success) setProfile(profileJson.data);
      if (dashJson.success) setDashboardData(dashJson.data);
    } catch (err) {
      console.error("Failed to load tenant dashboard data", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRenewLease = async () => {
    const activeBooking = dashboardData?.active_booking;
    if (!activeBooking) return;
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
      await loadData();
    } catch (err) {
      console.error("Error during renewal:", err);
      toast.error("Something went wrong while renewing lease.");
    } finally {
      setRenewing(false);
    }
  };

  const formatPrice = (price: number) =>
    `Rp ${price.toLocaleString("id-ID")}`;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const getServiceStatusVariant = (
    status: ServiceRequest["status"]
  ): "default" | "success" | "danger" | "info" | "gold" | "orange" => {
    const map: Record<ServiceRequest["status"], "default" | "success" | "danger" | "info" | "gold" | "orange"> = {
      completed: "success",
      in_progress: "orange",
      pending: "gold",
      approved: "default",
      cancelled: "info",
    };
    return map[status] ?? "default";
  };

  const formatRoomName = (name?: string) =>
    !name ? "" : /room/i.test(name) ? name : `Room ${name}`;

  const getRemainingDays = (endDate: string) =>
    Math.ceil(
      (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

  if (loading) return <LoadingSpinner message={t("dashboard.loading")} />;

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5E6D3] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-sm text-[#8B6F5E]">{t("dashboard.error_msg")}</p>
          <KosanButton variant="secondary" size="sm" onClick={loadData}>
            {t("dashboard.try_again")}
          </KosanButton>
        </div>
      </div>
    );
  }

  const welcomeName = profile
    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
    : "Tenant";

  return (
    <div className="min-h-screen bg-[#F5E6D3] p-4 sm:p-6">

      {/* Welcome */}
      <div className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2C1A0E]">
          {t("dashboard.welcome")} {welcomeName}
        </h1>
        <p className="text-sm text-[#8B6F5E] mt-0.5">
          {t("dashboard.welcome_sub")}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {dashboardData?.active_lease?.room?.id ? (
          <Link href={`/room/${dashboardData.active_lease.room.id}`} className="block">
            <KosanStatCard
              label={t("dashboard.stat.active_room")}
              value={dashboardData?.active_lease?.room?.name ?? "None"}
              subtext={
                dashboardData?.active_lease
                  ? `${t("rooms.floor_num")} ${dashboardData.active_lease.room?.floor}`
                  : t("dashboard.stat.no_active_lease")
              }
              accent={dashboardData?.active_lease ? "success" : "default"}
              icon={<HomeIcon size={16} />}
            />
          </Link>
        ) : (
          <KosanStatCard
            label={t("dashboard.stat.active_room")}
            value="None"
            subtext={t("dashboard.stat.no_active_lease")}
            accent="default"
            icon={<HomeIcon size={16} />}
          />
        )}
        <Link href="/payments" className="block">
          <KosanStatCard
            label={t("dashboard.stat.unpaid_balance")}
            value={dashboardData ? formatPrice(dashboardData.unpaid_payments_amount) : "Rp 0"}
            subtext={`${dashboardData?.unpaid_payments_count ?? 0} ${t("dashboard.stat.unpaid_invoices")}`}
            accent={dashboardData && dashboardData.unpaid_payments_amount > 0 ? "danger" : "success"}
            icon={<DollarSign size={16} />}
          />
        </Link>
        <Link href="/services" className="block">
          <KosanStatCard
            label={t("dashboard.stat.active_services")}
            value={
              (dashboardData?.service_requests?.filter(
                (r) => r.status === "pending" || r.status === "in_progress"
              ).length ?? 0).toString()
            }
            subtext={t("dashboard.stat.requests_queue")}
            accent="default"
            icon={<Wrench size={16} />}
          />
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Current Lease */}
        <KosanCard className="h-full flex flex-col">
          <KosanSectionHeader title={t("dashboard.card.current_lease")} />

          {dashboardData?.active_lease ? (() => {
            const lease = dashboardData.active_lease;
            const days = getRemainingDays(lease.end_date);

            return (
              <div className="mt-3 rounded-xl bg-[#EFE3D0] border border-[#C8A96E]/20 p-4 flex-1 flex flex-col justify-between">

                {/* Room name + badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xl font-bold text-[#2C1A0E] leading-snug hover:text-[#C8A96E] hover:underline transition-colors">
                      {lease.room?.id ? (
                        <Link href={`/room/${lease.room.id}`}>
                          {formatRoomName(lease.room?.name)}
                        </Link>
                      ) : (
                        formatRoomName(lease.room?.name)
                      )}
                    </p>

                    <p className="text-xs text-[#8B6F5E] mt-0.5">
                      {t("rooms.floor_num")} {lease.room?.floor} ·{" "}
                      {formatPrice(lease.room?.price ?? 0)}/{t("dashboard.modal.mo")}
                    </p>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-green-600 text-white text-[11px] font-semibold tracking-wide">
                      {t("dashboard.card.active_badge")}
                    </span>

                    <span className="text-xs font-medium text-[#2C1A0E]">
                      {days} {t("dashboard.card.days_left")}
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-3 border-t border-[#C8A96E]/20" />

                {/* Dates row + button */}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-auto">

                  <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                    <span className="flex items-center gap-1.5 text-xs">
                      <Calendar size={12} className="text-[#C8A96E]" />
                      <span className="text-[#8B6F5E]">{t("dashboard.card.start")}</span>
                      <span className="font-semibold text-[#2C1A0E]">
                        {formatDate(lease.start_date)}
                      </span>
                    </span>

                    <span className="flex items-center gap-1.5 text-xs">
                      <Calendar size={12} className="text-[#C8A96E]" />
                      <span className="text-[#8B6F5E]">{t("dashboard.card.end")}</span>
                      <span className="font-semibold text-[#2C1A0E]">
                        {formatDate(lease.end_date)}
                      </span>
                    </span>
                  </div>

                  <KosanButton variant="secondary" size="sm" onClick={() => setShowRenewModal(true)}>
                    {t("dashboard.card.renew_lease")}
                  </KosanButton>

                </div>
              </div>
            );
          })() : (
            <div className="mt-3 py-8 text-center bg-[#EFE3D0]/30 rounded-xl border border-dashed border-[#C8A96E]/30 flex-1 flex flex-col justify-center items-center">
              <p className="text-sm text-[#8B6F5E] mb-3">
                {t("dashboard.card.no_active_lease")}
              </p>

              <a href="/room">
                <KosanButton variant="secondary" size="sm">
                  {t("dashboard.card.browse_rooms")}
                </KosanButton>
              </a>
            </div>
          )}
        </KosanCard>

        {/* Guest Check-In Tools */}
        <KosanCard className="h-full flex flex-col">
          <KosanSectionHeader title={t("dashboard.card.guest_tools")} />

          <p className="text-xs text-[#8B6F5E] mt-1 mb-3">
            {t("dashboard.card.guest_tools_desc")}
          </p>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#EFE3D0] border border-[#C8A96E]/20 mt-auto">
            <div className="p-2.5 bg-[#C8A96E]/10 rounded-lg text-[#C8A96E] shrink-0">
              <QrCode size={20} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#2C1A0E] text-sm">
                {t("dashboard.card.visitor_qr")}
              </p>

              <p className="text-xs text-[#8B6F5E]">
                {t("dashboard.card.visitor_qr_desc")}
              </p>
            </div>

            <a href="/visitor" className="shrink-0">
              <KosanButton variant="gold" size="sm">
                {t("dashboard.card.view_qr")}
              </KosanButton>
            </a>
          </div>
        </KosanCard>

        {/* Recent Visitors */}
        <KosanCard className="h-full flex flex-col">
          <KosanSectionHeader
            title={t("dashboard.card.recent_visitors")}
            action={
              <a href="/visitor">
                <KosanButton variant="ghost" size="sm">
                  {t("dashboard.card.view_all")}
                </KosanButton>
              </a>
            }
          />

          <div className="mt-2 space-y-2 flex-1 flex flex-col">
            {!dashboardData?.visitor_logs?.length ? (
              <div className="flex-1 flex items-center justify-center py-5">
                <p className="text-xs text-[#8B6F5E] text-center">
                  {t("dashboard.card.no_visitors")}
                </p>
              </div>
            ) : (
              dashboardData.visitor_logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-[#EFE3D0] border border-[#C8A96E]/20"
                >
                  <div className="flex items-center justify-between mb-0.5 gap-2">
                    <span className="font-semibold text-[#2C1A0E] text-xs truncate">
                      {log.visitor_name}
                    </span>

                    <span className="text-[11px] text-[#8B6F5E] flex items-center gap-1 shrink-0">
                      <UserCheck size={11} className="text-[#C8A96E]" />
                      {log.check_out_at ? t("dashboard.card.checked_out") : t("dashboard.card.inside")}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#8B6F5E] space-y-0.5">
                    <p>
                      {t("dashboard.card.in_time")} {new Date(log.check_in_at).toLocaleString("en-GB")}
                    </p>

                    {log.check_out_at && (
                      <p>
                        {t("dashboard.card.out_time")} {new Date(log.check_out_at).toLocaleString("en-GB")}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </KosanCard>

        {/* Service Requests */}
        <KosanCard className="h-full flex flex-col">
          <KosanSectionHeader
            title={t("dashboard.card.service_requests")}
            action={
              <a href="/services">
                <KosanButton variant="ghost" size="sm">
                  {t("dashboard.card.view_all")}
                </KosanButton>
              </a>
            }
          />

          <div className="mt-2 space-y-2 flex-1 flex flex-col">
            {!dashboardData?.service_requests?.length ? (
              <div className="flex-1 flex items-center justify-center py-5">
                <p className="text-xs text-[#8B6F5E] text-center">
                  {t("dashboard.card.no_services")}
                </p>
              </div>
            ) : (
              dashboardData.service_requests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#EFE3D0] border border-[#C8A96E]/20"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#2C1A0E] text-xs truncate">
                      {req.service?.name}
                    </p>

                    <p className="text-[11px] text-[#8B6F5E]">
                      {formatDate(req.requested_at)}
                    </p>
                  </div>

                  <KosanBadge variant={getServiceStatusVariant(req.status)}>
                    {req.status.replace(/_/g, ' ')}
                  </KosanBadge>
                </div>
              ))
            )}
          </div>
        </KosanCard>

      </div>

      {/* Renew Lease Modal */}
      {showRenewModal && dashboardData?.active_booking && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <KosanCard className="w-full max-w-sm p-6 flex flex-col gap-4">
            <h2 className="text-xl font-bold text-[#2C1A0E]">{t("dashboard.modal.renew_title")}</h2>
            <p className="text-sm text-[#8B6F5E]">
              {t("dashboard.modal.renew_desc")}{" "}
              <strong>{new Date(dashboardData.active_booking.end_date).toLocaleDateString("en-GB")}</strong>
              {t("dashboard.modal.renew_desc_suffix")}
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
                  {m} {t("dashboard.modal.mo")}
                </button>
              ))}
            </div>
            <div className="bg-[#EFE3D0] border border-[#C8A96E]/20 rounded-xl px-4 py-3 text-sm">
              <span className="text-[#8B6F5E] font-semibold">{t("dashboard.modal.new_end_date")} </span>
              <span className="font-bold text-[#2C1A0E]">
                {(() => {
                  const d = new Date(dashboardData.active_booking.end_date);
                  d.setMonth(d.getMonth() + Number(renewMonths));
                  return d.toLocaleDateString("en-GB");
                })()}
              </span>
            </div>
            <div className="flex gap-3">
              <KosanButton variant="secondary" fullWidth onClick={() => setShowRenewModal(false)}>
                {t("dashboard.modal.cancel")}
              </KosanButton>
              <KosanButton
                variant="primary"
                fullWidth
                loading={renewing}
                onClick={() => handleRenewLease()}
              >
                {t("dashboard.modal.renew_btn")}
              </KosanButton>
            </div>
          </KosanCard>
        </div>
      )}
    </div>
  );
}