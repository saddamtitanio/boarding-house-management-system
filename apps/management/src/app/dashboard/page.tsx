"use client";

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
} from "lucide-react";
import {
  KosanSearchBar,
  KosanCard,
  KosanStatCard,
  KosanAlertCard,
  KosanSectionHeader,
  KosanButton,
  KosanRoomChip,
} from "@sbhms/ui";

const STATISTICS = [
  { 
    label: "Total Rooms", 
    value: "15", 
    subtext: "All units", 
    accent: "default" as const,
    icon: <Home size={18} />
  },
  { 
    label: "Occupied", 
    value: "7", 
    subtext: "46.7% Occupancy", 
    accent: "danger" as const,
    icon: <Users size={18} />
  },
  { 
    label: "Vacant", 
    value: "5", 
    subtext: "33.3% Vacancy", 
    accent: "success" as const,
    icon: <DoorOpen size={18} />
  },
  { 
    label: "Cleaning", 
    value: "3", 
    subtext: "20% Under Cleaning", 
    accent: "gold" as const,
    icon: <Brush size={18} />
  },
];

const ALERTS = [
  {
    icon: <DollarSign size={16} />,
    title: "Overdue payments",
    description: "Tenants with past-due rent",
    count: 4,
  },
  {
    icon: <AlertTriangle size={16} />,
    title: "Overstaying guests",
    description: "Guests past check-out time",
    count: 4,
  },
  {
    icon: <CalendarCheck size={16} />,
    title: "Leases expiring soon",
    description: "Pending over 24 hours",
    count: 4,
  },
  {
    icon: <Wrench size={16} />,
    title: "Pending services",
    description: "Pending over 24 hours",
    count: 4,
  },
  {
    icon: <LogIn size={16} />,
    title: "Upcoming check-ins",
    description: "Rooms that need cleaning",
    count: 4,
  },
];

const ROOMS_BY_FLOOR = [
  { floor: "1st Floor", rooms: ["101", "102", "103", "104", "105"] },
  { floor: "2nd Floor", rooms: ["201", "202", "203", "204", "205"] },
  { floor: "3rd Floor", rooms: ["301", "302", "303", "304", "305"] },
];

const BOOKING_REQUESTS = [
  { room: "Room 104", guest: "Fatih Rabbani" },
  { room: "Room 201", guest: "Fatih Rabbani" },
  { room: "Room 302", guest: "Fatih Rabbani" },
  { room: "Room 305", guest: "Fatih Rabbani" },
];

const GUEST_METRICS = [
  { label: "Currently Inside", value: "7", accent: "default" as const },
  { label: "Check-ins today", value: "13", accent: "success" as const },
  { label: "Check-outs today", value: "8", accent: "default" as const },
  { label: "Overstaying", value: "5", accent: "danger" as const },
];

export default function DashboardPage() {
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
              <span className="text-xs font-medium text-[#8B6F5E]">Cleaned</span>
            </div>
          </div>

          {/* Room Grid by Floor */}
          <div className="space-y-4">
            {ROOMS_BY_FLOOR.map(({ floor, rooms }) => (
              <div key={floor}>
                <p className="text-xs font-semibold text-[#8B6F5E] uppercase tracking-wider mb-2">
                  {floor}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {rooms.map((room) => (
                    <KosanRoomChip
                      key={room}
                      roomNumber={room}
                      status="vacant" 
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
              <KosanButton variant="ghost" size="sm">
                View All
              </KosanButton>
            }
          />
          
          <div className="space-y-3">
            {BOOKING_REQUESTS.map((request, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-[#EFE3D0] border border-[#C8A96E]/20"
              >
                <div>
                  <p className="font-semibold text-[#2C1A0E]">{request.room}</p>
                  <p className="text-sm text-[#8B6F5E]">{request.guest}</p>
                </div>
                <KosanButton variant="secondary" size="sm">
                  Review
                </KosanButton>
              </div>
            ))}
          </div>
        </KosanCard>

        {/* Alerts Section */}
        <KosanCard>
          <KosanSectionHeader title="Alerts" />
          <div className="space-y-2">
            {ALERTS.map((alert) => (
              <KosanAlertCard
                key={alert.title}
                icon={alert.icon}
                title={alert.title}
                description={alert.description}
                count={alert.count}
              />
            ))}
          </div>
        </KosanCard>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Placeholder */}
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

          {/* Chart Area */}
          <div className="h-52 rounded-xl bg-[#EFE3D0] border-2 border-dashed border-[#C8A96E]/40 flex items-center justify-center">
            <p className="text-sm text-[#8B6F5E]">Chart will appear here</p>
          </div>
        </KosanCard>

        {/* Guest Monitoring */}
        <KosanCard>
          <KosanSectionHeader 
            title="Guest Monitoring"
            action={
              <KosanButton variant="ghost" size="sm">
                View Log
              </KosanButton>
            }
          />
          
          <div className="grid grid-cols-2 gap-3">
            {GUEST_METRICS.map((metric) => (
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