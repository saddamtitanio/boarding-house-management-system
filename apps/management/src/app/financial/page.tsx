"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/src/contexts/LanguageContext";
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
  Edit,
  Trash2,
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
  const { language, t } = useTranslation();
  const toast = useToast();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"summary" | "expenses" | "revenue" | "service">("summary");

  // Date filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Add/Edit expense modal state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formDesc, setFormDesc] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  
  const [userRole, setUserRole] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

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
      toast.error(t("financial.toast_load_failed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [startDate, endDate]);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (data.success) {
          setUserRole(data.data.role?.name || "employee");
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    }
    fetchProfile();
  }, []);

  const handleLogExpenseClick = () => {
    setEditingExpense(null);
    setFormAmount("");
    setFormCategory(CATEGORIES[0]);
    setFormDesc("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setIsAddExpenseOpen(true);
  };

  const handleEditClick = (exp: Expense) => {
    setEditingExpense(exp);
    setFormAmount(String(exp.amount));
    setFormCategory(exp.category);
    setFormDesc(exp.description || "");
    const dateOnly = exp.expense_date ? exp.expense_date.split("T")[0] : new Date().toISOString().split("T")[0];
    setFormDate(dateOnly);
    setIsAddExpenseOpen(true);
  };

  const handleSaveExpense = async () => {
    try {
      const url = editingExpense ? `/api/finance/${editingExpense.id}` : "/api/finance";
      const method = editingExpense ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
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
        setEditingExpense(null);
        setFormAmount("");
        setFormCategory(CATEGORIES[0]);
        setFormDesc("");
        setFormDate(new Date().toISOString().split("T")[0]);
        toast.success(editingExpense ? t("financial.toast_update_success") : t("financial.toast_save_success"));
        fetchFinancialData();
      } else {
        const data = await res.json();
        toast.error(t("financial.toast_save_failed") + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      toast.error(t("financial.toast_save_error") + err.message);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm(t("financial.confirm_delete"))) return;
    try {
      const res = await fetch(`/api/finance/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(t("financial.toast_delete_success"));
        fetchFinancialData();
      } else {
        const data = await res.json();
        toast.error(t("financial.toast_delete_failed") + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      toast.error(t("financial.toast_delete_error") + err.message);
    }
  };

  const formatCurrency = (val: number) => {
    return `Rp ${val.toLocaleString("id-ID")}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === "id" ? "id-ID" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getCategoryLabel = (cat: string) => {
    const key = `financial.category.${cat.toLowerCase().replace("/", "_").replace(" ", "_")}`;
    return t(key);
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
          <h1 className="text-3xl font-bold text-[#2C1A0E]">{t("financial.title")}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8B6F5E] font-medium">{t("financial.from")}</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-3 py-1.5 text-xs text-[#2C1A0E] focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8B6F5E] font-medium">{t("financial.to")}</span>
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
              {t("financial.clear_filter")}
            </KosanButton>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KosanCard className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-[#DFC9A8] uppercase tracking-wider">{t("financial.rent_revenue")}</p>
              <h3 className="text-xl font-bold text-[#5E9B72] mt-1">
                {formatCurrency(totalRentRevenue)}
              </h3>
            </div>
            <span className="p-2 rounded-xl bg-[#5E9B72]/15 text-[#5E9B72]">
              <TrendingUp size={20} />
            </span>
          </div>
        </KosanCard>

        <KosanCard className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-[#DFC9A8] uppercase tracking-wider">{t("financial.service_revenue")}</p>
              <h3 className="text-xl font-bold text-[#5E9B72] mt-1">
                {formatCurrency(totalServiceRevenue)}
              </h3>
            </div>
            <span className="p-2 rounded-xl bg-[#5E9B72]/15 text-[#5E9B72]">
              <TrendingUp size={20} />
            </span>
          </div>
        </KosanCard>

        <KosanCard className="relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-[#DFC9A8] uppercase tracking-wider">{t("financial.total_expenses")}</p>
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
              <p className="text-xs font-semibold text-[#DFC9A8] uppercase tracking-wider">{t("financial.net_profit")}</p>
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
          {t("financial.tab.summary")}
        </button>
        <button
          onClick={() => setActiveTab("expenses")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === "expenses"
              ? "border-[#553D2B] text-[#553D2B]"
              : "border-transparent text-[#8B6F5E] hover:text-[#553D2B]"
          }`}
        >
          {t("financial.tab.expenses")}
        </button>
        <button
          onClick={() => setActiveTab("revenue")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === "revenue"
              ? "border-[#553D2B] text-[#553D2B]"
              : "border-transparent text-[#8B6F5E] hover:text-[#553D2B]"
          }`}
        >
          {t("financial.tab.rent")}
        </button>
        <button
          onClick={() => setActiveTab("service")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
            activeTab === "service"
              ? "border-[#553D2B] text-[#553D2B]"
              : "border-transparent text-[#8B6F5E] hover:text-[#553D2B]"
          }`}
        >
          {t("financial.tab.service")}
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message={t("financial.loading")} />
      ) : (
        <div>
          {/* Tab: Overview */}
          {activeTab === "summary" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <KosanCard>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="text-lg font-bold text-[#2C1A0E]">{t("financial.recent_expenses")}</h2>
                  <KosanButton
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus size={14} />}
                  className="w-full sm:w-auto"
                    onClick={handleLogExpenseClick}
                  >
                    {t("financial.log_expense")}
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
                          <span className="font-semibold text-sm text-[#2C1A0E]">{getCategoryLabel(exp.category)}</span>
                        </div>
                        <p className="text-xs text-[#8B6F5E] mt-0.5">{exp.description || t("financial.no_desc")}</p>
                        <p className="text-[10px] text-[#8B6F5E] mt-0.5">{t("financial.recorded_by")} {exp.recorder?.first_name} {t("financial.on")} {formatDate(exp.expense_date)}</p>
                      </div>
                      <span className="font-bold text-sm text-[#C0444A]">{formatCurrency(exp.amount)}</span>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <p className="text-sm text-[#8B6F5E] text-center py-6">{t("financial.empty_expenses")}</p>
                  )}
                </div>
              </KosanCard>

              <KosanCard>
                <h2 className="text-lg font-bold text-[#2C1A0E] mb-4">{t("financial.recent_rent_revenue")}</h2>
                <div className="space-y-3">
                  {rentPayments.slice(0, 5).map((pmt) => (
                    <div
                      key={pmt.id}
                      className="p-3 rounded-xl bg-[#EFE3D0] border border-[#C8A96E]/20 flex flex-col gap-2.5"
                    >
                      {/* Top Row: Room Name & Amount */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <User size={13} className="text-[#8B6F5E] flex-shrink-0" />
                          <span className="font-semibold text-sm text-[#DFC9A8]">
                            {pmt.booking?.room?.name || "N/A"}
                          </span>
                        </div>
                        <p className="font-bold text-sm text-[#5E9B72] whitespace-nowrap">{formatCurrency(pmt.amount)}</p>
                      </div>

                      {/* Divider line */}
                      <div className="border-t border-[#C8A96E]/10"></div>

                      {/* Bottom Row: Tenant Info & Status */}
                      <div className="flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-[#DFC9A8]">
                            {t("financial.tenant")}: <span className="text-[#F5E6D3]">{pmt.booking?.tenant?.first_name} {pmt.booking?.tenant?.last_name || ""}</span>
                          </p>
                          <p className="text-[10px] text-[#8B6F5E] mt-1">{formatDate(pmt.created_at)}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <KosanBadge variant={pmt.status === "paid" ? "success" : pmt.status === "pending" ? "default" : "danger"}>
                            {t("financial.status." + pmt.status)}
                          </KosanBadge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {rentPayments.length === 0 && (
                    <p className="text-sm text-[#8B6F5E] text-center py-6">{t("financial.empty_rent_revenue")}</p>
                  )}
                </div>
              </KosanCard>

              <KosanCard>
                <h2 className="text-lg font-bold text-[#2C1A0E] mb-4">{t("financial.recent_service_revenue")}</h2>
                <div className="space-y-3">
                  {servicePayments.slice(0, 5).map((pmt) => (
                    <div
                      key={pmt.id}
                      className="p-3 rounded-xl bg-[#EFE3D0] border border-[#C8A96E]/20 flex flex-col gap-2.5"
                    >
                      {/* Top Row: Service Name & Amount */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Tag size={13} className="text-[#8B6F5E] flex-shrink-0" />
                          <span className="font-semibold text-sm text-[#DFC9A8]">
                            {pmt.service_request?.service?.name || t("financial.service_item")}
                          </span>
                        </div>
                        <p className="font-bold text-sm text-[#5E9B72] whitespace-nowrap">{formatCurrency(pmt.amount)}</p>
                      </div>

                      {/* Divider line */}
                      <div className="border-t border-[#C8A96E]/10"></div>

                      {/* Bottom Row: Tenant Info & Status */}
                      <div className="flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-[#DFC9A8]">
                            {t("financial.tenant")}: <span className="text-[#F5E6D3]">{pmt.service_request?.tenant?.first_name} {pmt.service_request?.tenant?.last_name || ""}</span>
                          </p>
                          <p className="text-[10px] text-[#8B6F5E] mt-1">{formatDate(pmt.created_at)}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <KosanBadge variant={pmt.status === "paid" ? "success" : pmt.status === "pending" ? "default" : "danger"}>
                            {t("financial.status." + pmt.status)}
                          </KosanBadge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {servicePayments.length === 0 && (
                    <p className="text-sm text-[#8B6F5E] text-center py-6">{t("financial.empty_service_revenue")}</p>
                  )}
                </div>
              </KosanCard>
            </div>
          )}

          {/* Tab: Expenses */}
          {activeTab === "expenses" && (
            <KosanCard>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-[#2C1A0E]">{t("financial.expenses_history")}</h2>
                <KosanButton
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus size={14} />}
                  className="w-full sm:w-auto"
                  onClick={handleLogExpenseClick}
                >
                  {t("financial.log_expense")}
                </KosanButton>
              </div>

              {/* Desktop table */}
              <div className="overflow-x-auto hidden sm:block">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#C8A96E]/20 text-[#8B6F5E] text-xs font-semibold uppercase">
                      <th className="pb-3">{t("financial.th.date")}</th>
                      <th className="pb-3">{t("financial.th.category")}</th>
                      <th className="pb-3">{t("financial.th.description")}</th>
                      <th className="pb-3">{t("financial.th.recorded_by")}</th>
                      <th className="pb-3 text-right">{t("financial.th.amount")}</th>
                      {userRole === 'admin' && <th className="pb-3 text-center">{t("financial.th.actions")}</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C8A96E]/10">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="text-[#2C1A0E]">
                        <td className="py-3.5 font-medium">{formatDate(exp.expense_date)}</td>
                        <td className="py-3.5">
                          <span className="px-2 py-1 rounded bg-[#DFC9A8]/40 text-[#553D2B] text-xs font-semibold">
                            {getCategoryLabel(exp.category)}
                          </span>
                        </td>
                        <td className="py-3.5 max-w-xs truncate">{exp.description}</td>
                        <td className="py-3.5 text-xs text-[#8B6F5E]">
                          {exp.recorder?.first_name} {exp.recorder?.last_name || ""}
                        </td>
                        <td className="py-3.5 text-right font-bold text-[#C0444A]">
                          {formatCurrency(exp.amount)}
                        </td>
                        {userRole === 'admin' && (
                          <td className="py-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditClick(exp)}
                                className="text-[#8B6F5E] hover:text-[#553D2B] transition-colors p-1 cursor-pointer"
                                title={t("financial.tooltip.edit")}
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="text-red-500 hover:text-red-700 transition-colors p-1 cursor-pointer"
                                title={t("financial.tooltip.delete")}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {expenses.length === 0 && (
                      <tr>
                        <td colSpan={userRole === 'admin' ? 6 : 5} className="py-6 text-center text-[#8B6F5E]">
                          {t("financial.empty_expenses")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile card layout */}
              <div className="sm:hidden divide-y divide-[#C8A96E]/10">
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    onClick={() => userRole === 'admin' && handleEditClick(exp)}
                    className={`py-3.5 space-y-2 ${userRole === 'admin' ? 'cursor-pointer hover:bg-[#C8A96E]/5 active:scale-[0.99] transition-all rounded-xl px-2 -mx-2' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#8B6F5E]">{formatDate(exp.expense_date)}</span>
                      <span className="px-2 py-0.5 rounded bg-[#DFC9A8]/40 text-[#553D2B] text-[10px] font-bold">
                        {getCategoryLabel(exp.category)}
                      </span>
                    </div>
                    <p className="text-sm text-[#DFC9A8]">{exp.description || t("financial.no_desc")}</p>
                    <div className="text-xs text-[#8B6F5E] mt-1">
                      {t("financial.recorded_by")}: <span className="text-[#DFC9A8]">{exp.recorder?.first_name} {exp.recorder?.last_name || ""}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#C8A96E]/5 mt-2">
                      <span className="font-bold text-sm text-[#C0444A] whitespace-nowrap">{formatCurrency(exp.amount)}</span>
                      {userRole === 'admin' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(exp);
                          }}
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-[#DFC9A8] bg-[#C8A96E]/15 hover:bg-[#C8A96E]/25 transition-colors px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                          <Edit size={12} />
                          {t("financial.action.edit")}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {expenses.length === 0 && (
                  <div className="text-center py-8 text-xs text-[#8B6F5E]">
                    {t("financial.empty_expenses")}
                  </div>
                )}
              </div>
            </KosanCard>
          )}

          {/* Tab: Rent Payments */}
          {activeTab === "revenue" && (
            <KosanCard>
              <h2 className="text-lg font-bold text-[#2C1A0E] mb-4">{t("financial.recent_rent_revenue")}</h2>
              {/* Desktop table */}
              <div className="overflow-x-auto hidden sm:block">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#C8A96E]/20 text-[#8B6F5E] text-xs font-semibold uppercase">
                      <th className="pb-3">{t("financial.th.date")}</th>
                      <th className="pb-3">{t("nav.rooms")}</th>
                      <th className="pb-3">{t("financial.tenant")}</th>
                      <th className="pb-3">{t("rooms.card.status")}</th>
                      <th className="pb-3 text-right">{t("financial.th.amount")}</th>
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
                            {t("financial.status." + pmt.status)}
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
                          {t("financial.empty_rent_revenue")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile card layout */}
              <div className="sm:hidden divide-y divide-[#C8A96E]/10">
                {rentPayments.map((pmt) => (
                  <div key={pmt.id} className="py-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#8B6F5E]">{formatDate(pmt.created_at)}</span>
                      <KosanBadge variant={pmt.status === "paid" ? "success" : pmt.status === "pending" ? "gold" : "danger"}>
                        {t("financial.status." + pmt.status)}
                      </KosanBadge>
                    </div>
                    <div className="flex items-center justify-between text-sm gap-2">
                      <span className="font-bold text-[#2C1A0E]">{pmt.booking?.room?.name || "N/A"}</span>
                      <span className="font-bold text-[#5E9B72] whitespace-nowrap">{formatCurrency(pmt.amount)}</span>
                    </div>
                    <p className="text-xs text-[#8B6F5E]">
                      {t("financial.tenant")}: {pmt.booking?.tenant?.first_name} {pmt.booking?.tenant?.last_name || ""}
                    </p>
                  </div>
                ))}
                {rentPayments.length === 0 && (
                  <div className="text-center py-8 text-xs text-[#8B6F5E]">
                    {t("financial.empty_rent_revenue")}
                  </div>
                )}
              </div>
            </KosanCard>
          )}

          {/* Tab: Service Payments */}
          {activeTab === "service" && (
            <KosanCard>
              <h2 className="text-lg font-bold text-[#2C1A0E] mb-4">{t("financial.tab.service")}</h2>
              {/* Desktop table */}
              <div className="overflow-x-auto hidden sm:block">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#C8A96E]/20 text-[#8B6F5E] text-xs font-semibold uppercase">
                      <th className="pb-3">{t("financial.th.date")}</th>
                      <th className="pb-3">{t("nav.services")}</th>
                      <th className="pb-3">{t("financial.tenant")}</th>
                      <th className="pb-3">{t("rooms.card.status")}</th>
                      <th className="pb-3 text-right">{t("financial.th.amount")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#C8A96E]/10">
                    {servicePayments.map((pmt) => (
                      <tr key={pmt.id} className="text-[#2C1A0E]">
                        <td className="py-3.5 font-medium">{formatDate(pmt.created_at)}</td>
                        <td className="py-3.5">{pmt.service_request?.service?.name || t("financial.service_item")}</td>
                        <td className="py-3.5 text-xs text-[#8B6F5E]">
                          {pmt.service_request?.tenant?.first_name} {pmt.service_request?.tenant?.last_name || ""}
                        </td>
                        <td className="py-3.5">
                          <KosanBadge variant={pmt.status === "paid" ? "success" : pmt.status === "pending" ? "gold" : "danger"}>
                            {t("financial.status." + pmt.status)}
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
                          {t("financial.empty_service_revenue")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile card layout */}
              <div className="sm:hidden divide-y divide-[#C8A96E]/10">
                {servicePayments.map((pmt) => (
                  <div key={pmt.id} className="py-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#8B6F5E]">{formatDate(pmt.created_at)}</span>
                      <KosanBadge variant={pmt.status === "paid" ? "success" : pmt.status === "pending" ? "gold" : "danger"}>
                        {t("financial.status." + pmt.status)}
                      </KosanBadge>
                    </div>
                    <div className="flex items-center justify-between text-sm gap-2">
                      <span className="font-bold text-[#2C1A0E]">{pmt.service_request?.service?.name || t("financial.service_item")}</span>
                      <span className="font-bold text-[#5E9B72] whitespace-nowrap">{formatCurrency(pmt.amount)}</span>
                    </div>
                    <p className="text-xs text-[#8B6F5E]">
                      {t("financial.tenant")}: {pmt.service_request?.tenant?.first_name} {pmt.service_request?.tenant?.last_name || ""}
                    </p>
                  </div>
                ))}
                {servicePayments.length === 0 && (
                  <div className="text-center py-8 text-xs text-[#8B6F5E]">
                    {t("financial.empty_service_revenue")}
                  </div>
                )}
              </div>
            </KosanCard>
          )}
        </div>
      )}

      {/* Log Expense Modal */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#EFE3D0] rounded-2xl p-6 w-full max-w-md border border-[#C8A96E]/30 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[#2C1A0E] mb-4">
              {editingExpense ? t("financial.modal.title_edit") : t("financial.modal.title_add")}
            </h2>

            <div className="space-y-4">
              <KosanInput
                label={t("financial.modal.amount")}
                placeholder="e.g., 250000"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                leftIcon={<span className="text-[#8B6F5E]">Rp</span>}
                required
              />

              <div>
                <label className="text-sm font-semibold text-[#2C1A0E] mb-1.5 block">
                  {t("financial.modal.category")}
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-4 py-3 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#553D2B]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryLabel(cat)}
                    </option>
                  ))}
                </select>
              </div>

              <KosanInput
                label={t("financial.modal.description")}
                placeholder={t("financial.modal.description_placeholder")}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                required
              />

              <div>
                <label className="text-sm font-semibold text-[#2C1A0E] mb-1.5 block">
                  {t("financial.modal.date")}
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

            <div className="space-y-3 mt-6">
              <div className="flex gap-3">
                <KosanButton variant="secondary" fullWidth onClick={() => {
                  setIsAddExpenseOpen(false);
                  setEditingExpense(null);
                }}>
                  {t("financial.modal.cancel")}
                </KosanButton>
                <KosanButton variant="primary" fullWidth onClick={handleSaveExpense}>
                  {editingExpense ? t("financial.modal.save_changes") : t("financial.modal.save_expense")}
                </KosanButton>
              </div>
              {editingExpense && (
                <button
                  onClick={() => {
                    if (confirm(t("financial.confirm_delete"))) {
                      handleDeleteExpense(editingExpense.id);
                      setIsAddExpenseOpen(false);
                      setEditingExpense(null);
                    }
                  }}
                  className="w-full py-2.5 text-xs font-bold text-red-400 hover:text-red-500 bg-[#C0444A]/10 hover:bg-[#C0444A]/20 rounded-xl transition-colors cursor-pointer border border-[#C0444A]/20"
                >
                  {t("financial.tooltip.delete") || "Delete Expense"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}