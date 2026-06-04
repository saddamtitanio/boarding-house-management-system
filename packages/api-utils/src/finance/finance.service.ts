import { SupabaseClient } from '@supabase/supabase-js'
import { financeRepository } from './finance.repository'

export const financeService = {
  // Retrieve list of expenses
  listExpenses: async (supabase: SupabaseClient, startDate?: string, endDate?: string) => {
    return await financeRepository.listExpenses(supabase, startDate, endDate)
  },

  // Log a new expense
  createExpense: async (
    supabase: SupabaseClient,
    payload: {
      recorded_by: string
      amount: number
      category: string
      description: string
      expense_date: string
    }
  ) => {
    return await financeRepository.insertExpense(supabase, payload)
  },

  // Calculate total income, expenses, and net profit
  getFinancialSummary: async (supabase: SupabaseClient, startDate?: string, endDate?: string) => {
    try {
      const revenue = await financeRepository.getRevenueSummary(supabase, startDate, endDate)
      const expenses = await financeRepository.getExpenseSummary(supabase, startDate, endDate)
      return {
        data: {
          total_revenue: revenue,
          total_expenses: expenses,
          net_balance: revenue - expenses
        },
        error: null
      }
    } catch (err: any) {
      return { data: null, error: err }
    }
  },

  // Update expense details
  updateExpense: async (
    supabase: SupabaseClient,
    id: string,
    payload: {
      amount?: number
      category?: string
      description?: string
      expense_date?: string
    }
  ) => {
    return await financeRepository.updateExpense(supabase, id, payload)
  },

  // Delete expense
  deleteExpense: async (supabase: SupabaseClient, id: string) => {
    return await financeRepository.deleteExpense(supabase, id)
  }
}
