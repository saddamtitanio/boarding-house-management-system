import { createClient } from '@/src/app/lib/supabase/server'
import { bookingsService } from '@repo/api-utils/bookings'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await bookingsService.getTenantBookings(supabase)
    return NextResponse.json(data.data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}