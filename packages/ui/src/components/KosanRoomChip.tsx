/**
 * KosanRoomChip - Room number indicator with status color
 * 
 * @description 
 * Displays room numbers with color-coded status background
 * 
 * @status 
 * - occupied, light red background, dark red text 
 * - vacant, light green background, dark green text 
 * - cleaned, light gold background, dark gold text 
 * 
 * @features
 * - Rounded corners with border
 * - Centered room number text
 * - Bold font for readability
 * 
 */

"use client";

type RoomStatus = "occupied" | "vacant" | "cleaned";

interface KosanRoomChipProps {
  roomNumber: string | number;
  status?: RoomStatus;
}

export function KosanRoomChip({ roomNumber, status = "vacant" }: KosanRoomChipProps) {
  const styles: Record<RoomStatus, string> = {
    occupied: "bg-[#C0444A]/20 text-[#9a2f34] border-[#C0444A]/30",
    vacant: "bg-[#5E9B72]/20 text-[#3d6b4f] border-[#5E9B72]/30",
    cleaned: "bg-[#C8A96E]/20 text-[#7a6030] border-[#C8A96E]/30",
  };
  
  return (
    <div
      className={`
        w-12 p-4 h-10 rounded-lg border flex items-center justify-center
        text-xs font-bold ${styles[status]}
      `}
    >
      {roomNumber}
    </div>
  );
}