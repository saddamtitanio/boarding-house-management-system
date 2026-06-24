"use client";

import { useRef, useState, useEffect } from "react";
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
import { KosanButton, KosanCard, LoadingSpinner, useToast } from "@sbhms/ui";
import { createClient } from "@/src/app/lib/supabase/client";

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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 py-3 border-b border-[#C8A96E]/20 last:border-none">
      <div className="flex items-center gap-2.5 text-[#8B6F5E] shrink-0">
        {icon}
        <span className="text-xs sm:text-sm">{label}</span>
      </div>
      <span className={`text-sm font-semibold text-left sm:text-right break-all ${valueClass} mt-0.5 sm:mt-0`}>
        {value}
      </span>
    </div>
  );
}

export default function RoomDetailPage() {
  const toast = useToast();
  const params = useParams();
  const router = useRouter();
  const roomId = params?.id as string;

  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [images, setImages] = useState<string[]>([]);
  const [roomStatus, setRoomStatus] = useState("vacant");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [description, setDescription]  = useState("");
  const [descDraft, setDescDraft] = useState("");
  const [visitorsCount, setVisitorsCount] = useState<number>(0);
  
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [floorDraft, setFloorDraft] = useState(1);
  const [priceDraft, setPriceDraft] = useState(0);

  const supabase = createClient();

  const fetchRoom = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/rooms/${roomId}`);
      const data = await res.json();
      if (data.success && data.data) {
        const r = data.data;
        setRoom(r);
        setRoomStatus(r.status);
        setDescription(r.description ?? "");
        setDescDraft(r.description ?? "");
        setImages(r.room_images?.map((img: any) => img.url) ?? []);
        setFloorDraft(r.floor);
        setPriceDraft(Number(r.price));
      } else {
        setError(data.error || "Failed to load room details");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load room details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roomId) {
      fetchRoom();
    }
  }, [roomId]);

  useEffect(() => {
    const fetchVisitors = async () => {
      const { count, error: countErr } = await supabase
        .from("visitor_logs")
        .select("*", { count: "exact", head: true })
        .eq("room_id", roomId)
        .is("check_out_at", null);
      if (!countErr && count !== null) {
        setVisitorsCount(count);
      }
    };
    if (roomId) {
      fetchVisitors();
    }
  }, [roomId]);

  const patchRoom = async (updates: any) => {
    const res = await fetch(`/api/rooms/${roomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to update room");
    }
    return data.data;
  };

  const handleStatusChange = async (newStatus: "occupied" | "vacant" | "cleaning") => {
    try {
      const updated = await patchRoom({ status: newStatus });
      setRoom(updated);
      setRoomStatus(newStatus);
      toast.success("Status updated successfully");
    } catch (err: any) {
      toast.error("Failed to update status: " + err.message);
    }
  };

  const handleDescriptionSave = async () => {
    try {
      const updated = await patchRoom({ description: descDraft });
      setRoom(updated);
      setDescription(descDraft);
      setIsEditingDesc(false);
      toast.success("Description updated successfully");
    } catch (err: any) {
      toast.error("Failed to update description: " + err.message);
    }
  };

  const handleDetailsSave = async () => {
    try {
      const updated = await patchRoom({ floor: floorDraft, price: priceDraft });
      setRoom(updated);
      setFloorDraft(updated.floor);
      setPriceDraft(Number(updated.price));
      setIsEditingDetails(false);
      toast.success("Room details updated successfully");
    } catch (err: any) {
      toast.error("Failed to update details: " + err.message);
    }
  };

  const handleAddImages = async (newUrls: string[]) => {
    try {
      const updatedImages = [...images, ...newUrls];
      const updated = await patchRoom({ images: updatedImages });
      setRoom(updated);
      setImages(updatedImages);
      toast.success("Images updated successfully");
    } catch (err: any) {
      toast.error("Failed to update images: " + err.message);
    }
  };

  const handleRemoveImage = async (idx: number) => {
    try {
      const updatedImages = images.filter((_, i) => i !== idx);
      const updated = await patchRoom({ images: updatedImages });
      setRoom(updated);
      setImages(updatedImages);
      toast.success("Image removed successfully");
    } catch (err: any) {
      toast.error("Failed to update images: " + err.message);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading room details..." />;
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-[#F5E6D3] flex flex-col items-center justify-center gap-4">
        <BedDouble size={48} className="text-[#8B6F5E]" />
        <p className="text-lg font-bold text-[#2C1A0E]">{error || "Room not found"}</p>
        <KosanButton variant="secondary" onClick={() => router.push("/rooms")}>
          <ArrowLeft size={14} className="mr-1" /> Back to Rooms
        </KosanButton>
      </div>
    );
  }

  const priceVal = Number(room.price);

  const activeBooking = room.bookings?.find(
    (b: any) => b.status === "approved" || b.status === "completed" || b.status === "active"
  );
  const tenantName = activeBooking?.tenant
    ? `${activeBooking.tenant.first_name} ${activeBooking.tenant.last_name || ""}`.trim()
    : null;

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
              {room.name}
            </h1>
          </div>

          {/* Clickable status pills */}
          <div className="flex gap-2 flex-wrap">
            {(["occupied", "vacant", "cleaning"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleStatusChange(s)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize
                  ${roomStatus === s
                    ? s === "occupied" ? "bg-[#C0444A]/15 border-[#C0444A] text-[#C0444A]"
                    : s === "vacant"   ? "bg-[#5E9B72]/15 border-[#5E9B72] text-[#5E9B72]"
                    :                    "bg-[#C8A96E]/20 border-[#C8A96E] text-[#7a6030]"
                    : "border-[#C8A96E]/30 text-[#8B6F5E] hover:border-[#C8A96E]"
                  }`}
              >
                {s === "cleaning" ? "cleaning" : s}
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
                onAdd={handleAddImages}
                onRemove={handleRemoveImage}
              />
            </div>
          </KosanCard>

        </div>

        <div className="flex flex-col gap-5">
          <KosanCard padding="md">
            <div className="flex items-center justify-between mb-3 border-b border-[#C8A96E]/10 pb-2">
              <h3 className="text-sm font-bold text-[#2C1A0E] uppercase tracking-wider">
                Room Details
              </h3>
              {isEditingDetails ? (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFloorDraft(room.floor);
                      setPriceDraft(Number(room.price));
                      setIsEditingDetails(false);
                    }}
                    className="flex items-center gap-1 text-xs text-[#8B6F5E] hover:text-[#C0444A] transition-colors"
                  >
                    <X size={13} /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDetailsSave}
                    className="flex items-center gap-1 text-xs text-[#5E9B72] font-semibold hover:text-[#3d6b4f] transition-colors"
                  >
                    <Save size={13} /> Save
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setFloorDraft(room.floor);
                    setPriceDraft(Number(room.price));
                    setIsEditingDetails(true);
                  }}
                  className="flex items-center gap-1 text-xs text-[#8B6F5E] hover:text-[#553D2B] transition-colors underline underline-offset-2"
                >
                  <Pencil size={12} /> Edit
                </button>
              )}
            </div>

            {isEditingDetails ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#8B6F5E] block mb-1">
                    Floor
                  </label>
                  <input
                    type="number"
                    value={floorDraft}
                    onChange={(e) => setFloorDraft(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-4 py-2 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#553D2B] transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#8B6F5E] block mb-1">
                    Rent (Rp/month)
                  </label>
                  <input
                    type="number"
                    value={priceDraft}
                    onChange={(e) => setPriceDraft(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-4 py-2 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#553D2B] transition-all"
                  />
                </div>
              </div>
            ) : (
              <>
                <InfoRow icon={<MapPin size={15} />} label="Floor" value={`Floor ${room.floor}`} />
                <InfoRow icon={<DollarSign size={15} />} label="Rent"  value={formatRupiah(priceVal)} />
              </>
            )}
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
                    onClick={handleDescriptionSave}
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
                  <Pencil size={12} /> Edit
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
      </div>
    </div>
  );
}