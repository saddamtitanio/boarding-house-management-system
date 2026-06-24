/**
 * KosanAlertCard - Clickable alert notifications
 * 
 * @description 
 * Displays alerts with icon, title, description, and count badge
 * 
 * @features
 * - Hoverable
 * - Count badge shows number of items 
 * - Clickable entire card 
 * - Cuts of long texts 
 * 
 * @note
 * - Clickable
 * - Count badge only appears if count is provided
 */

"use client";

interface KosanAlertCardProps {
  title: string;
  description?: string;
  count?: number;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function KosanAlertCard({
  title,
  description,
  count,
  icon,
  action,
  onClick,
  className = "",
}: KosanAlertCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
      className={`
        w-full flex items-center gap-3 p-3.5 rounded-xl
        bg-[#2C1A0E] border border-[#C8A96E]/20
        hover:bg-[#3D2517] hover:border-[#C8A96E]/40
        transition-all duration-200 text-left cursor-pointer
        ${className}
      `}
    >
      {icon && (
        <span className="w-9 h-9 rounded-lg bg-[#C8A96E]/10 flex items-center justify-center text-[#C8A96E] flex-shrink-0">
          {icon}
        </span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#F5E6D3] truncate">{title}</p>
        {description && (
          <p className="text-xs text-[#DFC9A8] truncate">{description}</p>
        )}
      </div>
      {count !== undefined && (
        <span className="flex-shrink-0 min-w-[24px] h-6 px-1.5 bg-[#E07B39] text-white text-xs font-bold rounded-full flex items-center justify-center">
          {count}
        </span>
      )}
      {action}
    </div>
  );
}