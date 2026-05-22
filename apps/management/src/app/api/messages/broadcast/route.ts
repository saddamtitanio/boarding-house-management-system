import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { withRole } from '@/src/app/lib/withRole'
import { messagesService } from '@repo/api-utils/messages'

// Broadcast a message to all tenants (admin/employee only)
export const POST = withRole(['admin', 'employee'], async (req: NextRequest) => {
  const supabase = await createClient()
  const { content } = await req.json()

  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
  }

  // Retrieve current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await messagesService.broadcastMessage(supabase, user.id, content)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
})
