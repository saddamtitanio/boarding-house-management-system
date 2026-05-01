import { NextResponse } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function requireAdmin() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized', status: 401 }
  }

  const role = user.user_metadata?.role

  if (role !== 'admin') {
    return { error: 'Forbidden', status: 403 }
  }

  return { user, supabase }
}

export async function GET (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient()

    const { data, error } = await supabase
    .from('rooms')
    .select(`
        *,
        room_images (
        id,
        url
        )
    `)
    .eq('id', id)
    .single();

    if (error) {
        const isNotFound = error?.code === 'PGRST116'
        if (isNotFound) {
        return NextResponse.json(
            { error: 'Booking not found' },
            { status: 404 }
        )
        }

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin();

    if ('error' in auth) {
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        );
    }

    const { id } = await params;
    const { supabase } = auth;
    const body = await req.json();

    if (!body?.name || !body?.price || !body?.floor) {
        return NextResponse.json(
            { error: 'Name, price, and floor are required' },
            { status: 400 }
        );
    }

    // update room
    const { data, error: updateError } = await supabase
        .from('rooms')
        .update({
            name: body.name.trim(),
            price: body.price,
            floor: body.floor,
            description: body.description
        })
        .eq('id', id)
        .select()
        .single();

    if (updateError) {
        return NextResponse.json(
            { error: updateError.message },
            { status: 500 }
        );
    }

    // replace images (if provided)
    if (body.images?.length) {
        const { error: deleteError } = await supabase
        .from('room_images')
        .delete()
        .eq('room_id', id);

        if (deleteError) {
            return NextResponse.json(
                { error: deleteError.message },
                { status: 500 }
            );
        }

    const { error: insertError } = await supabase
      .from('room_images')
      .insert(
        body.images.map((url: string) => ({
            room_id: id,
            url
        }))
      );

    if (insertError) {
        return NextResponse.json(
            { error: insertError.message },
            { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    data
  });
}

export async function DELETE (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin();

    if ('error' in auth) {
        return NextResponse.json(
            { error: auth.error },
            { status: auth.status }
        );
    }
    
    const { id } = await params;

    const { supabase } = auth;

    const { data, error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id)
        .select()
        .maybeSingle();

    if (!data || data.length === 0) {
        return NextResponse.json(
            { error: 'Not found or not allowed' },
            { status: 404 }
        );
    }
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