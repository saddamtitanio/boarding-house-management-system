import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { messagesService } from '@repo/api-utils/messages'

// Get all message threads for the logged-in tenant
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await messagesService.listConversations(supabase)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}

// Start a new conversation or get an existing one with other participants
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const userIds: string[] = body.userIds || []

  // Ensure current tenant is included in the conversation participants
  if (!userIds.includes(user.id)) {
    userIds.push(user.id)
  }

  const { data, error } = await messagesService.getOrCreateConversation(supabase, userIds)

  if (error) console.log('Service error:', error)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
