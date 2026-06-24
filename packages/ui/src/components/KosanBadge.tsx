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
    default: "bg-[#C8A96E]/20 text-[#DFC9A8]",
    gold: "bg-[#C8A96E] text-[#1A0E0A]",
    orange: "bg-[#E07B39] text-white",
    success: "bg-[#5E9B72]/20 text-[#8BC39E]",
    danger: "bg-[#C0444A]/15 text-[#E57373]",
    info: "bg-[#8B6F5E]/20 text-[#DFC9A8]",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}