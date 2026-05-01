import { NextResponse } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('rooms')
        .select(`
        *,
        room_images (
            id,
            url
        )
        `)
        .limit(1, { foreignTable: 'room_images' });

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
export async function POST (
    req: NextRequest
) {
    const supabase = await createClient();
    const body = await req.json();

    if (!body?.name || !body?.price || !body?.floor) {
        return NextResponse.json({ error: 'Name, price, and floor are required' }, { status: 400 });
    }

  const { data, error } = await supabase
    .from('rooms')
    .insert({
        name: body.name.trim(),
        price: body.price,
        floor: body.floor,
        description: body.description
    })
    .select()
    .single();

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }

    return NextResponse.json({
        success: true,
        data
    })
}