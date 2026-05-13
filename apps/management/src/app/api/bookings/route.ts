import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { withRole } from '@/src/app/lib/withRole'
import { bookingsService } from '@repo/api-utils/bookings'

export const GET = withRole(['admin', 'employee'], async (req: NextRequest) => {
    const supabase = await createClient()

    const { data: user  } = await supabase.auth.getClaims();

    const role = user?.claims?.app_metadata?.role ?? 'tenant';

    const { data, error } = await bookingsService.getBookings(supabase, role)

    if (error) {
        return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
})