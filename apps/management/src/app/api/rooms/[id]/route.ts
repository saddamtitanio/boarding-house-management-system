import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { withRole } from '@/src/app/lib/withRole'
import { roomsService } from '@repo/api-utils/rooms'

export const GET = withRole(['admin', 'employee'], async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await roomsService.getRoomById(supabase, id);

    if (error) {
        const isNotFound = error?.code === 'PGRST116'

        return NextResponse.json(
            { error: isNotFound ? 'Room not found' : error.message},
            { status: isNotFound ? 404 : 500 }
        )
    }

    return NextResponse.json({
        success: true,
        data
    });
  }
)

export const PATCH = withRole(['admin', 'employee'], async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const supabase = await createClient();
    const body = await req.json();

    if (!body || Object.keys(body).length === 0) {
        return NextResponse.json(
            { error: 'No update data provided' },
            { status: 400 }
        )
    }

    const { data, error } = await roomsService.updateRoom(supabase,
        { id, ...body }
    );

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }

    return NextResponse.json({
        success: true,
        data
    });
  }
)

export const DELETE = withRole(['admin'], async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data, error } = await roomsService.deleteRoom(
        supabase,
        id
    )

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 404 }
        )
    }

    if (!data) {
        return NextResponse.json(
            { error: "Room cannot be deleted (not vacant or not allowed)" },
            { status: 404 }
        )   
    }

    return NextResponse.json({
        success: true,
        data
    })
  }
)