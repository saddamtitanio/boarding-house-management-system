import { SupabaseClient } from '@supabase/supabase-js'

const baseSelect = `
  id,
  booking_id,
  service_request_id,
  amount,
  status,
  gateway_ref,
  created_at,
  type,
  expires_at,
  snap_token,
  midtrans_order_id,
  midtrans_transaction_id,
  payment_method,
  booking:bookings (
    id,
    start_date,
    end_date,
    room:rooms (
      id,
      name,
      floor,
      price
    ),
    tenant:profiles (
      id,
      first_name,
      last_name,
      phone
    )
  ),
  service_request:service_requests (
    id,
    note,
    status,
    service:services (
      id,
      name,
      price
    ),
    tenant:profiles!service_requests_tenant_id_fkey (
      id,
      first_name,
      last_name,
      phone
    )
  )
`

export const paymentsRepository = {
  // List all payments
  listAll: (supabase: SupabaseClient) => {
    return supabase
      .from('payments')
      .select(baseSelect)
      .order('created_at', { ascending: false })
  },

  // List payments for a specific tenant (RLS handles scoping)
  listByTenant: (supabase: SupabaseClient, tenantId: string) => {
    return supabase
      .from('payments')
      .select(baseSelect)
      .order('created_at', { ascending: false })
  },

  // Get payment by ID
  getById: (supabase: SupabaseClient, id: string) => {
    return supabase
      .from('payments')
      .select(`
        *,
        booking:bookings (
          *,
          room:rooms (*),
          tenant:profiles (*)
        ),
        service_request:service_requests (
          *,
          service:services (*),
          tenant:profiles!service_requests_tenant_id_fkey (*)
        ),
        invoices (*)
      `)
      .eq('id', id)
      .single()
  },

  // Create payment record
  insert: (supabase: SupabaseClient, payload: {
    booking_id?: string
    service_request_id?: string
    amount: number
    status?: string
    gateway_ref?: string
    expires_at?: string
    type?: string
  }) => {
    return supabase
      .from('payments')
      .insert({
        booking_id: payload.booking_id,
        service_request_id: payload.service_request_id,
        amount: payload.amount,
        status: payload.status ?? 'pending',
        gateway_ref: payload.gateway_ref,
        expires_at: payload.expires_at,
        type: payload.type ?? 'booking'
      })
      .select()
      .single()
  },

  // Update status of payment
  updateStatus: (
    supabase: SupabaseClient,
    id: string,
    payload: { status: string; gateway_ref?: string }
  ) => {
    return supabase
      .from('payments')
      .update({
        status: payload.status,
        gateway_ref: payload.gateway_ref,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
  },

  // Get invoice by payment ID
  getInvoiceByPayment: (supabase: SupabaseClient, paymentId: string) => {
    return supabase
      .from('invoices')
      .select('*')
      .eq('payment_id', paymentId)
      .maybeSingle()
  },

  // Insert a new invoice
  insertInvoice: (
    supabase: SupabaseClient,
    payload: { payment_id: string; invoice_number: string; issued_to: string }
  ) => {
    return supabase
      .from('invoices')
      .insert({
        payment_id: payload.payment_id,
        invoice_number: payload.invoice_number,
        issued_to: payload.issued_to
      })
      .select()
      .single()
  },

  // Store Midtrans Snap token and order ID on a payment
  updateSnapToken: (
    supabase: SupabaseClient,
    id: string,
    snapToken: string,
    midtransOrderId: string
  ) => {
    return supabase
      .from('payments')
      .update({
        snap_token: snapToken,
        midtrans_order_id: midtransOrderId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
  },

  // Find a payment by its Midtrans order ID (used in webhook lookups)
  findByMidtransOrderId: (supabase: SupabaseClient, orderId: string) => {
    return supabase
      .from('payments')
      .select(baseSelect)
      .eq('midtrans_order_id', orderId)
      .single()
  },

  // Update payment with Midtrans transaction result
  updateMidtransResult: (
    supabase: SupabaseClient,
    id: string,
    payload: {
      status: string
      midtrans_transaction_id?: string
      payment_method?: string
      gateway_ref?: string
    }
  ) => {
    return supabase
      .from('payments')
      .update({
        status: payload.status,
        midtrans_transaction_id: payload.midtrans_transaction_id,
        payment_method: payload.payment_method,
        gateway_ref: payload.gateway_ref,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
  }
}

