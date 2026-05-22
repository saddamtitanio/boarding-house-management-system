import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { withRole } from '@/src/app/lib/withRole'
import { feedbackService } from '@repo/api-utils/feedback'

// Fetch all feedback logs
export const GET = withRole(['admin', 'employee'], async (req: NextRequest) => {
  const supabase = await createClient()
  const { data, error } = await feedbackService.getAllFeedback(supabase)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
})
