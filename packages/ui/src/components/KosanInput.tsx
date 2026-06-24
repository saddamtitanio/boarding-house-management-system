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
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-semibold text-[#F5E6D3]">
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
          required={required}
          className={`
            w-full bg-[#1A0E0A] border border-[#C8A96E]/30
            rounded-xl px-4 py-3 text-sm text-[#F5E6D3]
            placeholder:text-[#8B6F5E]/60
            focus:outline-none focus:border-[#C8A96E] focus:ring-2 focus:ring-[#C8A96E]/20
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
            className="absolute right-3 text-[#8B6F5E] hover:text-[#C8A96E] transition-colors"
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