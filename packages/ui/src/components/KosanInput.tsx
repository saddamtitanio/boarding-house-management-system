/**
 * KosanInput - Bar input field
 * 
 * @description 
 * Used for all form inputs (text, email, password, phone, etc.)
 * 
 * @features
 * - Password visibility toggle 
 * - Left icon
 * - Error state with error message display
 * - Required field indicator (red asterisk)
 * - Custom right element
 */

"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface KosanInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  required?: boolean;
}

export function KosanInput({
  label,
  error,
  leftIcon,
  rightElement,
  required,
  className = "",
  type,
  ...props
}: KosanInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-[#2C1A0E]">
          {label}
          {required && <span className="text-[#C0444A] ml-1">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-[#8B6F5E]">{leftIcon}</span>
        )}
        <input
          type={inputType}
          className={`
            w-full bg-[#EFE3D0] border border-[#C8A96E]/50
            rounded-xl px-4 py-3 text-sm text-[#2C1A0E]
            placeholder:text-[#8B6F5E]/70
            focus:outline-none focus:border-[#553D2B] focus:ring-2 focus:ring-[#553D2B]/20
            transition-all duration-200
            ${leftIcon ? "pl-10" : ""}
            ${isPassword || rightElement ? "pr-12" : ""}
            ${error ? "border-[#C0444A] focus:ring-[#C0444A]/20" : ""}
            ${className}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-[#8B6F5E] hover:text-[#553D2B] transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {!isPassword && rightElement && (
          <span className="absolute right-3">{rightElement}</span>
        )}
      </div>
      {error && <p className="text-xs text-[#C0444A] font-medium">{error}</p>}
    </div>
  );
}