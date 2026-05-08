"use client";

import { useState } from "react";
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
} from "@sbhms/ui";

const ROOMS_DATA = [
  { 
    id: 1, 
    number: "101", 
    floor: 1, 
    status: "occupied", 
    tenant: "Fatih R.", 
    rent: 1500000, 
    nextDue: "2026-05-01", 
    since: "2025-04-01", 
    visitors: 0,
    image: null,
    type: "Standard",
    size: "24m²"
  },
  { 
    id: 2, 
    number: "102", 
    floor: 1, 
    status: "vacant", 
    tenant: null, 
    rent: 1500000, 
    nextDue: null, 
    since: null, 
    visitors: null,
    image: null,
    type: "Standard",
    size: "24m²"
  },
  { 
    id: 3, 
    number: "103", 
    floor: 1, 
    status: "cleaned", 
    tenant: null, 
    rent: 1500000, 
    nextDue: null, 
    since: null, 
    visitors: null,
    image: null,
    type: "Standard",
    size: "24m²"
  },
  { 
    id: 4, 
    number: "201", 
    floor: 2, 
    status: "occupied", 
    tenant: "Ahmad F.", 
    rent: 1800000, 
    nextDue: "2026-05-15", 
    since: "2025-06-01", 
    visitors: 2,
    image: null,
    type: "Deluxe",
    size: "28m²"
  },
  { 
    id: 5, 
    number: "202", 
    floor: 2, 
    status: "vacant", 
    tenant: null, 
    rent: 1500000, 
    nextDue: null, 
    since: null, 
    visitors: null,
    image: null,
    type: "Standard",
    size: "24m²"
  },
  { 
    id: 6, 
    number: "203", 
    floor: 2, 
    status: "vacant", 
    tenant: null, 
    rent: 1800000, 
    nextDue: null, 
    since: null, 
    visitors: null,
    image: null,
    type: "Deluxe",
    size: "28m²"
  },
  { 
    id: 7, 
    number: "301", 
    floor: 3, 
    status: "occupied", 
    tenant: "Saddam Titanio", 
    rent: 2000000, 
    nextDue: "2026-05-10", 
    since: "2025-03-15", 
    visitors: 1,
    image: null,
    type: "Suite",
    size: "32m²"
  },
  { 
    id: 8, 
    number: "302", 
    floor: 3, 
    status: "vacant", 
    tenant: null, 
    rent: 2000000, 
    nextDue: null, 
    since: null, 
    visitors: null,
    image: null,
    type: "Suite",
    size: "32m²"
  },
];

const STATUS_CONFIG = {
  occupied: { label: "Occupied", color: "danger", icon: <Users size={12} /> },
  vacant: { label: "Vacant", color: "success", icon: <Home size={12} /> },
  cleaned: { label: "Cleaned", color: "gold", icon: <Wrench size={12} /> },
};

type RoomStatus = keyof typeof STATUS_CONFIG;

// Format currency
const formatRupiah = (amount: number) => {
  return `Rp ${amount.toLocaleString()}/mo`;
};

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

