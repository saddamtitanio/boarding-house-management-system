/**
 * KosanSectionHeader - Section title 
 * 
 * @description 
 * Provides consistent section headers across dashboard
 * 
 * @props
 * - title, section heading text
 * - action, optional button
 * 
 * @layout
 * - Title on left
 * - Optional action button on right
 * - Bottom margin for spacing below header
 */

"use client";

interface KosanSectionHeaderProps {
  title: string;
  action?: React.ReactNode;
  className?: string;
}

export function KosanSectionHeader({
  title,
  action,
  className = "",
}: KosanSectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      <h2 className="text-base font-bold text-[#F5E6D3]">{title}</h2>
      {action}
    </div>
  );
}