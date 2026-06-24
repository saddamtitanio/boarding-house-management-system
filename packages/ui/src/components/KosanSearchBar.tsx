/**
 * KosanSearchBar - Search input with magnifying glass icon
 * 
 * @description 
 * Used for searching
 * 
 * @features
 * - Left-aligned magnifying glass icon
 * - Full width by default
 */

"use client";

import { Search } from "lucide-react";

interface KosanSearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function KosanSearchBar({
  placeholder = "Search...",
  value,
  onChange,
  className = "",
}: KosanSearchBarProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        size={16}
        className="absolute left-3.5 text-[#8B6F5E] pointer-events-none"
      />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="
          w-full bg-[#1A0E0A] border border-[#C8A96E]/30
          rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F5E6D3]
          placeholder:text-[#8B6F5E]/60
          focus:outline-none focus:border-[#C8A96E] focus:ring-2 focus:ring-[#C8A96E]/20
          transition-all duration-200
        "
      />
    </div>
  );
}