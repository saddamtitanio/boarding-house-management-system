"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";

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
  avatarUrl?: string | null;
  onLogout?: () => void;
  language?: "en" | "id";
  onChangeLanguage?: (lang: "en" | "id") => void;
}

export default function Sidebar({
  navItems,
  appName = "Kosan Mama",
  userName = "User",
  roleLabel = "User",
  avatarUrl,
  onLogout,
  language = "en",
  onChangeLanguage,
}: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <>
      {/* Top Navbar */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-[#1A0E0A] border-b border-white/10 flex items-center justify-between px-4 z-[150] shadow-md select-none">
        <div className="flex items-center gap-3">
          {/* Hamburger Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#f5ede0]/80 hover:bg-white/10 hover:text-[#f5ede0] transition focus:outline-none"
            aria-label="Toggle sidebar"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          {/* App Name/Logo */}
          <span className="font-bold text-lg text-[#f5ede0] tracking-wide">
            {appName}
          </span>
        </div>

        {/* Right utilities (e.g. notifications or quick info) */}
        <div className="flex items-center gap-3">
          {onChangeLanguage && (
            <select
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value as "en" | "id")}
              className="bg-white/10 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-[#f5ede0] focus:outline-none cursor-pointer hover:bg-white/15 transition select-none mr-1"
            >
              <option value="en" className="bg-[#1A0E0A] text-[#f5ede0]">EN</option>
              <option value="id" className="bg-[#1A0E0A] text-[#f5ede0]">ID</option>
            </select>
          )}

          {roleLabel === 'Guest' ? (
            <div className="flex items-center gap-2 pointer-events-auto">
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#f5ede0]/80 hover:bg-white/10 hover:text-[#f5ede0] transition"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#c8a96e] text-[#3d2b1f] hover:bg-[#b89355] transition shadow-sm"
              >
                Register
              </Link>
            </div>
          ) : (
            <>
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-[#f5ede0]">
                  {userName}
                </div>
                <div className="text-[9px] text-[#f5ede0]/60 capitalize">
                  {roleLabel}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#c8a96e] text-[#3d2b1f] font-bold text-sm flex items-center justify-center select-none shadow overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  userName.charAt(0).toUpperCase()
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[130] transition-opacity"
        />
      )}

      {/* Sliding Sidebar Drawer */}
      <aside
        className={`
          fixed top-16 left-0 bottom-0 w-[240px]
          bg-[#1A0E0A] border-r border-white/10
          flex flex-col
          shadow-2xl
          transition-transform duration-300 ease-in-out
          z-[140]
          pointer-events-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full py-4 overflow-y-auto justify-between">
          <nav className="flex flex-col gap-[4px] px-2 flex-1">
            {navItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                    transition-all duration-200
                    ${
                      active
                        ? "bg-[#553D2B] text-[#DFC9A8] font-semibold shadow-md"
                        : "text-[#f5ede0]/70 hover:bg-white/10 hover:text-[#f5ede0]"
                    }
                  `}
                >
                  <span className="w-[20px] flex justify-center">
                    {item.icon}
                  </span>
                  <span className="flex-1">
                    {item.label}
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className={`
                        text-[10px] font-bold px-2 py-0.5 rounded-full
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

          {/* User profile / Logout at bottom */}
          <div className="px-2 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-white/5">
              <div className="w-8 h-8 rounded-full bg-[#c8a96e] text-[#3d2b1f] font-bold text-sm flex items-center justify-center shadow overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  userName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold text-[#f5ede0] truncate">
                  {userName}
                </span>
                <span className="text-[10px] text-[#f5ede0]/60 capitalize truncate">
                  {roleLabel}
                </span>
              </div>
              {onLogout && roleLabel !== 'Guest' && (
                <button
                  onClick={onLogout}
                  className="w-8 h-8 rounded-md flex items-center justify-center text-[#f5ede0]/60 hover:bg-white/10 hover:text-[#f5ede0] transition"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}