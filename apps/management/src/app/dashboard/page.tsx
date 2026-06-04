"use client";

import { useEffect, useState } from "react";
import {
  Home,
  Users,
  DoorOpen,
  Brush,
  AlertTriangle,
  Clock,
  CalendarCheck,
  Wrench,
  LogIn,
  DollarSign,
  ChevronDown,
  ChevronUp,
  UserX,
} from "lucide-react";
import {
  KosanCard,
  KosanStatCard,
  KosanAlertCard,
  KosanSectionHeader,
  KosanButton,
  KosanRoomChip,
  LoadingSpinner,
} from "@sbhms/ui";

interface OverstayingTenant {
  tenant_name: string;
  room_name: string;
  end_date: string;
  days_overdue: number;
}

interface PendingServiceDetail {
  service_name: string;
  tenant_name: string;
  status: string;
}

interface OccupancyTrend {
  month: string;
  occupied: number;
  vacant: number;
}

interface DashboardStats {
  rooms: {
    vacant: number;
    occupied: number;
    cleaning: number;
  };
  total_rooms: number;
  pending_bookings: number;
  active_service_requests: number;
  active_visitors: number;
  overstaying_tenants: OverstayingTenant[];
  pending_service_details: PendingServiceDetail[];
  occupancy_trend: OccupancyTrend[];
}

interface Room {
  id: string;
  name: string;
  floor: number;
  status: "vacant" | "occupied" | "cleaning";
  price: number;
}

interface BookingRequest {
  id: string;
  room: {
    name: string;
  };
  tenant: {
    first_name: string;
    last_name: string;
  };
}

