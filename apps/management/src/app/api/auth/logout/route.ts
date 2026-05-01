import { createClient } from '@/src/app/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Check if user is actually logged in
  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    )
  }

  // Sign out
  const { error } = await supabase.auth.signOut()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  // Clear cookies
  const response = NextResponse.json({ success: true })
  response.cookies.delete('sb-access-token')
  response.cookies.delete('sb-refresh-token')

  return response
}