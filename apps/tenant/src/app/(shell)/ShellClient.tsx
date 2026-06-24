'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/src/app/lib/supabase/client'
import { Sidebar } from '@sbhms/ui'
import type { NavItem } from '@sbhms/ui'
import type { User } from '@supabase/supabase-js'
import {
  LayoutDashboard, Home, CalendarCheck, DollarSign,
  Wrench, MessageSquare, Settings, ThumbsUp, UserCheck, Bell
} from 'lucide-react'
import { LeaseProvider } from '@/src/contexts/LeaseContext'
import { useTranslation } from '@/src/contexts/LanguageContext'

type Profile = {
  id: string
  first_name: string
  last_name: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string | null
  role: {
    id: string
    name: string
  } | null
}

export default function ShellClient({
  children,
  user,
}: {
  children: React.ReactNode
  user: User | null
}) {
  const supabase = createClient()
  const pathname = usePathname()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [hasActiveLease, setHasActiveLease] = useState(false)
  const [shellLoading, setShellLoading] = useState(true)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  useEffect(() => {
    if (!user) return

    async function loadShellData() {
      try {
        const profileRes = await fetch('/api/profile')
        const profileData = await profileRes.json()
        if (profileData.success && profileData.data) {
          setProfile(profileData.data)
        }

        const messagesRes = await fetch('/api/messages')
        const messagesData = await messagesRes.json()
        if (messagesData.success && Array.isArray(messagesData.data)) {
          const totalUnread = messagesData.data.reduce((acc: number, conv: any) => acc + (conv.unread_count || 0), 0)
          setUnreadMessages(totalUnread)
        }

        const notificationsRes = await fetch('/api/notifications')
        const notificationsData = await notificationsRes.json()
        if (notificationsData.success && Array.isArray(notificationsData.data)) {
          const totalUnread = notificationsData.data.reduce((acc: number, notif: any) => acc + (notif.is_read ? 0 : 1), 0)
          setUnreadNotifications(totalUnread)
        }

        // Check active lease status
        const dashboardRes = await fetch('/api/dashboard')
        const dashboardData = await dashboardRes.json()
        if (dashboardData.success && dashboardData.data?.active_lease) {
          setHasActiveLease(true)
        } else {
          setHasActiveLease(false)
        }
      } catch (err) {
        console.error('Failed to load session details for sidebar', err)
      } finally {
        setShellLoading(false)
      }
    }

    loadShellData()
  }, [user, pathname])

  const { language, setLanguage, t } = useTranslation();

  // Navigation links for guest users
  const publicNav: NavItem[] = [
    { label: t('nav.rooms'), href: '/room', icon: <Home size={18} /> },
    { label: t('nav.services'), href: '/services', icon: <Wrench size={18} /> },
    { label: t('nav.bookings'), href: '/bookings', icon: <CalendarCheck size={18} /> },
  ]

  // Construct authenticated navigation dynamic items
  const authNav: NavItem[] = [
    { label: t('nav.dashboard'), href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { label: t('nav.rooms'), href: '/room', icon: <Home size={18} /> },
    { label: t('nav.services'), href: '/services', icon: <Wrench size={18} /> },
    { label: t('nav.bookings'), href: '/bookings', icon: <CalendarCheck size={18} /> },
    { label: t('nav.payments'), href: '/payments', icon: <DollarSign size={18} /> },
    { 
      label: t('nav.notifications'), 
      href: '/notifications', 
      icon: <Bell size={18} />, 
      badge: unreadNotifications > 0 ? String(unreadNotifications) : undefined 
    },
    // Only show Feedback if user has active lease (show during loading to prevent flicker)
    ...((shellLoading || hasActiveLease) ? [{ label: t('nav.feedback'), href: '/feedback', icon: <ThumbsUp size={18} /> }] : []),
    { 
      label: t('nav.messages'), 
      href: '/messages', 
      icon: <MessageSquare size={18} />, 
      badge: unreadMessages > 0 ? String(unreadMessages) : undefined 
    },
    { label: t('nav.visitors'), href: '/visitor', icon: <UserCheck size={18} /> },
    { label: t('nav.settings'), href: '/settings', icon: <Settings size={18} /> },
  ]

  const navItems = user ? authNav : publicNav
  const userName = profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : (user?.email ?? 'Guest')

  const roleLabel = profile?.role?.name ? 'Tenant' : 'Guest'

  return (
    <LeaseProvider>
      <div className="flex min-h-screen">
        <Sidebar
          navItems={navItems}
          appName="Kosan Mama"
          userName={userName}
          roleLabel={roleLabel}
          avatarUrl={profile?.avatar_url}
          onLogout={handleLogout}
          language={language}
          onChangeLanguage={setLanguage}
        />
        <main className="flex-1 pt-20 px-4 md:px-8 overflow-y-auto transition-all duration-300">
          {children}
        </main>
      </div>
    </LeaseProvider>
  )
}