"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  User,
  Calendar,
  Clock,
  Users,
  Home,
  Pencil,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  BedDouble,
  Maximize2,
  Upload,
  Trash2,
} from "lucide-react";
import { KosanButton, KosanCard } from "@sbhms/ui";

const ROOMS_DATA = [
  { id: 1, number: "101", floor: 1, status: "occupied",    tenant: "Fatih R.",       rent: 1500000, nextDue: "2026-05-01", since: "2025-04-01", visitors: 0,    type: "Standard", size: "24m²", description: "A comfortable standard room on the first floor with natural lighting and a private bathroom. Includes built-in wardrobe, study desk, and ceiling fan.", images: [] as string[] },
  { id: 2, number: "102", floor: 1, status: "vacant",      tenant: null,             rent: 1500000, nextDue: null,         since: null,         visitors: null, type: "Standard", size: "24m²", description: "Freshly cleaned standard room ready for new tenants. Features a large window, built-in wardrobe, and private bathroom.", images: [] as string[] },
  { id: 3, number: "103", floor: 1, status: "cleaned",     tenant: null,             rent: 1500000, nextDue: null,         since: null,         visitors: null, type: "Standard", size: "24m²", description: "Recently cleaned and ready to move in. Ground floor convenience with a quiet side-street view.", images: [] as string[] },
  { id: 4, number: "201", floor: 2, status: "occupied",    tenant: "Ahmad F.",       rent: 1800000, nextDue: "2026-05-15", since: "2025-06-01", visitors: 2,    type: "Deluxe",   size: "28m²", description: "Spacious deluxe room with elevated view, AC, and private bathroom with hot water.", images: [] as string[] },
  { id: 5, number: "202", floor: 2, status: "vacant",      tenant: null,             rent: 1500000, nextDue: null,         since: null,         visitors: null, type: "Standard", size: "24m²", description: "Standard room on the second floor with good cross-ventilation and natural light.", images: [] as string[] },
  { id: 6, number: "203", floor: 2, status: "vacant",      tenant: null,             rent: 1800000, nextDue: null,         since: null,         visitors: null, type: "Deluxe",   size: "28m²", description: "Deluxe room with city-facing window, AC, hot water, and premium furnishings.", images: [] as string[] },
  { id: 7, number: "301", floor: 3, status: "occupied",    tenant: "Saddam Titanio", rent: 2000000, nextDue: "2026-05-10", since: "2025-03-15", visitors: 1,    type: "Suite",    size: "32m²", description: "Top-floor suite with panoramic views, split AC, en-suite bathroom with bathtub, and a dedicated sitting area.", images: [] as string[] },
  { id: 8, number: "302", floor: 3, status: "vacant",      tenant: null,             rent: 2000000, nextDue: null,         since: null,         visitors: null, type: "Suite",    size: "32m²", description: "Premium suite on the top floor. Available immediately with AC, en-suite bath, and panoramic views.", images: [] as string[] },
];

const formatRupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}/mo`;
const formatDate   = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function ImageGallery({
  images,
  onAdd,
  onRemove,
}: {
  images: string[];
  onAdd: (urls: string[]) => void;
  onRemove: (idx: number) => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const promises = Array.from(files).map(
      (f) =>
        new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.readAsDataURL(f);
        })
    );
    Promise.all(promises).then((urls) => {
      onAdd(urls);
      // jump to first newly added image
      setActiveIdx(images.length);
    });
  };

  const safeIdx = images.length > 0 ? Math.min(activeIdx, images.length - 1) : 0;

  if (images.length === 0) {
    return (
      <div className="flex gap-3 h-full">
        {/* Placeholder thumbs */}
        <div className="hidden sm:flex flex-col gap-2 w-20 flex-shrink-0">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-20 h-20 rounded-xl bg-[#C8A96E]/15 border border-dashed border-[#C8A96E]/40 flex items-center justify-center">
              <ImageOff size={14} className="text-[#C8A96E]/50" />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 h-full rounded-2xl bg-[#C8A96E]/10 border-2 border-dashed border-[#C8A96E]/50 hover:border-[#553D2B] hover:bg-[#C8A96E]/15 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-full bg-[#553D2B]/10 flex items-center justify-center">
            <Upload size={24} className="text-[#553D2B]" />
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-bold text-[#553D2B]">Upload room photos</p>
            <p className="text-xs text-[#8B6F5E] mt-1">Click to browse · JPG, PNG, WEBP</p>
          </div>
        </button>

        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => readFiles(e.target.files)} />
      </div>
    );
  }

  return (
    <div className="flex gap-3 h-full">
      {/* Thumbnail strip — scrollable */}
      <div className="hidden sm:flex flex-col gap-2 w-20 flex-shrink-0 overflow-y-auto">
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIdx(i)}
            className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all group
              ${safeIdx === i ? "border-[#553D2B]" : "border-transparent hover:border-[#C8A96E]"}`}
          >
            <img src={src} alt="" className="w-full h-full object-cover" />
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(i);
                setActiveIdx((p) => Math.max(0, p - (i <= p && p > 0 ? 1 : 0)));
              }}
              className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
              <Trash2 size={14} className="text-white" />
            </span>
          </button>
        ))}

        {/* Add-more button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-20 h-20 flex-shrink-0 rounded-xl border-2 border-dashed border-[#C8A96E]/50 hover:border-[#553D2B] bg-[#C8A96E]/10 hover:bg-[#C8A96E]/20 transition-all flex flex-col items-center justify-center gap-1"
        >
          <Upload size={14} className="text-[#8B6F5E]" />
          <span className="text-[9px] text-[#8B6F5E] font-bold">Add</span>
        </button>

        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => readFiles(e.target.files)} />
      </div>

      {/* Main image viewer */}
      <div className="relative flex-1 min-h-0">
        <img
          src={images[safeIdx]}
          alt={`Room photo ${safeIdx + 1}`}
          className="w-full h-full object-cover rounded-2xl"
        />

        {/* Counter pill */}
        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
          {safeIdx + 1} / {images.length}
        </div>

        {/* Mobile: add/delete buttons overlay */}
        <div className="sm:hidden absolute top-3 right-3 flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
          >
            <Upload size={14} />
          </button>
          <button
            type="button"
            onClick={() => { onRemove(safeIdx); setActiveIdx((p) => Math.max(0, p - 1)); }}
            className="w-8 h-8 rounded-full bg-[#C0444A]/70 text-white flex items-center justify-center hover:bg-[#C0444A]"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActiveIdx((i) => (i - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => setActiveIdx((i) => (i + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, valueClass = "text-[#2C1A0E]" }: {
  icon: React.ReactNode; label: string; value: React.ReactNode; valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#C8A96E]/20 last:border-none">
      <div className="flex items-center gap-2.5 text-[#8B6F5E]">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className={`text-sm font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

export default function RoomDetailPage() {
  const params  = useParams();
  const router  = useRouter();

  const roomId   = Number(params?.id);
  const roomBase = ROOMS_DATA.find((r) => r.id === roomId);

  const [images,        setImages]        = useState<string[]>(roomBase?.images ?? []);
  const [roomStatus,    setRoomStatus]    = useState(roomBase?.status ?? "vacant");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [description,   setDescription]  = useState(roomBase?.description ?? "");
  const [descDraft,     setDescDraft]    = useState(roomBase?.description ?? "");

  if (!roomBase) {
    return (
      <div className="min-h-screen bg-[#F5E6D3] flex flex-col items-center justify-center gap-4">
        <BedDouble size={48} className="text-[#8B6F5E]" />
        <p className="text-lg font-bold text-[#2C1A0E]">Room not found</p>
        <KosanButton variant="secondary" onClick={() => router.push("/rooms")}>
          <ArrowLeft size={14} className="mr-1" /> Back to Rooms
        </KosanButton>
      </div>
    );
  }

  const room  = { ...roomBase, status: roomStatus };
  const today = new Date().toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#F5E6D3] px-4 sm:px-6 py-8">

      <div className="mb-6">
        <button
          onClick={() => router.push("/rooms")}
          className="flex items-center gap-1.5 text-sm text-[#8B6F5E] hover:text-[#553D2B] mb-3 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Rooms
        </button>

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#2C1A0E] tracking-tight">
              Room {room.number}
            </h1>
            <p className="text-sm text-[#8B6F5E] mt-1">
              date : {today.replace(/\//g, " - ")}
            </p>
          </div>

          {/* Clickable status pills */}
          <div className="flex gap-2 flex-wrap">
            {(["occupied", "vacant", "cleaned"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRoomStatus(s)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize
                  ${roomStatus === s
                    ? s === "occupied" ? "bg-[#C0444A]/15 border-[#C0444A] text-[#C0444A]"
                    : s === "vacant"   ? "bg-[#5E9B72]/15 border-[#5E9B72] text-[#5E9B72]"
                    :                    "bg-[#C8A96E]/20 border-[#C8A96E] text-[#7a6030]"
                    : "border-[#C8A96E]/30 text-[#8B6F5E] hover:border-[#C8A96E]"
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

        <div className="flex flex-col gap-5">

          <KosanCard padding="md" className="flex flex-col">
            <div className="h-72 sm:h-96">
              <ImageGallery
                images={images}
                onAdd={(urls) => setImages((prev) => [...prev, ...urls])}
                onRemove={(idx) => setImages((prev) => prev.filter((_, i) => i !== idx))}
              />
            </div>
          </KosanCard>

          {/* Description */}
          <KosanCard padding="md" className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#2C1A0E] uppercase tracking-wider">
                Description
              </h3>
              {isEditingDesc ? (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setDescDraft(description); setIsEditingDesc(false); }}
                    className="flex items-center gap-1 text-xs text-[#8B6F5E] hover:text-[#C0444A] transition-colors"
                  >
                    <X size={13} /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDescription(descDraft); setIsEditingDesc(false); }}
                    className="flex items-center gap-1 text-xs text-[#5E9B72] font-semibold hover:text-[#3d6b4f] transition-colors"
                  >
                    <Save size={13} /> Save
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setDescDraft(description); setIsEditingDesc(true); }}
                  className="flex items-center gap-1 text-xs text-[#8B6F5E] hover:text-[#553D2B] transition-colors underline underline-offset-2"
                >
                  <Pencil size={12} /> edit
                </button>
              )}
            </div>
            {isEditingDesc ? (
              <textarea
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                rows={4}
                className="w-full bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-4 py-3 text-sm text-[#2C1A0E] resize-none focus:outline-none focus:border-[#553D2B] focus:ring-2 focus:ring-[#553D2B]/20 transition-all"
              />
            ) : (
              <p className="text-sm text-[#553D2B]/80 leading-relaxed">
                {description || "No description added yet. Click edit to add one."}
              </p>
            )}
          </KosanCard>

        </div>

        <div className="flex flex-col gap-5">

          <KosanCard padding="md">
            <h3 className="text-sm font-bold text-[#2C1A0E] uppercase tracking-wider mb-1">
              Room Details
            </h3>
            <InfoRow icon={<MapPin size={15} />}    label="Floor" value={`Floor ${room.floor}`} />
            <InfoRow icon={<BedDouble size={15} />}  label="Type"  value={room.type} />
            <InfoRow icon={<Maximize2 size={15} />}  label="Size"  value={room.size} />
            <InfoRow icon={<DollarSign size={15} />} label="Rent"  value={formatRupiah(room.rent)} />
          </KosanCard>

          <KosanCard padding="md" className="flex-1">
            <h3 className="text-sm font-bold text-[#2C1A0E] uppercase tracking-wider mb-1">
              {room.status === "occupied" ? "Tenant Info" : "Availability"}
            </h3>

            {room.status === "occupied" ? (
              <>
                <InfoRow icon={<User size={15} />}     label="Tenant"   value={room.tenant ?? "—"} />
                <InfoRow icon={<Calendar size={15} />} label="Next Due" value={room.nextDue ? formatDate(room.nextDue) : "—"} valueClass="text-[#C0444A] font-bold" />
                <InfoRow icon={<Clock size={15} />}    label="Since"    value={room.since ? formatDate(room.since) : "—"} />
                <InfoRow icon={<Users size={15} />}    label="Visitors" value={room.visitors != null ? String(room.visitors) : "None"} />
              </>
            ) : (
              <>
                <InfoRow icon={<Home size={15} />}       label="Status" value="Available Now" valueClass="text-[#5E9B72] font-bold" />
                <InfoRow icon={<DollarSign size={15} />} label="Rent"   value={formatRupiah(room.rent)} />
              </>
            )}
          </KosanCard>

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            {room.status !== "occupied" && (
              <KosanButton variant="gold" size="lg" fullWidth>Assign Tenant</KosanButton>
            )}
            <KosanButton variant="primary" size="lg" fullWidth>
              {room.status === "occupied" ? "Manage Tenant" : "Mark as Occupied"}
            </KosanButton>
            <KosanButton variant="secondary" size="md" fullWidth>
              Edit Room Details
            </KosanButton>
          </div>

        </div>
      </div>
    </div>
  );
}