// Add Room Modal Component
function AddRoomModal({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (room: any) => void }) {
  const [formData, setFormData] = useState({
    number: "",
    floor: "1",
    rent: "",
    type: "Standard",
    size: "24m²",
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#EFE3D0] rounded-2xl p-6 w-full max-w-md border border-[#C8A96E]/30">
        <h2 className="text-xl font-bold text-[#2C1A0E] mb-4">Add New Room</h2>
        
        <div className="space-y-4">
          <KosanInput
            label="Room Number"
            placeholder="e.g., 106"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            required
          />
          
          <div>
            <label className="text-sm font-semibold text-[#2C1A0E] mb-1.5 block">Floor</label>
            <select
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              className="w-full bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-4 py-3 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#553D2B]"
            >
              <option value="1">1st Floor</option>
              <option value="2">2nd Floor</option>
              <option value="3">3rd Floor</option>
            </select>
          </div>
          
          <KosanInput
            label="Rent Price"
            placeholder="e.g., 1500000"
            value={formData.rent}
            onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
            leftIcon={<span className="text-[#8B6F5E]">Rp</span>}
          />
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-[#2C1A0E] mb-1.5 block">Room Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-4 py-3 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#553D2B]"
              >
                <option>Standard</option>
                <option>Deluxe</option>
                <option>Suite</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-[#2C1A0E] mb-1.5 block">Size</label>
              <select
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-4 py-3 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#553D2B]"
              >
                <option>20m²</option>
                <option>24m²</option>
                <option>28m²</option>
                <option>32m²</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <KosanButton variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </KosanButton>
          <KosanButton variant="primary" fullWidth onClick={() => {
            onSave(formData);
            onClose();
          }}>
            Add Room
          </KosanButton>
        </div>
      </div>
    </div>
  );
}

// Room Card Component
function RoomCard({ room, onClick }: { room: any; onClick: () => void }) {
  const isOccupied = room.status === "occupied";
  const statusConfig = STATUS_CONFIG[room.status as RoomStatus];

  return (
    <KosanCard hoverable>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-[#2C1A0E]">Room {room.number}</h3>
          <div className="flex items-center gap-2 mt-1">
            <MapPin size={12} className="text-[#8B6F5E]" />
            <span className="text-xs text-[#8B6F5E]">Floor {room.floor}</span>
          </div>
        </div>
        <KosanBadge variant={statusConfig.color as any}>
          <span className="flex items-center gap-1">
            {statusConfig.icon}
            {statusConfig.label}
          </span>
        </KosanBadge>
      </div>

      {isOccupied ? (
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[#8B6F5E]">
              <User size={14} />
              <span>Tenant</span>
            </div>
            <span className="font-semibold text-[#2C1A0E]">{room.tenant}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[#8B6F5E]">
              <DollarSign size={14} />
              <span>Rent</span>
            </div>
            <span className="font-semibold text-[#2C1A0E]">{formatRupiah(room.rent)}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[#8B6F5E]">
              <Calendar size={14} />
              <span>Next due</span>
            </div>
            <span className="font-semibold text-[#C0444A]">{formatDate(room.nextDue)}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[#8B6F5E]">
              <Clock size={14} />
              <span>Since</span>
            </div>
            <span className="font-semibold text-[#2C1A0E]">{formatDate(room.since)}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[#8B6F5E]">
              <Users size={14} />
              <span>Visitors</span>
            </div>
            <span className="font-semibold text-[#2C1A0E]">{room.visitors || "None"}</span>
          </div>
        </div>
      ) : (
        // VACANT/CLEANED ROOM - Show availability info
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[#8B6F5E]">
              <DollarSign size={14} />
              <span>Rent</span>
            </div>
            <span className="font-semibold text-[#2C1A0E]">{formatRupiah(room.rent)}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[#8B6F5E]">
              <Home size={14} />
              <span>Status</span>
            </div>
            <span className="font-semibold text-[#5E9B72]">Available Now</span>
          </div>
        </div>
      )}
      
      {/* View Room Button - Same style for both occupied and vacant */}
      <button
        onClick={onClick}
        className="w-full mt-2 py-2.5 rounded-lg bg-[#553D2B] text-white font-semibold text-sm hover:bg-[#3d2b1f] transition-colors flex items-center justify-center gap-2"
      >
        <Eye size={14} />
        View Room
      </button>
    </KosanCard>
  );
}

export default function RoomsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"number" | "rent">("number");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<RoomStatus | "all">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rooms, setRooms] = useState(ROOMS_DATA);

  // Filter rooms based on search and status
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.number.includes(searchTerm) || 
      (room.tenant && room.tenant.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || room.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort rooms
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    if (sortBy === "number") {
      const numA = parseInt(a.number);
      const numB = parseInt(b.number);
      return sortOrder === "asc" ? numA - numB : numB - numA;
    } else {
      return sortOrder === "asc" ? a.rent - b.rent : b.rent - a.rent;
    }
  });

  const handleAddRoom = (newRoom: any) => {
    const newId = Math.max(...rooms.map(r => r.id)) + 1;
    setRooms([
      ...rooms,
      {
        id: newId,
        number: newRoom.number,
        floor: parseInt(newRoom.floor),
        status: "vacant",
        tenant: null,
        rent: parseInt(newRoom.rent),
        nextDue: null,
        since: null,
        visitors: null,
        image: null,
        type: newRoom.type,
        size: newRoom.size,
      },
    ]);
  };

  const handleRoomClick = (roomId: number) => {
    router.push(`/rooms/${roomId}`);
  };

  // Stats
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.status === "occupied").length;
  const vacantRooms = rooms.filter(r => r.status === "vacant").length;
  const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

  return (
    <div className="min-h-screen bg-[#F5E6D3] p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#2C1A0E]">Rooms</h1>
        <p className="text-sm text-[#8B6F5E] mt-1">Manage all rooms in your boarding house</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#DFC9A8] rounded-xl p-4 border border-[#C8A96E]/30">
          <p className="text-xs text-[#8B6F5E]">Total Rooms</p>
          <p className="text-2xl font-bold text-[#2C1A0E]">{totalRooms}</p>
        </div>
        <div className="bg-[#DFC9A8] rounded-xl p-4 border border-[#C8A96E]/30">
          <p className="text-xs text-[#8B6F5E]">Occupied</p>
          <p className="text-2xl font-bold text-[#C0444A]">{occupiedRooms}</p>
        </div>
        <div className="bg-[#DFC9A8] rounded-xl p-4 border border-[#C8A96E]/30">
          <p className="text-xs text-[#8B6F5E]">Vacant</p>
          <p className="text-2xl font-bold text-[#5E9B72]">{vacantRooms}</p>
        </div>
        <div className="bg-[#DFC9A8] rounded-xl p-4 border border-[#C8A96E]/30">
          <p className="text-xs text-[#8B6F5E]">Occupancy Rate</p>
          <p className="text-2xl font-bold text-[#2C1A0E]">{occupancyRate}%</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <KosanSearchBar
            placeholder="Search by room number or tenant name..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
        
        <div className="flex gap-2">
          {/* Sort Dropdown */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-');
              setSortBy(newSortBy as "number" | "rent");
              setSortOrder(newSortOrder as "asc" | "desc");
            }}
            className="bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-4 py-2 text-sm text-[#2C1A0E] focus:outline-none cursor-pointer"
          >
            <option value="number-asc">Sort by Number ↑</option>
            <option value="number-desc">Sort by Number ↓</option>
            <option value="rent-asc">Sort by Price ↑</option>
            <option value="rent-desc">Sort by Price ↓</option>
          </select>

          {/* Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RoomStatus | "all")}
            className="bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-4 py-2 text-sm text-[#2C1A0E] focus:outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="occupied">Occupied</option>
            <option value="vacant">Vacant</option>
            <option value="cleaned">Cleaned</option>
          </select>

          {/* Add Room Button */}
          <KosanButton
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Room
          </KosanButton>
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
          <p className="text-[#8B6F5E]">No rooms found</p>
          <KosanButton variant="primary" size="sm" className="mt-4" onClick={() => setIsModalOpen(true)}>
            <Plus size={14} className="mr-1" /> Add Your First Room
          </KosanButton>
        </div>
      )}

      {/* Add Room Modal */}
      <AddRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddRoom}
      />
    </div>
  );
}