import { createClient } from '@/src/app/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export async function POST(req: NextRequest) {
  const { token, name, phone, purpose } = await req.json()

  // verify and decode QR token
  let payload: any
  try {
    payload = jwt.verify(token, process.env.QR_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid or expired QR code' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('visitor_logs')
    .insert({
      tenant_id: payload.tenant_id,
      room_id: payload.room_id,
      visitor_name: name,
      visitor_phone: phone,
      purpose,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // notify tenant
  await supabase.from('notifications').insert({
    user_id: payload.tenant_id,
    content: `${name} has checked in to visit you.`,
    type: 'visitor',
  })

  return NextResponse.json(data, { status: 201 })
}