import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((current) => [...current, { id, message, type }]);
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

/* ── UI Components ── */

import { CheckIcon, InfoIcon, CloseIcon } from "@/shared/ui/Icons";

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item color-${toast.type}`}>
          <div className="toast-icon">
            {toast.type === "success" && <CheckIcon />}
            {toast.type === "error" && <InfoIcon />}
            {toast.type === "info" && <InfoIcon />}
          </div>
          <p className="toast-message">{toast.message}</p>
          <button className="toast-close" onClick={() => removeToast(toast.id)}>
            <CloseIcon />
          </button>
        </div>
      ))}

      <style>{`
        .toast-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 9999;
          pointer-events: none;
        }
        .toast-item {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 320px;
          max-width: 420px;
          padding: 16px;
          background: #1a1c1a;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.4);
          animation: toastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          overflow: hidden;
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(24px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .toast-item.color-success { border-left: 4px solid #34d399; }
        .toast-item.color-error { border-left: 4px solid #ef4444; }
        .toast-item.color-info { border-left: 4px solid #3b82f6; }
        
        .toast-icon {
          flex-shrink: 0;
          font-size: 1.2rem;
        }
        .color-success .toast-icon { color: #34d399; }
        .color-error .toast-icon { color: #ef4444; }
        .color-info .toast-icon { color: #3b82f6; }

        .toast-message {
          flex-grow: 1;
          margin: 0;
          font-size: 0.95rem;
          font-weight: 500;
          color: rgba(255,255,255,0.9);
        }
        .toast-close {
          background: none;
          border: none;
          color: rgba(255,255,255,0.3);
          cursor: pointer;
          font-size: 1.1rem;
          display: flex;
          padding: 4px;
          border-radius: 4px;
          transition: background 0.2s;
        }
        .toast-close:hover {
          background: rgba(255,255,255,0.05);
          color: #fff;
        }
      `}</style>
    </div>
  );
}
