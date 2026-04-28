import './global.css'
import { Sidebar } from '@sbhms/ui'
import type { NavItem } from '@sbhms/ui'
import {
  LayoutDashboard, Home, CalendarCheck, DollarSign,
  Wrench, MessageSquare, Settings, ThumbsUp
} from 'lucide-react'

import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const tenantNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "My Room", href: "/room", icon: <Home size={18} /> },
  { label: "Bookings", href: "/bookings", icon: <CalendarCheck size={18} /> },
  { label: "Payments", href: "/payments", icon: <DollarSign size={18} /> },
  { label: "Services", href: "/services", icon: <Wrench size={18} /> },
  { label: "Feedback", href: "/feedback", icon: <ThumbsUp size={18} /> },
  { label: "Messages", href: "/messages", icon: <MessageSquare size={18} />, badge: 3 },
  { label: "Settings", href: "/settings", icon: <Settings size={18} /> },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${poppins.className} font-sans`}>
          <div className="flex h-screen">
            <Sidebar
              navItems={tenantNav}
              appName="Kosan Mama"
              userName="Test"
              roleLabel="Tenant"
            />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
      </body>
    </html>
  )
}