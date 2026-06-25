"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, Phone, Calendar, MessageSquare, Search, ArrowRight, Eye } from "lucide-react";
import { KosanCard, KosanButton, KosanBadge, KosanSearchBar, LoadingSpinner, useToast } from "@sbhms/ui";
import { useTranslation } from "@/src/contexts/LanguageContext";

export default function TenantsDirectoryPage() {
  const toast = useToast();
  const { language, t } = useTranslation();
  
  const [tenants, setTenants] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tenantsRes, bookingsRes] = await Promise.all([
        fetch("/api/tenants"),
        fetch("/api/bookings"),
      ]);

      const tenantsData = await tenantsRes.json();
      const bookingsData = await bookingsRes.json();

      if (tenantsData.success) {
        setTenants(tenantsData.data || []);
      }
      if (bookingsData.success) {
        setBookings(bookingsData.data || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(language === "id" ? "Gagal memuat data penyewa" : "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getActiveRoom = (tenantId: string) => {
    const activeBooking = bookings.find(
      (b: any) =>
        b.tenant?.id === tenantId &&
        (b.status === "approved" || b.status === "active" || b.status === "completed")
    );
    return activeBooking?.room?.name || null;
  };

  const filteredTenants = tenants.filter((tenant) => {
    const fullName = `${tenant.first_name || ""} ${tenant.last_name || ""}`.toLowerCase();
    const phone = (tenant.phone || "").toLowerCase();
    const activeRoom = (getActiveRoom(tenant.id) || "").toLowerCase();
    const term = search.toLowerCase();

    return (
      fullName.includes(term) ||
      phone.includes(term) ||
      activeRoom.includes(term)
    );
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#F5E6D3] p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#2C1A0E]">
            {language === "id" ? "Daftar Penyewa" : "Tenants Directory"}
          </h1>
          <p className="text-sm text-[#8B6F5E] mt-1">
            {language === "id"
              ? "Kelola dan tinjau profil aktif, kamar, dan riwayat penyewa"
              : "Manage and review active profiles, rooms, and history of all tenants"}
          </p>
        </div>
      </div>

      {/* Main Catalog Card */}
      <KosanCard>
        <div className="mb-4">
          <KosanSearchBar
            placeholder={language === "id" ? "Cari penyewa berdasarkan nama, telepon, atau kamar..." : "Search tenants by name, phone, or room..."}
            value={search}
            onChange={setSearch}
          />
        </div>

        {loading ? (
          <LoadingSpinner message={language === "id" ? "Memuat penyewa..." : "Loading tenants directory..."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#C8A96E]/20 text-[#8B6F5E] text-xs font-semibold uppercase">
                  <th className="pb-3">{language === "id" ? "Nama" : "Name"}</th>
                  <th className="pb-3">{language === "id" ? "Kamar Aktif" : "Active Room"}</th>
                  <th className="pb-3">{language === "id" ? "Telepon" : "Phone"}</th>
                  <th className="pb-3">{language === "id" ? "Tanggal Bergabung" : "Joined Date"}</th>
                  <th className="pb-3 text-right">{language === "id" ? "Tindakan" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C8A96E]/10">
                {filteredTenants.map((tenant) => {
                  const activeRoom = getActiveRoom(tenant.id);
                  return (
                    <tr key={tenant.id} className="text-[#2C1A0E]">
                      <td className="py-3.5">
                        <Link href={`/tenants/${tenant.id}`} className="flex items-center gap-2.5 hover:text-[#C8A96E] transition-colors group">
                          <div className="w-8 h-8 rounded-full bg-[#DFC9A8] text-[#553D2B] font-bold text-sm flex items-center justify-center shadow-sm overflow-hidden">
                            {tenant.avatar_url ? (
                              <img src={tenant.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              tenant.first_name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="font-bold group-hover:underline">
                            {tenant.first_name} {tenant.last_name || ""}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3.5">
                        {activeRoom ? (
                          <KosanBadge variant="success">{activeRoom}</KosanBadge>
                        ) : (
                          <span className="text-xs text-[#8B6F5E] italic">
                            {language === "id" ? "Tidak Aktif" : "Inactive"}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-[#8B6F5E] font-medium">{tenant.phone || "—"}</td>
                      <td className="py-3.5 text-xs text-[#8B6F5E]">{formatDate(tenant.created_at)}</td>
                      <td className="py-3.5 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/messages?userId=${tenant.id}`} title="Message tenant">
                            <KosanButton variant="secondary" size="sm" className="cursor-pointer">
                              <MessageSquare size={13} />
                            </KosanButton>
                          </Link>
                          <Link href={`/tenants/${tenant.id}`}>
                            <KosanButton variant="primary" size="sm" className="cursor-pointer">
                              <Eye size={13} className="mr-1" /> {language === "id" ? "Lihat" : "View"}
                            </KosanButton>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredTenants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#8B6F5E]">
                      {language === "id" ? "Tidak ada penyewa yang cocok." : "No tenants matched the search filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </KosanCard>
    </div>
  );
}
