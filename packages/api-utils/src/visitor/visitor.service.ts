 import { SupabaseClient } from '@supabase/supabase-js'
import { visitorRepository } from './visitor.repository'

async function notifyTenant(
  supabase: SupabaseClient,
  tenantId: string,
  content: string
) {
  await supabase.from('notifications').insert({
    user_id: tenantId,
    content,
    type: 'visitor',
  })
}

export const visitorService = {
  // management (get all logs with optional date filter)
  getAllLogs: async (supabase: SupabaseClient, date?: string) => {
    const { data, error } = await visitorRepository.findAll(supabase, date)
    if (error) throw error
    return data
  },

  // tenant (get own visitor logs)
  getTenantLogs: async (supabase: SupabaseClient, tenantId: string) => {
    const { data, error } = await visitorRepository.findByTenant(supabase, tenantId)
    if (error) throw error
    return data
  },

  // tenant (get currently checked-in visitors)
  getActiveVisitors: async (supabase: SupabaseClient, tenantId: string) => {
    const { data, error } = await visitorRepository.findActiveByTenant(supabase, tenantId)
    if (error) throw error
    return data
  },

  // public (check in - called from /visit/[token] page, no auth)
  checkIn: async (supabase: SupabaseClient, payload: {
    tenant_id: string
    room_id: string
    visitor_name: string
    visitor_phone?: string
    purpose?: string
  }) => {
    const { data, error } = await visitorRepository.insert(supabase, payload)
    if (error) {
      throw error
    }
    await notifyTenant(
      supabase,
      payload.tenant_id,
      `${payload.visitor_name} has checked in to visit you.`
    )

    return data
  },

  // public (check out - called from /visit/[token] page, no auth)
  checkOut: async (supabase: SupabaseClient, visitId: string) => {
    const { data, error } = await visitorRepository.updateCheckOut(supabase, visitId)

    if (error) {
      throw error
    }
    if (!data) throw new Error('ALREADY_CHECKED_OUT')

    await notifyTenant(
      supabase,
      (data.tenant as any).id,
      `${data.visitor_name} has checked out.`
    )

    return data
  },

  // get tenant's active booking room
  getTenantActiveRoom: async (supabase: SupabaseClient, tenantId: string) => {
    const { data, error } = await supabase
      .from('leases')
      .select('room_id')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .maybeSingle()
    
    console.log('Active booking query result:', { data, error }) // Debug log
    if (error || !data) throw new Error('NO_ACTIVE_BOOKING')
    return data.room_id as string
  },
}