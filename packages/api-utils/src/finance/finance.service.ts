import { SupabaseClient } from '@supabase/supabase-js'
import { financeRepository } from './finance.repository'
import { autoTranslateText, resolveTranslation } from '../utils/translate'

async function getLanguagePreference(): Promise<string> {
  try {
    const nextHeadersModule = 'next/headers';
    const { cookies } = await import(nextHeadersModule);
    const cookieStore = await cookies();
    const lang = (cookieStore as any).get ? (cookieStore as any).get('app_lang')?.value : undefined;
    return lang || 'en';
  } catch (err) {
    return 'en';
  }
}

export const financeService = {
  // Retrieve list of expenses
  listExpenses: async (supabase: SupabaseClient, startDate?: string, endDate?: string) => {
    const { data, error } = await financeRepository.listExpenses(supabase, startDate, endDate)
    if (error) {
      return { data, error }
    }
    const lang = await getLanguagePreference();
    const resolved = (data || []).map((exp: any) => ({
      ...exp,
      description: resolveTranslation(exp.description, lang),
    }))
    return { data: resolved, error: null }
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
    const translatedDesc = await autoTranslateText(payload.description);
    const { data, error } = await financeRepository.insertExpense(supabase, {
      ...payload,
      description: translatedDesc,
    });
    if (error) {
      return { data, error }
    }
    const lang = await getLanguagePreference();
    const resolved = data ? {
      ...data,
      description: resolveTranslation(data.description, lang),
    } : data;
    return { data: resolved, error: null }
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
    const updates: any = { ...payload };
    if (payload.description !== undefined) {
      updates.description = await autoTranslateText(payload.description);
    }
    const { data, error } = await financeRepository.updateExpense(supabase, id, updates);
    if (error) {
      return { data, error }
    }
    const lang = await getLanguagePreference();
    const resolved = data ? {
      ...data,
      description: resolveTranslation(data.description, lang),
    } : data;
    return { data: resolved, error: null }
  },

  // Delete expense
  deleteExpense: async (supabase: SupabaseClient, id: string) => {
    return await financeRepository.deleteExpense(supabase, id)
  }
}
