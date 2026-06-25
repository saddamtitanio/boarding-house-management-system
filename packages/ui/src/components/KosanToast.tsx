"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Keyframes CSS to inject for slide-in transition
const slideInStyle = `
@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
.animate-toast-slide-in {
  animation: slideIn 0.2s ease-out forwards;
}
`;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info", title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    
    // Automatically remove toast after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  const success = useCallback((message: string, title?: string) => toast(message, "success", title), [toast]);
  const error = useCallback((message: string, title?: string) => toast(message, "error", title), [toast]);
  const info = useCallback((message: string, title?: string) => toast(message, "info", title), [toast]);
  const warning = useCallback((message: string, title?: string) => toast(message, "warning", title), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning, removeToast }}>
      <style dangerouslySetInnerHTML={{ __html: slideInStyle }} />
      {children}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 md:left-auto md:right-5 md:translate-x-0 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 md:px-0">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  // Brand themes for different toast statuses
  const styles: Record<ToastType, { bg: string; border: string; text: string; iconColor: string; icon: React.ReactNode }> = {
    success: {
      bg: "bg-[#06260F]",
      border: "border-[#15803D]/40",
      text: "text-[#D1FAE5]",
      iconColor: "text-[#34D399]",
      icon: <CheckCircle2 size={20} />,
    },
    error: {
      bg: "bg-[#2D0D0D]",
      border: "border-[#B91C1C]/40",
      text: "text-[#FEE2E2]",
      iconColor: "text-[#F87171]",
      icon: <AlertCircle size={20} />,
    },
    info: {
      bg: "bg-[#2C1A0E]",
      border: "border-[#C8A96E]/30",
      text: "text-[#F5E6D3]",
      iconColor: "text-[#C8A96E]",
      icon: <Info size={20} />,
    },
    warning: {
      bg: "bg-[#2A1E08]",
      border: "border-[#B45309]/40",
      text: "text-[#FEF3C7]",
      iconColor: "text-[#FBBF24]",
      icon: <AlertCircle size={20} />,
    },
  };

  const style = styles[toast.type];

  return (
    <div
      className={`
        pointer-events-auto w-full flex gap-3 p-4 rounded-xl border shadow-lg
        transition-all duration-300 transform translate-y-0 opacity-100 animate-toast-slide-in
        ${style.bg} ${style.border} ${style.text}
      `}
      role="alert"
    >
      <div className={`${style.iconColor} flex-shrink-0 mt-0.5`}>
        {style.icon}
      </div>
      <div className="flex-1 min-w-0">
        {toast.title && <p className="font-bold text-sm mb-0.5">{toast.title}</p>}
        <p className="text-sm font-semibold leading-relaxed break-words">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 self-start p-0.5 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
