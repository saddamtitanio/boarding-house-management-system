'use client'
import { useState } from 'react'
import { Sidebar, useIsMobile } from '@sbhms/ui'
import type { NavItem } from '@sbhms/ui'
import type { User } from '@supabase/supabase-js'
import {
  LayoutDashboard, Home, CalendarCheck, DollarSign,
  Wrench, MessageSquare, Settings, ThumbsUp, UserCheck
} from 'lucide-react'

// always visible
const publicNav: NavItem[] = [
  { label: 'Rooms', href: '/room', icon: <Home size={18} /> },
  { label: 'Services', href: '/services', icon: <Wrench size={18} /> },
  { label: 'Bookings', href: '/bookings', icon: <CalendarCheck size={18} /> },
]

// only shown when logged in
const authNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Rooms', href: '/room', icon: <Home size={18} /> },
  { label: 'Services', href: '/services', icon: <Wrench size={18} /> },
  { label: 'Bookings', href: '/bookings', icon: <CalendarCheck size={18} /> },
  { label: 'Payments', href: '/payments', icon: <DollarSign size={18} /> },
  { label: 'Feedback', href: '/feedback', icon: <ThumbsUp size={18} /> },
  { label: 'Messages', href: '/messages', icon: <MessageSquare size={18} />, badge: 3 },
  { label: 'Visitors', href: '/visitor', icon: <UserCheck size={18} /> },
{ label: 'Settings', href: '/settings', icon: <Settings size={18} /> },
]

export default function ShellClient({
  children,
  user,
}: {
  children: React.ReactNode
  user: User | null
}) {
  const [collapsed, setCollapsed] = useState(false)
  const isMobile = useIsMobile();

  const navItems = user ? authNav : publicNav

  return (
    <div className="flex">
      <Sidebar
        navItems={navItems}
        appName="Kosan Mama"
        userName={user?.email ?? 'Guest'}
        roleLabel={user ? 'Tenant' : 'Guest'}
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
  )
}