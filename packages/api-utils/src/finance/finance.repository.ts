import { SupabaseClient } from '@supabase/supabase-js'

export const financeRepository = {
  // Fetch expenses with option to filter by date range
  listExpenses: (supabase: SupabaseClient, startDate?: string, endDate?: string) => {
    let query = supabase
      .from('expenses')
      .select(`
        id,
        amount,
        category,
        description,
        expense_date,
        created_at,
        recorder:profiles (
          id,
          first_name,
          last_name
        )
      `)
      .order('expense_date', { ascending: false })

    if (startDate) {
      query = query.gte('expense_date', startDate)
    }
    if (endDate) {
      query = query.lte('expense_date', endDate)
    }

    return query
  },

  // Record a new expense
  insertExpense: (
    supabase: SupabaseClient,
    payload: {
      recorded_by: string
      amount: number
      category: string
      description: string
      expense_date: string
    }
  ) => {
    return supabase
      .from('expenses')
      .insert({
        recorded_by: payload.recorded_by,
        amount: payload.amount,
        category: payload.category,
        description: payload.description,
        expense_date: payload.expense_date
      })
      .select()
      .single()
  },

  // Fetch sum of paid payments (revenue) within date range
  getRevenueSummary: async (supabase: SupabaseClient, startDate?: string, endDate?: string) => {
    let query = supabase
      .from('payments')
      .select('amount, created_at')
      .eq('status', 'paid')

    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, error } = await query
    if (error) throw error

    const total = (data ?? []).reduce((acc, curr) => acc + Number(curr.amount), 0)
    return total
  },

  // Fetch sum of expenses within date range
  getExpenseSummary: async (supabase: SupabaseClient, startDate?: string, endDate?: string) => {
    let query = supabase
      .from('expenses')
      .select('amount, expense_date')

    if (startDate) {
      query = query.gte('expense_date', startDate)
    }
    if (endDate) {
      query = query.lte('expense_date', endDate)
    }

    const { data, error } = await query
    if (error) throw error

    const total = (data ?? []).reduce((acc, curr) => acc + Number(curr.amount), 0)
    return total
  },

  // Update an existing expense
  updateExpense: (
    supabase: SupabaseClient,
    id: string,
    payload: {
      amount?: number
      category?: string
      description?: string
      expense_date?: string
    }
  ) => {
    return supabase
      .from('expenses')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
  },

  // Delete an expense
  deleteExpense: (supabase: SupabaseClient, id: string) => {
    return supabase
      .from('expenses')
      .delete()
      .eq('id', id)
  }
}
