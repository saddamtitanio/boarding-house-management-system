"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, Layers, Eye, Wrench, Users, User } from "lucide-react";
import {
  KosanCard,
  KosanSearchBar,
  KosanButton,
  KosanBadge,
} from "@sbhms/ui";
import { useTranslation } from "@/src/contexts/LanguageContext";

interface RoomImage {
  id: string;
  url: string;
}

interface Room {
  id: string;
  name: string;
  description: string | null;
  price: number;
  status: "vacant" | "occupied" | "cleaning";
  floor: number;
  room_images: RoomImage[];
}

const STATUS_CONFIG = {
  occupied: { label: "Your Room", color: "danger" as const, icon: <Users size={12} /> },
  vacant: { label: "Vacant", color: "success" as const, icon: <Home size={12} /> },
  cleaning: { label: "Cleaning", color: "gold" as const, icon: <Wrench size={12} /> },
};


type RoomStatus = keyof typeof STATUS_CONFIG;

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [floorFilter, setFloorFilter] = useState<number | "all">("all");
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchRooms() {
      try {
        setLoading(true);
        const res = await fetch("/api/rooms");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setRooms(json.data);
        }
      } catch (err) {
        console.error("Failed to load rooms", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRooms();
  }, []);

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString("id-ID")}`;
  };


  // Separate your room from the catalog list
  const myRoom = rooms.find(room => room.status === "occupied");
  const catalogRooms = rooms.filter(room => room.status !== "occupied");

  // Filter logic for available rooms catalog
  const filteredCatalogRooms = catalogRooms.filter(room => {
    const matchesSearch =
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFloor = floorFilter === "all" || room.floor === floorFilter;
    return matchesSearch && matchesFloor;
  });

  // Get unique floors for the filter
  const uniqueFloors = Array.from(new Set(catalogRooms.map(r => r.floor))).sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5E6D3] p-6 flex items-center justify-center">
        <p className="text-lg font-semibold text-[#8B6F5E]">{t("rooms.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5E6D3] p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#2C1A0E]">{t("rooms.title")}</h1>
          <p className="text-sm text-[#8B6F5E] mt-1">{t("rooms.subtitle")}</p>
        </div>
      </div>

      {/* Your Room Section */}
      {myRoom && (
        <div className="mb-8 border-b border-[#C8A96E]/20 pb-8">
          <h2 className="text-xl font-bold text-[#2C1A0E] mb-4 flex items-center gap-2">
            <User size={20} className="text-[#C8A96E]" />
            {t("rooms.your_room")}
          </h2>
          <div className="max-w-md">
            {(() => {
              const statusConfig = STATUS_CONFIG.occupied;
              const firstImage = myRoom.room_images?.[0]?.url;
              return (
                <div className="group flex flex-col bg-[#EFE3D0] border border-[#C8A96E]/30 rounded-2xl overflow-hidden shadow-sm transition duration-300 hover:shadow-md hover:border-[#C8A96E]/50">
                  {/* Thumbnail Image */}
                  <div className="relative h-48 w-full bg-[#3d2b1f] overflow-hidden">
                     {firstImage ? (
                      <img
                        src={firstImage}
                        alt={myRoom.name}
                        className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[#8B6F5E]/50 gap-2 bg-[#C8A96E]/10">
                        <Home size={36} />
                        <span className="text-[10px] uppercase font-bold tracking-wider">{t("rooms.no_photos")}</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <KosanBadge variant="gold">
                        <span className="flex items-center gap-1">
                          {statusConfig.icon}
                          {t("rooms.status.occupied")}
                        </span>
                      </KosanBadge>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-[#2C1A0E]/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-white flex items-center gap-1">
                      <Layers size={12} className="text-[#C8A96E]" />
                      {t("rooms.floor_num")} {myRoom.floor}
                    </div>
                  </div>

                  {/* Details Body */}
                  <div className="p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[#2C1A0E] group-hover:text-[#8B6F5E] transition">
                        {myRoom.name}
                      </h3>
                      <p className="text-xs text-[#8B6F5E] mt-1.5 line-clamp-2 min-h-[32px]">
                        {myRoom.description || "No description provided."}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#C8A96E]/15 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8B6F5E]">{t("rooms.monthly_rent")}</span>
                        <p className="text-base font-bold text-[#2C1A0E]">
                          {formatPrice(myRoom.price)}
                        </p>
                      </div>
                      <Link href={`/room/${myRoom.id}`}>
                        <KosanButton variant="gold" size="sm" className="flex items-center gap-1">
                          <Eye size={14} /> {t("rooms.view_details_lease")}
                        </KosanButton>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Available Rooms Section Header */}
      {myRoom && (
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#2C1A0E]">{t("rooms.catalog_title")}</h2>
        </div>
      )}

      {/* Filter Toolbar */}
       <div className="flex flex-col sm:flex-row gap-4 mb-6 items-stretch sm:items-center">
        <div className="flex-1 max-w-md">
          <KosanSearchBar
            placeholder={t("rooms.search_placeholder")}
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="floor-select" className="text-xs font-semibold text-[#8B6F5E] uppercase tracking-wider">
            {t("rooms.floor_label")}
          </label>
          <select
            id="floor-select"
            className="px-3 py-2 bg-[#EFE3D0] border border-[#C8A96E]/30 rounded-xl text-sm font-medium text-[#2C1A0E] focus:outline-none focus:border-[#C8A96E]"
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
          >
            <option value="all">{t("rooms.all_floors")}</option>
            {uniqueFloors.map(floor => (
              <option key={floor} value={floor}>{t("rooms.floor_num")} {floor}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Rooms Grid */}
      {filteredCatalogRooms.length === 0 ? (
        <div className="py-12 text-center bg-[#EFE3D0]/30 rounded-2xl border border-dashed border-[#C8A96E]/20">
          <Home size={40} className="mx-auto text-[#8B6F5E]/40 mb-3" />
          <p className="text-sm font-medium text-[#8B6F5E]">{t("rooms.empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCatalogRooms.map(room => {
            const statusConfig = STATUS_CONFIG[room.status as RoomStatus] || STATUS_CONFIG.vacant;
            const firstImage = room.room_images?.[0]?.url;
            return (
              <div
                key={room.id}
                className="group flex flex-col bg-[#EFE3D0] border border-[#C8A96E]/20 rounded-2xl overflow-hidden shadow-sm transition duration-300 hover:shadow-md hover:border-[#C8A96E]/40"
              >
                {/* Thumbnail Image */}
                <div className="relative h-48 w-full bg-[#3d2b1f] overflow-hidden">
                   {firstImage ? (
                    <img
                      src={firstImage}
                      alt={room.name}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#8B6F5E]/50 gap-2 bg-[#C8A96E]/10">
                      <Home size={36} />
                      <span className="text-[10px] uppercase font-bold tracking-wider">{t("rooms.no_photos")}</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <KosanBadge variant={statusConfig.color}>
                      {t(`rooms.status.${room.status}`)}
                    </KosanBadge>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-[#2C1A0E]/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-white flex items-center gap-1">
                    <Layers size={12} className="text-[#C8A96E]" />
                    {t("rooms.floor_num")} {room.floor}
                  </div>
                </div>

                {/* Details Body */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#2C1A0E] group-hover:text-[#8B6F5E] transition">
                      {room.name}
                    </h3>
                    <p className="text-xs text-[#8B6F5E] mt-1.5 line-clamp-2 min-h-[32px]">
                      {room.description || "No description provided. Experience premium computer engineering boarding student life."}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#C8A96E]/15 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8B6F5E]">{t("rooms.monthly_rent")}</span>
                      <p className="text-base font-bold text-[#2C1A0E]">
                        {formatPrice(room.price)}
                      </p>
                    </div>
                    <Link href={`/room/${room.id}`}>
                      <KosanButton variant="gold" size="sm" className="flex items-center gap-1">
                        <Eye size={14} /> {t("rooms.view_details")}
                      </KosanButton>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}