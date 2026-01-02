import React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faCircleCheck,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

type ToastType = "info" | "error" | "success";

type Toast = {
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  addToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [visible, setVisible] = useState(false);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    setToast({ message, type });
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const id = setTimeout(() => setVisible(false), 7000);
    return () => clearTimeout(id);
  }, [visible]);

  const value = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && visible && (
        <div
          className={`toast-root ${
            toast.type === "error"
              ? "toast-error"
              : toast.type === "success"
              ? "toast-success"
              : "toast-info"
          }`}
          role="status"
          aria-live="polite"
        >
          <span aria-hidden>
            <FontAwesomeIcon
              icon={
                toast.type === "error"
                  ? faTriangleExclamation
                  : toast.type === "success"
                  ? faCircleCheck
                  : faCircleInfo
              }
            />
          </span>
          <span>{toast.message}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}
