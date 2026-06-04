import MidtransClient from 'midtrans-client'

// Midtrans configuration from environment variables
const serverKey = process.env.MIDTRANS_SERVER_KEY || ''
const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''
const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true'

function getSnap() {
  return new MidtransClient.Snap({
    isProduction,
    serverKey,
    clientKey
  })
}

export interface MidtransCustomerDetails {
  first_name: string
  last_name?: string
  email?: string
  phone?: string
}

export interface MidtransItemDetail {
  id: string
  price: number
  quantity: number
  name: string
}

export interface CreateSnapTransactionParams {
  orderId: string
  grossAmount: number
  customerDetails: MidtransCustomerDetails
  items: MidtransItemDetail[]
}

export interface SnapTransactionResult {
  token: string
  redirect_url: string
}

export interface MidtransNotificationResult {
  order_id: string
  transaction_status: string
  fraud_status: string
  transaction_id: string
  payment_type: string
  gross_amount: string
  status_code: string
}

export const midtransService = {
  /**
   * Create a Midtrans Snap transaction and return the token + redirect URL.
   */
  createSnapTransaction: async (params: CreateSnapTransactionParams): Promise<SnapTransactionResult> => {
    const snap = getSnap()

    const parameter = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.grossAmount
      },
      customer_details: {
        first_name: params.customerDetails.first_name,
        last_name: params.customerDetails.last_name || '',
        phone: params.customerDetails.phone || ''
      },
      item_details: params.items,
      callbacks: {
        finish: process.env.NEXT_PUBLIC_TENANT_URL
          ? `${process.env.NEXT_PUBLIC_TENANT_URL}/payments`
          : 'http://localhost:3000/payments'
      }
    }

    const transaction = await snap.createTransaction(parameter)
    return {
      token: transaction.token,
      redirect_url: transaction.redirect_url
    }
  },

  /**
   * Verify and parse a Midtrans webhook notification.
   * Returns the parsed status response after verifying the signature.
   */
  handleNotification: async (notificationBody: Record<string, unknown>): Promise<MidtransNotificationResult> => {
    const snap = getSnap()
    const statusResponse = await snap.transaction.notification(notificationBody)
    return statusResponse as MidtransNotificationResult
  },

  /**
   * Map Midtrans transaction_status to our internal payment status.
   */
  mapTransactionStatus: (transactionStatus: string, fraudStatus: string): string => {
    if (transactionStatus === 'capture') {
      return fraudStatus === 'accept' ? 'paid' : 'pending'
    }

    switch (transactionStatus) {
      case 'settlement':
        return 'paid'
      case 'pending':
        return 'pending'
      case 'deny':
      case 'cancel':
        return 'cancelled'
      case 'expire':
        return 'expired'
      case 'refund':
      case 'partial_refund':
        return 'refunded'
      default:
        return 'failed'
    }
  }
}
