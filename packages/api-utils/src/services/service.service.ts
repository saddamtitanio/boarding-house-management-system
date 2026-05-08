import { SupabaseClient } from '@supabase/supabase-js'
import { serviceRepository } from './service.repository'

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

  await supabase.from('notifications').insert({
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

    // notify management
    await supabase.from('notifications').insert({
      user_id: payload.tenant_id,
      content: `Your request for "${service.name}" has been submitted and is pending approval.`,
      type: 'service',
    })

    return data
  },

  // management (update request status with transition validation)
  updateRequestStatus: async (
    supabase: SupabaseClient,
    id: string,
    newStatus: string,
    requesterId: string,
    requesterRole: string
  ) => {
    if (!VALID_STATUSES.includes(newStatus)) throw new Error('INVALID_STATUS')

    const { data: current, error: fetchError } = await serviceRepository.findById(supabase, id)
    if (fetchError || !current) throw new Error('REQUEST_NOT_FOUND')

    // only admin or the assigned employee can update
    const assignedToId = (current.assigned_to as any)?.id
    const isAdmin = requesterRole === 'admin'
    const isAssigned = assignedToId === requesterId

    if (!isAdmin && !isAssigned) {
      throw new Error('FORBIDDEN')
    }

    // validate transition
    const allowed = VALID_TRANSITIONS[current.status] ?? []
    if (!allowed.includes(newStatus)) {
      throw new Error(`INVALID_TRANSITION:${current.status}→${newStatus}`)
    }

    const { data, error } = await serviceRepository.updateStatus(supabase, id, newStatus)
    if (error) throw error

    await notifyTenant(
      supabase,
      (current.tenant as any).id,
      newStatus,
      (current.service as any).name
    )
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

    return data
  },
}