"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Layers, DollarSign, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
import { KosanCard, KosanButton, KosanBadge, KosanInput, KosanSectionHeader } from "@sbhms/ui";

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
  bookings?: any[];
}

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [months, setMonths] = useState("1");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    async function loadRoomDetails() {
      try {
        setLoading(true);
        const res = await fetch(`/api/rooms/${id}`);
        const json = await res.json();
        if (json.success && json.data) {
          setRoom(json.data);
        } else {
          setError(json.error || "Room details not found");
        }
      } catch (err) {
        console.error("Failed to load room details", err);
        setError("Network error loading room details");
      } finally {
        setLoading(false);
      }
    }
    loadRoomDetails();
  }, [id]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !months) {
      setError("Please fill in check-in date and select duration.");
      return;
    }

    const calculatedEndDate = (() => {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + Number(months));
      return d.toISOString().split("T")[0];
    })();

    try {
      setSubmitting(true);
      setError("");

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: id,
          start_date: startDate,
          end_date: calculatedEndDate
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to submit booking application");
      }

      if (json.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/bookings");
        }, 2000);
      }
    } catch (err: any) {
      console.error("Booking error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString("id-ID")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5E6D3] p-6 flex items-center justify-center">
        <p className="text-lg font-semibold text-[#8B6F5E]">Loading room details...</p>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="min-h-screen bg-[#F5E6D3] p-6 flex flex-col items-center justify-center gap-4">
        <div className="p-4 rounded-xl bg-[#C0444A]/10 text-[#9a2f34] flex items-center gap-2">
          <AlertCircle size={20} />
          <p className="font-semibold">{error}</p>
        </div>
        <KosanButton variant="secondary" onClick={() => router.push("/room")}>
          <ArrowLeft size={16} /> Back to Rooms
        </KosanButton>
      </div>
    );
  }

  if (!room) return null;

  const images = room.room_images && room.room_images.length > 0
    ? room.room_images
    : [{ id: "fallback", url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80" }];

  return (
    <div className="min-h-screen bg-[#F5E6D3] p-6">
      {/* Back Button */}
      <div className="mb-6">
        <KosanButton variant="ghost" onClick={() => router.push("/room")} className="flex items-center gap-1.5 pl-0 text-[#8B6F5E] hover:text-[#2C1A0E]">
          <ArrowLeft size={16} /> Back to Catalog
        </KosanButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left/Middle Column: Details & Images */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Specs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#2C1A0E]">{room.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                  room.status === "occupied"
                    ? "bg-[#C8A96E]/20 text-[#7a6030]"
                    : room.status === "cleaning"
                      ? "bg-[#C8A96E]/20 text-[#7a6030]"
                      : "bg-[#5E9B72]/15 text-[#3d6b4f]"
                }`}>
                  {room.status === "occupied" ? "Your Room" : room.status}
                </span>
                <span className="flex items-center gap-1 text-sm text-[#8B6F5E]">
                  <Layers size={14} className="text-[#C8A96E]" />
                  Floor {room.floor}
                </span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#8B6F5E]">Monthly Rent</span>
              <p className="text-2xl font-black text-[#2C1A0E]">{formatPrice(room.price)}</p>
            </div>
          </div>

          {/* Image Gallery */}
          <div className="space-y-3">
            <div className="h-96 w-full rounded-2xl overflow-hidden bg-[#3d2b1f] relative border border-[#C8A96E]/20">
              <img
                src={images[activeImageIndex]?.url}
                alt={`${room.name} view`}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIndex(index)}
                    className={`h-16 w-24 rounded-lg overflow-hidden border-2 transition ${
                      activeImageIndex === index ? "border-[#C8A96E]" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Room Description */}
          <KosanCard>
            <KosanSectionHeader title="Description & Amenities" />
            <p className="text-sm leading-relaxed mt-2 whitespace-pre-line">
              {room.description ||
                "This premium unit comes with high-quality single study desk, wardrobe cabinet, air conditioning, private bathroom with shower head, and high speed wireless internet. Perfect environment to study computer engineering."}
            </p>
          </KosanCard>
        </div>

        {/* Right Column: Booking Request Form */}
        <div className="space-y-6">
          <KosanCard className="border border-[#C8A96E]/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#C8A96E]" />
            {room.status === "occupied" ? (
              <>
                <KosanSectionHeader title="Your Active Lease" />
                <div className="mt-4 space-y-4">
                  <div className="p-4 bg-[#5E9B72]/10 border border-[#5E9B72]/20 rounded-xl text-center space-y-3">
                    <CheckCircle className="mx-auto text-[#3d6b4f]" size={24} />
                    <p className="text-sm font-bold text-[#2C1A0E]">
                      You occupy this room
                    </p>
                    {(() => {
                      const activeBooking = room.bookings?.find(
                        (b: any) => b.status === "approved" || b.status === "completed" || b.status === "active"
                      );
                      if (!activeBooking) return null;
                      return (
                        <div className="text-xs text-[#8B6F5E] space-y-1 pt-1 border-t border-[#C8A96E]/15">
                          <div>
                            Start Date:{" "}
                            <span className="font-semibold text-[#2C1A0E]">
                              {new Date(activeBooking.start_date).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <div>
                            Expiry Date:{" "}
                            <span className="font-semibold text-[#2C1A0E]">
                              {new Date(activeBooking.end_date).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <KosanButton
                    variant="primary"
                    fullWidth
                    onClick={() => router.push("/dashboard")}
                  >
                    Go to Dashboard
                  </KosanButton>
                </div>
              </>
            ) : success ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 bg-[#5E9B72]/15 text-[#3d6b4f] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={24} />
                </div>
                <h3 className="font-bold text-lg text-[#2C1A0E]">Request Submitted</h3>
                <p className="text-xs text-[#8B6F5E]">
                  Your booking request was logged. Redirecting you to bookings logs...
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="mt-4 space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-[#C0444A]/10 text-[#9a2f34] text-xs font-semibold flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="start-date" className="block text-xs font-semibold text-[#8B6F5E] uppercase tracking-wider mb-1.5">
                    Check-in Date
                  </label>
                  <KosanInput
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="duration-months" className="block text-xs font-semibold text-[#8B6F5E] uppercase tracking-wider mb-1.5">
                    Duration (Months)
                  </label>
                  <select
                    id="duration-months"
                    value={months}
                    onChange={(e) => setMonths(e.target.value)}
                    className="w-full bg-[#EFE3D0] border border-[#C8A96E]/20 text-[#2C1A0E] rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-[#C8A96E] transition"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m.toString()}>
                        {m} Month{m > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {startDate && (
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-[#8B6F5E] uppercase tracking-wider">
                      Calculated Check-out Date
                    </span>
                    <p className="text-xs font-bold text-[#2C1A0E]">
                      {(() => {
                        const d = new Date(startDate);
                        d.setMonth(d.getMonth() + Number(months));
                        return d.toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' });
                      })()}
                    </p>
                  </div>
                )}

                <div className="p-3 bg-[#EFE3D0] rounded-xl border border-[#C8A96E]/20 text-xs text-[#8B6F5E] space-y-1.5">
                  <div className="flex justify-between">
                    <span>Monthly rate:</span>
                    <span className="font-semibold text-[#2C1A0E]">{formatPrice(room.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-semibold text-[#2C1A0E]">{months} Month{Number(months) > 1 ? "s" : ""}</span>
                  </div>
                  <div className="border-t border-[#C8A96E]/15 pt-1.5 flex justify-between font-bold text-sm text-[#2C1A0E]">
                    <span>Total Rent:</span>
                    <span>{formatPrice(room.price * Number(months))}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#8B6F5E]">
                    <span>Security Deposit:</span>
                    <span>1 Month (Refundable)</span>
                  </div>
                </div>

                <KosanButton
                  type="submit"
                  variant="gold"
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 font-bold"
                  disabled={submitting}
                >
                  {submitting ? "Submitting Application..." : "Request Booking"}
                </KosanButton>
              </form>
            )}
          </KosanCard>
        </div>
      </div>
    </div>
  );
}