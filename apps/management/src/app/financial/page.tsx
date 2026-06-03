"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Calendar,
  Tag,
  FileText,
  User,
  Search,
} from "lucide-react";
import {
  KosanCard,
  KosanButton,
  KosanBadge,
  KosanInput,
  useToast,
  LoadingSpinner,
} from "@sbhms/ui";

interface FinancialSummary {
  total_revenue: number;
  total_expenses: number;
  net_balance: number;
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  expense_date: string;
  created_at: string;
  recorder?: {
    first_name: string;
    last_name: string;
  };
}

interface Payment {
  id: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "refunded" | "cancelled" | "expired";
  gateway_ref: string | null;
  created_at: string;
  type?: string;
  booking?: {
    room?: {
      name: string;
    };
    tenant?: {
      first_name: string;
      last_name: string;
    };
  };
  service_request?: {
    service?: {
      name: string;
    };
    tenant?: {
      first_name: string;
      last_name: string;
    };
  };
}

const CATEGORIES = [
  "Maintenance",
  "Utilities",
  "Cleaning Supplies",
  "Internet",
  "Marketing/Ads",
  "Tax",
  "Salary",
  "Other",
];

export default function FinancialPage() {
  const toast = useToast();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"summary" | "expenses" | "revenue" | "service">("summary");

  // Date filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Add expense modal state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formDesc, setFormDesc] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);

      const [summaryRes, expensesRes, paymentsRes] = await Promise.all([
        fetch(`/api/finance?type=summary&${queryParams.toString()}`),
        fetch(`/api/finance?type=expenses&${queryParams.toString()}`),
        fetch("/api/payments"),
      ]);

      const summaryData = await summaryRes.json();
      const expensesData = await expensesRes.json();
      const paymentsData = await paymentsRes.json();

      if (summaryData.success) {
        setSummary(summaryData.data);
      }
      if (expensesData.success) {
        setExpenses(expensesData.data || []);
      }
      if (paymentsData.success) {
        setPayments(paymentsData.data || []);
      }
    } catch (error) {
      console.error("Error loading financial records:", error);
      toast.error("Failed to load financial records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [startDate, endDate]);

  const handleCreateExpense = async () => {
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(formAmount) || 0,
          category: formCategory,
          description: formDesc,
          expense_date: formDate,
        }),
      });

      if (res.ok) {
        setIsAddExpenseOpen(false);
        setFormAmount("");
        setFormCategory(CATEGORIES[0]);
        setFormDesc("");
        setFormDate(new Date().toISOString().split("T")[0]);
        toast.success("Expense logged successfully.");
        fetchFinancialData();
      } else {
        const data = await res.json();
        toast.error("Failed to save expense log: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      toast.error("Error logging expense: " + err.message);
    }
  };

  const formatCurrency = (val: number) => {
    return `Rp ${val.toLocaleString("id-ID")}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Perform date filtering on payments client-side
  const filteredPayments = payments.filter((pmt) => {
    if (startDate && new Date(pmt.created_at) < new Date(startDate)) return false;
    if (endDate && new Date(pmt.created_at) > new Date(endDate + "T23:59:59")) return false;
    return true;
  });

  const rentPayments = filteredPayments.filter(pmt => pmt.type !== 'service');
  const servicePayments = filteredPayments.filter(pmt => pmt.type === 'service');

  const totalRentRevenue = rentPayments.filter(pmt => pmt.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalServiceRevenue = servicePayments.filter(pmt => pmt.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netProfit = totalRentRevenue + totalServiceRevenue - totalExpenses;

  return (
    <div className="min-h-screen bg-[#F5E6D3] p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#2C1A0E]">Financials</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8B6F5E] font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-3 py-1.5 text-xs text-[#2C1A0E] focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8B6F5E] font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-3 py-1.5 text-xs text-[#2C1A0E] focus:outline-none"
            />
          </div>
          {(startDate || endDate) && (
            <KosanButton
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
            >
              Clear Filter
            </KosanButton>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KosanCard className="relative overflow-hidden bg-gradient-to-br from-[#DFC9A8] to-[#EFE3D0]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-[#8B6F5E] uppercase tracking-wider">Rent Revenue</p>
              <h3 className="text-xl font-bold text-[#5E9B72] mt-1">
                {formatCurrency(totalRentRevenue)}
              </h3>
            </div>
            <span className="p-2 rounded-xl bg-[#5E9B72]/15 text-[#5E9B72]">
              <TrendingUp size={20} />
            </span>
          </div>
        </KosanCard>

        <KosanCard className="relative overflow-hidden bg-gradient-to-br from-[#DFC9A8] to-[#EFE3D0]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-[#8B6F5E] uppercase tracking-wider">Service Revenue</p>
              <h3 className="text-xl font-bold text-[#5E9B72] mt-1">
                {formatCurrency(totalServiceRevenue)}
              </h3>
            </div>
            <span className="p-2 rounded-xl bg-[#5E9B72]/15 text-[#5E9B72]">
              <TrendingUp size={20} />
            </span>
          </div>
        </KosanCard>

        <KosanCard className="relative overflow-hidden bg-gradient-to-br from-[#DFC9A8] to-[#EFE3D0]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-[#8B6F5E] uppercase tracking-wider">Total Expenses</p>
              <h3 className="text-xl font-bold text-[#C0444A] mt-1">
                {formatCurrency(totalExpenses)}
              </h3>
            </div>
            <span className="p-2 rounded-xl bg-[#C0444A]/15 text-[#C0444A]">
              <TrendingDown size={20} />
            </span>
          </div>
        </KosanCard>

        <KosanCard className="relative overflow-hidden bg-[#553D2B]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-[#8B6F5E] uppercase tracking-wider">Net Profit</p>
              <h3 className="text-xl font-bold text-white mt-1">
                {formatCurrency(netProfit)}
              </h3>
            </div>
            <span className="p-2 rounded-xl bg-white/10 text-white">
              <DollarSign size={20} />
            </span>
          </div>
        </KosanCard>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-[#C8A96E]/20 mb-6 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === "summary"
              ? "border-[#553D2B] text-[#553D2B]"
              : "border-transparent text-[#8B6F5E] hover:text-[#553D2B]"
          }`}
        >
          Overview Summary
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === "expenses"
              ? "border-[#553D2B] text-[#553D2B]"
              : "border-transparent text-[#8B6F5E] hover:text-[#553D2B]"
          }`}
        >
          Operating Expenses
        </button>
        <button
          onClick={() => setActiveTab("revenue")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === "revenue"
              ? "border-[#553D2B] text-[#553D2B]"
              : "border-transparent text-[#8B6F5E] hover:text-[#553D2B]"
          }`}
        >
          Rent Payments
        </button>
        <button
          onClick={() => setActiveTab("service")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === "service"
              ? "border-[#553D2B] text-[#553D2B]"
              : "border-transparent text-[#8B6F5E] hover:text-[#553D2B]"
          }`}
        >
          Service Payments
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading financial records…" />
      ) : (
        <div>
          {/* Tab: Overview */}
          {activeTab === "summary" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <KosanCard>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="text-lg font-bold text-[#2C1A0E]">Recent Operations Expenses</h2>
                  <KosanButton
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus size={14} />}
                  className="w-full sm:w-auto"
                    onClick={() => setIsAddExpenseOpen(true)}
                  >
                    Log Expense
                  </KosanButton>
                </div>
                <div className="space-y-3">
                  {expenses.slice(0, 5).map((exp) => (
                    <div
                      key={exp.id}
                      className="p-3 rounded-xl bg-[#EFE3D0] border border-[#C8A96E]/20 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Tag size={13} className="text-[#8B6F5E]" />
                          <span className="font-semibold text-sm text-[#2C1A0E]">{exp.category}</span>
                        </div>
                        <p className="text-xs text-[#8B6F5E] mt-0.5">{exp.description || "No description"}</p>
                        <p className="text-[10px] text-[#8B6F5E] mt-0.5">Recorded by {exp.recorder?.first_name} on {formatDate(exp.expense_date)}</p>
                      </div>
                      <span className="font-bold text-sm text-[#C0444A]">{formatCurrency(exp.amount)}</span>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <p className="text-sm text-[#8B6F5E] text-center py-6">No expenses logged for this range.</p>
                  )}
                </div>
              </KosanCard>

              <KosanCard>
                <h2 className="text-lg font-bold text-[#2C1A0E] mb-4">Recent Rent Revenue</h2>
                <div className="space-y-3">
                  {rentPayments.slice(0, 5).map((pmt) => (
                    <div
                      key={pmt.id}
                      className="p-3 rounded-xl bg-[#EFE3D0] border border-[#C8A96E]/20 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <User size={13} className="text-[#8B6F5E]" />
                          <span className="font-semibold text-sm text-[#2C1A0E]">
                            {pmt.booking?.room?.name || "N/A"}
                          </span>
                        </div>
                        <p className="text-xs text-[#8B6F5E] mt-0.5">
                          Tenant: {pmt.booking?.tenant?.first_name} {pmt.booking?.tenant?.last_name || ""}
                        </p>
                        <p className="text-[10px] text-[#8B6F5E] mt-0.5">{formatDate(pmt.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-[#5E9B72]">{formatCurrency(pmt.amount)}</p>
                        <span className="inline-block mt-0.5 text-[9px] uppercase tracking-wide px-1.5 py-0.5 bg-[#5E9B72]/15 text-[#5E9B72] rounded-md font-semibold">
                          {pmt.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {rentPayments.length === 0 && (
                    <p className="text-sm text-[#8B6F5E] text-center py-6">No payment records found.</p>
                  )}
                </div>
              </KosanCard>

              <KosanCard>
                <h2 className="text-lg font-bold text-[#2C1A0E] mb-4">Recent Service Revenue</h2>
                <div className="space-y-3">
                  {servicePayments.slice(0, 5).map((pmt) => (
                    <div
                      key={pmt.id}
                      className="p-3 rounded-xl bg-[#EFE3D0] border border-[#C8A96E]/20 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Tag size={13} className="text-[#8B6F5E]" />
                          <span className="font-semibold text-sm text-[#2C1A0E]">
                            {pmt.service_request?.service?.name || "Service Item"}
                          </span>
                        </div>
                        <p className="text-xs text-[#8B6F5E] mt-0.5">
                          Tenant: {pmt.service_request?.tenant?.first_name} {pmt.service_request?.tenant?.last_name || ""}
                        </p>
                        <p className="text-[10px] text-[#8B6F5E] mt-0.5">{formatDate(pmt.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-[#5E9B72]">{formatCurrency(pmt.amount)}</p>
                        <span className="inline-block mt-0.5 text-[9px] uppercase tracking-wide px-1.5 py-0.5 bg-[#5E9B72]/15 text-[#5E9B72] rounded-md font-semibold">
                          {pmt.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {servicePayments.length === 0 && (
                    <p className="text-sm text-[#8B6F5E] text-center py-6">No service payments found.</p>
                  )}
                </div>
              </KosanCard>
            </div>
          )}

          {/* Tab: Expenses */}
          {activeTab === "expenses" && (
            <KosanCard>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-[#2C1A0E]">Operational Expenses History</h2>
                <KosanButton
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  className="w-full sm:w-auto"
                  onClick={() => setIsAddExpenseOpen(true)}
                >
                  Log Expense
                </KosanButton>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#C8A96E]/20 text-[#8B6F5E] text-xs font-semibold uppercase">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Description</th>
                      <th className="pb-3">Recorded By</th>
                      <th className="pb-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C8A96E]/10">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="text-[#2C1A0E]">
                        <td className="py-3.5 font-medium">{formatDate(exp.expense_date)}</td>
                        <td className="py-3.5">
                          <span className="px-2 py-1 rounded bg-[#DFC9A8]/40 text-[#553D2B] text-xs font-semibold">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3.5 max-w-xs truncate">{exp.description}</td>
                        <td className="py-3.5 text-xs text-[#8B6F5E]">
                          {exp.recorder?.first_name} {exp.recorder?.last_name || ""}
                        </td>
                        <td className="py-3.5 text-right font-bold text-[#C0444A]">
                          {formatCurrency(exp.amount)}
                        </td>
                      </tr>
                    ))}
                    {expenses.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-[#8B6F5E]">
                          No expenses logged.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </KosanCard>
          )}

          {/* Tab: Rent Payments */}
          {activeTab === "revenue" && (
            <KosanCard>
              <h2 className="text-lg font-bold text-[#2C1A0E] mb-4">Rent Collection History</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#C8A96E]/20 text-[#8B6F5E] text-xs font-semibold uppercase">
                      <th className="pb-3">Paid Date</th>
                      <th className="pb-3">Room</th>
                      <th className="pb-3">Tenant</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Amount Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C8A96E]/10">
                    {rentPayments.map((pmt) => (
                      <tr key={pmt.id} className="text-[#2C1A0E]">
                        <td className="py-3.5 font-medium">{formatDate(pmt.created_at)}</td>
                        <td className="py-3.5">{pmt.booking?.room?.name || "N/A"}</td>
                        <td className="py-3.5 text-xs text-[#8B6F5E]">
                          {pmt.booking?.tenant?.first_name} {pmt.booking?.tenant?.last_name || ""}
                        </td>
                        <td className="py-3.5">
                          <KosanBadge variant={pmt.status === "paid" ? "success" : pmt.status === "pending" ? "gold" : "danger"}>
                            {pmt.status}
                          </KosanBadge>
                        </td>
                        <td className="py-3.5 text-right font-bold text-[#5E9B72]">
                          {formatCurrency(pmt.amount)}
                        </td>
                      </tr>
                    ))}
                    {rentPayments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-[#8B6F5E]">
                          No payments recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </KosanCard>
          )}

          {/* Tab: Service Payments */}
          {activeTab === "service" && (
            <KosanCard>
              <h2 className="text-lg font-bold text-[#2C1A0E] mb-4">Service Payments History</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#C8A96E]/20 text-[#8B6F5E] text-xs font-semibold uppercase">
                      <th className="pb-3">Paid Date</th>
                      <th className="pb-3">Service</th>
                      <th className="pb-3">Tenant</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Amount Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C8A96E]/10">
                    {servicePayments.map((pmt) => (
                      <tr key={pmt.id} className="text-[#2C1A0E]">
                        <td className="py-3.5 font-medium">{formatDate(pmt.created_at)}</td>
                        <td className="py-3.5">{pmt.service_request?.service?.name || "Service Item"}</td>
                        <td className="py-3.5 text-xs text-[#8B6F5E]">
                          {pmt.service_request?.tenant?.first_name} {pmt.service_request?.tenant?.last_name || ""}
                        </td>
                        <td className="py-3.5">
                          <KosanBadge variant={pmt.status === "paid" ? "success" : pmt.status === "pending" ? "gold" : "danger"}>
                            {pmt.status}
                          </KosanBadge>
                        </td>
                        <td className="py-3.5 text-right font-bold text-[#5E9B72]">
                          {formatCurrency(pmt.amount)}
                        </td>
                      </tr>
                    ))}
                    {servicePayments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-[#8B6F5E]">
                          No service payments recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </KosanCard>
          )}
        </div>
      )}

      {/* Log Expense Modal */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#EFE3D0] rounded-2xl p-6 w-full max-w-md border border-[#C8A96E]/30 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[#2C1A0E] mb-4">Record Operating Expense</h2>

            <div className="space-y-4">
              <KosanInput
                label="Amount (Rp)"
                placeholder="e.g., 250000"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                leftIcon={<span className="text-[#8B6F5E]">Rp</span>}
                required
              />

              <div>
                <label className="text-sm font-semibold text-[#2C1A0E] mb-1.5 block">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-4 py-3 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#553D2B]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <KosanInput
                label="Description"
                placeholder="What was this expense for?"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                required
              />

              <div>
                <label className="text-sm font-semibold text-[#2C1A0E] mb-1.5 block">
                  Date
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-4 py-3 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#553D2B]"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <KosanButton variant="secondary" fullWidth onClick={() => setIsAddExpenseOpen(false)}>
                Cancel
              </KosanButton>
              <KosanButton variant="primary" fullWidth onClick={handleCreateExpense}>
                Save Expense
              </KosanButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}