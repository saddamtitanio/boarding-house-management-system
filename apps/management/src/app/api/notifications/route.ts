import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { withRole } from '@/src/app/lib/withRole'
import { notificationsService } from '@repo/api-utils/notifications'

// Get notifications for the authenticated user
export const GET = withRole(['admin', 'employee'], async (req: NextRequest) => {
  const supabase = await createClient()
  
  // Find current user ID
  const { data: userClaim } = await supabase.auth.getClaims()
  const userId = userClaim?.claims?.sub

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await notificationsService.listNotifications(supabase, userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
})

// Mark single notification or all notifications as read
export const PATCH = withRole(['admin', 'employee'], async (req: NextRequest) => {
  const supabase = await createClient()
  
  const { data: userClaim } = await supabase.auth.getClaims()
  const userId = userClaim?.claims?.sub

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  
  if (body.all) {
    const { data, error } = await notificationsService.markAllNotificationsRead(supabase, userId)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data })
  } else {
    const { data, error } = await notificationsService.markNotificationRead(supabase, body.id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data })
  }
})
