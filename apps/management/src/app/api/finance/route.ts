import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { withRole } from '@/src/app/lib/withRole'
import { financeService } from '@repo/api-utils/finance'

// Get financial records (expenses list or overall summary)
export const GET = withRole(['admin', 'employee'], async (req: NextRequest) => {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // 'summary' or 'expenses'
  const startDate = searchParams.get('startDate') || undefined
  const endDate = searchParams.get('endDate') || undefined

  if (type === 'summary') {
    const { data, error } = await financeService.getFinancialSummary(supabase, startDate, endDate)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data })
  } else {
    const { data, error } = await financeService.listExpenses(supabase, startDate, endDate)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data })
  }
})

// Create a new expense entry
export const POST = withRole(['admin', 'employee'], async (req: NextRequest) => {
  const supabase = await createClient()
  
  // Get claims to find out who is recording the expense
  const { data: userClaim } = await supabase.auth.getClaims()
  const userId = userClaim?.claims?.sub

  if (!userId) {
    return NextResponse.json({ error: 'User ID not found in session' }, { status: 401 })
  }

  const body = await req.json()
  const { data, error } = await financeService.createExpense(supabase, {
    recorded_by: userId,
    amount: body.amount,
    category: body.category,
    description: body.description,
    expense_date: body.expense_date || new Date().toISOString().split('T')[0]
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true, data })
})
