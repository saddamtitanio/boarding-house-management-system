import { SupabaseClient, createClient } from '@supabase/supabase-js'
import { serviceRepository } from './service.repository'
import { notificationsService } from '../notifications/notifications.service'
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
  const lang = await getLanguagePreference();
  const resolvedName = resolveTranslation(serviceName, lang);
  const messages: Record<string, string> = {
    approved: lang === 'id' 
      ? `Permintaan layanan Anda untuk "${resolvedName}" telah disetujui.` 
      : `Your service request for "${resolvedName}" has been approved.`,
    in_progress: lang === 'id' 
      ? `Permintaan layanan Anda untuk "${resolvedName}" sedang dikerjakan.` 
      : `Your service request for "${resolvedName}" is now in progress.`,
    completed: lang === 'id' 
      ? `Permintaan layanan Anda untuk "${resolvedName}" telah selesai.` 
      : `Your service request for "${resolvedName}" has been completed.`,
    cancelled: lang === 'id' 
      ? `Permintaan layanan Anda untuk "${resolvedName}" telah dibatalkan.` 
      : `Your service request for "${resolvedName}" has been cancelled.`,
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
    const lang = await getLanguagePreference();
    return (data || []).map((svc: any) => ({
      ...svc,
      name: resolveTranslation(svc.name, lang),
      description: resolveTranslation(svc.description, lang),
    }))
  },

  getServiceById: async (supabase: SupabaseClient, serviceId: string) => {
    const { data, error } = await serviceRepository.getServiceById(supabase, serviceId);
    if (error) {
      throw new Error(error.message)
    }
    if (!data) return data;
    const lang = await getLanguagePreference();
    return {
      ...data,
      name: resolveTranslation(data.name, lang),
      description: resolveTranslation(data.description, lang),
    }
  },
  
  addService: async (supabase: SupabaseClient, payload: {
    name: string,
    description?: string | null,
    price: number,
    duration_h?: number
  }) => {
    const translatedName = await autoTranslateText(payload.name);
    const translatedDesc = await autoTranslateText(payload.description);
    const { data, error } = await serviceRepository.createService(supabase, {
      ...payload,
      name: translatedName,
      description: translatedDesc,
    });
    if (error) {
      throw {
        message: error.message,
        code: error.code,
        details: error.details,
      }
    }
    const lang = await getLanguagePreference();
    return data ? {
      ...data,
      name: resolveTranslation(data.name, lang),
      description: resolveTranslation(data.description, lang),
    } : data;
  },

  updateService: async (supabase: SupabaseClient, serviceId: string, payload: {
    name?: string,
    description?: string | null,
    price?: number,
    duration_h?: number
  }) => {
    const updates: any = { ...payload };
    if (payload.name !== undefined) {
      updates.name = await autoTranslateText(payload.name);
    }
    if (payload.description !== undefined) {
      updates.description = await autoTranslateText(payload.description);
    }
    const { data, error } = await serviceRepository.updateService(supabase, serviceId, updates);
    if (error) {
      throw {
        message: error.message,
        code: error.code,
        details: error.details,
      }
    }
    const lang = await getLanguagePreference();
    return data ? {
      ...data,
      name: resolveTranslation(data.name, lang),
      description: resolveTranslation(data.description, lang),
    } : data;
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
    const lang = await getLanguagePreference();
    return (data || []).map((req: any) => {
      if (req.service) {
        req.service.name = resolveTranslation(req.service.name, lang);
        req.service.description = resolveTranslation(req.service.description, lang);
      }
      return req;
    })
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
    const lang = await getLanguagePreference();
    return (data || []).map((req: any) => {
      if (req.service) {
        req.service.name = resolveTranslation(req.service.name, lang);
        req.service.description = resolveTranslation(req.service.description, lang);
      }
      return req;
    })
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
    const lang = await getLanguagePreference();
    return (data || []).map((req: any) => {
      if (req.service) {
        req.service.name = resolveTranslation(req.service.name, lang);
        req.service.description = resolveTranslation(req.service.description, lang);
      }
      return req;
    })
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
    if (!data) return data;
    const lang = await getLanguagePreference();
    if (data.service) {
      const svc = data.service as any;
      svc.name = resolveTranslation(svc.name, lang);
      svc.description = resolveTranslation(svc.description, lang);
    }
    return data;
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

    const lang = await getLanguagePreference();
    const resolvedServiceName = resolveTranslation(service.name, lang);

    // notify tenant
    await notificationsService.createNotificationSafe(supabase, {
      user_id: payload.tenant_id,
      content: lang === 'id'
        ? `Permintaan Anda untuk "${resolvedServiceName}" telah diajukan dan sedang menunggu persetujuan.`
        : `Your request for "${resolvedServiceName}" has been submitted and is pending approval.`,
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

        const notifText = lang === 'id'
          ? `${tenantName} telah mengajukan permintaan layanan "${resolvedServiceName}".`
          : `${tenantName} has requested the service "${resolvedServiceName}".`;

        await notificationsService.notifyUsersSafe(
          adminClient,
          staff.map((member: any) => member.id),
          notifText,
          'service'
        )
      }
    } catch (err) {
      console.error('Failed to notify management:', err)
    }

    return data;
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

    const lang = await getLanguagePreference();
    const resolvedServiceName = resolveTranslation((current.service as any).name, lang);

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

      const managementNotifText = lang === 'id'
        ? `Permintaan layanan "${resolvedServiceName}" sekarang ${payload.status === 'in_progress' ? 'sedang dikerjakan' : payload.status === 'approved' ? 'disetujui' : payload.status === 'completed' ? 'selesai' : 'dibatalkan'}.`
        : `Service request "${resolvedServiceName}" is now ${payload.status.replace('_', ' ')}.`;

      await notificationsService.notifyManagementSafe(
        supabase,
        managementNotifText,
        'service'
      )
    }

    if (payload.assigned_to !== undefined && payload.assigned_to !== assignedToId) {
      const tenantAssignedText = lang === 'id'
        ? `Permintaan layanan Anda "${resolvedServiceName}" telah ditugaskan ke pekerja.`
        : `Your service request "${resolvedServiceName}" has been assigned to a worker.`;

      await notificationsService.createNotificationSafe(supabase, {
        user_id: (current.tenant as any).id,
        content: tenantAssignedText,
        type: 'service'
      })

      // Notify the assigned worker directly
      if (payload.assigned_to) {
        const workerAssignedText = lang === 'id'
          ? `Anda telah ditugaskan untuk permintaan layanan: "${resolvedServiceName}".`
          : `You have been assigned to service request: "${resolvedServiceName}".`;

        await notificationsService.createNotificationSafe(supabase, {
          user_id: payload.assigned_to,
          content: workerAssignedText,
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

    const lang = await getLanguagePreference();
    const resolvedServiceName = resolveTranslation((current.service as any).name, lang);

    const tenantCancelText = lang === 'id'
      ? `Permintaan layanan Anda "${resolvedServiceName}" telah dibatalkan.`
      : `Your service request "${resolvedServiceName}" has been cancelled.`;

    await notificationsService.createNotificationSafe(supabase, {
      user_id: tenantId,
      content: tenantCancelText,
      type: 'service'
    })

    const managementCancelText = lang === 'id'
      ? `Penyewa membatalkan permintaan layanan "${resolvedServiceName}".`
      : `A tenant cancelled service request "${resolvedServiceName}".`;

    await notificationsService.notifyManagementSafe(
      supabase,
      managementCancelText,
      'service'
    )

    return data;
  },
}