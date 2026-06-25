import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { feedbackService } from '@repo/api-utils/feedback'

// Fetch feedback submitted by the authenticated tenant
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await feedbackService.getFeedbackByTenant(supabase, user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}

// Submit new feedback rating and comment
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check active lease
  const { data: activeLease } = await supabase
    .from('leases')
    .select('id')
    .eq('tenant_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!activeLease) {
    return NextResponse.json({ error: 'Active lease required to submit feedback' }, { status: 403 })
  }

  const body = await req.json()
  const { rating, comment } = body

  if (!rating) {
    return NextResponse.json({ error: 'rating is required' }, { status: 400 })
  }

  const { data, error } = await feedbackService.createFeedback(supabase, {
    tenant_id: user.id,
    rating: Number(rating),
    comment: comment || ''
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data }, { status: 201 })
}
