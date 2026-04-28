'use client';

import { useState } from "react";
import { Sidebar } from "@sbhms/ui";
import { useIsMobile } from "@sbhms/ui";
import type { NavItem } from '@sbhms/ui'
import {
  LayoutDashboard, BedDouble, CalendarCheck, DollarSign,
  ConciergeBell, MessageSquare, Settings, Users, ThumbsUp
} from 'lucide-react'

const managementNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Room", href: "/rooms", icon: <BedDouble size={18} /> },
  { label: "Bookings", href: "/bookings", icon: <CalendarCheck size={18} /> },
  { label: "Financial", href: "/financial", icon: <DollarSign size={18} /> },
  { label: "Services", href: "/services", icon: <ConciergeBell size={18} /> },
  { label: "Feedback", href: "/feedback", icon: <ThumbsUp size={18} /> },
  { label: "Messages", href: "/messages", icon: <MessageSquare size={18} />, badge: "99+" },
  { label: "Settings", href: "/settings", icon: <Settings size={18} /> },
  { label: "Users", href: "/users", icon: <Users size={18} /> },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen">
      <Sidebar
        navItems={managementNav}
        appName="Kosan Mama"
        userName="Admin"
        roleLabel="Management"
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <main
        className={`
          flex-1 overflow-y-auto transition-all duration-300
          ${isMobile
            ? "pl-20 pt-[10px]"
            : collapsed
              ? "pl-[90px] pt-[10px]"
              : "pl-[250px] pt-[10px]"
          }
        `}
      >
        {children}
      </main>
    </div>
  );
}