"use client";

interface KosanAvatarChipProps {
  name: string;
  role?: string;
  size?: "sm" | "md";
  className?: string;
  avatarUrl?: string | null;
}

export function KosanAvatarChip({
  name,
  role,
  size = "md",
  className = "",
  avatarUrl,
}: KosanAvatarChipProps) {
  const initial = name.charAt(0).toUpperCase();
  
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`
          rounded-full bg-[#C8A96E] text-[#2C1A0E] font-bold flex items-center justify-center flex-shrink-0 overflow-hidden
          ${size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm"}
        `}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </div>
      <div>
        <p className={`font-semibold text-[#2C1A0E] ${size === "sm" ? "text-xs" : "text-sm"}`}>
          {name}
        </p>
        {role && (
          <p className="text-[10px] text-[#8B6F5E]">{role}</p>
        )}
      </div>
    </div>
  );
}