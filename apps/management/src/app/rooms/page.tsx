"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  BedDouble,
  Users,
  Wrench,
  Home,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Clock,
  Eye,
} from "lucide-react";
import {
  KosanButton,
  KosanSearchBar,
  KosanCard,
  KosanBadge,
  KosanInput,
  useToast,
  LoadingSpinner,
} from "@sbhms/ui";
import { useTranslation } from "@/src/contexts/LanguageContext";

const STATUS_CONFIG = {
  occupied: { label: "Occupied", color: "danger" as const, icon: <Users size={12} /> },
  vacant: { label: "Vacant", color: "success" as const, icon: <Home size={12} /> },
  cleaning: { label: "Cleaning", color: "gold" as const, icon: <Wrench size={12} /> },
};

type RoomStatus = keyof typeof STATUS_CONFIG;

// Format currency
const formatRupiah = (amount: number) => {
  return `Rp ${amount.toLocaleString()}/mo`;
};

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

// Add Room Modal Component
function AddRoomModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (room: any) => Promise<void>;
}) {
  const { language, t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    floor: "1",
    price: "",
    description: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async () => {
    await onSave({
      name: formData.name,
      floor: parseInt(formData.floor),
      price: parseFloat(formData.price),
      description: formData.description,
      status: "vacant",
    });
    setFormData({ name: "", floor: "1", price: "", description: "" });
    onClose();
  };

   return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#EFE3D0] rounded-2xl p-6 w-full max-w-md border border-[#C8A96E]/30 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-[#2C1A0E] mb-4">{language === "id" ? "Tambah Kamar Baru" : "Add New Room"}</h2>

        <div className="space-y-4">
          <KosanInput
            label={language === "id" ? "Nama/Nomor Kamar" : "Room Name/Number"}
            placeholder="e.g., 106"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div>
            <label className="text-sm font-semibold text-[#2C1A0E] mb-1.5 block">
              {t("dashboard.map.floor")}
            </label>
            <select
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              className="w-full bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-4 py-3 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#553D2B]"
            >
              <option value="1">{language === "id" ? "Lantai 1" : "1st Floor"}</option>
              <option value="2">{language === "id" ? "Lantai 2" : "2nd Floor"}</option>
              <option value="3">{language === "id" ? "Lantai 3" : "3rd Floor"}</option>
            </select>
          </div>

          <KosanInput
            label={t("rooms.card.rent")}
            placeholder="e.g., 1500000"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            leftIcon={<span className="text-[#8B6F5E]">Rp</span>}
            required
          />

          <KosanInput
            label={language === "id" ? "Deskripsi" : "Description"}
            placeholder={language === "id" ? "Detail kamar, fasilitas, dll." : "Room details, amenities, etc."}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="flex gap-3 mt-6">
          <KosanButton variant="secondary" fullWidth onClick={onClose}>
            {language === "id" ? "Batal" : "Cancel"}
          </KosanButton>
          <KosanButton variant="primary" fullWidth onClick={handleSubmit}>
            {t("rooms.add_room")}
          </KosanButton>
        </div>
      </div>
    </div>
  );
}

