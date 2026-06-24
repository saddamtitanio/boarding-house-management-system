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
    occupied: "bg-[#C0444A]/20 text-[#FF8A80] border-[#C0444A]/40",
    vacant: "bg-[#5E9B72]/20 text-[#81C784] border-[#5E9B72]/40",
    cleaned: "bg-[#C8A96E]/20 text-[#FFD54F] border-[#C8A96E]/40",
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