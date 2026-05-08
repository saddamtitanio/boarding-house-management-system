import { NextResponse, type NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { visitorService } from '@repo/api-utils/visitor'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { token, visitor_name, visitor_phone, purpose } = await req.json()

  let payload: { tenant_id: string; room_id: string }
  try {
    payload = jwt.verify(token, process.env.QR_SECRET!) as any
  } catch {
    return NextResponse.json({ error: 'Invalid or expired QR code' }, { status: 401 })
  }

  try {
    const data = await visitorService.checkIn(adminSupabase, {
      tenant_id: payload.tenant_id,
      room_id: payload.room_id,
      visitor_name,
      visitor_phone,
      purpose,
    })
    return NextResponse.json(data, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}