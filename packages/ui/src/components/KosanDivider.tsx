/**
 * KosanDivider - Horizontal line with optional centered text
 * 
 * @description 
 * Separates content sections with a subtle line
 * 
 * @props
 * - label: Optional text centered between lines
 * 
 */

"use client";

interface KosanDividerProps {
  label?: string;
  className?: string;
}

export function KosanDivider({ label, className = "" }: KosanDividerProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-px bg-[#C8A96E]/30" />
      {label && (
        <span className="text-xs text-[#8B6F5E] font-medium">{label}</span>
      )}
      <div className="flex-1 h-px bg-[#C8A96E]/30" />
    </div>
  );
}