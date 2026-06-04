import { SupabaseClient, createClient } from '@supabase/supabase-js'
import { serviceRepository } from './service.repository'
import { notificationsService } from '../notifications/notifications.service'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

const VALID_STATUSES = ['pending', 'approved', 'in_progress', 'completed', 'cancelled']

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['approved', 'cancelled'],
  approved: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

async function notifyTenant(
  supabase: SupabaseClient,
  tenantId: string,
  status: string,
  serviceName: string
) {
  const messages: Record<string, string> = {
    approved: `Your service request for "${serviceName}" has been approved.`,
    in_progress: `Your service request for "${serviceName}" is now in progress.`,
    completed: `Your service request for "${serviceName}" has been completed.`,
    cancelled: `Your service request for "${serviceName}" has been cancelled.`,
  }

  if (!messages[status]) return

  await notificationsService.createNotificationSafe(supabase, {
    user_id: tenantId,
    content: messages[status],
    type: 'service',
  })
}

export const serviceQueueService = {
  getAllServices: async (supabase: SupabaseClient) => {
    const { data, error } = await serviceRepository.getAllServices(supabase);
    if (error) {
      throw {
        message: error.message,
        code: error.code,
        details: error.details,
      }
    }
    return data
  },

  getServiceById: async (supabase: SupabaseClient, serviceId: string) => {
    const { data, error } = await serviceRepository.getServiceById(supabase, serviceId);
    if (error) {
      throw new Error(error.message)
    }
    return data
  },
  
  addService: async (supabase: SupabaseClient, payload: {
    name: string,
    description?: string | null,
    price: number,
    duration_h?: number
  }) => {
    const { data, error } = await serviceRepository.createService(supabase, payload);
    if (error) {
      throw {
        message: error.message,
        code: error.code,
        details: error.details,
      }
    }
    return data
  },

  updateService: async (supabase: SupabaseClient, serviceId: string, payload: {
    name: string,
    description?: string,
    price: number,
    duration_h?: number
  }) => {
    const { data, error } = await serviceRepository.updateService(supabase, serviceId, payload);
    if (error) {
      throw {
        message: error.message,
        code: error.code,
        details: error.details,
      }
    }
    return data
  },

  deleteService: async (supabase: SupabaseClient, serviceId: string) => {
    const { data, error } = await serviceRepository.deleteService(supabase, serviceId)
    if (error) {
      throw {
        message: error.message,
        code: error.code,
        details: error.details,
      }
    }
    return data
  },

  // tenant (get own requests)
  getTenantRequests: async (supabase: SupabaseClient, tenantId: string) => {
    const { data, error } = await serviceRepository.findByTenant(supabase, tenantId)
    if (error) {
      throw error;
    }
    return data
  },

  // management (get all requests)
  getAllRequests: async (supabase: SupabaseClient) => {
    const { data, error } = await serviceRepository.findAll(supabase)
    if (error) {
      throw {
        message: error.message,
        code: error.code,
        details: error.details,
      }
    }

    return data
  },

  // management (filter by status)
  getRequestsByStatus: async (supabase: SupabaseClient, status: string) => {
    if (!VALID_STATUSES.includes(status)) throw new Error('INVALID_STATUS')
    const { data, error } = await serviceRepository.findByStatus(supabase, status)
    if (error) {
      throw {
        message: error.message,
        code: error.code,
        details: error.details,
      }
    }

    return data
  },

  // get single request
  getRequestById: async (supabase: SupabaseClient, id: string) => {
    const { data, error } = await serviceRepository.findById(supabase, id)
    if (error) {
      throw {
        message: error.message,
        code: error.code,
        details: error.details,
      }
    }
    return data
  },

  // tenant (submit a new request)
  createRequest: async (supabase: SupabaseClient, payload: {
    tenant_id: string
    service_id: string
    note?: string | null
  }) => {
    // verify service exists
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, name')
      .eq('id', payload.service_id)
      .single()

    if (serviceError || !service) throw new Error('SERVICE_NOT_FOUND')

    const { data, error } = await serviceRepository.insert(supabase, payload)
    if (error) {
      throw {
        message: error.message,
        code: error.code,
        details: error.details,
      }
    }

    // notify tenant
    await notificationsService.createNotificationSafe(supabase, {
      user_id: payload.tenant_id,
      content: `Your request for "${service.name}" has been submitted and is pending approval.`,
      type: 'service',
    })

    // notify management
    try {
      const adminClient = getAdminClient() || supabase
      const { data: staff } = await adminClient
        .from('profiles')
        .select('id, roles!inner(name)')
        .in('roles.name', ['admin', 'employee'])

      if (staff && staff.length > 0) {
        const { data: tenantProfile } = await adminClient
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', payload.tenant_id)
          .single()

        const tenantName = tenantProfile
          ? `${tenantProfile.first_name} ${tenantProfile.last_name || ''}`.trim()
          : 'A tenant'

        await notificationsService.notifyUsersSafe(
          adminClient,
          staff.map((member: any) => member.id),
          `${tenantName} has requested the service "${service.name}".`,
          'service'
        )
      }
    } catch (err) {
      console.error('Failed to notify management:', err)
    }

    return data
  },

  // management (update request status with transition validation and/or assign worker)
  updateRequest: async (
    supabase: SupabaseClient,
    id: string,
    payload: { status?: string; assigned_to?: string | null },
    requesterId: string,
    requesterRole: string
  ) => {
    const { data: current, error: fetchError } = await serviceRepository.findById(supabase, id)
    if (fetchError || !current) throw new Error('REQUEST_NOT_FOUND')

    const assignedToId = (current.assigned_to as any)?.id
    const isAdmin = requesterRole === 'admin'
    const isAssigned = assignedToId === requesterId

    if (!isAdmin && !isAssigned) {
      throw new Error('FORBIDDEN')
    }

    // if changing assignee, only admin can perform this action
    if (payload.assigned_to !== undefined && payload.assigned_to !== assignedToId) {
      if (!isAdmin) throw new Error('FORBIDDEN')
    }

    // if changing status, validate status transition
    if (payload.status !== undefined && payload.status !== current.status) {
      if (!VALID_STATUSES.includes(payload.status)) throw new Error('INVALID_STATUS')
      const allowed = VALID_TRANSITIONS[current.status] ?? []
      if (!allowed.includes(payload.status)) {
        throw new Error(`INVALID_TRANSITION:${current.status}→${payload.status}`)
      }

      // Block transition to in_progress unless payment is paid
      if (payload.status === 'in_progress') {
        const { data: payments, error: paymentError } = await supabase
          .from('payments')
          .select('status')
          .eq('service_request_id', id)
          .eq('type', 'service')

        if (paymentError) throw paymentError

        const isPaid = payments && payments.some((p: any) => p.status === 'paid')
        if (!isPaid) {
          throw new Error('PAYMENT_REQUIRED')
        }
      }
    }

    // If approving, generate a pending payment first
    if (payload.status === 'approved' && current.status !== 'approved') {
      const price = (current.service as any).price || 0
      
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          service_request_id: id,
          amount: price,
          status: 'pending',
          type: 'service',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
      
      if (paymentError) {
        console.error('Failed to create payment for approved service request:', paymentError)
        throw paymentError
      }
    }

    const { data, error } = await serviceRepository.updateRequest(supabase, id, payload)
    if (error) throw error

    if (payload.status !== undefined && payload.status !== current.status) {
      if (payload.status === 'cancelled') {
        await supabase
          .from('payments')
          .update({ status: 'cancelled' })
          .eq('service_request_id', id)
          .eq('status', 'pending')
      }

      await notifyTenant(
        supabase,
        (current.tenant as any).id,
        payload.status,
        (current.service as any).name
      )
      await notificationsService.notifyManagementSafe(
        supabase,
        `Service request "${(current.service as any).name}" is now ${payload.status.replace('_', ' ')}.`,
        'service'
      )
    }

    if (payload.assigned_to !== undefined && payload.assigned_to !== assignedToId) {
      await notificationsService.createNotificationSafe(supabase, {
        user_id: (current.tenant as any).id,
        content: `Your service request "${(current.service as any).name}" has been assigned to a worker.`,
        type: 'service'
      })

      // Notify the assigned worker directly
      if (payload.assigned_to) {
        await notificationsService.createNotificationSafe(supabase, {
          user_id: payload.assigned_to,
          content: `You have been assigned to service request: "${(current.service as any).name}".`,
          type: 'service'
        })
      }
    }
    return data
  },

  // tenant cancel own request (only if pending)
  cancelRequest: async (
    supabase: SupabaseClient,
    id: string,
    tenantId: string
  ) => {
    const { data: current, error: fetchError } = await serviceRepository.findById(supabase, id)
    if (fetchError || !current) {
      throw new Error('REQUEST_NOT_FOUND')
    }

    // verify ownership
    if ((current.tenant as any).id !== tenantId) {
      throw new Error('FORBIDDEN')
    }

    // can only cancel if pending
    if (current.status !== 'pending') {
      throw new Error('INVALID_TRANSITION: can only cancel pending requests')
    }

    const { data, error } = await serviceRepository.updateStatus(supabase, id, 'cancelled')
    if (error) {
      throw {
        message: error.message,
        code: error.code,
        details: error.details,
      }
    }

    await supabase
      .from('payments')
      .update({ status: 'cancelled' })
      .eq('service_request_id', id)
      .eq('status', 'pending')

    await notificationsService.createNotificationSafe(supabase, {
      user_id: tenantId,
      content: `Your service request "${(current.service as any).name}" has been cancelled.`,
      type: 'service'
    })
    await notificationsService.notifyManagementSafe(
      supabase,
      `A tenant cancelled service request "${(current.service as any).name}".`,
      'service'
    )

    return data
  },
}