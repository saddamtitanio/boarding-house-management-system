"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Banknote,
  CheckCircle2,
  XCircle,
  Download,
  ChevronRight,
  ChevronLeft,
  Clock,
  AlertCircle,
  ArrowLeft,
  FileText,
  Calendar,
  Building2,
  Hash,
} from "lucide-react";
import type { Payment, PaymentStatus, PaymentMethod, Invoice } from "@/src/types/payments";
import { paymentMethods } from "@/src/types/payments";
import "./payment.css";

type View = "main" | "pay" | "success" | "failure" | "invoice";

interface PaymentDisplayData extends Payment {
  room: string;
  customer: string;
  method: string;
  date: string;
  formattedAmount: string;
}
// TODO : Modify this part for backend intergration
const display_payments: PaymentDisplayData[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    booking_id: "550e8400-e29b-41d4-a716-446655440001",
    room: "Room 101",
    customer: "Backend Job",
    method: "card",
    formattedAmount: "Rp 1.200.000",
    amount: 1200000,
    date: "11.01.2026",
    status: "completed",
    gateway_ref: "REF-1234567890",
    created_at: "2026-01-11T00:00:00Z",
  },
];
// TODO : Modify this part for backend integration
const display_upcomingPayments = [
  { name: "Backend Bro", room: "Room 100", due: "01 - 04 - 2026" },
];

// Import types
const PAYMENT_METHODS: { id: string; label: string; type: "bank" | "cash" | "card" }[] = [
  { id: "bca", label: "BCA Transfer", type: "bank" },
  { id: "bni", label: "BNI Transfer", type: "bank" },
  { id: "mandiri", label: "Mandiri Transfer", type: "bank" },
  { id: "card", label: "Credit / Debit Card", type: "card" },
  { id: "cash", label: "Cash (On-site)", type: "cash" },
];

/* helpers*/
const StatusBadge = ({ status }: { status: PaymentStatus }) => {
  const cfg: Record<PaymentStatus, { label: string; className: string }> = {
    completed: { label: "Completed", className: "badge-complete" },
    pending:   { label: "Pending",   className: "badge-pending"  },
    processing: { label: "Processing", className: "badge-waiting" },
    failed:    { label: "Failed",    className: "badge-failed"   },
    refunded:  { label: "Refunded",  className: "badge-failed"   },
  };
  const { label, className } = cfg[status];
  return <span className={`badge ${className}`}>{label}</span>;
};

