import { SupabaseClient } from '@supabase/supabase-js'
import { paymentsRepository } from './payments.repository'
import { notificationsService } from '../notifications/notifications.service'

export const paymentsService = {
  getAllPayments: async (supabase: SupabaseClient) => {
    return await paymentsRepository.listAll(supabase)
  },

  getTenantPayments: async (supabase: SupabaseClient, tenantId: string) => {
    return await paymentsRepository.listByTenant(supabase, tenantId)
  },

  getPaymentById: async (supabase: SupabaseClient, id: string) => {
    return await paymentsRepository.getById(supabase, id)
  },

  getInvoiceByPayment: async (supabase: SupabaseClient, paymentId: string) => {
    return await paymentsRepository.getInvoiceByPayment(supabase, paymentId)
  },

  // Only called internally when management approves a booking
  _createPayment: async (
    supabase: SupabaseClient,
    payload: { booking_id?: string; service_request_id?: string; amount: number; gateway_ref?: string; type?: string }
  ) => {
    const result = await paymentsRepository.insert(supabase, payload)
    if (result.data?.id) {
      const { data: fullPayment } = await paymentsRepository.getById(supabase, result.data.id)
      const tenantId =
        fullPayment?.booking?.tenant?.id || fullPayment?.service_request?.tenant?.id
      if (tenantId) {
        await notificationsService.createNotificationSafe(supabase, {
          user_id: tenantId,
          content: `A new payment invoice has been generated (${Number(fullPayment.amount || 0).toLocaleString('id-ID')}).`,
          type: 'payment'
        })
      }
    }
    return result
  },

  createPayment: async (
    supabase: SupabaseClient,
    payload: { booking_id?: string; service_request_id?: string; amount: number; status?: string; gateway_ref?: string; type?: string }
  ) => {
    const result = await paymentsRepository.insert(supabase, payload)
    if (result.data?.id) {
      const { data: fullPayment } = await paymentsRepository.getById(supabase, result.data.id)
      const tenantId =
        fullPayment?.booking?.tenant?.id || fullPayment?.service_request?.tenant?.id
      if (tenantId) {
        await notificationsService.createNotificationSafe(supabase, {
          user_id: tenantId,
          content: `A new payment record has been created for your account.`,
          type: 'payment'
        })
      }
    }
    return result
  },

  updatePaymentStatus: async (
    supabase: SupabaseClient,
    id: string,
    status: string,
    gatewayRef?: string
  ) => {
    const { data: payment, error: updateError } = await paymentsRepository.updateStatus(
      supabase,
      id,
      { status, gateway_ref: gatewayRef }
    )

    if (updateError || !payment) {
      return { data: null, error: updateError ?? new Error('Payment not found') }
    }

    if (status === 'paid') {
      const { error: rpcError } = await supabase.rpc('handle_successful_payment', {
        p_payment_id: id
      })

      if (rpcError) {
        return { data: null, error: rpcError }
      }

      const { data: fullPayment, error: fetchError } = await paymentsRepository.getById(
        supabase,
        id
      )

      if (fetchError || !fullPayment) {
        return { data: null, error: fetchError ?? new Error('Could not resolve payment') }
      }

      let tenantId: string | undefined = undefined
      let serviceName: string = ''

      if (fullPayment.type === 'service' && fullPayment.service_request) {
        tenantId = fullPayment.service_request.tenant_id
        serviceName = fullPayment.service_request.service?.name || 'requested service'
      } else if (fullPayment.booking?.tenant) {
        tenantId = fullPayment.booking.tenant.id
      }

      if (!tenantId) {
        return { data: null, error: new Error('Could not resolve tenant for invoice') }
      }

      const invoiceNum = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`

      const { error: invoiceError } = await paymentsRepository.insertInvoice(supabase, {
        payment_id: id,
        invoice_number: invoiceNum,
        issued_to: tenantId
      })

      if (invoiceError) {
        console.error('Invoice creation failed after successful payment:', invoiceError)
      }

      await notificationsService.createNotificationSafe(supabase, {
        user_id: tenantId,
        content:
          fullPayment.type === 'service'
            ? `Your payment for service "${serviceName}" was successful and the service has started!`
            : 'Your payment was successful and has been recorded.',
        type: fullPayment.type === 'service' ? 'service' : 'payment'
      })
    } else {
      const { data: fullPayment } = await paymentsRepository.getById(supabase, id)
      const tenantId = fullPayment?.booking?.tenant?.id || fullPayment?.service_request?.tenant?.id
      if (tenantId) {
        await notificationsService.createNotificationSafe(supabase, {
          user_id: tenantId,
          content: `Payment status updated to "${status}".`,
          type: 'payment'
        })
      }
    }

    return { data: payment, error: null }
  }
}