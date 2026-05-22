import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { withRole } from '@/src/app/lib/withRole'
import { tenantsService } from '@repo/api-utils/tenants'

// Fetch profile details for a specific tenant
export const GET = withRole(['admin', 'employee'], async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await tenantsService.getProfile(supabase, id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
})

// Update profile details for a specific tenant
export const PATCH = withRole(['admin', 'employee'], async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const supabase = await createClient()
  const body = await req.json()
  const { data, error } = await tenantsService.updateProfile(supabase, id, body)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
})