/*main page*/
export default function PaymentsPage() {
  const [view, setView]               = useState<View>("main");
  const [selectedMethod, setMethod]   = useState<string | null>(null);
  const [selectedPayment, setPayment] = useState<PaymentDisplayData | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [cardNum, setCardNum]         = useState("");
  const [expiry, setExpiry]           = useState("");
  const [cvv, setCvv]                 = useState("");
  const [accountNum, setAccountNum]   = useState("");
  const [payments, setPayments]       = useState<PaymentDisplayData[]>(display_payments);
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setPayments(display_payments);
      } catch (error) {
        console.error("Failed to fetch payments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);
// TODO : Handle payment for real payments, THIS RETURNS TRUE ALWAYS
  const handlePay = () => {
    const ok = 1 > 0.2;
    setView(ok ? "success" : "failure");
  };
// TODO : Create a real download and print real invoice according to the database
  const handleDownloadInvoice = async (paymentId: string) => {
    try {
      alert("Waiting for backend");
    } catch (error) {
      console.error("Failed to download invoice:", error);
      alert("Failed to download invoice");
    }
  };

  const reset = () => {
    setView("main");
    setMethod(null);
    setCardNum(""); setExpiry(""); setCvv(""); setAccountNum("");
  };

  /* ── invoice view ── */
  if (view === "invoice" && selectedPayment) {
    return (
      <div className="page-wrapper">
        <button className="back-btn" onClick={() => setView("main")}>
          <ArrowLeft size={16} /> Back to Payments
        </button>

        <div className="invoice-card">
          <div className="invoice-header">
            <div className="invoice-brand">
              <span className="brand-dot" />
              <span className="invoice-brand-name">Kosan Mama</span>
            </div>
            <div className="invoice-meta">
              <span className="invoice-label">INVOICE</span>
              <span className="invoice-id"># KM-{selectedPayment.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>

          <div className="invoice-divider" />

          <div className="invoice-grid">
            <div className="invoice-section">
              <p className="inv-section-title">Billed To</p>
              <p className="inv-value-lg">{selectedPayment.customer}</p>
              <p className="inv-muted">{selectedPayment.room} · Kosan Mama</p>
            </div>
            <div className="invoice-section" style={{ textAlign: "right" }}>
              <p className="inv-section-title">Date Issued</p>
              <p className="inv-value-lg">{selectedPayment.date !== "—" ? selectedPayment.date : "Pending"}</p>
            </div>
          </div>

          <div className="invoice-table">
            <div className="inv-table-row inv-table-head">
              <span>Description</span><span>Period</span><span style={{ textAlign: "right" }}>Amount</span>
            </div>
            <div className="inv-table-row">
              <span>Monthly Rent</span>
              <span>{selectedPayment.date}</span>
              <span style={{ textAlign: "right", fontWeight: 600 }}>{selectedPayment.formattedAmount}</span>
            </div>
          </div>

          <div className="invoice-total-row">
            <span>Total</span>
            <span className="invoice-total-amount">{selectedPayment.formattedAmount}</span>
          </div>

          <div className="invoice-divider" />

          <div className="invoice-footer">
            <div>
              <p className="inv-section-title">Payment Method</p>
              <p className="inv-muted">{selectedPayment.method}</p>
            </div>
            <StatusBadge status={selectedPayment.status} />
          </div>

          <button className="btn-primary invoice-download-btn">
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>
    );
  }

  /* ── success view ── */
  if (view === "success") {
    return (
      <div className="page-wrapper feedback-wrapper">
        <div className="feedback-card">
          <div className="feedback-icon success-icon">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="feedback-title">Payment Successful!</h2>
          <p className="feedback-sub">Your payment of <strong>Rp 1.200.000</strong> has been received.</p>
          <div className="feedback-detail-grid">
            <div className="feedback-detail">
              <span className="fd-label">Room</span>
              <span className="fd-value">Room 101</span>
            </div>
            <div className="feedback-detail">
              <span className="fd-label">Method</span>
              <span className="fd-value">{PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label ?? "—"}</span>
            </div>
            <div className="feedback-detail">
              <span className="fd-label">Reference</span>
              <span className="fd-value">KM-{Date.now().toString().slice(-6)}</span>
            </div>
            <div className="feedback-detail">
              <span className="fd-label">Date</span>
              <span className="fd-value">{new Date().toLocaleDateString("en-GB")}</span>
            </div>
          </div>
          <div className="feedback-actions">
            <button className="btn-outline" onClick={() => { setView("invoice"); setPayment(payments[0]); }}>
              <FileText size={15} /> View Invoice
            </button>
            <button className="btn-primary" onClick={reset}>Back to Payments</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── failure view ── */
  if (view === "failure") {
    return (
      <div className="page-wrapper feedback-wrapper">
        <div className="feedback-card">
          <div className="feedback-icon failure-icon">
            <XCircle size={48} />
          </div>
          <h2 className="feedback-title">Payment Failed</h2>
          <p className="feedback-sub">We couldn't process your payment. Please check your details and try again.</p>
          <div className="failure-reasons">
            <p className="failure-reason-item"><AlertCircle size={14} /> Insufficient funds or incorrect details</p>
            <p className="failure-reason-item"><AlertCircle size={14} /> Transaction declined by bank</p>
          </div>
          <div className="feedback-actions">
            <button className="btn-outline" onClick={reset}>Cancel</button>
            <button className="btn-primary" onClick={() => setView("pay")}>Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── payment flow view ── */
  if (view === "pay") {
    return (
      <div className="page-wrapper">
        
        <div className="page-title-row">
            <div className="pay-header-block">
              <button className="btn-primary" onClick={reset}>
                Back to Menu <ChevronLeft size={15} />
              </button>
              <h1 className="page-title">Make a Payment</h1>
            </div>
          </div>

        <div className="pay-layout">
          {/* summary card */}
          <div className="pay-summary-card">
            <p className="section-label">Payment Summary</p>
            <div className="summary-row"><Building2 size={15} className="summary-icon" /><span>Room 101 — Kosan Mama</span></div>
            <div className="summary-row"><Calendar size={15} className="summary-icon" /><span>Due: 01 April 2026</span></div>
            <div className="summary-row"><Hash size={15} className="summary-icon" /><span>Monthly Rent</span></div>
            <div className="summary-divider" />
            <div className="summary-total">
              <span>Total Due</span>
              <span className="summary-amount">Rp 1.200.000</span>
            </div>
          </div>

          {/* method selection */}
          <div className="pay-method-card">
            <p className="section-label">Select Payment Method</p>
            <div className="method-list">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  className={`method-item ${selectedMethod === m.id ? "method-active" : ""}`}
                  onClick={() => setMethod(m.id)}
                >
                  <span className="method-icon">
                    {m.type === "bank" && <Banknote size={18} />}
                    {m.type === "card" && <CreditCard size={18} />}
                    {m.type === "cash" && <Banknote size={18} />}
                  </span>
                  <span className="method-label">{m.label}</span>
                  {selectedMethod === m.id && <CheckCircle2 size={16} className="method-check" />}
                </button>
              ))}
            </div>

            {/* dynamic form */}
            {selectedMethod && selectedMethod !== "cash" && (
              <div className="pay-form">
                {(selectedMethod === "card") && (
                  <>
                    <p className="form-label">Card Number</p>
                    <input
                      className="pay-input"
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      value={cardNum}
                      onChange={(e) => setCardNum(e.target.value.replace(/[^\d]/g, "").replace(/(.{4})/g, "$1 ").trim())}
                    />
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <p className="form-label">Expiry</p>
                        <input className="pay-input" placeholder="MM / YY" maxLength={7} value={expiry} onChange={(e) => setExpiry(e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p className="form-label">CVV</p>
                        <input className="pay-input" placeholder="•••" maxLength={3} value={cvv} onChange={(e) => setCvv(e.target.value)} />
                      </div>
                    </div>
                  </>
                )}
                {(selectedMethod === "bca" || selectedMethod === "bni" || selectedMethod === "mandiri") && (
                  <>
                    <div className="bank-info-box">
                      <p className="bank-info-title">Transfer to</p>
                      <p className="bank-info-value">
                        {selectedMethod === "bca" && "BCA — 1234567890"}
                        {selectedMethod === "bni" && "BNI — 9876543210"}
                        {selectedMethod === "mandiri" && "Mandiri — 1122334455"}
                      </p>
                      <p className="bank-info-name">a/n Kosan Mama</p>
                    </div>
                    <p className="form-label">Your Account Number</p>
                    <input className="pay-input" placeholder="Enter your account number" value={accountNum} onChange={(e) => setAccountNum(e.target.value)} />
                  </>
                )}
              </div>
            )}

            {selectedMethod === "cash" && (
              <div className="cash-info-box">
                <Banknote size={20} className="cash-icon" />
                <p>Please pay in person at the management office. Bring this reference number: <strong>KM-APR-2026</strong></p>
              </div>
            )}

            <button
              className={`btn-primary pay-btn ${!selectedMethod ? "btn-disabled" : ""}`}
              disabled={!selectedMethod}
              onClick={handlePay}
            >
              Confirm Payment — Rp 1.200.000
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── main view ── */
  return (
    <div className="page-wrapper">
      <div className="page-title-row">
        <h1 className="page-title">Payments</h1>
        <button className="btn-primary" onClick={() => setView("pay")}>
          Make a Payment <ChevronRight size={15} />
        </button>
      </div>

      {/* payment history */}
      <section className="card-section">
        <p className="section-label">Payment History</p>
        <div className="table-wrapper">
          <table className="pay-table">
            <thead>
              <tr>
                <th>ID</th><th>Room</th><th>Customer</th>
                <th>Method</th><th>Date</th><th>Amount</th>
                <th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="td-id">{p.id.slice(0, 8)}</td>
                  <td>{p.room}</td>
                  <td>{p.customer}</td>
                  <td>{p.method}</td>
                  <td>{p.date}</td>
                  <td className="td-amount">{p.formattedAmount}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>
                    <button
                      className="invoice-link"
                      onClick={() => {
                        setPayment(p);
                        setView("invoice");
                        handleDownloadInvoice(p.id);
                      }}
                    >
                      <Download size={14} /> Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* bottom two panels */}
      <div className="bottom-grid">
        {/* upcoming */}
        <section className="card-section">
          <p className="section-label">Closest Due Date</p>
          <div className="upcoming-list">
            {display_upcomingPayments.map((u, i) => (
              <div key={i} className="upcoming-item">
                <div className="upcoming-avatar">{u.name.charAt(0)}</div>
                <div className="upcoming-info">
                  <span className="upcoming-name">{u.name}</span>
                  <span className="upcoming-meta">{u.room}</span>
                  <span className="upcoming-due">
                    <Clock size={11} /> Due {u.due}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* payment options */}
        <section className="card-section">
          <p className="section-label">Payment Options</p>
          <table className="options-table">
            <thead>
              <tr><th>#</th><th>Method</th><th>Status</th></tr>
            </thead>
            <tbody>
              {[{ id: 1, label: "BCA Transfer" }, { id: 2, label: "BNI Transfer" }, { id: 3, label: "Mandiri Transfer" }, { id: 4, label: "Cash" }, { id: 5, label: "Credit / Debit Card" }].map((m) => (
                <tr key={m.id}>
                  <td>{m.id}</td>
                  <td><strong>{m.label}</strong></td>
                  <td>
                    <span className="option-active">
                      <CheckCircle2 size={13} /> Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

    </div>
  );
}
