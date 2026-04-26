"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BedDouble,
  CalendarCheck,
  DollarSign,
  ConciergeBell,
  MessageSquare,
  Settings,
  Users,
  Bell,
  LogOut,
  Menu,
  X,
  Home,
  FileText,
  Wrench,
  ThumbsUp,
  ChevronRight,
} from "lucide-react";

type Role = "management" | "tenant";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

const managementNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Room", href: "/rooms", icon: <BedDouble size={18} /> },
  { label: "Bookings", href: "/bookings", icon: <CalendarCheck size={18} /> },
  { label: "Financial",href: "/financial", icon: <DollarSign size={18} /> },
  { label: "Services", href: "/services", icon: <ConciergeBell size={18} /> },
  { label: "Feedback", href: "/feedback", icon: <ThumbsUp size={18} /> },
  { label: "Messages", href: "/messages", icon: <MessageSquare size={18} />, badge: "99+" },
  { label: "Settings", href: "/settings", icon: <Settings size={18} /> },
  { label: "Users", href: "/users", icon: <Users size={18} /> },
];

const tenantNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "My Room", href: "/room", icon: <Home size={18} /> },
  { label: "Bookings", href: "/bookings", icon: <CalendarCheck size={18} /> },
  { label: "Payments", href: "/payments", icon: <DollarSign size={18} /> },
  { label: "Services", href: "/services", icon: <Wrench size={18} /> },
  { label: "Feedback", href: "/feedback", icon: <ThumbsUp size={18} /> },
  { label: "Messages", href: "/messages", icon: <MessageSquare size={18} />, badge: 3 },
  { label: "Settings", href: "/settings", icon: <Settings size={18} /> },
];


interface SidebarProps {
    role?: Role;
    userName?: string;
}

// temp role and username
export default function Sidebar({ role = "management", userName = "Admin" }: SidebarProps) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const navItems = role === "management" ? managementNav : tenantNav;
    const roleLabel = role === "management" ? "Management" : "Tenant";
    
    const isActive = (href: string) => pathname?.startsWith(href);

    const SidebarContent = () => (
        <div className="sidebar-inner">
            <div className="sidebar-brand">
                <span className="brand-name">Kosan Mama</span>
                <span className="role-chip">{roleLabel}</span>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item ${isActive(item.href) ? "active" : ""}`}
                    onClick={() => setMobileOpen(false)}
                >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    {item.badge !== undefined && (
                    <span className="nav-badge">{item.badge}</span>
                    )}
                    {isActive(item.href) && <ChevronRight size={14} className="nav-arrow" />}
                </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-row">
                    <div className="avatar">{userName.charAt(0).toUpperCase()}</div>
                    <div className="user-info">
                        <span className="user-name">{userName}</span>
                        <span className="user-role">{roleLabel}</span>
                    </div>
                    <div className="footer-actions">
                        <button className="icon-btn" title="Notifications" aria-label="Notifications">
                            <Bell size={16} />
                            <span className="notif-dot" />
                        </button>
                        <button className="icon-btn" title="Log out" aria-label="Log out">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
  );

  return (
    <>
        <button
            className="mobile-toggle"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle sidebar"
        >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {mobileOpen && (
            <div
            className="overlay"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
            />
        )}

        <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
            <SidebarContent />
        </aside>

    </>
  );
}