import { SupabaseClient } from '@supabase/supabase-js'
import { paymentsRepository } from './payments.repository'

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
    return await paymentsRepository.insert(supabase, payload)
  },

  createPayment: async (
    supabase: SupabaseClient,
    payload: { booking_id?: string; service_request_id?: string; amount: number; status?: string; gateway_ref?: string; type?: string }
  ) => {
    return await paymentsRepository.insert(supabase, payload)
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

      // Send notification for service payment success
      if (fullPayment.type === 'service') {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: tenantId,
            content: `Your payment for service "${serviceName}" was successful and the service has started!`,
            type: 'service'
          })
        if (notificationError) {
          console.error('Failed to create notification for service payment:', notificationError)
        }
      }
    }

    return { data: payment, error: null }
  }
}