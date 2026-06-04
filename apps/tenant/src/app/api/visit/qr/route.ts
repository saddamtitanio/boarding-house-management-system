import { createClient } from '@/src/app/lib/supabase/server'
import { visitorService } from '@repo/api-utils/visitor'
import { NextResponse, type NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import QRCode from 'qrcode'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const roomId = await visitorService.getTenantActiveRoom(supabase, user.id)
    const searchParams = req.nextUrl.searchParams
    const name = searchParams.get('name') || ''
    const purpose = searchParams.get('purpose') || ''

    const token = jwt.sign(
      { tenant_id: user.id, room_id: roomId, visitor_name: name, purpose },
      process.env.QR_SECRET!,
      { expiresIn: '24h' }
    )

    const url = `${process.env.NEXT_PUBLIC_TENANT_URL}/visit/${token}`
    const qr = await QRCode.toDataURL(url)

    return NextResponse.json({ qr, url, expires_in: '24h' })
  } catch (e: any) {
    const status = e.message === 'NO_ACTIVE_BOOKING' ? 404 : 500
    return NextResponse.json({ error: e.message }, { status })
  }
}