// Room Card Component
function RoomCard({ room, onClick }: { room: any; onClick: () => void }) {
  const { language, t } = useTranslation();
  const isOccupied = room.status === "occupied";
  const statusConfig = STATUS_CONFIG[room.status as RoomStatus] || STATUS_CONFIG.vacant;

  // Find all active leases to display tenant info (supports roommates)
  const activeLeases = room.leases?.filter((l: any) => l.status === "active") || [];
  const tenantNames = activeLeases.map((l: any) => 
    `${l.tenant?.first_name || ""} ${l.tenant?.last_name || ""}`.trim()
  ).filter(Boolean);
  const tenantText = tenantNames.length > 0 ? tenantNames.join(", ") : "Unknown Tenant";
  const activeLease = activeLeases[0];

  const firstImage = room.room_images?.[0]?.url;

   return (
    <KosanCard hoverable className="h-full flex flex-col">
      {/* Room Image Header */}
      <div className="h-40 w-full bg-[#C8A96E]/10 rounded-xl overflow-hidden mb-4 relative select-none">
        {firstImage ? (
          <img
            src={firstImage}
            alt={room.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#8B6F5E]/50 gap-2">
            <BedDouble size={36} />
            <span className="text-[10px] uppercase font-bold tracking-wider">{language === "id" ? "Tidak ada foto" : "No photos"}</span>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-[#2C1A0E]">{room.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <MapPin size={12} className="text-[#8B6F5E]" />
            <span className="text-xs text-[#8B6F5E]">{t("dashboard.map.floor")} {room.floor}</span>
          </div>
        </div>
        <KosanBadge variant={statusConfig.color}>
          <span className="flex items-center gap-1">
            {statusConfig.icon}
            {t("rooms.filter." + room.status)}
          </span>
        </KosanBadge>
      </div>

      {isOccupied && activeLeases.length > 0 && activeLease ? (
        <div className="space-y-3 mb-4 flex-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[#8B6F5E]">
              <User size={14} />
              <span>{activeLeases.length > 1 ? t("rooms.card.tenants") : t("rooms.card.tenant")}</span>
            </div>
            <span className="font-semibold text-[#2C1A0E] text-right truncate max-w-[180px]" title={tenantText}>
              {tenantText}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[#8B6F5E]">
              <DollarSign size={14} />
              <span>{t("rooms.card.rent")}</span>
            </div>
            <span className="font-semibold text-[#2C1A0E]">
              {formatRupiah(Number(room.price))}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[#8B6F5E]">
              <Calendar size={14} />
              <span>{t("rooms.card.next_due")}</span>
            </div>
            <span className="font-semibold text-[#C0444A]">
              {formatDate(activeLease.end_date)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[#8B6F5E]">
              <Clock size={14} />
              <span>{t("rooms.card.since")}</span>
            </div>
            <span className="font-semibold text-[#2C1A0E]">
              {formatDate(activeLease.start_date)}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-3 mb-4 flex-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[#8B6F5E]">
              <DollarSign size={14} />
              <span>{t("rooms.card.rent")}</span>
            </div>
            <span className="font-semibold text-[#2C1A0E]">
              {formatRupiah(Number(room.price))}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[#8B6F5E]">
              <Home size={14} />
              <span>{t("rooms.card.status")}</span>
            </div>
            <span
              className={`font-semibold ${
                room.status === "cleaning" ? "text-[#C8A96E]" : "text-[#5E9B72]"
              }`}
            >
              {room.status === "cleaning" ? t("rooms.card.under_cleaning") : t("rooms.card.available")}
            </span>
          </div>
        </div>
      )}

      {/* View Details Button */}
      <button
        onClick={onClick}
        className="w-full mt-auto py-2.5 rounded-lg bg-[#553D2B] text-white font-semibold text-sm hover:bg-[#3d2b1f] transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <Eye size={14} />
        {t("rooms.card.view")}
      </button>
    </KosanCard>
  );
}

export default function RoomsPage() {
  const toast = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<RoomStatus | "all">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { language, t } = useTranslation();

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rooms");
      const resData = await res.json();
      if (resData.success) {
        setRooms(resData.data || []);
      }
    } catch (err) {
      console.error("Error loading rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Filter rooms based on search and status
  const filteredRooms = rooms.filter((room) => {
    const activeLeases = room.leases?.filter((l: any) => l.status === "active") || [];
    const matchesTenantSearch = activeLeases.some((l: any) => {
      const name = `${l.tenant?.first_name || ""} ${l.tenant?.last_name || ""}`.toLowerCase();
      return name.includes(searchTerm.toLowerCase());
    });
    const matchesSearch =
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      matchesTenantSearch;
    const matchesStatus = statusFilter === "all" || room.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort rooms
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    if (sortBy === "name") {
      const numA = parseInt(a.name) || 0;
      const numB = parseInt(b.name) || 0;
      return sortOrder === "asc" ? numA - numB : numB - numA;
    } else {
      const priceA = Number(a.price);
      const priceB = Number(b.price);
      return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
    }
  });

  const handleAddRoomSubmit = async (newRoom: any) => {
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRoom),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Room created successfully.");
        fetchRooms();
      } else {
        toast.error("Failed to create room: " + data.error);
      }
    } catch (err: any) {
      toast.error("Error adding room: " + err.message);
    }
  };

  const handleRoomClick = (roomId: string) => {
    router.push(`/rooms/${roomId}`);
  };

  // Stats computation
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
  const vacantRooms = rooms.filter((r) => r.status === "vacant").length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  if (loading) {
    return <LoadingSpinner message={language === "id" ? "Memuat kamar..." : "Loading rooms..."} />;
  }

   return (
    <div className="min-h-screen bg-[#F5E6D3] pb-8 text-[#2C1A0E]">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2C1A0E]">{t("rooms.title")}</h1>
          <p className="text-sm text-[#8B6F5E] mt-1">
            {t("rooms.subtitle")}
          </p>
        </div>

        <KosanButton
          variant="primary"
          size="sm"
          leftIcon={<Plus size={14} />}
          className="w-full sm:w-auto h-10"
          onClick={() => setIsModalOpen(true)}
        >
          {t("rooms.add_room")}
        </KosanButton>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#DFC9A8] rounded-xl p-4 border border-[#C8A96E]/30">
          <p className="text-xs text-[#8B6F5E]">{t("dashboard.stat.total_rooms")}</p>
          <p className="text-2xl font-bold text-[#2C1A0E]">{totalRooms}</p>
        </div>
        <div className="bg-[#DFC9A8] rounded-xl p-4 border border-[#C8A96E]/30">
          <p className="text-xs text-[#8B6F5E]">{t("dashboard.stat.occupied")}</p>
          <p className="text-2xl font-bold text-[#C0444A]">{occupiedRooms}</p>
        </div>
        <div className="bg-[#DFC9A8] rounded-xl p-4 border border-[#C8A96E]/30">
          <p className="text-xs text-[#8B6F5E]">{t("dashboard.stat.vacant")}</p>
          <p className="text-2xl font-bold text-[#5E9B72]">{vacantRooms}</p>
        </div>
        <div className="bg-[#DFC9A8] rounded-xl p-4 border border-[#C8A96E]/30">
          <p className="text-xs text-[#8B6F5E]">{t("dashboard.stat.occupancy_rate")}</p>
          <p className="text-2xl font-bold text-[#2C1A0E]">{occupancyRate}%</p>
        </div>
      </div>

       {/* Actions Bar */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex-1">
          <KosanSearchBar
            placeholder={t("rooms.search")}
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {/* Sort Dropdown */}
      <select
        value={`${sortBy}-${sortOrder}`}
        onChange={(e) => {
          const [newSortBy, newSortOrder] = e.target.value.split("-");
          setSortBy(newSortBy as "name" | "price");
          setSortOrder(newSortOrder as "asc" | "desc");
        }}
        className="w-full bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-4 py-2 text-sm text-[#2C1A0E] focus:outline-none cursor-pointer"
      >
        <option value="price-asc">{t("rooms.sort.price_asc")}</option>
        <option value="price-desc">{t("rooms.sort.price_desc")}</option>
      </select>

      {/* Filter Dropdown */}
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as RoomStatus | "all")}
        className="w-full bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-4 py-2 text-sm text-[#2C1A0E] focus:outline-none cursor-pointer"
      >
        <option value="all">{t("rooms.filter.all")}</option>
        <option value="occupied">{t("rooms.filter.occupied")}</option>
        <option value="vacant">{t("rooms.filter.vacant")}</option>
        <option value="cleaning">{t("rooms.filter.cleaning")}</option>
      </select>
    </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedRooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onClick={() => handleRoomClick(room.id)}
          />
        ))}
      </div>

      {/* Empty State */}
      {sortedRooms.length === 0 && (
        <div className="text-center py-12">
          <BedDouble size={48} className="mx-auto text-[#8B6F5E] mb-4" />
          <p className="text-[#8B6F5E]">{t("rooms.empty")}</p>
          <KosanButton
            variant="primary"
            size="sm"
            className="mt-4"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={14} className="mr-1" /> {language === "id" ? "Tambah Kamar Pertama Anda" : "Add Your First Room"}
          </KosanButton>
        </div>
      )}

      {/* Add Room Modal */}
      <AddRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddRoomSubmit}
      />
    </div>
  );
}