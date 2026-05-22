import { NextResponse, type NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verify visitor pass token and fetch tenant/room details
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  try {
    const payload = jwt.verify(token, process.env.QR_SECRET!) as {
      tenant_id: string
      room_id: string
      visitor_name?: string
      purpose?: string
    }

    // Fetch tenant profile details
    const { data: tenant, error: tenantError } = await adminSupabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', payload.tenant_id)
      .single()

    // Fetch room details
    const { data: room, error: roomError } = await adminSupabase
      .from('rooms')
      .select('name')
      .eq('id', payload.room_id)
      .single()

    return NextResponse.json({
      success: true,
      tenant_name: tenant ? `${tenant.first_name} ${tenant.last_name || ''}`.trim() : 'Resident',
      room_name: room?.name || 'Room',
      visitor_name: payload.visitor_name || '',
      purpose: payload.purpose || '',
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid or expired QR pass' }, { status: 401 })
  }
}
