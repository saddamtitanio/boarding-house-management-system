/**
 * KosanStatCard - Metrics display card
 * 
 * @description 
 * Shows key metrics with large numbers and optional icon
 * 
 * @accent 
 * colors (controls the main number color)
 * 
 * - default, dark brown, stats like total rooms
 * - danger, red, stats like occupied, overdue
 * - success, green, stats like vacant, available
 * - gold, stats like cleaning, pending
 * - orange, stats like warning 
 *  
 * @structure
 * - Small uppercase label 
 * - Large bold number 
 * - Small subtext 
 * - Icon 
 */

"use client";

import { KosanCard } from "./KosanCard";

interface KosanStatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  accent?: "default" | "gold" | "orange" | "success" | "danger";
  className?: string;
}

export function KosanStatCard({
  label,
  value,
  subtext,
  icon,
  accent = "default",
  className = "",
}: KosanStatCardProps) {
  const accents: Record<string, string> = {
    default: "text-[#F5E6D3]",
    gold: "text-[#C8A96E]",
    orange: "text-[#E07B39]",
    success: "text-[#5E9B72]",
    danger: "text-[#C0444A]",
  };

  return (
    <KosanCard className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-[#DFC9A8] uppercase tracking-wider">
          {label}
        </span>
        {icon && <span className="text-[#8B6F5E]">{icon}</span>}
      </div>
      <span className={`text-3xl font-bold leading-none ${accents[accent]}`}>
        {value}
      </span>
      {subtext && <span className="text-xs text-[#A68D7D]">{subtext}</span>}
    </KosanCard>
  );
}