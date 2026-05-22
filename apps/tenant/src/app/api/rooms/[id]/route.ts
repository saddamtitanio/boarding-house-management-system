import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { roomsService } from '@repo/api-utils/rooms'

// GET /api/rooms/[id] — public, no auth required
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient()

    const result = await roomsService.getRoomById(supabase, id)

    if (result.error) {
        const status = result.error.code === 'PGRST116' ? 404 : 500
        return NextResponse.json({ error: result.error.message }, { status })
    }

    return NextResponse.json({ success: true, data: result.data })
}