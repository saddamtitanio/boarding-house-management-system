/**
 * KosanButton - Buttons Template
 * 
 * @description 
 * Used for all clickable actions
 * 
 * @variants
 * - primary: Brown background, cream text (main actions like Login, Submit)
 * - gold: Gold background, dark text (important actions like Create Account)
 * - secondary: Light beige with border (other actions)
 * - ghost: Transparent, text only (view all)
 * - danger: Red background (delete, remove, destructive actions)
 * 
 * @sizes
 * - sm: Small 
 * - md: Medium 
 * - lg: Large 
 * 
 * @props
 * - fullWidth: Makes button take full container width
 * - loading: Shows spinner, disables button
 * - leftIcon/rightIcon: Add icons from lucide-react
 */

"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "gold";
type ButtonSize = "sm" | "md" | "lg";

interface KosanButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function KosanButton({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className = "",
  disabled,
  ...props
}: KosanButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 select-none cursor-pointer";

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-[#553D2B] text-[#F5E6D3] hover:bg-[#3d2b1f] focus:ring-[#553D2B] active:scale-[0.98]",
    gold: "bg-[#C8A96E] text-[#2C1A0E] hover:bg-[#b8944f] focus:ring-[#C8A96E] active:scale-[0.98]",
    secondary: "bg-[#E8D5BC] text-[#553D2B] border border-[#C8A96E]/40 hover:bg-[#ddc9aa] focus:ring-[#C8A96E] active:scale-[0.98]",
    ghost: "bg-transparent text-[#553D2B] hover:bg-[#553D2B]/10 focus:ring-[#553D2B] active:scale-[0.98]",
    danger: "bg-[#C0444A] text-white hover:bg-[#a33a3f] focus:ring-[#C0444A] active:scale-[0.98]",
  };

  const sizes: Record<ButtonSize, string> = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-5 py-2.5",
    lg: "text-base px-7 py-3.5",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`
        ${base}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}