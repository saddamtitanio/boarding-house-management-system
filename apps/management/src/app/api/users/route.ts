import { NextResponse, type NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/src/app/lib/supabase/server'
import { withRole } from '@/src/app/lib/withRole'
import { tenantsService } from '@repo/api-utils/tenants'

// Retrieve list of all users in the system (staff and tenants)
export const GET = withRole(['admin', 'employee'], async (req: NextRequest) => {
  const adminSupabase = createAdminClient()
  const { data, error } = await tenantsService.getAllUsers(adminSupabase)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
})

// Create a new staff member account (admin only)
export const POST = withRole(['admin'], async (req: NextRequest) => {
  const adminSupabase = createAdminClient()
  const body = await req.json()

  const { data, error } = await tenantsService.createStaffUser(adminSupabase, {
    email: body.email,
    password: body.password,
    first_name: body.first_name,
    last_name: body.last_name,
    phone: body.phone,
    role: body.role // 'admin' or 'employee'
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
})
