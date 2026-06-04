import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()
    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Find the profile matching the phone number
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: 'Phone number not found' }, { status: 404 })
    }

    // Retrieve the user from auth.users to get their email address
    const { data: userData, error: userError } = await adminSupabase.auth.admin.getUserById(profile.id)
    if (userError || !userData || !userData.user || !userData.user.email) {
      return NextResponse.json({ success: false, error: 'Associated email address not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, email: userData.user.email })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
