import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { withRole } from '@/src/app/lib/withRole'
import { messagesService } from '@repo/api-utils/messages'

// Get conversation listings for the current user
export const GET = withRole(['admin', 'employee'], async (req: NextRequest) => {
  const supabase = await createClient()
  const { data, error } = await messagesService.listConversations(supabase)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
})

// Create or fetch conversation with a specific set of users
export const POST = withRole(['admin', 'employee'], async (req: NextRequest) => {
  const supabase = await createClient()
  const body = await req.json()

  // Find out current user's ID
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id
  
  if (!currentUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Ensure current user is in the list of participants
  const userIds: string[] = body.userIds || []
  
  if (!userIds.includes(currentUserId)) {
    userIds.push(currentUserId)
  }

  const { data, error } = await messagesService.getOrCreateConversation(supabase, userIds)
  
  if (error) {
    console.log(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
})
