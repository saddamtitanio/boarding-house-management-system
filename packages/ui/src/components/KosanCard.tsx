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
    md: "p-5",
    lg: "p-7",
  };

  return (
    <div
      className={`
        bg-[#DFC9A8] rounded-2xl border border-[#C8A96E]/30
        ${paddings[padding]}
        ${hoverable ? "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#553D2B]/10 cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}