interface VisitorLog {
  id: string;
  check_in_at: string;
  check_out_at: string | null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({});

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard metrics, rooms, bookings, and visitor logs in parallel
      const [statsRes, roomsRes, bookingsRes, visitorsRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/rooms"),
        fetch("/api/bookings"),
        fetch("/api/visitor/logs")
      ]);

      const [statsData, roomsData, bookingsData, visitorsData] = await Promise.all([
        statsRes.json(),
        roomsRes.json(),
        bookingsRes.json(),
        visitorsRes.json()
      ]);

      if (statsData.success) setStats(statsData.data);
      if (roomsData.success) setRooms(roomsData.data || []);
      if (bookingsData.success) {
        // Filter only pending booking requests
        const pending = (bookingsData.data || []).filter(
          (b: any) => b.status === "pending"
        );
        setBookings(pending);
      }
      if (visitorsData && Array.isArray(visitorsData)) {
        setVisitorLogs(visitorsData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Format rooms grouped by floor
  const floorsMap: { [key: number]: Room[] } = {};
  rooms.forEach((room) => {
    if (!floorsMap[room.floor]) {
      floorsMap[room.floor] = [];
    }
    floorsMap[room.floor].push(room);
  });

  const sortedFloors = Object.keys(floorsMap)
    .map(Number)
    .sort((a, b) => a - b);

  // Compute visitor metrics
  const todayStr = new Date().toISOString().split("T")[0];
  const currentlyInside = visitorLogs.filter((log) => !log.check_out_at).length;
  const checkinsToday = visitorLogs.filter(
    (log) => log.check_in_at && log.check_in_at.startsWith(todayStr)
  ).length;
  const checkoutsToday = visitorLogs.filter(
    (log) => log.check_out_at && log.check_out_at.startsWith(todayStr)
  ).length;

  const overstaying = visitorLogs.filter((log) => {
    if (log.check_out_at) return false;
    const checkInTime = new Date(log.check_in_at).getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return Date.now() - checkInTime > oneDayMs;
  }).length;

  const STATISTICS = [
    {
      label: "Total Rooms",
      value: stats?.total_rooms.toString() ?? "0",
      subtext: "All units",
      accent: "default" as const,
      icon: <Home size={18} />,
    },
    {
      label: "Occupied",
      value: stats?.rooms.occupied.toString() ?? "0",
      subtext: stats
        ? `${((stats.rooms.occupied / (stats.total_rooms || 1)) * 100).toFixed(
            1
          )}% Occupancy`
        : "0% Occupancy",
      accent: "danger" as const,
      icon: <Users size={18} />,
    },
    {
      label: "Vacant",
      value: stats?.rooms.vacant.toString() ?? "0",
      subtext: stats
        ? `${((stats.rooms.vacant / (stats.total_rooms || 1)) * 100).toFixed(
            1
          )}% Vacancy`
        : "0% Vacancy",
      accent: "success" as const,
      icon: <DoorOpen size={18} />,
    },
    {
      label: "Cleaning",
      value: stats?.rooms.cleaning.toString() ?? "0",
      subtext: stats
        ? `${((stats.rooms.cleaning / (stats.total_rooms || 1)) * 100).toFixed(
            1
          )}% Cleaning`
        : "0% Cleaning",
      accent: "gold" as const,
      icon: <Brush size={18} />,
    },
  ];

  const ALERTS = [
    {
      key: "overstaying_tenants",
      icon: <UserX size={16} />,
      title: "Overstaying Tenants",
      description: "Tenants past lease end date still occupying rooms",
      count: stats?.overstaying_tenants?.length ?? 0,
    },
    {
      key: "pending_bookings",
      icon: <CalendarCheck size={16} />,
      title: "Pending bookings",
      description: "New booking applications awaiting review",
      count: stats?.pending_bookings ?? 0,
    },
    {
      key: "pending_services",
      icon: <Wrench size={16} />,
      title: "Pending services",
      description: "Active service requests",
      count: stats?.active_service_requests ?? 0,
    },
    {
      key: "overstaying_guests",
      icon: <AlertTriangle size={16} />,
      title: "Overstaying guests",
      description: "Visitors in rooms past 24 hours",
      count: overstaying,
    },
  ];

  if (loading) {
    return <LoadingSpinner message="Loading dashboard…" />;
  }

  return (
    <div className="min-h-screen bg-[#F5E6D3] p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-[#2C1A0E]">Dashboard</h1>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STATISTICS.map((stat) => (
          <KosanStatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            subtext={stat.subtext}
            accent={stat.accent}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Room Map Section */}
        <KosanCard>
          <KosanSectionHeader title="Room Map" />

          {/* Room Legend */}
          <div className="flex flex-wrap gap-4 mb-5 pb-3 border-b border-[#C8A96E]/15">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md bg-[#C0444A]/70" />
              <span className="text-xs font-medium text-[#8B6F5E]">Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md bg-[#5E9B72]/70" />
              <span className="text-xs font-medium text-[#8B6F5E]">Vacant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-md bg-[#C8A96E]/70" />
              <span className="text-xs font-medium text-[#8B6F5E]">Cleaning</span>
            </div>
          </div>

          {/* Room Grid by Floor */}
          <div className="space-y-4">
            {sortedFloors.map((floor) => (
              <div key={floor}>
                <p className="text-xs font-semibold text-[#8B6F5E] uppercase tracking-wider mb-2">
                  Floor {floor}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {(floorsMap[floor] || []).map((room) => (
                    <KosanRoomChip
                      key={room.id}
                      roomNumber={room.name}
                      status={room.status === "cleaning" ? "cleaned" : room.status}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </KosanCard>

        {/* Booking Requests Section */}
        <KosanCard>
          <KosanSectionHeader
            title="Booking Requests"
            action={
              <a href="/bookings">
                <KosanButton variant="ghost" size="sm">
                  View All
                </KosanButton>
              </a>
            }
          />

          <div className="space-y-3">
            {bookings.length === 0 ? (
              <p className="text-sm text-[#8B6F5E] text-center py-4">
                No pending booking requests
              </p>
            ) : (
              bookings.slice(0, 4).map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#EFE3D0] border border-[#C8A96E]/20"
                >
                  <div>
                    <p className="font-semibold text-[#2C1A0E]">
                      {request.room?.name || "Unknown Room"}
                    </p>
                    <p className="text-sm text-[#8B6F5E]">
                      {request.tenant
                        ? `${request.tenant.first_name} ${request.tenant.last_name || ""}`
                        : "Unknown Guest"}
                    </p>
                  </div>
                  <a href={`/bookings`}>
                    <KosanButton variant="secondary" size="sm">
                      Review
                    </KosanButton>
                  </a>
                </div>
              ))
            )}
          </div>
        </KosanCard>

        {/* Alerts Section */}
        <KosanCard>
          <KosanSectionHeader title="Alerts" />
          <div className="space-y-2">
            {ALERTS.map((alert) => {
              const isExpanded = expandedAlerts[alert.key] ?? false;
              return (
                <div key={alert.key}>
                  <KosanAlertCard
                    icon={alert.icon}
                    title={alert.title}
                    description={alert.description}
                    count={alert.count}
                    onClick={() => setExpandedAlerts(prev => ({ ...prev, [alert.key]: !prev[alert.key] }))}
                    action={
                      <span className="text-[#8B6F5E] ml-1">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    }
                  />

                  {/* Expanded detail list */}
                  {isExpanded && (
                    <div className="mt-1 ml-2 mr-2 mb-2 rounded-lg bg-[#EFE3D0]/60 border border-[#C8A96E]/15 p-3 space-y-2 text-xs">
                      {alert.key === "overstaying_tenants" && (
                        (stats?.overstaying_tenants?.length ?? 0) === 0
                          ? <p className="text-[#8B6F5E]">No overstaying tenants.</p>
                          : stats!.overstaying_tenants.map((t, i) => (
                            <div key={i} className="flex items-center justify-between gap-2 py-1 border-b border-[#C8A96E]/10 last:border-0">
                              <div>
                                <span className="font-semibold text-[#2C1A0E]">{t.tenant_name}</span>
                                <span className="text-[#8B6F5E] ml-1.5">· {t.room_name}</span>
                              </div>
                              <span className="text-[#C0444A] font-bold shrink-0">{t.days_overdue}d overdue</span>
                            </div>
                          ))
                      )}
                      {alert.key === "pending_bookings" && (
                        bookings.length === 0
                          ? <p className="text-[#8B6F5E]">No pending bookings.</p>
                          : bookings.slice(0, 5).map((b) => (
                            <div key={b.id} className="flex items-center justify-between gap-2 py-1 border-b border-[#C8A96E]/10 last:border-0">
                              <span className="font-semibold text-[#2C1A0E]">{b.tenant?.first_name} {b.tenant?.last_name || ''}</span>
                              <span className="text-[#8B6F5E]">{b.room?.name || 'Unknown Room'}</span>
                            </div>
                          ))
                      )}
                      {alert.key === "pending_services" && (
                        (stats?.pending_service_details?.length ?? 0) === 0
                          ? <p className="text-[#8B6F5E]">No pending services.</p>
                          : stats!.pending_service_details.map((s, i) => (
                            <div key={i} className="flex items-center justify-between gap-2 py-1 border-b border-[#C8A96E]/10 last:border-0">
                              <div>
                                <span className="font-semibold text-[#2C1A0E]">{s.service_name}</span>
                                <span className="text-[#8B6F5E] ml-1.5">· {s.tenant_name}</span>
                              </div>
                              <span className={`font-bold shrink-0 ${s.status === 'pending' ? 'text-[#C8A96E]' : 'text-[#5E9B72]'}`}>
                                {s.status.replace('_', ' ')}
                              </span>
                            </div>
                          ))
                      )}
                      {alert.key === "overstaying_guests" && (
                        overstaying === 0
                          ? <p className="text-[#8B6F5E]">No overstaying guests.</p>
                          : visitorLogs
                              .filter(log => {
                                if (log.check_out_at) return false;
                                const checkInTime = new Date(log.check_in_at).getTime();
                                return Date.now() - checkInTime > 24 * 60 * 60 * 1000;
                              })
                              .slice(0, 5)
                              .map((log) => (
                                <div key={log.id} className="flex items-center justify-between gap-2 py-1 border-b border-[#C8A96E]/10 last:border-0">
                                  <span className="font-semibold text-[#2C1A0E]">Visitor #{log.id.slice(0, 6)}</span>
                                  <span className="text-[#8B6F5E]">Since {new Date(log.check_in_at).toLocaleDateString('en-GB')}</span>
                                </div>
                              ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </KosanCard>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Placeholder */}
        {/* Room Availability Trend Chart */}
        <KosanCard className="lg:col-span-2">
          <KosanSectionHeader title="Room Availability Trend" />

          {/* Chart Legend */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#C0444A]/70" />
              <span className="text-xs text-[#8B6F5E]">Occupied</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#5E9B72]/70" />
              <span className="text-xs text-[#8B6F5E]">Vacant</span>
            </div>
          </div>

          {/* Bar Chart */}
          {(stats?.occupancy_trend?.length ?? 0) === 0 ? (
            <div className="h-52 rounded-xl bg-[#EFE3D0] border-2 border-dashed border-[#C8A96E]/40 flex items-center justify-center">
              <p className="text-sm text-[#8B6F5E]">No occupancy data available</p>
            </div>
          ) : (
            <div className="h-52 flex items-end gap-3 px-2">
              {stats!.occupancy_trend.map((entry) => {
                const total = entry.occupied + entry.vacant;
                const occupiedPct = total > 0 ? (entry.occupied / total) * 100 : 0;
                const vacantPct = total > 0 ? (entry.vacant / total) * 100 : 0;
                return (
                  <div key={entry.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div className="w-full flex flex-col rounded-t-md overflow-hidden" style={{ height: '80%' }}>
                      <div
                        className="w-full bg-[#5E9B72]/70 transition-all duration-500"
                        style={{ height: `${vacantPct}%` }}
                        title={`Vacant: ${entry.vacant}`}
                      />
                      <div
                        className="w-full bg-[#C0444A]/70 transition-all duration-500"
                        style={{ height: `${occupiedPct}%` }}
                        title={`Occupied: ${entry.occupied}`}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-[#2C1A0E]">{entry.occupied}/{total}</p>
                      <p className="text-[9px] text-[#8B6F5E] mt-0.5">{entry.month}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </KosanCard>

        {/* Guest Monitoring */}
        <KosanCard>
          <KosanSectionHeader title="Guest Monitoring" />

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Currently Inside", value: currentlyInside.toString(), accent: "default" as const },
              { label: "Check-ins today", value: checkinsToday.toString(), accent: "success" as const },
              { label: "Check-outs today", value: checkoutsToday.toString(), accent: "default" as const },
              { label: "Overstaying", value: overstaying.toString(), accent: "danger" as const },
            ].map((metric) => (
              <div
                key={metric.label}
                className="bg-[#EFE3D0] rounded-xl p-4 border border-[#C8A96E]/20"
              >
                <p className="text-xs font-semibold text-[#8B6F5E] uppercase tracking-wide mb-1">
                  {metric.label}
                </p>
                <p
                  className={`text-2xl font-bold ${
                    metric.accent === "danger"
                      ? "text-[#C0444A]"
                      : metric.accent === "success"
                      ? "text-[#5E9B72]"
                      : "text-[#2C1A0E]"
                  }`}
                >
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </KosanCard>
      </div>
    </div>
  );
}