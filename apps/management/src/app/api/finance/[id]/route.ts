import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/src/app/lib/supabase/server'
import { withRole } from '@/src/app/lib/withRole'
import { financeService } from '@repo/api-utils/finance'

export const PATCH = withRole(['admin'], async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const supabase = await createClient();
    const body = await req.json();

    if (!body || Object.keys(body).length === 0) {
        return NextResponse.json(
            { error: 'No update data provided' },
            { status: 400 }
        )
    }

    const { data, error } = await financeService.updateExpense(supabase, id, {
        amount: body.amount,
        category: body.category,
        description: body.description,
        expense_date: body.expense_date
    });

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
)

export const DELETE = withRole(['admin'], async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const supabase = await createClient();
    
    const { error } = await financeService.deleteExpense(
        supabase,
        id
    )

    if (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }

    return NextResponse.json({
        success: true
    })
  }
)
