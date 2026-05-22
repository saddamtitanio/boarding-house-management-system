'use client';

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/src/app/lib/supabase/client";

import { Sidebar } from "@sbhms/ui";
import { useIsMobile } from "@sbhms/ui";

import type { NavItem } from '@sbhms/ui';

import {
  LayoutDashboard,
  BedDouble,
  CalendarCheck,
  DollarSign,
  ConciergeBell,
  MessageSquare,
  Settings,
  Users,
  ThumbsUp,
  Bell
} from 'lucide-react';

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();

  const [profile, setProfile] = useState<{ first_name: string; last_name?: string; role?: { name: string } } | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  useEffect(() => {
    // Fetch profile and unread notifications
    async function loadData() {
      try {
        const profileRes = await fetch("/api/profile");
        const profileData = await profileRes.json();
        if (profileData.success) {
          setProfile(profileData.data);
        }

        const notifyRes = await fetch("/api/notifications");
        const notifyData = await notifyRes.json();
        if (notifyData.success && Array.isArray(notifyData.data)) {
          const unread = notifyData.data.filter((n: any) => !n.is_read).length;
          setUnreadNotifications(unread);
        }
      } catch (err) {
        console.error("Failed to load user session data", err);
      }
    }

    loadData();
  }, [pathname]);

  const userName = profile ? `${profile.first_name} ${profile.last_name || ""}`.trim() : "Loading...";
  const roleLabel = profile?.role?.name ? profile.role.name.toUpperCase() : "Staff";

  const managementNav: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: "Rooms", href: "/rooms", icon: <BedDouble size={18} /> },
    { label: "Bookings", href: "/bookings", icon: <CalendarCheck size={18} /> },
    { label: "Financial", href: "/financial", icon: <DollarSign size={18} /> },
    { label: "Services", href: "/services", icon: <ConciergeBell size={18} /> },
    { label: "Feedback", href: "/feedback", icon: <ThumbsUp size={18} /> },
    { 
      label: "Messages", 
      href: "/messages", 
      icon: <MessageSquare size={18} />
    },
    { 
      label: "Notifications", 
      href: "/notifications", 
      icon: <Bell size={18} />, 
      badge: unreadNotifications > 0 ? String(unreadNotifications) : undefined 
    },
    { label: "Settings", href: "/settings", icon: <Settings size={18} /> },
    { label: "Users", href: "/settings/users", icon: <Users size={18} /> },
  ];

  // routes without sidebar
  const noSidebarRoutes = ['/login', '/register'];
  const hideSidebar = noSidebarRoutes.includes(pathname);

  return (
    <div className="flex h-screen">
      {!hideSidebar && (
        <Sidebar
          navItems={managementNav}
          appName="Kosan Mama"
          userName={userName}
          roleLabel={roleLabel}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onLogout={handleLogout}
        />
      )}

      <main
        className={`
          flex-1 overflow-y-auto transition-all duration-300
          ${
            hideSidebar
              ? "p-0"
              : isMobile
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