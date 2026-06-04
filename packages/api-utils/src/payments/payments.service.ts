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

      try {
        const tenantName = fullPayment.type === 'service'
          ? (fullPayment.service_request?.tenant ? `${fullPayment.service_request.tenant.first_name} ${fullPayment.service_request.tenant.last_name || ''}`.trim() : 'Tenant')
          : (fullPayment.booking?.tenant ? `${fullPayment.booking.tenant.first_name} ${fullPayment.booking.tenant.last_name || ''}`.trim() : 'Tenant')
        
        const itemDesc = fullPayment.type === 'service'
          ? `service "${serviceName}"`
          : `room ${fullPayment.booking?.room?.name || 'rent'}`

        await notificationsService.notifyManagementSafe(
          supabase,
          `Payment of Rp ${Number(fullPayment.amount).toLocaleString('id-ID')} from ${tenantName} for ${itemDesc} has been received successfully.`,
          'payment'
        )
      } catch (notifErr) {
        console.error('Failed to notify management of payment success:', notifErr)
      }
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
  },

  /**
   * Create a Midtrans Snap transaction for a given payment.
   * Fetches payment details, resolves tenant info, calls Midtrans, stores the snap token.
   */
  createMidtransTransaction: async (supabase: SupabaseClient, paymentId: string) => {
    const { data: payment, error: fetchError } = await paymentsRepository.getById(supabase, paymentId)
    if (fetchError || !payment) {
      return { data: null, error: fetchError ?? new Error('Payment not found') }
    }

    if (
      payment.status !== 'pending' &&
      payment.status !== 'failed' &&
      payment.status !== 'expired' &&
      payment.status !== 'cancelled'
    ) {
      return { data: null, error: new Error(`Payment is not payable (status: ${payment.status})`) }
    }

    // If a snap token already exists, payment is pending, and token is less than 10 minutes old, reuse it
    const tokenAgeMs = payment.updated_at ? (Date.now() - new Date(payment.updated_at).getTime()) : Infinity
    if (payment.snap_token && payment.status === 'pending' && tokenAgeMs < 10 * 60 * 1000) {
      return { data: { snap_token: payment.snap_token, midtrans_order_id: payment.midtrans_order_id }, error: null }
    }

    // Resolve tenant details
    let customerName = 'Tenant'
    let customerPhone = ''
    if (payment.booking?.tenant) {
      customerName = `${payment.booking.tenant.first_name} ${payment.booking.tenant.last_name || ''}`.trim()
      customerPhone = payment.booking.tenant.phone || ''
    } else if (payment.service_request?.tenant) {
      customerName = `${payment.service_request.tenant.first_name} ${payment.service_request.tenant.last_name || ''}`.trim()
      customerPhone = payment.service_request.tenant.phone || ''
    }

    // Determine item description
    let itemName = 'Monthly Rent'
    if (payment.type === 'service') {
      itemName = `Service: ${payment.service_request?.service?.name || 'Service Fee'}`
    } else if (payment.booking?.room?.name) {
      itemName = `Rent: ${payment.booking.room.name}`
    }

    const orderId = `${paymentId}-${Math.floor(Date.now() / 1000)}`
    const grossAmount = Math.round(Number(payment.amount))

    try {
      const { midtransService } = await import('./midtrans.service')
      const result = await midtransService.createSnapTransaction({
        orderId,
        grossAmount,
        customerDetails: {
          first_name: customerName,
          phone: customerPhone
        },
        items: [{
          id: paymentId.slice(0, 8),
          price: grossAmount,
          quantity: 1,
          name: itemName.slice(0, 50) // Midtrans limits item name to 50 chars
        }]
      })

      // Store snap token on the payment record
      const { error: updateError } = await paymentsRepository.updateSnapToken(
        supabase, paymentId, result.token, orderId
      )
      if (updateError) {
        console.error('Failed to store snap token:', updateError)
      }

      return { data: { snap_token: result.token, redirect_url: result.redirect_url, midtrans_order_id: orderId }, error: null }
    } catch (err: any) {
      console.error('Midtrans createTransaction error:', err)
      return { data: null, error: new Error(err?.message || 'Failed to create Midtrans transaction') }
    }
  },

  /**
   * Process a Midtrans webhook notification.
   * Verifies the notification, maps status, and updates the payment.
   */
  processMidtransNotification: async (supabase: SupabaseClient, notificationBody: Record<string, unknown>) => {
    try {
      const { midtransService } = await import('./midtrans.service')
      const statusResponse = await midtransService.handleNotification(notificationBody)

      const { order_id, transaction_status, fraud_status, transaction_id, payment_type } = statusResponse

      // Extract payment ID from order_id (format: UUID-timestamp)
      const parts = order_id.split('-')
      const paymentId = parts.slice(0, 5).join('-')

      // Find payment by ID
      const { data: payment, error: findError } = await paymentsRepository.getById(supabase, paymentId)
      if (findError || !payment) {
        console.error('Webhook: Payment not found for order_id:', order_id, findError)
        return { data: null, error: findError ?? new Error(`Payment not found for order ${order_id}`) }
      }

      // Map Midtrans status to our internal status
      const newStatus = midtransService.mapTransactionStatus(transaction_status, fraud_status)

      // Update payment with Midtrans result
      const { error: updateError } = await paymentsRepository.updateMidtransResult(supabase, payment.id, {
        status: newStatus,
        midtrans_transaction_id: transaction_id,
        payment_method: payment_type,
        gateway_ref: `MT-${transaction_id || order_id}`
      })

      if (updateError) {
        console.error('Webhook: Failed to update payment:', updateError)
        return { data: null, error: updateError }
      }

      // If paid, run post-payment logic (invoice, lease, notifications)
      if (newStatus === 'paid') {
        const { error: rpcError } = await supabase.rpc('handle_successful_payment', {
          p_payment_id: payment.id
        })

        if (rpcError) {
          console.error('Webhook: handle_successful_payment RPC failed:', rpcError)
        }

        // Resolve tenant for invoice and notification
        const payAny = payment as any
        const tenantId = payAny.booking?.tenant?.id || payAny.service_request?.tenant?.id
        if (tenantId) {
          const tenant = payAny.booking?.tenant || payAny.service_request?.tenant
          const tenantName = tenant ? `${tenant.first_name} ${tenant.last_name || ''}`.trim() : 'Tenant'
          const invoiceNum = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
          await paymentsRepository.insertInvoice(supabase, {
            payment_id: payment.id,
            invoice_number: invoiceNum,
            issued_to: tenantId
          })

          const itemDesc = payAny.type === 'service'
            ? `service "${payAny.service_request?.service?.name || 'Service'}"`
            : `room ${payAny.booking?.room?.name || 'rent'}`

          await notificationsService.createNotificationSafe(supabase, {
            user_id: tenantId,
            content: `Your payment for ${itemDesc} of Rp ${Number(payment.amount).toLocaleString('id-ID')} was successful via Midtrans.`,
            type: payment.type === 'service' ? 'service' : 'payment'
          })

          await notificationsService.notifyManagementSafe(
            supabase,
            `Payment of Rp ${Number(payment.amount).toLocaleString('id-ID')} from ${tenantName} for ${itemDesc} has been received successfully via Midtrans.`,
            'payment'
          )
        }
      } else {
        // Webhook payment failed/expired/cancelled
        const payAny = payment as any
        const tenantId = payAny.booking?.tenant?.id || payAny.service_request?.tenant?.id
        if (tenantId) {
          const tenant = payAny.booking?.tenant || payAny.service_request?.tenant
          const tenantName = tenant ? `${tenant.first_name} ${tenant.last_name || ''}`.trim() : 'Tenant'
          const itemDesc = payAny.type === 'service'
            ? `service "${payAny.service_request?.service?.name || 'Service'}"`
            : `room ${payAny.booking?.room?.name || 'rent'}`

          await notificationsService.createNotificationSafe(supabase, {
            user_id: tenantId,
            content: `Your payment of Rp ${Number(payment.amount).toLocaleString('id-ID')} for ${itemDesc} status updated to: ${newStatus}.`,
            type: 'payment'
          })

          await notificationsService.notifyManagementSafe(
            supabase,
            `Payment of Rp ${Number(payment.amount).toLocaleString('id-ID')} from ${tenantName} for ${itemDesc} failed/expired (status: ${newStatus}).`,
            'payment'
          )
        }
      }

      return { data: { payment_id: payment.id, new_status: newStatus, transaction_id }, error: null }
    } catch (err: any) {
      console.error('Webhook processing error:', err)
      return { data: null, error: new Error(err?.message || 'Failed to process webhook notification') }
    }
  }
}