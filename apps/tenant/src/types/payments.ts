/* ─────────────────────────── Payments*/
export interface Payment {
  id: string; // uuid
  booking_id: string; // uuid
  amount: number; // numeric
  status: PaymentStatus;
  gateway_ref: string; 
  created_at: string; // timestamptz
}

export type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded";

export interface PaymentMethod {
  id: string;
  label: string;
  type: "bank" | "cash" | "card";
}

export const paymentMethods: PaymentMethod[] = [
  { id: "bca", label: "BCA Transfer", type: "bank" },
  { id: "bni", label: "BNI Transfer", type: "bank" },
  { id: "mandiri", label: "Mandiri Transfer", type: "bank" },
  { id: "card", label: "Credit / Debit Card", type: "card" },
  { id: "cash", label: "Cash (On-site)", type: "cash" },
];

/*Invoices*/
export interface Invoice {
  id: string; // uuid
  payment_id: string; // uuid 
  generated_date: string; // timestamptz
  invoice_number: string; // unique number
  issued_to: string; // uuid 
}

/*Response types*/
export interface PaymentsResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
}

export interface InvoiceResponse extends Invoice {
  payment?: Payment;
}

/*Request types*/
export interface CreatePaymentRequest {
  booking_id: string;
  amount: number;
  method: string; // "bca" | "bni" | "mandiri" | "card" | "cash"
}

export interface PaymentWebhookPayload {
  gateway_ref: string;
  status: PaymentStatus;
  amount: number;
  timestamp: string;
}
