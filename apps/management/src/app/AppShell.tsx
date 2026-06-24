'use client';

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/src/app/lib/supabase/client";

import { Sidebar } from "@sbhms/ui";

import type { NavItem } from '@sbhms/ui';
import { useTranslation } from "@/src/contexts/LanguageContext";

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
  Bell,
  UserCheck
} from 'lucide-react';

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const pathname = usePathname();

  const [profile, setProfile] = useState<{ first_name: string; last_name?: string; avatar_url?: string | null; role?: { name: string } } | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { language, setLanguage, t } = useTranslation();

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
    { label: t("nav.dashboard"), href: "/dashboard", icon: <LayoutDashboard size={18} /> },
    { label: t("nav.rooms"), href: "/rooms", icon: <BedDouble size={18} /> },
    { label: t("nav.bookings"), href: "/bookings", icon: <CalendarCheck size={18} /> },
    { label: t("nav.financial"), href: "/financial", icon: <DollarSign size={18} /> },
    { label: t("nav.services"), href: "/services", icon: <ConciergeBell size={18} /> },
    { label: t("nav.visitors"), href: "/visitor", icon: <UserCheck size={18} /> },
    { label: t("nav.feedback"), href: "/feedback", icon: <ThumbsUp size={18} /> },
    { 
      label: t("nav.messages"), 
      href: "/messages", 
      icon: <MessageSquare size={18} />
    },
    { 
      label: t("nav.notifications"), 
      href: "/notifications", 
      icon: <Bell size={18} />, 
      badge: unreadNotifications > 0 ? String(unreadNotifications) : undefined 
    },
    { label: t("nav.settings"), href: "/settings", icon: <Settings size={18} /> },
    { label: t("nav.users"), href: "/settings/users", icon: <Users size={18} /> },
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
          avatarUrl={profile?.avatar_url}
          onLogout={handleLogout}
          language={language}
          onChangeLanguage={setLanguage}
        />
      )}

      <main
        className={`
          flex-1 overflow-y-auto transition-all duration-300
          ${
            hideSidebar
              ? "p-0"
              : "pt-20 px-4 md:px-8"
          }
        `}
      >
        {children}
      </main>
    </div>
  );
}