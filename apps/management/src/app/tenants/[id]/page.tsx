"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  DollarSign,
  ConciergeBell,
  UserCheck,
  MessageSquare,
  Clock,
  Pencil,
  Save,
  X,
  CreditCard,
  Building,
  Bell,
} from "lucide-react";
import { KosanCard, KosanButton, KosanBadge, LoadingSpinner, useToast } from "@sbhms/ui";
import { useTranslation } from "@/src/contexts/LanguageContext";
import { createClient } from "@/src/app/lib/supabase/client";

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { language, t } = useTranslation();
  const tenantId = params?.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [visitorLogs, setVisitorLogs] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"leases" | "payments" | "services" | "guests">("leases");
  
  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [firstNameDraft, setFirstNameDraft] = useState("");
  const [lastNameDraft, setLastNameDraft] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");

  const supabase = createClient();

  const fetchTenantData = async () => {
    try {
      setLoading(true);
      // Fetch profile
      const profileRes = await fetch(`/api/tenants/${tenantId}`);
      const profileData = await profileRes.json();
      if (profileData.success) {
        setProfile(profileData.data);
        setFirstNameDraft(profileData.data.first_name || "");
        setLastNameDraft(profileData.data.last_name || "");
        setPhoneDraft(profileData.data.phone || "");
      } else {
        throw new Error(profileData.error || "Failed to load tenant profile");
      }

      // Fetch all bookings, payments, service requests, visitor logs in parallel
      const [bookingsRes, paymentsRes, servicesRes, visitorsRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/payments"),
        fetch("/api/services/request"),
        fetch("/api/visitor/logs"),
      ]);

      const [bookingsData, paymentsData, servicesData, visitorsData] = await Promise.all([
        bookingsRes.json(),
        paymentsRes.json(),
        servicesRes.json(),
        visitorsRes.json(),
      ]);

      if (bookingsData.success) {
        // Filter bookings for this tenant
        const tenantBookings = (bookingsData.data || []).filter(
          (b: any) => b.tenant?.id === tenantId
        );
        setBookings(tenantBookings);
      }

      if (paymentsData.success) {
        // Filter payments where booking tenant ID or service request tenant ID matches
        const tenantPayments = (paymentsData.data || []).filter(
          (p: any) =>
            p.booking?.tenant?.id === tenantId ||
            p.service_request?.tenant?.id === tenantId
        );
        setPayments(tenantPayments);
      }

      if (Array.isArray(servicesData)) {
        const tenantServices = servicesData.filter((s: any) => s.tenant?.id === tenantId);
        setServiceRequests(tenantServices);
      }

      if (Array.isArray(visitorsData)) {
        const tenantVisitors = visitorsData.filter((v: any) => v.tenant?.id === tenantId);
        setVisitorLogs(tenantVisitors);
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load tenant data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchTenantData();
    }
  }, [tenantId]);

  const handleSaveProfile = async () => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstNameDraft,
          last_name: lastNameDraft,
          phone: phoneDraft,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setIsEditing(false);
        toast.success(language === "id" ? "Profil berhasil diperbarui" : "Profile updated successfully");
        fetchTenantData();
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    }
  };

  if (loading) {
    return <LoadingSpinner message={language === "id" ? "Memuat profil penyewa..." : "Loading tenant profile..."} />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F5E6D3] flex flex-col items-center justify-center gap-4">
        <User size={48} className="text-[#8B6F5E]" />
        <p className="text-lg font-bold text-[#2C1A0E]">Tenant not found</p>
        <KosanButton variant="secondary" className="cursor:pointer" onClick={() => router.back()}>
          <ArrowLeft size={14} className="mr-1" /> Back
        </KosanButton>
      </div>
    );
  }

  const tenantName = `${profile.first_name} ${profile.last_name || ""}`.trim();
  const joinedDate = new Date(profile.created_at).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const activeBooking = bookings.find((b: any) => b.status === "approved" || b.status === "active" || b.status === "completed");
  const hasActiveLease = !!activeBooking;

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

  return (
    <div className="min-h-screen bg-[#F5E6D3] p-4 sm:p-6">
      {/* Back button and page title */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-[#8B6F5E] hover:text-[#C8A96E] hover:translate-x-[-2px] mb-3 transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft size={16} /> {language === "id" ? "Kembali" : "Back"}
        </button>
        <h1 className="text-3xl font-bold text-[#2C1A0E]">
          {language === "id" ? "Detail Penyewa" : "Tenant Profile"}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left Column: Profile Card */}
        <div className="flex flex-col gap-6">
          <KosanCard padding="md" className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-[#C8A96E] text-[#3d2b1f] font-bold text-3xl flex items-center justify-center shadow-md mb-4 overflow-hidden">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={tenantName} className="w-full h-full object-cover" />
              ) : (
                profile.first_name.charAt(0).toUpperCase()
              )}
            </div>

            {isEditing ? (
              <div className="w-full space-y-3 mb-4 text-left">
                <div>
                  <label className="text-xs font-semibold text-[#8B6F5E] block mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstNameDraft}
                    onChange={(e) => setFirstNameDraft(e.target.value)}
                    className="w-full bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-3 py-2 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#553D2B] transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8B6F5E] block mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastNameDraft}
                    onChange={(e) => setLastNameDraft(e.target.value)}
                    className="w-full bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-3 py-2 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#553D2B] transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8B6F5E] block mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={phoneDraft}
                    onChange={(e) => setPhoneDraft(e.target.value)}
                    className="w-full bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-3 py-2 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#553D2B] transition-all"
                  />
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-[#2C1A0E] mb-1">{tenantName}</h2>
                <div className="flex gap-2 mb-4">
                  <KosanBadge variant={hasActiveLease ? "success" : "danger"}>
                    {hasActiveLease ? (language === "id" ? "Aktif" : "Active Tenant") : (language === "id" ? "Mantan Penyewa" : "Inactive")}
                  </KosanBadge>
                  {activeBooking?.room && (
                    <KosanBadge variant="gold">
                      {activeBooking.room.name}
                    </KosanBadge>
                  )}
                </div>
              </>
            )}

            {/* Profile Fields List */}
            <div className="w-full border-t border-[#C8A96E]/20 pt-4 text-left space-y-3 mb-6 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[#8B6F5E] flex items-center gap-1.5">
                  <Phone size={14} /> Phone
                </span>
                <span className="font-semibold text-[#2C1A0E]">
                  {isEditing ? phoneDraft : (profile.phone || "—")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8B6F5E] flex items-center gap-1.5">
                  <Calendar size={14} /> Joined
                </span>
                <span className="font-semibold text-[#2C1A0E]">{joinedDate}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col gap-2.5">
              {isEditing ? (
                <div className="flex gap-2 w-full">
                  <KosanButton
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setFirstNameDraft(profile.first_name || "");
                      setLastNameDraft(profile.last_name || "");
                      setPhoneDraft(profile.phone || "");
                      setIsEditing(false);
                    }}
                  >
                    <X size={14} className="mr-1" /> Cancel
                  </KosanButton>
                  <KosanButton
                    variant="primary"
                    className="flex-1"
                    onClick={handleSaveProfile}
                  >
                    <Save size={14} className="mr-1" /> Save
                  </KosanButton>
                </div>
              ) : (
                <>
                  <Link href={`/messages?userId=${tenantId}`} className="w-full">
                    <KosanButton variant="primary" className="w-full justify-center">
                      <MessageSquare size={14} className="mr-1.5" />
                      {language === "id" ? "Hubungi Penyewa" : "Message Tenant"}
                    </KosanButton>
                  </Link>
                  <KosanButton
                    variant="secondary"
                    className="w-full justify-center"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil size={14} className="mr-1.5" />
                    {language === "id" ? "Ubah Profil" : "Edit Profile"}
                  </KosanButton>
                </>
              )}
            </div>
          </KosanCard>
        </div>

        {/* Right Columns: Detail Tabs */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <KosanCard padding="md" className="flex flex-col h-full">
            {/* Tab navigation headers */}
            <div className="flex border-b border-[#C8A96E]/20 overflow-x-auto whitespace-nowrap mb-6 scrollbar-none">
              {(["leases", "payments", "services", "guests"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 capitalize cursor-pointer
                    ${
                      activeTab === tab
                        ? "border-[#C8A96E] text-[#C8A96E]"
                        : "border-transparent text-[#8B6F5E] hover:text-[#553D2B]"
                    }
                  `}
                >
                  {tab === "leases" && <Building size={14} />}
                  {tab === "payments" && <CreditCard size={14} />}
                  {tab === "services" && <ConciergeBell size={14} />}
                  {tab === "guests" && <UserCheck size={14} />}
                  {tab === "leases" && (language === "id" ? "Sewa" : "Leases")}
                  {tab === "payments" && (language === "id" ? "Pembayaran" : "Payments")}
                  {tab === "services" && (language === "id" ? "Layanan" : "Services")}
                  {tab === "guests" && (language === "id" ? "Tamu" : "Guests")}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              
              {/* Leases Tab */}
              {activeTab === "leases" && (
                <div className="space-y-4">
                  {bookings.length === 0 ? (
                    <p className="text-sm text-[#8B6F5E] text-center py-8">
                      {language === "id" ? "Tidak ada riwayat sewa." : "No lease history found."}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-[#C8A96E]/20 text-[#8B6F5E] text-xs font-semibold uppercase">
                            <th className="pb-3">{language === "id" ? "Kamar" : "Room"}</th>
                            <th className="pb-3">{language === "id" ? "Mulai" : "Start Date"}</th>
                            <th className="pb-3">{language === "id" ? "Selesai" : "End Date"}</th>
                            <th className="pb-3">{language === "id" ? "Status" : "Status"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#C8A96E]/10">
                          {bookings.map((b) => (
                            <tr key={b.id} className="text-[#2C1A0E]">
                              <td className="py-3.5 font-medium">
                                {b.room ? (
                                  <Link
                                    href={`/rooms/${b.room.id}`}
                                    className="hover:underline hover:text-[#C8A96E] transition-colors"
                                  >
                                    {b.room.name}
                                  </Link>
                                ) : (
                                  "Unknown"
                                )}
                              </td>
                              <td className="py-3.5">{formatDate(b.start_date)}</td>
                              <td className="py-3.5 text-xs">{formatDate(b.end_date)}</td>
                              <td className="py-3.5">
                                <KosanBadge
                                  variant={
                                    b.status === "approved" || b.status === "active" || b.status === "completed"
                                      ? "success"
                                      : b.status === "pending"
                                      ? "gold"
                                      : "danger"
                                  }
                                >
                                  {b.status}
                                </KosanBadge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === "payments" && (
                <div className="space-y-4">
                  {payments.length === 0 ? (
                    <p className="text-sm text-[#8B6F5E] text-center py-8">
                      {language === "id" ? "Tidak ada riwayat pembayaran." : "No payment history found."}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-[#C8A96E]/20 text-[#8B6F5E] text-xs font-semibold uppercase">
                            <th className="pb-3">{language === "id" ? "Tanggal" : "Date"}</th>
                            <th className="pb-3">{language === "id" ? "Deskripsi" : "Item"}</th>
                            <th className="pb-3">{language === "id" ? "Jumlah" : "Amount"}</th>
                            <th className="pb-3">{language === "id" ? "Status" : "Status"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#C8A96E]/10">
                          {payments.map((p) => {
                            const desc =
                              p.type === "service" && p.service_request?.service?.name
                                ? `Service: ${p.service_request.service.name}`
                                : p.booking?.room?.name
                                ? `Rent: Room ${p.booking.room.name}`
                                : "General Payment";
                            return (
                              <tr key={p.id} className="text-[#2C1A0E]">
                                <td className="py-3.5">{formatDate(p.created_at)}</td>
                                <td className="py-3.5 max-w-[200px] truncate" title={desc}>
                                  {p.booking?.room?.id ? (
                                    <Link href={`/rooms/${p.booking.room.id}`} className="hover:underline hover:text-[#C8A96E] transition-colors">
                                      {desc}
                                    </Link>
                                  ) : (
                                    desc
                                  )}
                                </td>
                                <td className="py-3.5 font-bold text-[#5E9B72]">
                                  {formatCurrency(p.amount)}
                                </td>
                                <td className="py-3.5">
                                  <KosanBadge
                                    variant={
                                      p.status === "paid"
                                        ? "success"
                                        : p.status === "pending"
                                        ? "gold"
                                        : "danger"
                                    }
                                  >
                                    {p.status}
                                  </KosanBadge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Services Tab */}
              {activeTab === "services" && (
                <div className="space-y-4">
                  {serviceRequests.length === 0 ? (
                    <p className="text-sm text-[#8B6F5E] text-center py-8">
                      {language === "id" ? "Tidak ada pengajuan layanan." : "No service requests found."}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {serviceRequests.map((s) => (
                        <div
                          key={s.id}
                          className="p-3.5 rounded-xl border border-[#C8A96E]/20 bg-[#EFE3D0]/20 flex justify-between items-start flex-wrap gap-2"
                        >
                          <div>
                            <h4 className="font-bold text-[#2C1A0E]">
                              {s.service?.name || "General Service"}
                            </h4>
                            <p className="text-xs text-[#8B6F5E] mt-1 italic">
                              "{s.note || "No notes added"}"
                            </p>
                            <span className="text-[10px] text-[#8B6F5E] mt-2 block flex items-center gap-1">
                              <Clock size={12} /> {formatDate(s.created_at)}
                            </span>
                          </div>
                          <KosanBadge
                            variant={
                              s.status === "completed"
                                ? "success"
                                : s.status === "pending"
                                ? "gold"
                                : "danger"
                            }
                          >
                            {s.status}
                          </KosanBadge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Guests Tab */}
              {activeTab === "guests" && (
                <div className="space-y-4">
                  {visitorLogs.length === 0 ? (
                    <p className="text-sm text-[#8B6F5E] text-center py-8">
                      {language === "id" ? "Tidak ada riwayat kunjungan tamu." : "No visitor logs found."}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-[#C8A96E]/20 text-[#8B6F5E] text-xs font-semibold uppercase">
                            <th className="pb-3">{language === "id" ? "Tamu" : "Guest"}</th>
                            <th className="pb-3">{language === "id" ? "Keperluan" : "Purpose"}</th>
                            <th className="pb-3">{language === "id" ? "Masuk" : "Check In"}</th>
                            <th className="pb-3">{language === "id" ? "Keluar" : "Check Out"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#C8A96E]/10">
                          {visitorLogs.map((v) => (
                            <tr key={v.id} className="text-[#2C1A0E]">
                              <td className="py-3.5">
                                <span className="font-semibold">{v.visitor_name}</span>
                                {v.visitor_phone && (
                                  <span className="text-xs text-[#8B6F5E] block">{v.visitor_phone}</span>
                                )}
                              </td>
                              <td className="py-3.5 text-xs text-[#8B6F5E] max-w-[120px] truncate" title={v.purpose}>
                                {v.purpose || "—"}
                              </td>
                              <td className="py-3.5 text-xs">{formatDate(v.check_in_at)}</td>
                              <td className="py-3.5 text-xs">
                                {v.check_out_at ? (
                                  formatDate(v.check_out_at)
                                ) : (
                                  <KosanBadge variant="gold">Inside</KosanBadge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>
          </KosanCard>
        </div>
      </div>

      {/* Page Footer */}
      <footer className="mt-8 pt-4 border-t border-[#C8A96E]/10 text-center text-xs text-[#A68D7D]">
        <p>© {new Date().getFullYear()} Kosan Mama · Management System · Tenant Directory</p>
      </footer>
    </div>
  );
}
