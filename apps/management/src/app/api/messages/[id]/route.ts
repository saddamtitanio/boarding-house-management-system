import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { withRole } from '@/src/app/lib/withRole'
import { messagesService } from '@repo/api-utils/messages'

// Get all messages in a specific conversation
export const GET = withRole(['admin', 'employee'], async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await messagesService.listMessages(supabase, id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
})

// Send a new message to a specific conversation
export const POST = withRole(['admin', 'employee'], async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const supabase = await createClient()
  
  // Find current user's ID
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id

  if (!currentUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { data, error } = await messagesService.sendMessage(supabase, {
    conversation_id: id,
    sender_id: currentUserId,
    content: body.content
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
})
