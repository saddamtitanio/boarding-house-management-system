import { NextResponse } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'

export async function GET (
  req: Request
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }
    
    const { data, error } = await supabase
        .from('bookings')
        .select('*')

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