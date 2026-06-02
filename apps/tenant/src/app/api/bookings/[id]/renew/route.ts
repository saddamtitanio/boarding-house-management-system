import { NextResponse, type NextRequest } from 'next/server'
import { createClient as createUserClient } from '@/src/app/lib/supabase/server'
import { bookingsService } from '@repo/api-utils/bookings'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createUserClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { end_date } = await req.json()

        const { data: booking, error } = await bookingsService.requestRenew(supabase, id, { end_date })

        if (error) {
            return NextResponse.json({ error: error }, { status: 500 })
        }
        
        return NextResponse.json({ success: true, data: booking })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}