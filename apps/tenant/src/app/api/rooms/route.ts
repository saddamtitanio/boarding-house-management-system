import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { roomsService } from '@repo/api-utils/rooms'

// GET /api/rooms - public, no auth required
export async function GET(req: NextRequest) {
  const supabase = await createClient()

  const result = await roomsService.getTenantRooms(supabase)

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: result.data })
}