import { NextResponse } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'

import { bookingsService } from '@repo/api-utils/bookings'

export async function GET(req: Request) {
    const supabase = await createClient()

    const { data: user  } = await supabase.auth.getClaims();

    const role = user?.claims?.app_metadata?.role ?? 'tenant';

    const { data, error } = await bookingsService.getBookings(supabase, role)

    if (error) {
        return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
}