/**
 * KosanBadge - Status pill label
 * 
 * @description
 *  Compact label for status, categories, or metadata
 * 
 * @variants
 * - default, light gold bg, dark brown text 
 * - gold, solid gold bg, dark text 
 * - orange, solid orange bg, white text 
 * - success, light green bg, dark green text 
 * - danger, light red bg, dark red text 
 * - info, light brown bg, brown text 
 */

"use client";

type BadgeVariant = "default" | "gold" | "orange" | "success" | "danger" | "info";

interface KosanBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function KosanBadge({
  children,
  variant = "default",
  className = "",
}: KosanBadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: "bg-[#C8A96E]/20 text-[#553D2B]",
    gold: "bg-[#C8A96E] text-[#2C1A0E]",
    orange: "bg-[#E07B39] text-white",
    success: "bg-[#5E9B72]/20 text-[#3d6b4f]",
    danger: "bg-[#C0444A]/15 text-[#9a2f34]",
    info: "bg-[#553D2B]/15 text-[#553D2B]",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}