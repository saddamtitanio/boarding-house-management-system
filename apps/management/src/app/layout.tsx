import './global.css'
import { Sidebar } from '@sbhms/ui'
import type { NavItem } from '@sbhms/ui'
import {
  LayoutDashboard, BedDouble, CalendarCheck, DollarSign,
  ConciergeBell, MessageSquare, Settings, Users, ThumbsUp
} from 'lucide-react'
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

// temp
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

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${poppins.className} font-sans`}>
          <div className="flex h-screen">
            <Sidebar
              navItems={managementNav}
              appName="Kosan Mama"
              userName="Admin"
              roleLabel="Management"
            />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
      </body>
    </html>
  )
}