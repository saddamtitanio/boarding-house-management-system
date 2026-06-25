/**
 * KosanCard - Card template component
 * 
 * @description 
 * Wraps content within card with background and border
 * 
 * @props
 * - hoverable, card lifts up on hover
 * - padding, controls internal spacing which includes none, sm, md, and lg
 * 
 * @note
 * - not hoverable by default
 */

"use client";

interface KosanCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export function KosanCard({
  children,
  className = "",
  hoverable = false,
  padding = "md",
}: KosanCardProps) {
  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-4 sm:p-5",
    lg: "p-5 sm:p-7",
  };

  return (
    <div
      className={`
        bg-[#2C1A0E] rounded-2xl border border-[#C8A96E]/20
        ${paddings[padding]}
        ${hoverable ? "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#C8A96E]/5 cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}