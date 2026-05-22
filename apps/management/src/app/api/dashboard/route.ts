import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { withRole } from '@/src/app/lib/withRole'
import { dashboardService } from '@repo/api-utils/dashboard'

// Retrieve administrative statistics for the dashboard
export const GET = withRole(['admin', 'employee'], async (req: NextRequest) => {
  const supabase = await createClient()
  const { data, error } = await dashboardService.getStats(supabase)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
})
