"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut, Menu, X, ChevronRight, ChevronLeft } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

interface SidebarProps {
  navItems: NavItem[];
  appName?: string;
  userName?: string;
  roleLabel?: string;
  collapsed: boolean;
  setCollapsed: (value: boolean | ((v: boolean) => boolean)) => void;
  onLogout?: () => void;
}
export default function Sidebar({
  navItems,
  appName = "Kosan Mama",
  userName = "User",
  roleLabel = "User",
  collapsed,
  setCollapsed,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname?.startsWith(href);

  const SidebarContent = () => (
    <div className="flex flex-col h-full py-5 overflow-y-auto">
      <div className="flex items-center px-4 pb-5 mb-3 border-b border-white/10">

        {!collapsed && (
          <span className="font-bold text-sm text-[#f5ede0]">
            Kosan Mama
          </span>
        )}

        <button
          onClick={() => setCollapsed((v) => !v)}
          className="ml-auto w-8 h-8 rounded-md flex items-center justify-center text-[#f5ede0]/60 hover:bg-white/10 hover:text-[#f5ede0]"
        >
          {collapsed ? (
            <ChevronRight size={18} />
          ) : (
            <ChevronLeft size={18} />
          )}
        </button>

      </div>

      <nav className="flex flex-col flex-1 gap-[2px] px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              onClick={() => setMobileOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                transition-all duration-200
                ${
                  active
                    ? "bg-[#c8a96e] text-[#3d2b1f] font-semibold"
                    : "text-[#f5ede0]/60 hover:bg-white/10 hover:text-[#f5ede0]"
                }
              `}
            >
              <span className="w-[18px] flex justify-center">
                {item.icon}
              </span>

              {!collapsed && (
                <span className="flex-1">
                  {item.label}
                </span>
              )}

              {!collapsed && item.badge !== undefined && (
                <span
                  className={`
                    text-[10px] font-bold px-2 rounded-full
                    ${
                      active
                        ? "bg-[#3d2b1f] text-[#c8a96e]"
                        : "bg-[#e07b39] text-white"
                    }
                  `}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 pt-4 mt-3 border-t border-white/10">

        <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-white/5">

          <div className="w-8 h-8 rounded-full bg-[#c8a96e] text-[#3d2b1f] font-bold text-sm flex items-center justify-center">
            {userName.charAt(0).toUpperCase()}
          </div>

          {!collapsed && (
            <div className="flex flex-col flex-1 flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold text-[#f5ede0] truncate">
                    {userName}
                </span>

                <span className="text-[10px] text-[#f5ede0]/60 capitalize truncate">
                {roleLabel}
                </span>
            </div>
          )}

          {!collapsed && (
            <div className="flex gap-1">
                <button className="w-7 h-7 rounded-md flex items-center justify-center text-[#f5ede0]/60 hover:bg-white/10 hover:text-[#f5ede0] relative">
                    <Bell size={16} />
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#e07b39]" />
                </button>

                <button
                  onClick={onLogout}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-[#f5ede0]/60 hover:bg-white/10 hover:text-[#f5ede0]"
                  title="Logout"
                >
                    <LogOut size={16} />
                </button>

            </div>
          )}

        </div>

      </div>

    </div>
  );

  return (
    <>
    {!mobileOpen && (
    <button
        onClick={() => setMobileOpen(true)}
        className="
        md:hidden
        fixed top-3 left-3
        z-[200]
        w-10 h-10
        rounded-lg
        bg-[#553D2B]
        text-[#f5ede0]
        shadow-lg
        flex items-center justify-center
        "
        aria-label="Open sidebar"
    >
        <Menu size={22} />
    </button>
    )}

    {mobileOpen && (
    <button
        onClick={() => setMobileOpen(false)}
        className="
        md:hidden
        fixed top-3 right-3
        z-[200]
        w-10 h-10
        rounded-lg
        bg-white
        text-[#553D2B]
        shadow-lg
        flex items-center justify-center
        hover:bg-gray-100
        transition
        "
        aria-label="Close sidebar"
    >
        <X size={22} />
    </button>
    )}

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-screen
          bg-[#553D2B]
          flex flex-col
          shadow-lg
          transition-all duration-300
          z-[100]

          ${collapsed ? "w-[72px]" : "w-[230px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <SidebarContent />
      </aside>
    </>
  );
}