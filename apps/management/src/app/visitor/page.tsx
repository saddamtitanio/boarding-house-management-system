"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  Building,
  Phone,
  Clock,
  LogOut,
  Search,
  Calendar,
  Sparkles,
  Home,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import {
  KosanCard,
  KosanButton,
  KosanBadge,
  KosanSearchBar,
  useToast,
  LoadingSpinner
} from "@sbhms/ui";
import { useTranslation } from "@/src/contexts/LanguageContext";

interface TenantProfile {
  id: string;
  first_name: string;
  phone?: string;
}

interface RoomInfo {
  id: string;
  name: string;
}

interface VisitorLog {
  id: string;
  visitor_name: string;
  visitor_phone?: string;
  purpose?: string;
  check_in_at: string;
  check_out_at: string | null;
  tenant: TenantProfile | null;
  room: RoomInfo | null;
}

interface LeaseInfo {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  tenant: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface Room {
  id: string;
  name: string;
  status: string;
  floor: number;
  leases?: LeaseInfo[];
}

export default function VisitorManagementPage() {
  const toast = useToast();
  const { language, t } = useTranslation();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [selectedRoomId, setSelectedRoomId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [checkingOutId, setCheckingOutId] = useState("");
  const [showPastLeases, setShowPastLeases] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsRes, logsRes] = await Promise.all([
        fetch("/api/rooms"),
        fetch("/api/visitor/logs"),
      ]);

      const roomsData = await roomsRes.json();
      const logsData = await logsRes.json();

      if (roomsData.success) {
        setRooms(roomsData.data || []);
      }
      if (Array.isArray(logsData)) {
        setLogs(logsData);
      } else {
        setLogs(logsData?.data || []);
      }
    } catch (err: any) {
      console.error("Failed to load visitor data:", err);
      toast.error("Failed to load visitor records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleForceCheckout = async (visitId: string) => {
    try {
      setCheckingOutId(visitId);
      const res = await fetch("/api/visitor/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visit_id: visitId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Visitor checked out successfully.");
        fetchData();
      } else {
        toast.error("Failed to check out: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      toast.error("Error checking out: " + err.message);
    } finally {
      setCheckingOutId("");
    }
  };

  // Helper calculations
  const getVisitDuration = (checkInStr: string, checkOutStr?: string | null) => {
    const start = new Date(checkInStr).getTime();
    const end = checkOutStr ? new Date(checkOutStr).getTime() : Date.now();
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return language === "id" ? "Baru masuk" : "Just checked in";
    if (diffMins < 60) return `${diffMins}m`;
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return language === "id" ? `${hrs}j ${mins}m` : `${hrs}h ${mins}m`;
  };

  const isLogCheckedInToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  // Filter logs based on selection, search, date
  const filteredLogs = logs.filter((log) => {
    // Room Filter
    if (selectedRoomId !== "all" && log.room?.id !== selectedRoomId) {
      return false;
    }

    // Past Leases Filter
    const fullRoom = rooms.find((r) => r.id === log.room?.id);
    const activeLease = fullRoom?.leases?.find((l) => l.status === "active");
    const isCurrentLease = activeLease && activeLease.tenant?.id === log.tenant?.id;

    if (!showPastLeases && !isCurrentLease) {
      return false;
    }

    // Date Filter
    if (selectedDate) {
      const logDate = new Date(log.check_in_at).toISOString().split("T")[0];
      if (logDate !== selectedDate) return false;
    }

    // Search term
    if (searchTerm) {
      const visitorName = (log.visitor_name || "").toLowerCase();
      const visitorPhone = (log.visitor_phone || "").toLowerCase();
      const tenantName = (log.tenant?.first_name || "").toLowerCase();
      const roomName = (log.room?.name || "").toLowerCase();
      const term = searchTerm.toLowerCase();

      return (
        visitorName.includes(term) ||
        visitorPhone.includes(term) ||
        tenantName.includes(term) ||
        roomName.includes(term)
      );
    }

    return true;
  });

  // Calculate statistics
  const activeCount = logs.filter((l) => !l.check_out_at).length;
  const todayCount = logs.filter((l) => isLogCheckedInToday(l.check_in_at)).length;
  const totalCount = logs.length;

  if (loading) {
    return <LoadingSpinner message={language === "id" ? "Memuat catatan pengunjung..." : "Loading visitor logs dashboard..."} />;
  }

  return (
    <div className="min-h-screen bg-[#1A0E0A] pb-8 text-[#F5E6D3]">
      {/* Page Title */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F5E6D3]">{t("visitors.title")}</h1>
          <p className="text-sm text-[#DFC9A8] mt-1">
            {t("visitors.subtitle")}
          </p>
        </div>
      </div>

       {/* Analytics Metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KosanCard className="flex items-center gap-4 relative overflow-hidden shadow-sm border border-[#C8A96E]/20">
          <div className="p-3 bg-[#DFC9A8]/40 text-[#553D2B] rounded-xl">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-xs text-[#553D2B] font-semibold uppercase tracking-wider">{t("visitors.stat.inside")}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-[#2C1A0E]">{activeCount}</span>
              {activeCount > 0 && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c8a96e] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c8a96e]"></span>
                </span>
              )}
            </div>
          </div>
        </KosanCard>

        <KosanCard className="flex items-center gap-4 shadow-sm border border-[#C8A96E]/20">
          <div className="p-3 bg-[#553D2B]/10 text-[#553D2B] rounded-xl">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-xs text-[#553D2B] font-semibold uppercase tracking-wider">{t("visitors.stat.today")}</p>
            <p className="text-2xl font-bold text-[#2C1A0E] mt-1">{todayCount}</p>
          </div>
        </KosanCard>

        <KosanCard className="flex items-center gap-4 shadow-sm border border-[#C8A96E]/20">
          <div className="p-3 bg-[#553D2B]/10 text-[#553D2B] rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-[#553D2B] font-semibold uppercase tracking-wider">{t("visitors.stat.total")}</p>
            <p className="text-2xl font-bold text-[#2C1A0E] mt-1">{totalCount}</p>
          </div>
        </KosanCard>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Room Picker Selector */}
        <div className="w-full lg:w-72 shrink-0">
           {/* Mobile dropdown selector */}
          <div className="lg:hidden w-full mb-4">
            <label className="text-xs font-semibold text-[#8B6F5E] mb-1 block">{language === "id" ? "Filter berdasarkan Kamar" : "Filter by Room"}</label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full bg-[#EFE3D0] border border-[#C8A96E]/25 rounded-xl px-4 py-2.5 text-sm text-[#2C1A0E] focus:outline-none cursor-pointer shadow-sm"
            >
              <option value="all">{language === "id" ? "Semua Kamar" : "All Rooms"}</option>
              {rooms.map((room) => {
                const activeLease = room.leases?.find((l) => l.status === "active");
                const label = `${room.name} (${room.status === "occupied" ? activeLease?.tenant?.first_name || "Occupied" : language === "id" ? "Kosong" : "Vacant"})`;
                return (
                  <option key={room.id} value={room.id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

           {/* Desktop panel picker */}
          <div className="hidden lg:flex flex-col bg-[#EFE3D0] border border-[#C8A96E]/20 rounded-2xl p-4 sticky top-24 max-h-[75vh] overflow-y-auto shadow-sm">
            <h3 className="font-bold text-[#2C1A0E] text-base mb-3 flex items-center gap-2 pb-2 border-b border-[#C8A96E]/10">
              {t("visitors.directory.title")}
            </h3>
            <div className="space-y-1.5 pr-1 overflow-y-auto">
              <button
                onClick={() => setSelectedRoomId("all")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                  selectedRoomId === "all"
                    ? "bg-[#553D2B] text-white"
                    : "text-[#8B6F5E] hover:bg-[#F5E6D3]/20 hover:text-[#553D2B]"
                }`}
              >
                <span>{t("visitors.directory.all")}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                  selectedRoomId === "all"
                    ? "bg-[#F5E6D3] text-[#553D2B]"
                    : "bg-[#DFC9A8]/40 text-[#553D2B]"
                }`}>
                  {logs.length}
                </span>
              </button>

               {rooms.map((room) => {
                const activeLease = room.leases?.find((l) => l.status === "active");
                const tenantName = activeLease?.tenant
                  ? `${activeLease.tenant.first_name} ${activeLease.tenant.last_name || ""}`.trim()
                  : "";
                const roomLogsCount = logs.filter((l) => l.room?.id === room.id).length;
                const isSelected = selectedRoomId === room.id;

                return (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex flex-col gap-1 cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-[#553D2B] text-white border-transparent shadow"
                        : "text-[#2C1A0E] bg-[#F5E6D3]/10 hover:bg-[#F5E6D3]/35 border-[#C8A96E]/10"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full font-bold">
                      <span className="flex items-center gap-1">
                        <Home size={12} className={isSelected ? "text-white" : "text-[#C8A96E]"} />
                        {room.name}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${
                        isSelected
                          ? room.status === "occupied"
                            ? "bg-[#c8a96e] text-[#2C1A0E] font-bold"
                            : "bg-[#DFC9A8] text-[#553D2B] font-bold"
                          : room.status === "occupied"
                          ? "bg-[#553D2B]/10 text-[#553D2B] font-bold"
                          : "bg-[#DFC9A8]/30 text-[#553D2B]"
                      }`}>
                        {t("rooms.filter." + room.status)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between w-full text-[10px] text-inherit opacity-75">
                      <span className="truncate max-w-[120px]">
                        {room.status === "occupied" ? `${t("rooms.card.tenant")}: ${tenantName}` : language === "id" ? "Kamar Kosong" : "Vacant Room"}
                      </span>
                      <span>{roomLogsCount} {t("visitors.directory.visits")}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Visitors List Area */}
        <div className="flex-1 space-y-4">
           {/* Search and Filters Bar */}
          <div className="bg-[#EFE3D0] border border-[#C8A96E]/20 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center shadow-sm">
            <div className="w-full sm:flex-1">
              <KosanSearchBar
                placeholder={t("visitors.search")}
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>
            
            <div className="w-full sm:w-auto flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-[#553D2B]">
                <input
                  type="checkbox"
                  checked={showPastLeases}
                  onChange={(e) => setShowPastLeases(e.target.checked)}
                  className="rounded border-[#C8A96E]/40 text-[#553D2B] focus:ring-[#553D2B]/20 w-4 h-4 cursor-pointer accent-[#553D2B]"
                />
                <span>{t("visitors.past_toggle")}</span>
              </label>

              <div className="flex items-center gap-2 bg-[#DFC9A8]/30 border border-[#C8A96E]/30 rounded-xl px-3 py-1.5 justify-between">
                <Calendar size={14} className="text-[#8B6F5E] shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs text-[#2C1A0E] focus:outline-none cursor-pointer w-full text-right sm:text-left"
                />
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate("")}
                    className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer ml-1"
                  >
                    {language === "id" ? "Bersihkan" : "Clear"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Visitor Timeline / List */}
          <div className="space-y-4">
            {filteredLogs.length === 0 ? (
              <KosanCard className="py-12 flex flex-col items-center justify-center text-center border border-[#C8A96E]/20 shadow-sm">
                <AlertCircle size={36} className="text-[#8B6F5E]/60 mb-2" />
                <h4 className="font-bold text-[#2C1A0E] text-base">{t("visitors.empty")}</h4>
                <p className="text-xs text-[#8B6F5E] max-w-sm mt-1">
                  {t("visitors.empty_desc")}
                </p>
              </KosanCard>
            ) : (
              filteredLogs.map((log) => {
                const isActive = !log.check_out_at;
                const formatTime = (dStr: string) => {
                  return new Date(dStr).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                };
                const formatDate = (dStr: string) => {
                  return new Date(dStr).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });
                };

                const fullRoom = rooms.find((r) => r.id === log.room?.id);
                const activeLease = fullRoom?.leases?.find((l) => l.status === "active");
                const isCurrentLease = activeLease && activeLease.tenant?.id === log.tenant?.id;

                return (
                  <div
                    key={log.id}
                    className={`p-4 rounded-2xl border transition duration-200 shadow-sm hover:shadow-md relative flex flex-col gap-3.5 ${
                      isActive
                        ? "border-[#C8A96E]/50 bg-[#DFC9A8]/35"
                        : "border-[#C8A96E]/20 bg-[#EFE3D0]"
                    }`}
                  >
                    {/* Top Row: Visitor Info & Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-[#2C1A0E] text-sm sm:text-base">
                          {log.visitor_name}
                        </h4>
                        {log.visitor_phone && (
                          <a
                            href={`tel:${log.visitor_phone}`}
                            className="text-[10px] text-[#8B6F5E] hover:text-[#553D2B] flex items-center gap-1 bg-[#DFC9A8]/20 hover:bg-[#DFC9A8]/45 px-2 py-0.5 rounded-lg border border-[#C8A96E]/15 transition"
                          >
                            <Phone size={10} />
                            {log.visitor_phone}
                          </a>
                        )}
                      </div>

                       {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="text-[10px] font-bold bg-[#DFC9A8]/40 text-[#553D2B] px-2 py-0.5 rounded-md border border-[#C8A96E]/15">
                          {log.room?.name || "N/A"}
                        </span>
                        {isActive ? (
                          <span className="bg-[#c8a96e] text-[#2C1A0E] text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1.5 select-none animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#2C1A0E]"></span>
                            {language === "id" ? "Di Dalam Gedung" : "In Building"}
                          </span>
                        ) : (
                          <span className="bg-gray-400/20 text-gray-500 text-[9px] font-bold px-2 py-0.5 rounded-md">
                            {language === "id" ? "Telah Keluar" : "Checked Out"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Section: Details Panel */}
                    <div className="p-3 rounded-xl bg-[#1A0E0A] border border-[#C8A96E]/15 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#DFC9A8]">
                      <div className="flex items-start gap-2">
                        <Home size={13} className="text-[#C8A96E] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-[#DFC9A8]/70 font-semibold uppercase tracking-wider">{t("visitors.card.tenant")}</p>
                          <p className="mt-0.5 font-bold flex items-center gap-1.5 flex-wrap">
                            <span>{log.tenant?.first_name || "Unknown Tenant"}</span>
                            {!isCurrentLease && (
                              <span className="text-[9px] bg-[#C0444A]/10 text-[#C0444A] border border-[#C0444A]/20 px-1.5 py-0.5 rounded font-semibold select-none">
                                {language === "id" ? "Sewa Berakhir" : "Expired Lease"}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Clock size={13} className="text-[#C8A96E] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-[#DFC9A8]/70 font-semibold uppercase tracking-wider">{t("visitors.card.time")}</p>
                          <p className="mt-0.5 font-semibold">
                            {formatDate(log.check_in_at)} at {formatTime(log.check_in_at)}
                            {log.check_out_at && ` - ${formatTime(log.check_out_at)}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <HelpCircle size={13} className="text-[#C8A96E] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-[#DFC9A8]/70 font-semibold uppercase tracking-wider">{t("visitors.card.purpose")}</p>
                          <p className="mt-0.5 italic text-[#DFC9A8]/85">{log.purpose || (language === "id" ? "Kunjungan Umum" : "Generic Visit")}</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Stay Duration & Action */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#C8A96E]/10">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#8B6F5E] uppercase font-semibold">{language === "id" ? "Durasi Kunjungan:" : "Stay Duration:"}</span>
                        <span className={`font-bold text-xs sm:text-sm ${isActive ? "text-[#E07B39]" : "text-[#2C1A0E]"}`}>
                          {isActive ? (language === "id" ? "⏳ Aktif: " : "⏳ Active: ") : ""}
                          {getVisitDuration(log.check_in_at, log.check_out_at)}
                        </span>
                      </div>

                      {isActive && (
                        <KosanButton
                          variant="gold"
                          size="sm"
                          className="bg-[#c8a96e] hover:bg-[#b89355] text-[#3d2b1f] font-bold py-1 px-3.5 text-xs rounded-lg shadow-sm transition"
                          disabled={checkingOutId === log.id}
                          onClick={() => handleForceCheckout(log.id)}
                        >
                          {checkingOutId === log.id ? t("visitors.card.signingout") : t("visitors.card.signout")}
                        </KosanButton>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
