import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { withRole } from '@/src/app/lib/withRole'
import { roomsService } from '@repo/api-utils/rooms'

export async function GET() {
    const supabase = await createClient();

    const { data, error } = await roomsService.getManagementRooms(supabase);

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }

    return NextResponse.json({ success: true, data });
}

export const POST = withRole(['admin'], async (req: NextRequest) => {
    const supabase = await createClient()
    const body = await req.json()

    if (!body?.name || !body?.price || !body?.floor) {
        return NextResponse.json(
        { error: 'Name, price, and floor are required' },
        { status: 400 }
        )
    }

    const { data, error } = await roomsService.createRoom(supabase, body)

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }

    return NextResponse.json(
        { success: true, data },
        { status: 201 }
    )
})